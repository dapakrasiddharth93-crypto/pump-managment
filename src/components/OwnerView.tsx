/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, Fuel, CreditCard, ShieldAlert, FileText, CheckCircle, 
  XCircle, ToggleLeft, ToggleRight, UserPlus, Save, Plus, 
  Trash2, DollarSign, Activity, Settings, Database, Upload, AlertTriangle, Calendar, Filter, Eye
} from "lucide-react";
import { User, FuelRate, Shift, CreditCustomer, CreditTransaction, AuditLog, Task } from "../types.js";
import { api } from "../utils/api.js";
import ExportButton from "./ExportButton.js";

interface OwnerViewProps {
  currentUser: User;
  onRefreshStats: () => void;
}

export default function OwnerView({ currentUser, onRefreshStats }: OwnerViewProps) {
  const [activeTab, setActiveTab] = useState<'rates' | 'users' | 'credit' | 'shifts' | 'tasks' | 'audit' | 'backup'>('rates');
  
  // States for backend data
  const [users, setUsers] = useState<User[]>([]);
  const [rates, setRates] = useState<FuelRate[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Fuel rates edit state
  const [editingRatePetrol, setEditingRatePetrol] = useState<number>(0);
  const [editingRateDiesel, setEditingRateDiesel] = useState<number>(0);
  
  // User management form
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: "", password: "", role: "Worker" as any, name: "", contact: ""
  });
  
  // Credit customer form
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "", contact: "", creditLimit: 50000
  });

  // Credit payment form
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentRemarks, setPaymentRemarks] = useState("");

  // Shift Audit Filters
  const [auditSingleDate, setAuditSingleDate] = useState("");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [auditMachineFilter, setAuditMachineFilter] = useState<"all" | "795" | "796">("all");
  const [selectedShiftModal, setSelectedShiftModal] = useState<Shift | null>(null);

  // Task creation form
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title: "", description: "", assignedTo: "" });
  const [taskRemarks, setTaskRemarks] = useState<{ [taskId: string]: string }>({});

  // Backup & Restore
  const [backupFileContent, setBackupFileContent] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState({ text: "", type: "success" as 'success' | 'error' });

  // Load backend data
  const loadData = async () => {
    try {
      const [u, r, s, c, ct, a, t] = await Promise.all([
        api.getUsers(),
        api.getFuelRates(),
        api.getShifts(),
        api.getCreditCustomers(),
        api.getCreditTransactions(),
        api.getAuditLogs(),
        api.getTasks()
      ]);
      setUsers(u);
      setRates(r);
      setShifts(s);
      setCreditCustomers(c);
      setCreditTransactions(ct);
      setAuditLogs(a);
      setTasks(t);
      
      const pRate = r.find(x => x.fuelType === 'petrol')?.rate || 104.25;
      const dRate = r.find(x => x.fuelType === 'diesel')?.rate || 92.50;
      setEditingRatePetrol(pRate);
      setEditingRateDiesel(dRate);
    } catch (err: any) {
      showFeedback(err.message || "Failed to load data", 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: "", type: "success" }), 5000);
  };

  // Update Fuel Rates
  const handleUpdateRates = async () => {
    try {
      await api.updateFuelRates([
        { fuelType: 'petrol', rate: Number(editingRatePetrol) },
        { fuelType: 'diesel', rate: Number(editingRateDiesel) }
      ], currentUser.id, currentUser.username, currentUser.role);
      showFeedback("Fuel rates updated successfully!");
      onRefreshStats();
      loadData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Toggle User Active / Inactive
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await api.toggleUserStatus(userId, currentUser.id, currentUser.username, currentUser.role);
      showFeedback(`Account status is now ${res.newStatus}`);
      loadData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.name || !newUserForm.contact) {
      showFeedback("All fields are required", 'error');
      return;
    }
    try {
      await api.saveUser({
        ...newUserForm,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback("User account created successfully!");
      setNewUserOpen(false);
      setNewUserForm({ username: "", password: "", role: "Worker", name: "", contact: "" });
      loadData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Create Credit Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.contact) {
      showFeedback("Name and contact details are required", 'error');
      return;
    }
    try {
      await api.saveCreditCustomer({
        ...newCustomerForm,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback("Credit customer registry created!");
      setNewCustomerOpen(false);
      setNewCustomerForm({ name: "", contact: "", creditLimit: 50000 });
      loadData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || paymentAmount <= 0) {
      showFeedback("Please select a customer and valid positive amount", 'error');
      return;
    }
    try {
      await api.recordCreditPayment({
        customerId: selectedCustomerId,
        amount: Number(paymentAmount),
        remarks: paymentRemarks,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback("Customer credit payment successfully logged.");
      setRecordPaymentOpen(false);
      setSelectedCustomerId("");
      setPaymentAmount(0);
      setPaymentRemarks("");
      loadData();
      onRefreshStats();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title || !newTaskForm.description || !newTaskForm.assignedTo) {
      showFeedback("All fields are required to allocate task", 'error');
      return;
    }
    try {
      await api.createTask({
        ...newTaskForm,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback("Task successfully allocated!");
      setNewTaskOpen(false);
      setNewTaskForm({ title: "", description: "", assignedTo: "" });
      loadData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Owner Final Approve / Close Shift
  const handleOwnerApproveShift = async (shiftId: string) => {
    try {
      await api.ownerApproveShift({
        shiftId,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback("Shift audited and final approval granted. Status set to CLOSED.");
      loadData();
      onRefreshStats();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Task Action
  const handleTaskAction = async (taskId: string, status: 'approved' | 'rejected') => {
    try {
      await api.approveRejectTask({
        taskId,
        status,
        remarks: taskRemarks[taskId] || "",
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        currentUserRole: currentUser.role
      });
      showFeedback(`Task has been marked as ${status}.`);
      loadData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Backup file read
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackupFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  // Restore DB
  const handleRestoreBackup = async () => {
    if (!backupFileContent) return;
    try {
      const parsed = JSON.parse(backupFileContent);
      await api.restoreBackup(parsed, currentUser.id, currentUser.username, currentUser.role);
      showFeedback("Database restored successfully!");
      setBackupFileContent("");
      loadData();
      onRefreshStats();
    } catch (err: any) {
      showFeedback(err.message || "Invalid JSON backup file", 'error');
    }
  };

  // Shift Audit Filtering Logic
  const filteredShifts = shifts.filter(shift => {
    if (auditMachineFilter !== "all" && shift.machineId !== auditMachineFilter) {
      return false;
    }
    if (auditSingleDate) {
      if (shift.date !== auditSingleDate) return false;
    }
    if (auditStartDate && auditEndDate) {
      if (shift.date < auditStartDate || shift.date > auditEndDate) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top feedback notification */}
      {feedbackMsg.text && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {feedbackMsg.text}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-3 overflow-x-auto">
        {[
          { id: 'rates', label: 'Fuel Rates', icon: Fuel },
          { id: 'shifts', label: 'Shift Audit & Approvals', icon: Activity },
          { id: 'users', label: 'Staff Directory', icon: Users },
          { id: 'credit', label: 'Credit Ledger', icon: CreditCard },
          { id: 'tasks', label: 'Tasks', icon: FileText },
          { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
          { id: 'backup', label: 'System Backup', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FUEL RATES */}
      {activeTab === 'rates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-neutral-200 dark:border-zinc-800 p-6 glass-panel space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                <Fuel className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Update Fuel Tariff</h3>
                <p className="text-xs text-neutral-500">Live price per liter applied globally across terminals</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Petrol Tariff (₹ / Liter)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={editingRatePetrol}
                    onChange={e => setEditingRatePetrol(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-base font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-4 top-3 text-sm text-neutral-400 font-bold">₹/L</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Diesel Tariff (₹ / Liter)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={editingRateDiesel}
                    onChange={e => setEditingRateDiesel(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-base font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-4 top-3 text-sm text-neutral-400 font-bold">₹/L</span>
                </div>
              </div>

              <button
                onClick={handleUpdateRates}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Fuel Rates
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 dark:border-zinc-800 p-6 glass-panel space-y-4">
            <h3 className="font-display font-bold text-lg">Active Pricing Structure</h3>
            <div className="space-y-3">
              {rates.map(r => (
                <div key={r.fuelType} className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-zinc-800/80 bg-white/30 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${r.fuelType === 'petrol' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                    <span className="font-bold capitalize">{r.fuelType}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-display">₹{r.rate.toFixed(2)}</span>
                    <p className="text-[10px] text-neutral-400">Updated by {r.updatedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHIFT AUDIT & APPROVALS */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 dark:border-zinc-800 p-6 glass-panel space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg">Shift Audit Terminal</h3>
                <p className="text-xs text-neutral-500">
                  Verify Worker & Manager signatures, shift dates, nozzle meter readings, and audit totals.
                </p>
              </div>

              <ExportButton 
                filename="shift_audit_report" 
                headers={["ID", "Shift Date", "Shift Name", "Machine", "Worker Name", "Manager Name", "Owner Name", "Status", "Approval Time", "Expected Amount", "Total Collected", "Cash", "Online", "Credit", "Short/Excess"]}
                keys={["ID", "ShiftDate", "ShiftName", "Machine", "WorkerName", "ManagerName", "OwnerName", "Status", "ApprovalTime", "ExpectedAmount", "TotalCollected", "Cash", "Online", "Credit", "ShortExcess"]}
                data={filteredShifts.map(s => ({
                  ID: s.id,
                  ShiftDate: s.date,
                  ShiftName: s.shiftName,
                  Machine: `Machine ${s.machineId}`,
                  WorkerName: users.find(u => u.id === s.workerId)?.name || s.workerName || s.workerId,
                  ManagerName: s.managerName || 'Pending',
                  OwnerName: s.ownerName || 'Pending',
                  Status: s.status,
                  ApprovalTime: s.ownerApprovedAt || s.managerApprovedAt || s.submittedToManagerAt || 'N/A',
                  ExpectedAmount: s.expectedAmount || 0,
                  TotalCollected: s.totalCollected || 0,
                  Cash: s.cashCollected || 0,
                  Online: s.onlineCollected || 0,
                  Credit: s.creditCollected || 0,
                  ShortExcess: s.shortExcessAmount || 0
                }))} 
              />
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-neutral-100/60 dark:bg-zinc-900/60 p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Single Date Filter</label>
                <input 
                  type="date" 
                  value={auditSingleDate} 
                  onChange={e => { setAuditSingleDate(e.target.value); setAuditStartDate(""); setAuditEndDate(""); }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Start Date Range</label>
                <input 
                  type="date" 
                  value={auditStartDate} 
                  onChange={e => { setAuditStartDate(e.target.value); setAuditSingleDate(""); }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">End Date Range</label>
                <input 
                  type="date" 
                  value={auditEndDate} 
                  onChange={e => { setAuditEndDate(e.target.value); setAuditSingleDate(""); }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Machine Filter</label>
                <select
                  value={auditMachineFilter}
                  onChange={e => setAuditMachineFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                >
                  <option value="all">All Machines (795 & 796)</option>
                  <option value="795">Machine 795</option>
                  <option value="796">Machine 796</option>
                </select>
              </div>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-100/80 dark:bg-zinc-800/80 border-b border-neutral-200 dark:border-zinc-800">
                    <th className="p-3">Shift Date</th>
                    <th className="p-3">Machine</th>
                    <th className="p-3">Worker Name</th>
                    <th className="p-3">Manager Name</th>
                    <th className="p-3">Owner Name</th>
                    <th className="p-3">Approval Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-neutral-400">No shifts match the selected filters.</td>
                    </tr>
                  ) : (
                    filteredShifts.map(s => {
                      const workerObj = users.find(u => u.id === s.workerId);
                      const workerName = workerObj ? workerObj.name : (s.workerName || s.workerId);
                      const approvalTime = s.ownerApprovedAt ? new Date(s.ownerApprovedAt).toLocaleString() :
                                           s.managerApprovedAt ? new Date(s.managerApprovedAt).toLocaleString() :
                                           s.submittedToManagerAt ? new Date(s.submittedToManagerAt).toLocaleString() : 'N/A';

                      return (
                        <tr key={s.id} className="border-b border-neutral-100 dark:border-zinc-800/60 hover:bg-neutral-50/50 dark:hover:bg-zinc-800/30">
                          <td className="p-3 font-bold">{s.date} <span className="text-[10px] text-neutral-400 block">{s.shiftName}</span></td>
                          <td className="p-3 font-semibold">Machine #{s.machineId}</td>
                          <td className="p-3">{workerName}</td>
                          <td className="p-3">{s.managerName || <span className="text-neutral-400 italic">Pending</span>}</td>
                          <td className="p-3">{s.ownerName || <span className="text-neutral-400 italic">Pending</span>}</td>
                          <td className="p-3 text-[11px] text-neutral-500">{approvalTime}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              s.status === 'closed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                              s.status === 'approved_by_manager' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                              s.status === 'submitted_by_worker' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {s.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedShiftModal(s)}
                                className="p-1.5 rounded-lg bg-neutral-200 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-300"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {s.status !== 'closed' && (
                                <button
                                  type="button"
                                  onClick={() => handleOwnerApproveShift(s.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                                >
                                  Final Close
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STAFF DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg">System Users & Staff Directory</h3>
            <button
              onClick={() => setNewUserOpen(!newUserOpen)}
              className="py-2 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add Staff Account
            </button>
          </div>

          {newUserOpen && (
            <form onSubmit={handleCreateUser} className="p-6 rounded-3xl border border-neutral-200 dark:border-zinc-800 glass-panel space-y-4">
              <h4 className="font-bold text-sm">New Staff Registration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <input
                  placeholder="Username"
                  required
                  value={newUserForm.username}
                  onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs"
                />
                <input
                  placeholder="Password"
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs"
                />
                <input
                  placeholder="Full Name"
                  required
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs"
                />
                <input
                  placeholder="Contact Number"
                  required
                  value={newUserForm.contact}
                  onChange={e => setNewUserForm({ ...newUserForm, contact: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs"
                />
                <select
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs"
                >
                  <option value="Worker">Worker</option>
                  <option value="Manager">Manager</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <button type="submit" className="py-2 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                Create Account
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => (
              <div key={u.id} className="p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 glass-panel flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{u.name}</span>
                    <span className="text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">@{u.username} • {u.contact}</p>
                </div>

                {u.id !== currentUser.id && (
                  <button
                    onClick={() => handleToggleUserStatus(u.id)}
                    className={`p-2 rounded-xl text-xs font-bold ${
                      u.status === 'active' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                    }`}
                  >
                    {u.status === 'active' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CREDIT LEDGER */}
      {activeTab === 'credit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg">Credit Customer Ledger & Parties</h3>
              <p className="text-xs text-neutral-500">Manage credit limits, view balances, and record payments.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setNewCustomerOpen(!newCustomerOpen)}
                className="py-2 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Credit Party
              </button>

              <button
                onClick={() => setRecordPaymentOpen(!recordPaymentOpen)}
                className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
              >
                <DollarSign className="w-4 h-4" /> Record Payment
              </button>
            </div>
          </div>

          {newCustomerOpen && (
            <form onSubmit={handleCreateCustomer} className="p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 glass-panel grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="Party Name" required value={newCustomerForm.name} onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} className="px-3 py-2 rounded-xl border text-xs" />
              <input placeholder="Contact Number" required value={newCustomerForm.contact} onChange={e => setNewCustomerForm({ ...newCustomerForm, contact: e.target.value })} className="px-3 py-2 rounded-xl border text-xs" />
              <input placeholder="Credit Limit (₹)" type="number" required value={newCustomerForm.creditLimit} onChange={e => setNewCustomerForm({ ...newCustomerForm, creditLimit: Number(e.target.value) })} className="px-3 py-2 rounded-xl border text-xs" />
              <button type="submit" className="sm:col-span-3 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">Save Customer</button>
            </form>
          )}

          {recordPaymentOpen && (
            <form onSubmit={handleRecordPayment} className="p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 glass-panel space-y-3">
              <h4 className="font-bold text-xs">Record Customer Credit Payment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="px-3 py-2 rounded-xl border text-xs">
                  <option value="">-- Choose Customer --</option>
                  {creditCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Bal: ₹{c.balance})</option>
                  ))}
                </select>
                <input placeholder="Amount Received ₹" type="number" value={paymentAmount || ""} onChange={e => setPaymentAmount(Number(e.target.value))} className="px-3 py-2 rounded-xl border text-xs" />
                <input placeholder="Remarks / Cheque / UTR" value={paymentRemarks} onChange={e => setPaymentRemarks(e.target.value)} className="px-3 py-2 rounded-xl border text-xs" />
              </div>
              <button type="submit" className="py-2 px-4 bg-emerald-600 text-white font-bold rounded-xl text-xs">Log Payment</button>
            </form>
          )}

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-100/80 dark:bg-zinc-800/80 border-b">
                  <th className="p-3">Party Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Credit Limit</th>
                  <th className="p-3">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                {creditCustomers.map(c => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3 text-neutral-500">{c.contact}</td>
                    <td className="p-3">₹{c.creditLimit.toLocaleString()}</td>
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">₹{c.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg">Task Allocation & Approval</h3>
            <button
              onClick={() => setNewTaskOpen(!newTaskOpen)}
              className="py-2 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Create Task
            </button>
          </div>

          {newTaskOpen && (
            <form onSubmit={handleCreateTask} className="p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 glass-panel space-y-3">
              <input placeholder="Task Title" required value={newTaskForm.title} onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" />
              <textarea placeholder="Instructions..." required value={newTaskForm.description} onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs min-h-20" />
              <select required value={newTaskForm.assignedTo} onChange={e => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs">
                <option value="">-- Select Worker --</option>
                {users.filter(u => u.role === 'Worker').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <button type="submit" className="py-2 px-4 bg-indigo-600 text-white font-bold text-xs rounded-xl">Assign Task</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(t => (
              <div key={t.id} className="p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 glass-panel space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600">{t.status}</span>
                    <h4 className="font-bold text-sm">{t.title}</h4>
                  </div>
                  <span className="text-[11px] text-neutral-400">Worker: {users.find(u => u.id === t.assignedTo)?.name || t.assignedTo}</span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-zinc-400">{t.description}</p>

                {t.submissionNotes && (
                  <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs">
                    <p className="font-bold text-neutral-500">Worker Notes:</p>
                    <p>{t.submissionNotes}</p>
                  </div>
                )}

                {t.submissionPhoto && (
                  <img src={t.submissionPhoto} alt="Work Proof" className="max-h-48 rounded-xl border object-cover" />
                )}

                {t.status === 'submitted' && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleTaskAction(t.id, 'approved')} className="py-1.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-xl">Approve</button>
                    <button onClick={() => handleTaskAction(t.id, 'rejected')} className="py-1.5 px-3 bg-rose-600 text-white text-xs font-bold rounded-xl">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg">System Security Audit Trail</h3>
            <ExportButton 
              filename="audit_logs" 
              headers={["ID", "Timestamp", "User ID", "Username", "Role", "Action", "Details"]}
              keys={["id", "timestamp", "userId", "username", "role", "action", "details"]}
              data={auditLogs} 
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-100 dark:bg-zinc-800 border-b">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(l => (
                  <tr key={l.id} className="border-b border-neutral-100 dark:border-zinc-800/40">
                    <td className="p-3 font-mono text-[11px] text-neutral-400">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-bold">{l.username} ({l.role})</td>
                    <td className="p-3 font-bold text-indigo-600">{l.action}</td>
                    <td className="p-3 text-neutral-600 dark:text-zinc-400">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-zinc-800 glass-panel space-y-4">
            <h3 className="font-display font-bold text-lg">Download System Backup</h3>
            <p className="text-xs text-neutral-500">Export complete JSON snapshot of shifts, sales, credit ledger, and users.</p>
            <a
              href="/api/backup"
              download="petrol_pump_backup.json"
              className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-indigo-600 text-white font-bold text-xs"
            >
              <Database className="w-4 h-4" /> Download JSON Backup
            </a>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-zinc-800 glass-panel space-y-4">
            <h3 className="font-display font-bold text-lg">Restore Database Backup</h3>
            <p className="text-xs text-neutral-500">Upload a valid backup file to overwrite application state.</p>
            <input type="file" accept=".json" onChange={handleFileUpload} className="block text-xs" />
            <button
              disabled={!backupFileContent}
              onClick={handleRestoreBackup}
              className="py-2.5 px-4 bg-emerald-600 text-white font-bold text-xs rounded-xl disabled:opacity-50"
            >
              <Upload className="w-4 h-4 inline mr-1" /> Restore Database
            </button>
          </div>
        </div>
      )}

      {/* View Shift Detail Modal */}
      {selectedShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base">Shift Audit Detail #{selectedShiftModal.id}</h3>
              <button onClick={() => setSelectedShiftModal(null)} className="text-neutral-400 font-bold hover:text-neutral-600">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>Shift Date:</strong> {selectedShiftModal.date}</p>
              <p><strong>Shift Name:</strong> {selectedShiftModal.shiftName}</p>
              <p><strong>Machine:</strong> Machine #{selectedShiftModal.machineId}</p>
              <p><strong>Worker:</strong> {users.find(u => u.id === selectedShiftModal.workerId)?.name || selectedShiftModal.workerName || selectedShiftModal.workerId}</p>
              <p><strong>Manager Approval:</strong> {selectedShiftModal.managerName || 'Pending'} ({selectedShiftModal.managerApprovedAt ? new Date(selectedShiftModal.managerApprovedAt).toLocaleString() : 'N/A'})</p>
              <p><strong>Owner Audit:</strong> {selectedShiftModal.ownerName || 'Pending'} ({selectedShiftModal.ownerApprovedAt ? new Date(selectedShiftModal.ownerApprovedAt).toLocaleString() : 'N/A'})</p>
              <p><strong>Meter Readings:</strong> Petrol ({selectedShiftModal.petrolStartReading} → {selectedShiftModal.petrolEndReading || 'N/A'}), Diesel ({selectedShiftModal.dieselStartReading} → {selectedShiftModal.dieselEndReading || 'N/A'})</p>
              <p><strong>Expected Tariff:</strong> ₹{(selectedShiftModal.expectedAmount || 0).toLocaleString()}</p>
              <p><strong>Collected:</strong> Cash ₹{selectedShiftModal.cashCollected || 0}, Online ₹{selectedShiftModal.onlineCollected || 0}, Credit ₹{selectedShiftModal.creditCollected || 0} (Total: ₹{selectedShiftModal.totalCollected || 0})</p>
              <p><strong>Short / Excess:</strong> ₹{selectedShiftModal.shortExcessAmount || 0}</p>
              {selectedShiftModal.notes && <p className="p-2 rounded bg-neutral-100 dark:bg-zinc-800"><strong>Notes:</strong> {selectedShiftModal.notes}</p>}
            </div>

            <button onClick={() => setSelectedShiftModal(null)} className="w-full py-2 bg-neutral-200 dark:bg-zinc-800 text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
