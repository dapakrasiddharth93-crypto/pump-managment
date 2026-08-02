import React, { useEffect, useState, useRef } from "react";
import { CheckCircle, DollarSign, ListTodo, Plus, Power, Send, Camera, Image as ImageIcon, Trash2, Calendar, UserCheck, AlertCircle, Eye, FileSpreadsheet, Download, Search } from "lucide-react";
import { CreditCustomer, FuelRate, Shift, Task, User as UserType, OnlinePaymentEntry, CreditPartyEntry, CreditTransaction } from "../types.js";
import { api } from "../utils/api.js";
import ExportButton from "./ExportButton.js";
import CustomerLedgerModal from "./CustomerLedgerModal.js";

interface ManagerViewProps {
  currentUser: UserType;
  onRefreshStats: () => void;
}

// Auto-complete & dropdown input component for Credit Customer Parties
function PartyAutoCompleteInput({
  value,
  customers,
  onChange
}: {
  value: string;
  customers: CreditCustomer[];
  onChange: (name: string, customerId?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes((value || '').toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex gap-1 items-center">
        {/* Dropdown Select option */}
        <select
          value={customers.find(c => c.name.toLowerCase() === (value || '').toLowerCase())?.id || ""}
          onChange={(e) => {
            const selectedCust = customers.find(c => c.id === e.target.value);
            if (selectedCust) {
              onChange(selectedCust.name, selectedCust.id);
            } else if (e.target.value === "") {
              onChange("");
            }
          }}
          className="w-1/3 min-w-[100px] rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
        >
          <option value="">-- Select --</option>
          {customers.map(cust => (
            <option key={cust.id} value={cust.id}>
              {cust.name}
            </option>
          ))}
        </select>

        {/* Search / Type Party Name */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type Party Name..."
            value={value}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            className="w-full rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          />
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-48 overflow-y-auto rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1 text-xs">
          {filtered.length > 0 ? (
            filtered.map((cust) => (
              <button
                key={cust.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-zinc-800 flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800/40 last:border-0 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur before onClick fires
                }}
                onClick={() => {
                  onChange(cust.name, cust.id);
                  setIsOpen(false);
                }}
              >
                <div>
                  <span className="font-bold text-neutral-800 dark:text-zinc-100 block">{cust.name}</span>
                  <span className="text-[10px] text-neutral-400">{cust.contact}</span>
                </div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                  Bal: ₹{cust.balance.toLocaleString()}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-neutral-400 text-center text-[11px] italic">
              No existing customer matches "{value}". New party will be created.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManagerView({ currentUser, onRefreshStats }: ManagerViewProps) {
  const [activeTab, setActiveTab] = useState<"shifts" | "credit" | "tasks">("shifts");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rates, setRates] = useState<FuelRate[]>([]);
  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<UserType[]>([]);
  
  // Single Customer Ledger View Modal state
  const [viewingCustomerLedger, setViewingCustomerLedger] = useState<CreditCustomer | null>(null);

  // Shift creation form
  const [openShiftForm, setOpenShiftForm] = useState({
    shiftName: "Morning" as "Morning" | "Night",
    machineId: "795" as "795" | "796",
    workerId: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Approval / Close shift state
  const [closingShiftId, setClosingShiftId] = useState("");
  const [closeForm, setCloseForm] = useState({
    petrolEndReading: 0,
    dieselEndReading: 0,
    cashCollected: 0,
    onlineCollected: 0,
    creditCollected: 0,
    petrolTesting: 0,
    dieselTesting: 0,
    silak: 0,
    notes: ""
  });

  // Online payments state
  const [onlinePayments, setOnlinePayments] = useState<OnlinePaymentEntry[]>([]);
  const [newOnlineRef, setNewOnlineRef] = useState("");
  const [newOnlineAmount, setNewOnlineAmount] = useState("");
  const [newOnlinePhoto, setNewOnlinePhoto] = useState<string | undefined>(undefined);

  // Credit parties state (Multiple Parties support)
  const [creditParties, setCreditParties] = useState<CreditPartyEntry[]>([]);

  // Task creation state
  const [newTaskForm, setNewTaskForm] = useState({ title: "", description: "", assignedTo: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState({ text: "", type: "success" as "success" | "error" });

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    window.setTimeout(() => setFeedback({ text: "", type: "success" }), 5000);
  };

  const loadData = async () => {
    try {
      const [loadedShifts, loadedRates, loadedCustomers, loadedTasks, users, loadedTransactions] = await Promise.all([
        api.getShifts(), 
        api.getFuelRates(), 
        api.getCreditCustomers(), 
        api.getTasks(), 
        api.getUsers(),
        api.getCreditTransactions()
      ]);
      setShifts(loadedShifts);
      setRates(loadedRates);
      setCustomers(loadedCustomers);
      setTasks(loadedTasks);
      setStaff(users.filter((user) => user.status === "active"));
      setCreditTransactions(loadedTransactions);
    } catch (error: any) { 
      showFeedback(error.message || "Failed to load manager dashboard data.", "error"); 
    }
  };

  useEffect(() => { 
    loadData(); 
  }, [activeTab]);

  const handleRecordPaymentDirect = async (customerId: string, amount: number, remarks: string) => {
    await api.recordCreditPayment({
      customerId,
      amount,
      remarks,
      currentUserId: currentUser.id,
      currentUsername: currentUser.username,
      currentUserRole: currentUser.role
    });
    showFeedback("Customer credit payment successfully logged.");
    await loadData();
    onRefreshStats();
  };

  const handleOpenShift = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!openShiftForm.workerId) return showFeedback("Please select a worker.", "error");
    try {
      await api.openShift(
        openShiftForm.shiftName, 
        openShiftForm.machineId, 
        openShiftForm.workerId, 
        openShiftForm.date,
        currentUser.id, 
        currentUser.username, 
        currentUser.role
      );
      showFeedback(`Machine #${openShiftForm.machineId} shift opened successfully for ${openShiftForm.date}!`);
      await loadData(); 
      onRefreshStats();
    } catch (error: any) { 
      showFeedback(error.message || "Failed to open shift.", "error"); 
    }
  };

  const startApproval = (shift: Shift) => {
    if (shift.status === "open") {
      showFeedback("Worker has not submitted the shift readings yet. Awaiting worker submission.", "error");
      return;
    }

    // Check worker pending tasks
    const pendingTasksForWorker = tasks.filter(t => t.assignedTo === shift.workerId && t.status === "pending");
    if (pendingTasksForWorker.length > 0) {
      showFeedback(`Worker has ${pendingTasksForWorker.length} pending task(s) ("${pendingTasksForWorker[0].title}") that must be completed first.`, "error");
      return;
    }

    setClosingShiftId(shift.id);
    setCloseForm({
      petrolEndReading: shift.petrolEndReading ?? shift.petrolStartReading,
      dieselEndReading: shift.dieselEndReading ?? shift.dieselStartReading,
      cashCollected: shift.cashCollected || 0,
      onlineCollected: shift.onlineCollected || 0,
      creditCollected: shift.creditCollected || 0,
      petrolTesting: shift.petrolTesting || 0,
      dieselTesting: shift.dieselTesting || 0,
      silak: shift.silak || 0,
      notes: shift.notes || ""
    });
    setOnlinePayments(shift.onlinePayments || []);
    setCreditParties(shift.creditParties || [{ customerName: "", amount: 0, remarks: "" }]);
  };

  // Add credit party row
  const handleAddCreditParty = () => {
    setCreditParties([...creditParties, { customerName: "", amount: 0, remarks: "" }]);
  };

  // Remove credit party row
  const handleRemoveCreditParty = (index: number) => {
    const updated = [...creditParties];
    updated.splice(index, 1);
    setCreditParties(updated);
  };

  // Update credit party row
  const handleCreditPartyUpdate = (index: number, name: string, customerId?: string) => {
    setCreditParties(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        customerName: name,
        ...(customerId ? { customerId } : { customerId: undefined })
      };
      const sumCredit = updated.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setCloseForm(form => ({ ...form, creditCollected: sumCredit }));
      return updated;
    });
  };

  const handleCreditPartyChange = (index: number, field: keyof CreditPartyEntry, value: any) => {
    setCreditParties(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const sumCredit = updated.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setCloseForm(form => ({ ...form, creditCollected: sumCredit }));
      return updated;
    });
  };

  // Online photo handler (Camera or Gallery)
  const handleOnlinePhotoSelect = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewOnlinePhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddOnlinePayment = () => {
    if (!newOnlineAmount || Number(newOnlineAmount) <= 0) {
      showFeedback("Enter valid online payment amount.", "error");
      return;
    }
    const newEntry: OnlinePaymentEntry = {
      id: `online_${Date.now()}`,
      amount: Number(newOnlineAmount),
      transactionRef: newOnlineRef,
      proofImage: newOnlinePhoto
    };
    const updated = [...onlinePayments, newEntry];
    setOnlinePayments(updated);
    setNewOnlineAmount("");
    setNewOnlineRef("");
    setNewOnlinePhoto(undefined);

    // Auto sync online collected
    const sumOnline = updated.reduce((acc, curr) => acc + curr.amount, 0);
    setCloseForm(prev => ({ ...prev, onlineCollected: sumOnline }));
  };

  const handleRemoveOnlinePayment = (index: number) => {
    const updated = [...onlinePayments];
    updated.splice(index, 1);
    setOnlinePayments(updated);
    const sumOnline = updated.reduce((acc, curr) => acc + curr.amount, 0);
    setCloseForm(prev => ({ ...prev, onlineCollected: sumOnline }));
  };

  const handleApproveAndClose = async (event: React.FormEvent) => {
    event.preventDefault();
    const shift = shifts.find((item) => item.id === closingShiftId);
    if (!shift) return;

    if (closeForm.petrolEndReading < shift.petrolStartReading || closeForm.dieselEndReading < shift.dieselStartReading) {
      return showFeedback("Closing reading cannot be lower than opening reading.", "error");
    }

    try {
      await api.managerApproveShift({
        shiftId: shift.id,
        ...closeForm,
        onlinePayments,
        creditParties: creditParties.filter(p => p.customerName.trim() !== ""),
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback("Shift verified and approved by Manager! Sent to Owner for final closure.");
      setClosingShiftId(""); 
      await loadData(); 
      onRefreshStats();
    } catch (error: any) { 
      showFeedback(error.message || "Failed to approve shift.", "error"); 
    }
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTaskForm.title || !newTaskForm.description || !newTaskForm.assignedTo) {
      return showFeedback("All task fields are required.", "error");
    }
    try {
      await api.createTask({
        ...newTaskForm,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback("Maintenance task assigned to worker.");
      setNewTaskForm({ title: "", description: "", assignedTo: "" }); 
      setShowTaskForm(false); 
      await loadData();
    } catch (error: any) { 
      showFeedback(error.message || "Failed to create task.", "error"); 
    }
  };

  const activeShifts = shifts.filter((shift) => shift.status === "open");
  const workerSubmittedShifts = shifts.filter((shift) => shift.status === "submitted_by_worker" || shift.status === "pending_approval");
  const managerApprovedShifts = shifts.filter((shift) => shift.status === "approved_by_manager");
  
  const petrolRate = rates.find((rate) => rate.fuelType === "petrol")?.rate || 0;
  const dieselRate = rates.find((rate) => rate.fuelType === "diesel")?.rate || 0;

  return (
    <div className="space-y-6">
      {feedback.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-bold ${feedback.type === "success" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"}`}>
          {feedback.text}
        </div>
      )}

      <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-3">
        <button 
          onClick={() => setActiveTab("shifts")} 
          className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "shifts" ? "bg-indigo-600 text-white" : "text-neutral-600 dark:text-zinc-400"}`}
        >
          Shift Desk
        </button>
        <button 
          onClick={() => setActiveTab("credit")} 
          className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "credit" ? "bg-indigo-600 text-white" : "text-neutral-600 dark:text-zinc-400"}`}
        >
          Credit Registry
        </button>
        <button 
          onClick={() => setActiveTab("tasks")} 
          className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "tasks" ? "bg-indigo-600 text-white" : "text-neutral-600 dark:text-zinc-400"}`}
        >
          Task Management
        </button>
      </div>

      {activeTab === "shifts" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* Worker Submitted Shifts (Pending Manager Approval) */}
            <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
              <h3 className="mb-3 font-bold text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Send className="h-5 w-5" />
                Submitted by Worker (Pending Manager Approval)
              </h3>
              
              {workerSubmittedShifts.length === 0 ? (
                <p className="text-sm text-neutral-500">No shifts currently submitted by workers for approval.</p>
              ) : (
                <div className="space-y-3">
                  {workerSubmittedShifts.map((shift) => (
                    <div key={shift.id} className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <strong className="text-sm">Machine #{shift.machineId} • {shift.shiftName} Shift ({shift.date})</strong>
                          <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-1">
                            Worker: <strong>{staff.find(u => u.id === shift.workerId)?.name || shift.workerName || shift.workerId}</strong>
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-zinc-400">
                            Petrol: {shift.petrolStartReading} → {shift.petrolEndReading} L | Diesel: {shift.dieselStartReading} → {shift.dieselEndReading} L
                          </p>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Expected Sales Tariff: ₹{(shift.expectedAmount || 0).toLocaleString()}
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => startApproval(shift)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verify & Approve Shift
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Shifts (Open, awaiting worker submission) */}
            <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
              <h3 className="mb-3 font-bold text-base">Active Open Shifts</h3>
              {activeShifts.length === 0 ? (
                <p className="text-sm text-neutral-500">No active open shifts.</p>
              ) : (
                <div className="space-y-3">
                  {activeShifts.map((shift) => {
                    const workerHasPendingTask = tasks.some(t => t.assignedTo === shift.workerId && t.status === "pending");
                    return (
                      <div key={shift.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-neutral-200 dark:border-zinc-800 p-4">
                        <div>
                          <strong className="text-sm">Machine #{shift.machineId} • {shift.shiftName} Shift ({shift.date})</strong>
                          <p className="text-xs text-neutral-500">
                            Worker: {staff.find((user) => user.id === shift.workerId)?.name || shift.workerName || shift.workerId}
                          </p>
                          <span className="inline-block mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                            Worker Reading Submission Pending
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          disabled={true}
                          className="flex items-center gap-1.5 rounded-xl bg-neutral-300 dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-neutral-500 cursor-not-allowed opacity-70"
                          title="Worker must submit shift readings first before Manager can approve"
                        >
                          <Power className="h-4 w-4" />
                          Awaiting Worker Submission
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Manager Verification & Approval Modal Form */}
            {closingShiftId && (
              <form onSubmit={handleApproveAndClose} className="space-y-5 rounded-2xl border border-emerald-500/40 p-5 bg-emerald-50/30 dark:bg-emerald-950/20 backdrop-blur-md">
                <h3 className="font-bold text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Manager Verification & Billing Collection
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-zinc-400">Petrol Closing Reading</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={closeForm.petrolEndReading || ""} 
                      onChange={(event) => setCloseForm({ ...closeForm, petrolEndReading: Number(event.target.value) })} 
                      className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-zinc-400">Diesel Closing Reading</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={closeForm.dieselEndReading || ""} 
                      onChange={(event) => setCloseForm({ ...closeForm, dieselEndReading: Number(event.target.value) })} 
                      className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" 
                      required 
                    />
                  </div>
                </div>

                <div className="border-t border-emerald-200 dark:border-emerald-800/40 pt-4 space-y-4">
                  <p className="text-xs font-bold uppercase text-neutral-500 dark:text-zinc-400">
                    Collected Revenue & Daily Testing / Silak Breakdown
                  </p>
                  
                  {/* Row 1: Existing Collections (Unchanged) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold">Cash Collection (₹)</label>
                      <input 
                        type="number" 
                        value={closeForm.cashCollected} 
                        onChange={(event) => setCloseForm({ ...closeForm, cashCollected: Number(event.target.value) })} 
                        className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-bold" 
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold">Online Total (₹)</label>
                      <input 
                        type="number" 
                        value={closeForm.onlineCollected} 
                        onChange={(event) => setCloseForm({ ...closeForm, onlineCollected: Number(event.target.value) })} 
                        className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-bold" 
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold">Credit Total (₹)</label>
                      <input 
                        type="number" 
                        value={closeForm.creditCollected} 
                        onChange={(event) => setCloseForm({ ...closeForm, creditCollected: Number(event.target.value) })} 
                        className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-bold" 
                      />
                    </div>
                  </div>

                  {/* Row 2: Petrol Testing, Diesel Testing, Silak */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-amber-700 dark:text-amber-400">Petrol Testing (₹)</label>
                      <input 
                        type="number" 
                        value={closeForm.petrolTesting || ""} 
                        onChange={(event) => setCloseForm({ ...closeForm, petrolTesting: Number(event.target.value) })} 
                        className="mt-1 w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 px-3 py-2 text-sm font-bold" 
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-amber-700 dark:text-amber-400">Diesel Testing (₹)</label>
                      <input 
                        type="number" 
                        value={closeForm.dieselTesting || ""} 
                        onChange={(event) => setCloseForm({ ...closeForm, dieselTesting: Number(event.target.value) })} 
                        className="mt-1 w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 px-3 py-2 text-sm font-bold" 
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Silak (₹)</label>
                      <input 
                        type="number" 
                        value={closeForm.silak || ""} 
                        onChange={(event) => setCloseForm({ ...closeForm, silak: Number(event.target.value) })} 
                        className="mt-1 w-full rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 px-3 py-2 text-sm font-bold" 
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Grand Net Total Display */}
                  <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-100/80 dark:bg-emerald-950/60 p-3 flex flex-wrap items-center justify-between gap-2 text-emerald-900 dark:text-emerald-200">
                    <span className="text-xs font-bold">
                      Grand Total (Cash + Online + Credit + Petrol Testing + Diesel Testing + Silak):
                    </span>
                    <span className="text-base font-extrabold font-display">
                      ₹{(
                        Number(closeForm.cashCollected || 0) + 
                        Number(closeForm.onlineCollected || 0) + 
                        Number(closeForm.creditCollected || 0) + 
                        Number(closeForm.petrolTesting || 0) + 
                        Number(closeForm.dieselTesting || 0) + 
                        Number(closeForm.silak || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Online Payment Receipts & Camera/Gallery Proofs */}
                <div className="border-t border-emerald-200 dark:border-emerald-800/40 pt-4 space-y-3">
                  <p className="text-xs font-bold uppercase text-neutral-600 dark:text-zinc-400">
                    Online Payment Proof Uploads
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Amount ₹"
                      value={newOnlineAmount}
                      onChange={e => setNewOnlineAmount(e.target.value)}
                      className="rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Txn Ref / UTR #"
                      value={newOnlineRef}
                      onChange={e => setNewOnlineRef(e.target.value)}
                      className="rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs"
                    />

                    <div className="flex gap-1">
                      <label className="cursor-pointer flex-1 flex items-center justify-center gap-1 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800 py-2 text-[11px] font-bold">
                        <Camera className="h-3.5 w-3.5" /> Camera
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleOnlinePhotoSelect(e.target.files?.[0] || null)} />
                      </label>
                      <label className="cursor-pointer flex-1 flex items-center justify-center gap-1 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800 py-2 text-[11px] font-bold">
                        <ImageIcon className="h-3.5 w-3.5" /> Gallery
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleOnlinePhotoSelect(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>

                  {newOnlinePhoto && (
                    <div className="flex items-center gap-2">
                      <img src={newOnlinePhoto} alt="Proof" className="h-12 w-12 rounded-lg object-cover border" />
                      <span className="text-xs text-emerald-600 font-bold">Photo attached</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddOnlinePayment}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Online Entry
                  </button>

                  {onlinePayments.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {onlinePayments.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-900 p-2 rounded-lg border">
                          <span>₹{p.amount} {p.transactionRef && `(${p.transactionRef})`}</span>
                          <div className="flex items-center gap-2">
                            {p.proofImage && <img src={p.proofImage} alt="proof" className="h-6 w-6 rounded object-cover" />}
                            <button type="button" onClick={() => handleRemoveOnlinePayment(idx)} className="text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Multiple Credit Party Entries */}
                <div className="border-t border-emerald-200 dark:border-emerald-800/40 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase text-neutral-600 dark:text-zinc-400">
                      Credit Customer Parties
                    </p>
                    <button
                      type="button"
                      onClick={handleAddCreditParty}
                      className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Party
                    </button>
                  </div>

                  <div className="space-y-2">
                    {creditParties.map((party, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800">
                        <div className="sm:col-span-5">
                          <PartyAutoCompleteInput
                            value={party.customerName}
                            customers={customers}
                            onChange={(name, customerId) => handleCreditPartyUpdate(index, name, customerId)}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            placeholder="Amount ₹"
                            value={party.amount || ""}
                            onChange={(e) => handleCreditPartyChange(index, "amount", Number(e.target.value))}
                            className="w-full rounded-lg border border-neutral-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Vehicle / Remarks"
                            value={party.remarks || ""}
                            onChange={(e) => handleCreditPartyChange(index, "remarks", e.target.value)}
                            className="w-full rounded-lg border border-neutral-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveCreditParty(index)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <input 
                  value={closeForm.notes} 
                  onChange={(event) => setCloseForm({ ...closeForm, notes: event.target.value })} 
                  placeholder="Manager audit notes..." 
                  className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm" 
                />

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    <Send className="h-4 w-4" /> Approve & Forward to Owner
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setClosingShiftId("")} 
                    className="rounded-xl border border-neutral-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Open New Shift Form Sidebar */}
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
            <h3 className="mb-4 font-bold text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" /> Open New Shift
            </h3>

            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-400 mb-1">Shift Date</label>
                <input
                  type="date"
                  required
                  value={openShiftForm.date}
                  onChange={(e) => setOpenShiftForm({ ...openShiftForm, date: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-400 mb-1">Select Machine</label>
                <select 
                  value={openShiftForm.machineId} 
                  onChange={(event) => setOpenShiftForm({ ...openShiftForm, machineId: event.target.value as "795" | "796" })} 
                  className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="795">Machine 795</option>
                  <option value="796">Machine 796</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-400 mb-1">Shift Type</label>
                <select 
                  value={openShiftForm.shiftName} 
                  onChange={(event) => setOpenShiftForm({ ...openShiftForm, shiftName: event.target.value as "Morning" | "Night" })} 
                  className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-400 mb-1">Assign Worker</label>
                <select 
                  required 
                  value={openShiftForm.workerId} 
                  onChange={(event) => setOpenShiftForm({ ...openShiftForm, workerId: event.target.value })} 
                  className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="">-- Select Worker --</option>
                  {staff.filter((user) => user.role === "Worker").map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all">
                Open Shift
              </button>
            </form>

            <div className="mt-5 rounded-xl bg-neutral-100 dark:bg-zinc-800/40 p-3 text-xs text-neutral-500 dark:text-zinc-400 space-y-1">
              <p><strong>Fuel Rates:</strong> Petrol ₹{petrolRate} • Diesel ₹{dieselRate}</p>
              <p className="text-[11px]">Note: Evening shift has been removed. Use Morning or Night.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "credit" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-base">Credit Registry & Statements</h3>
              <p className="text-xs text-neutral-500">Track outstanding balances, view customer statements, and download credit reports.</p>
            </div>
            <ExportButton
              filename="all_customers_credit_ledger"
              title="All Customers Credit Ledger"
              headers={["Customer Name", "Contact", "Date", "Type", "Remarks", "Amount (INR)", "Recorded By"]}
              keys={["CustomerName", "Contact", "Date", "Type", "Remarks", "Amount", "RecordedBy"]}
              data={creditTransactions.map(tx => {
                const cust = customers.find(c => c.id === tx.customerId);
                return {
                  CustomerName: cust ? cust.name : tx.customerId,
                  Contact: cust ? cust.contact : "-",
                  Date: tx.date,
                  Type: tx.type === 'charge' ? 'CHARGE (Fuel)' : 'PAYMENT (Received)',
                  Remarks: tx.remarks || "-",
                  Amount: tx.amount,
                  RecordedBy: tx.recordedBy
                };
              })}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-zinc-800 bg-neutral-100/50 dark:bg-zinc-800/50">
                  <th className="p-3">Customer Party</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Credit Limit</th>
                  <th className="p-3">Outstanding Balance</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50/50 dark:hover:bg-zinc-800/20">
                    <td className="p-3 font-semibold">{customer.name}</td>
                    <td className="p-3 text-neutral-500">{customer.contact}</td>
                    <td className="p-3">₹{customer.creditLimit.toLocaleString()}</td>
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">₹{customer.balance.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingCustomerLedger(customer)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detailed Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer Ledger Detailed Modal */}
          {viewingCustomerLedger && (
            <CustomerLedgerModal
              customer={viewingCustomerLedger}
              transactions={creditTransactions}
              shifts={shifts}
              onClose={() => setViewingCustomerLedger(null)}
              onRecordPayment={handleRecordPaymentDirect}
            />
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base">Tasks Management</h3>
            <button 
              type="button" 
              onClick={() => setShowTaskForm(!showTaskForm)} 
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" /> Assign New Task
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="space-y-3 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
              <input 
                required 
                value={newTaskForm.title} 
                onChange={(event) => setNewTaskForm({ ...newTaskForm, title: event.target.value })} 
                placeholder="Task title (e.g. Clean Machine 795 Nozzles)" 
                className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm" 
              />
              
              <textarea 
                required 
                value={newTaskForm.description} 
                onChange={(event) => setNewTaskForm({ ...newTaskForm, description: event.target.value })} 
                placeholder="Detailed task instructions..." 
                className="min-h-24 w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm" 
              />
              
              <select 
                required 
                value={newTaskForm.assignedTo} 
                onChange={(event) => setNewTaskForm({ ...newTaskForm, assignedTo: event.target.value })} 
                className="w-full rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm"
              >
                <option value="">-- Assign to Worker --</option>
                {staff.filter((user) => user.role === "Worker").map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>

              <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
                Assign Task
              </button>
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <div key={task.id} className="space-y-2 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    task.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    task.status === "submitted" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600"
                  }`}>
                    {task.status}
                  </span>
                  <span className="text-xs text-neutral-400">Assigned to: {staff.find(u => u.id === task.assignedTo)?.name || task.assignedTo}</span>
                </div>

                <h4 className="font-bold text-sm">{task.title}</h4>
                <p className="text-xs text-neutral-600 dark:text-zinc-400">{task.description}</p>
                
                {task.submissionNotes && (
                  <div className="rounded-xl bg-neutral-50 dark:bg-zinc-800/50 p-3 text-xs space-y-1">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">Worker Completion Notes:</p>
                    <p>{task.submissionNotes}</p>
                  </div>
                )}

                {task.submissionPhoto && (
                  <img src={task.submissionPhoto} alt="Task completion proof" className="max-h-48 rounded-xl border border-neutral-200 dark:border-zinc-800 object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
