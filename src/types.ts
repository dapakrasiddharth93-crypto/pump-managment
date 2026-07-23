export type UserRole = "Owner" | "Manager" | "Worker";

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  contact: string;
  status: "active" | "inactive";
}

export interface FuelRate {
  fuelType: "petrol" | "diesel";
  rate: number;
  updatedBy: string;
  updatedAt: string;
}

export interface OnlinePaymentEntry {
  id: string;
  amount: number;
  transactionRef?: string;
  proofImage?: string;
}

export interface CreditPartyEntry {
  customerId?: string;
  customerName: string;
  amount: number;
  remarks?: string;
}

export interface Shift {
  id: string;
  date: string;
  shiftName: "Morning" | "Night";
  machineId: "795" | "796";
  workerId: string;
  workerName?: string;
  status: "open" | "submitted_by_worker" | "approved_by_manager" | "closed" | "pending_approval";
  openedAt: string;
  closedAt?: string;

  petrolStartReading: number;
  petrolEndReading?: number;
  dieselStartReading: number;
  dieselEndReading?: number;
  petrolLitersSold?: number;
  dieselLitersSold?: number;
  expectedAmount?: number;

  submittedToManagerAt?: string;
  submittedBy?: string;

  managerName?: string;
  managerId?: string;
  managerApprovedAt?: string;

  ownerName?: string;
  ownerId?: string;
  ownerApprovedAt?: string;

  approvedBy?: string;
  approvedAt?: string;

  cashCollected: number;
  onlineCollected: number;
  creditCollected: number;
  totalCollected: number;
  shortExcessAmount?: number;
  notes?: string;

  onlinePayments?: OnlinePaymentEntry[];
  creditParties?: CreditPartyEntry[];
}

export interface Sale {
  id: string;
  date: string;
  shiftId: string;
  machineId: "795" | "796";
  fuelType: "petrol" | "diesel";
  liters: number;
  amount: number;
  paymentMethod: "cash" | "online" | "credit";
  customerName?: string;
  workerId: string;
  createdAt: string;
  remarks?: string;
  proofImage?: string;
}

export interface CreditCustomer {
  id: string;
  name: string;
  contact: string;
  creditLimit: number;
  balance: number;
}

export interface CreditTransaction {
  id: string;
  customerId: string;
  date: string;
  type: "charge" | "payment";
  amount: number;
  shiftId?: string;
  remarks?: string;
  recordedBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  createdBy: string;
  submissionNotes?: string;
  submissionPhoto?: string;
  remarks?: string;
  createdAt: string;
  submittedAt?: string;
  completedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface DBState {
  users: User[];
  fuelRates: FuelRate[];
  shifts: Shift[];
  sales: Sale[];
  creditCustomers: CreditCustomer[];
  creditTransactions: CreditTransaction[];
  tasks: Task[];
  auditLogs: AuditLog[];
  meterState: {
    "795": { petrol: number; diesel: number };
    "796": { petrol: number; diesel: number };
  };
}
