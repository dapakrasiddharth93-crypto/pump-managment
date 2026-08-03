import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, Check, AlertTriangle, SwitchCamera, Upload } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, dataUrl: string) => void;
  title?: string;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Take Photo with Camera"
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Stop current camera stream
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Enumerate video devices
  const loadDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
    } catch (err) {
      console.warn("Error enumerating devices:", err);
    }
  };

  // Start webcam stream
  const startCamera = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use a modern browser like Chrome, Edge, or Firefox.");
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }

      await loadDevices();
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Camera permission was denied. Please allow camera access in your browser settings to use your webcam.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("No camera detected on this laptop or computer. Please connect a webcam or upload a photo file.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMsg("Your camera is being used by another application. Please close other apps using the camera and try again.");
      } else {
        setErrorMsg(err.message || "Failed to access laptop camera. Please ensure permissions are granted.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setCapturedFile(null);
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, selectedDeviceId, facingMode]);

  // Capture frame from live video
  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);

    // Convert dataURL to File
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], `camera_photo_${Date.now()}.jpg`, { type: mime });
    setCapturedFile(file);
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedFile(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedDataUrl && capturedFile) {
      onCapture(capturedFile, capturedDataUrl);
      stopStream();
      onClose();
    }
  };

  const handleToggleFacingMode = () => {
    setSelectedDeviceId("");
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      onCapture(file, dataUrl);
      stopStream();
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">{title}</h3>
              <p className="text-[11px] text-zinc-400">Computer / Mobile Live Camera Capture</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Display Viewport */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for capture processing */}
          <canvas ref={canvasRef} className="hidden" />

          {capturedDataUrl ? (
            /* Snapshot Preview */
            <img src={capturedDataUrl} alt="Captured preview" className="w-full h-full object-contain" />
          ) : (
            /* Live Video Feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Viewfinder Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-2 border-white/20 m-6 rounded-2xl">
                <div className="w-12 h-12 border-t-2 border-l-2 border-indigo-400 absolute top-2 left-2 rounded-tl-lg" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-indigo-400 absolute top-2 right-2 rounded-tr-lg" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-indigo-400 absolute bottom-2 left-2 rounded-bl-lg" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-indigo-400 absolute bottom-2 right-2 rounded-br-lg" />
              </div>

              {/* Loading spinner */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
                  <span className="text-xs font-semibold text-zinc-300">Starting Camera...</span>
                </div>
              )}
            </>
          )}

          {/* Error Message Display */}
          {errorMsg && !capturedDataUrl && (
            <div className="absolute inset-0 bg-zinc-950/90 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold text-rose-300 max-w-md">{errorMsg}</p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Try Again
                </button>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Choose Image File from PC
                  <input type="file" accept="image/*" className="hidden" onChange={handleFallbackFileSelect} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Device selector or switch camera */}
          <div className="flex items-center gap-2">
            {!capturedDataUrl && devices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Default Camera</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            {!capturedDataUrl && (
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Switch Camera / Facing Mode"
              >
                <SwitchCamera className="h-4 w-4" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            )}

            {!capturedDataUrl && (
              <label className="cursor-pointer p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">From File</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFallbackFileSelect} />
              </label>
            )}
          </div>

          {/* Right: Capture or Retake/Confirm Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {capturedDataUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" /> Retake
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Check className="h-4 w-4" /> Use This Photo
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isLoading || Boolean(errorMsg)}
                onClick={handleTakeSnapshot}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                Take Photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
