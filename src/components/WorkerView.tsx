import React, { useEffect, useState } from "react";
import { Camera, DollarSign, Fuel, ListTodo, Send, Image as ImageIcon, AlertCircle } from "lucide-react";
import { FuelRate, Shift, Task, User } from "../types.js";
import { api } from "../utils/api.js";
import CameraCaptureModal from "./CameraCaptureModal.tsx";

interface WorkerViewProps {
  currentUser: User;
  onRefreshStats: () => void;
}

type FuelType = "petrol" | "diesel";

const workerTabs: Array<{
  id: "sales" | "tasks" | "totalTariff";
  label: string;
  Icon: React.ElementType;
}> = [
  { id: "sales", label: "Fuel Dispatch", Icon: Fuel },
  { id: "tasks", label: "My Tasks", Icon: ListTodo },
  { id: "totalTariff", label: "Total Tariff & Shift Submit", Icon: DollarSign },
];

export default function WorkerView({ currentUser, onRefreshStats }: WorkerViewProps) {
  const [activeTab, setActiveTab] = useState<"sales" | "tasks" | "totalTariff">("sales");
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [rates, setRates] = useState<FuelRate[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>("petrol");
  const [petrolClosingReading, setPetrolClosingReading] = useState("");
  const [dieselClosingReading, setDieselClosingReading] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [taskPhoto, setTaskPhoto] = useState<File | null>(null);
  const [taskPhotoPreview, setTaskPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "success" as "success" | "error" });

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    window.setTimeout(() => setFeedback({ text: "", type: "success" }), 5000);
  };

  const loadData = async () => {
    try {
      const [shifts, fuelRates, allTasks] = await Promise.all([
        api.getShifts(), 
        api.getFuelRates(), 
        api.getTasks()
      ]);
      setRates(fuelRates);
      const myTasks = allTasks.filter((task) => task.assignedTo === currentUser.id);
      setTasks(myTasks);
      
      const openShift = shifts.find(
        (shift) => shift.workerId === currentUser.id && (shift.status === "open" || shift.status === "submitted_by_worker" || shift.status === "pending_approval")
      ) || null;
      
      setActiveShift(openShift);
      if (openShift) {
        if (openShift.petrolEndReading) setPetrolClosingReading(String(openShift.petrolEndReading));
        if (openShift.dieselEndReading) setDieselClosingReading(String(openShift.dieselEndReading));
      }
    } catch (error: any) {
      showFeedback(error.message || "Failed to load worker data.", "error");
    }
  };

  useEffect(() => { 
    loadData(); 
  }, [currentUser.id]);

  const petrolRate = rates.find((rate) => rate.fuelType === "petrol")?.rate || 0;
  const dieselRate = rates.find((rate) => rate.fuelType === "diesel")?.rate || 0;
  
  const petrolOpening = activeShift?.petrolStartReading || 0;
  const dieselOpening = activeShift?.dieselStartReading || 0;
  
  const petrolClosing = Number(petrolClosingReading || petrolOpening);
  const dieselClosing = Number(dieselClosingReading || dieselOpening);
  
  const petrolLiters = petrolClosing >= petrolOpening ? Number((petrolClosing - petrolOpening).toFixed(2)) : 0;
  const dieselLiters = dieselClosing >= dieselOpening ? Number((dieselClosing - dieselOpening).toFixed(2)) : 0;
  
  const petrolTariff = Number((petrolLiters * petrolRate).toFixed(2));
  const dieselTariff = Number((dieselLiters * dieselRate).toFixed(2));
  const totalTariff = Number((petrolTariff + dieselTariff).toFixed(2));
  
  const currentOpening = fuelType === "petrol" ? petrolOpening : dieselOpening;
  const currentClosing = fuelType === "petrol" ? petrolClosingReading : dieselClosingReading;
  const setCurrentClosing = fuelType === "petrol" ? setPetrolClosingReading : setDieselClosingReading;

  // Pending tasks check
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  const handlePhotoSelect = (file: File | null) => {
    if (!file) {
      setTaskPhoto(null);
      setTaskPhotoPreview(null);
      return;
    }
    setTaskPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setTaskPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const photoToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read photo file."));
    reader.readAsDataURL(file);
  });

  const handleTaskSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTaskId || !submissionNotes.trim()) {
      return showFeedback("Please select a task and provide submission notes.", "error");
    }
    try {
      const submissionPhoto = taskPhoto ? await photoToBase64(taskPhoto) : undefined;
      await api.submitTask({
        taskId: selectedTaskId,
        submissionNotes,
        submissionPhoto,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role,
      });
      showFeedback("Task submitted successfully for Manager approval!");
      setSelectedTaskId("");
      setSubmissionNotes("");
      setTaskPhoto(null);
      setTaskPhotoPreview(null);
      await loadData();
    } catch (error: any) { 
      showFeedback(error.message || "Failed to submit task.", "error"); 
    }
  };

  const handleSendToManager = async () => {
    if (!activeShift) return showFeedback("No active shift found.", "error");
    
    if (pendingTasks.length > 0) {
      return showFeedback(`Cannot submit shift! You have ${pendingTasks.length} pending task(s) ("${pendingTasks[0].title}") that must be submitted first.`, "error");
    }

    if (petrolClosing < petrolOpening || dieselClosing < dieselOpening) {
      return showFeedback("Closing meter reading cannot be lower than opening reading.", "error");
    }
    if (!petrolClosingReading || !dieselClosingReading) {
      return showFeedback("Both Petrol and Diesel closing readings are required.", "error");
    }

    try {
      await api.submitShiftForManager({
        shiftId: activeShift.id,
        petrolEndReading: petrolClosing,
        dieselEndReading: dieselClosing,
        petrolLitersSold: petrolLiters,
        dieselLitersSold: dieselLiters,
        expectedAmount: totalTariff,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role,
      });
      showFeedback("Shift readings submitted successfully to Manager for verification!");
      await loadData();
      onRefreshStats();
    } catch (error: any) { 
      showFeedback(error.message || "Failed to submit shift to Manager.", "error"); 
    }
  };

  return (
    <div className="space-y-6">
      {feedback.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${feedback.type === "success" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"}`}>
          {feedback.text}
        </div>
      )}

      {/* Pending Tasks Warning Banner */}
      {pendingTasks.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Pending Task Action Required!</p>
            <p>You have {pendingTasks.length} pending task(s) assigned. You must complete & submit them in "My Tasks" before submitting your shift.</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-3 overflow-x-auto">
        {workerTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800/60"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "tasks" && pendingTasks.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-white font-bold">
                {pendingTasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "sales" && (
        <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 space-y-5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base">Fuel Meter Readings</h3>
            </div>
            {activeShift && (
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Shift Date: {activeShift.date}
              </span>
            )}
          </div>

          {!activeShift ? (
            <p className="text-sm text-neutral-500 dark:text-zinc-400">No active shift assigned to you at the moment.</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-400 bg-neutral-100 dark:bg-zinc-800/50 p-3 rounded-xl">
                <span><strong>Machine:</strong> #{activeShift.machineId}</span>
                <span><strong>Shift:</strong> {activeShift.shiftName} Shift</span>
                <span><strong>Status:</strong> <span className="capitalize font-bold text-indigo-600 dark:text-indigo-400">{activeShift.status.replace(/_/g, " ")}</span></span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["petrol", "diesel"] as FuelType[]).map((fuel) => (
                  <button
                    key={fuel}
                    type="button"
                    onClick={() => setFuelType(fuel)}
                    className={`rounded-xl border py-2.5 text-xs font-bold capitalize transition-all ${
                      fuelType === fuel 
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                        : "border-neutral-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 text-neutral-700 dark:text-zinc-300"
                    }`}
                  >
                    {fuel} Dispenser
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-neutral-600 dark:text-zinc-400">Opening Reading (Automatic)</label>
                  <input
                    value={currentOpening}
                    readOnly
                    className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-100 dark:bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-neutral-600 dark:text-zinc-400">{fuelType.toUpperCase()} Closing Reading</label>
                  <input
                    type="number"
                    min={currentOpening}
                    step="0.01"
                    placeholder={`e.g. ${currentOpening + 100}`}
                    value={currentClosing}
                    onChange={(event) => setCurrentClosing(event.target.value)}
                    disabled={activeShift.status === "submitted_by_worker" || activeShift.status === "approved_by_manager" || activeShift.status === "closed"}
                    className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 dark:bg-zinc-800/40 p-4 text-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase">{fuelType} Volume Sold</p>
                  <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{fuelType === "petrol" ? petrolLiters : dieselLiters} Liters</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase">Current Rate</p>
                  <p className="text-base font-bold">₹{fuelType === "petrol" ? petrolRate : dieselRate}/L</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <form onSubmit={handleTaskSubmit} className="space-y-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base">Submit Assigned Maintenance Task</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-400 mb-1">Select Task</label>
            <select
              required
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Choose Assigned Task --</option>
              {tasks.filter((task) => task.status === "pending" || task.status === "rejected").map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-400 mb-1">Completion Notes</label>
            <textarea
              required
              value={submissionNotes}
              onChange={(event) => setSubmissionNotes(event.target.value)}
              placeholder="Describe work performed, meter observations, or findings..."
              className="min-h-24 w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-zinc-400">
              <Camera className="h-4 w-4 text-indigo-500" />
              Upload Work Photo (Camera or Gallery)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all"
              >
                <Camera className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Use Laptop / Mobile Camera
              </button>

              <label className="cursor-pointer flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all">
                <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Choose from Gallery / Files
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(file, dataUrl) => {
                setTaskPhoto(file);
                setTaskPhotoPreview(dataUrl);
              }}
              title="Task Work Photo Capture"
            />

            {taskPhotoPreview && (
              <div className="mt-3">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Selected Photo Preview:</p>
                <img src={taskPhotoPreview} alt="Task Preview" className="h-32 rounded-xl object-cover border border-neutral-200 dark:border-zinc-800" />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
          >
            Submit Task to Manager
          </button>
        </form>
      )}

      {activeTab === "totalTariff" && (
        <div className="space-y-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
          <h3 className="font-bold text-base">Shift Total Tariff & Meter Summary</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-neutral-50 dark:bg-zinc-800/40 p-4 border border-neutral-100 dark:border-zinc-800">
              <span className="block text-xs text-neutral-500 dark:text-zinc-400 font-bold uppercase">Petrol Sales Tariff</span>
              <strong className="text-lg text-emerald-600 dark:text-emerald-400">₹{petrolTariff.toLocaleString()}</strong>
              <span className="block text-[11px] text-neutral-400">{petrolLiters} L × ₹{petrolRate}</span>
            </div>
            
            <div className="rounded-xl bg-neutral-50 dark:bg-zinc-800/40 p-4 border border-neutral-100 dark:border-zinc-800">
              <span className="block text-xs text-neutral-500 dark:text-zinc-400 font-bold uppercase">Diesel Sales Tariff</span>
              <strong className="text-lg text-indigo-600 dark:text-indigo-400">₹{dieselTariff.toLocaleString()}</strong>
              <span className="block text-[11px] text-neutral-400">{dieselLiters} L × ₹{dieselRate}</span>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 p-4 flex items-center justify-between text-indigo-900 dark:text-indigo-200">
            <div>
              <span className="text-xs font-bold uppercase">Total Calculated Expected Tariff</span>
              <p className="text-xl font-extrabold">₹{totalTariff.toLocaleString()}</p>
            </div>
            <Send className="h-8 w-8 text-indigo-500/40" />
          </div>

          <button
            type="button"
            disabled={!activeShift || pendingTasks.length > 0 || activeShift.status === "submitted_by_worker" || activeShift.status === "approved_by_manager" || activeShift.status === "closed"}
            onClick={handleSendToManager}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Send className="h-4 w-4" />
            {activeShift?.status === "submitted_by_worker"
              ? "Submitted to Manager (Pending Manager Verification)"
              : activeShift?.status === "approved_by_manager" || activeShift?.status === "closed"
              ? "Shift Closed & Audited"
              : "Submit Shift Readings to Manager"}
          </button>
        </div>
      )}
    </div>
  );
}
