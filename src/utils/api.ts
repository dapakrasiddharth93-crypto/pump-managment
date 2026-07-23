import { User, FuelRate, Shift, Sale, CreditCustomer, CreditTransaction, Task, AuditLog, OnlinePaymentEntry, CreditPartyEntry } from "../types.js";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (username: string, password: string) => 
    request<{ user: User; token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  // Users
  getUsers: () => request<User[]>("/api/users"),
  saveUser: (user: Partial<User> & { currentUserId: string; currentUsername: string; currentUserRole: string; password?: string }) => 
    request<{ success: boolean }>("/api/users", { method: "POST", body: JSON.stringify(user) }),
  toggleUserStatus: (targetUserId: string, currentUserId: string, currentUsername: string, currentUserRole: string) => 
    request<{ success: boolean; newStatus: "active" | "inactive" }>("/api/users/toggle-status", { method: "POST", body: JSON.stringify({ targetUserId, currentUserId, currentUsername, currentUserRole }) }),

  // Fuel Rates
  getFuelRates: () => request<FuelRate[]>("/api/fuel-rates"),
  updateFuelRates: (rates: { fuelType: "petrol" | "diesel"; rate: number }[], currentUserId: string, currentUsername: string, currentUserRole: string) => 
    request<{ success: boolean; fuelRates: FuelRate[] }>("/api/fuel-rates", { method: "POST", body: JSON.stringify({ rates, currentUserId, currentUsername, currentUserRole }) }),

  // Shifts
  getShifts: () => request<Shift[]>("/api/shifts"),
  openShift: (
    shiftName: "Morning" | "Night", 
    machineId: "795" | "796", 
    workerId: string, 
    date: string, 
    currentUserId: string, 
    currentUsername: string, 
    currentUserRole: string
  ) => request<Shift>("/api/shifts/open", { 
    method: "POST", 
    body: JSON.stringify({ shiftName, machineId, workerId, date, currentUserId, currentUsername, currentUserRole }) 
  }),

  submitShiftForManager: (params: {
    shiftId: string;
    petrolEndReading: number;
    dieselEndReading: number;
    petrolLitersSold: number;
    dieselLitersSold: number;
    expectedAmount: number;
    currentUserId: string;
    currentUsername: string;
    currentUserRole: string;
  }) => request<Shift>("/api/shifts/submit-for-manager", { method: "POST", body: JSON.stringify(params) }),

  managerApproveShift: (params: {
    shiftId: string;
    petrolEndReading: number;
    dieselEndReading: number;
    cashCollected: number;
    onlineCollected: number;
    creditCollected: number;
    notes?: string;
    onlinePayments?: OnlinePaymentEntry[];
    creditParties?: CreditPartyEntry[];
    currentUserId: string;
    currentUsername: string;
    currentUserRole: string;
  }) => request<Shift>("/api/shifts/approve-manager", { method: "POST", body: JSON.stringify(params) }),

  ownerApproveShift: (params: {
    shiftId: string;
    currentUserId: string;
    currentUsername: string;
    currentUserRole: string;
  }) => request<Shift>("/api/shifts/approve-owner", { method: "POST", body: JSON.stringify(params) }),

  closeShift: (params: {
    shiftId: string;
    petrolEndReading: number;
    dieselEndReading: number;
    cashCollected: number;
    onlineCollected: number;
    creditCollected: number;
    notes?: string;
    currentUserId: string;
    currentUsername: string;
    currentUserRole: string;
  }) => request<Shift>("/api/shifts/close", { method: "POST", body: JSON.stringify(params) }),

  approveShift: (shiftId: string, currentUserId: string, currentUsername: string, currentUserRole: string) => 
    request<Shift>("/api/shifts/approve", { method: "POST", body: JSON.stringify({ shiftId, currentUserId, currentUsername, currentUserRole }) }),

  // Sales
  getSales: () => request<Sale[]>("/api/sales"),
  createSale: (params: { 
    shiftId: string; 
    fuelType: "petrol" | "diesel"; 
    liters: number; 
    amount: number; 
    paymentMethod: "cash" | "online" | "credit"; 
    customerId?: string; 
    customerName?: string; 
    remarks?: string; 
    proofImage?: string; 
    currentUserId: string; 
    currentUsername: string; 
    currentUserRole: string;
  }) => request<Sale>("/api/sales", { method: "POST", body: JSON.stringify(params) }),

  // Credit Customers
  getCreditCustomers: () => request<CreditCustomer[]>("/api/credit-customers"),
  saveCreditCustomer: (params: { 
    id?: string; 
    name: string; 
    contact: string; 
    creditLimit: number; 
    currentUserId: string; 
    currentUsername: string; 
    currentUserRole: string;
  }) => request<{ success: boolean; customers: CreditCustomer[] }>("/api/credit-customers", { method: "POST", body: JSON.stringify(params) }),

  recordCreditPayment: (params: { 
    customerId: string; 
    amount: number; 
    remarks?: string; 
    currentUserId: string; 
    currentUsername: string; 
    currentUserRole: string;
  }) => request<{ success: boolean; customer: CreditCustomer }>("/api/credit-transactions/pay", { method: "POST", body: JSON.stringify(params) }),

  getCreditTransactions: () => request<CreditTransaction[]>("/api/credit-transactions"),

  // Tasks
  getTasks: () => request<Task[]>("/api/tasks"),
  createTask: (params: { 
    title: string; 
    description: string; 
    assignedTo: string; 
    currentUserId: string; 
    currentUsername: string; 
    currentUserRole: string;
  }) => request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(params) }),

  submitTask: (params: { 
    taskId: string; 
    submissionNotes: string; 
    submissionPhoto?: string; 
    currentUserId: string; 
    currentUsername: string; 
    currentUserRole: string;
  }) => request<Task>("/api/tasks/submit", { method: "POST", body: JSON.stringify(params) }),

  approveRejectTask: (params: { 
    taskId: string; 
    status: "approved" | "rejected"; 
    remarks?: string; 
    currentUserId: string; 
    currentUsername: string; 
    currentUserRole: string;
  }) => request<Task>("/api/tasks/approve-reject", { method: "POST", body: JSON.stringify(params) }),

  // Audit & Stats & Backup
  getAuditLogs: () => request<AuditLog[]>("/api/audit-logs"),
  getStats: () => request<{ 
    revenue: { total: number; cash: number; online: number; credit: number }; 
    fuel: { petrol: number; diesel: number; total: number }; 
    machines: { "795": { petrol: number; diesel: number; revenue: number }; "796": { petrol: number; diesel: number; revenue: number } }; 
    credit: { totalOutstanding: number; customerCount: number };
  }>("/api/stats"),
  restoreBackup: (backupData: any, currentUserId: string, currentUsername: string, currentUserRole: string) => 
    request<{ success: boolean }>("/api/restore", { method: "POST", body: JSON.stringify({ backupData, currentUserId, currentUsername, currentUserRole }) }),
};
