import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { DBState, User, FuelRate, Shift, Sale, CreditCustomer, CreditTransaction, Task, AuditLog, OnlinePaymentEntry, CreditPartyEntry } from "./src/types.js";

const PORT = process.env.PORT || 3000;
const app = express();

// Increase JSON body size limit for photo uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS for mobile data / WiFi / multi-device network connectivity
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Determine paths
const dbPath = path.join(process.cwd(), "src", "data", "db.json");

// Utility to read DB
function readDB(): DBState {
  try {
    if (!fs.existsSync(dbPath)) {
      throw new Error("Database file does not exist");
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    const db = JSON.parse(data) as DBState;
    // Migrate legacy shift names/statuses if present
    if (db.shifts) {
      db.shifts = db.shifts.map(s => {
        let name = s.shiftName;
        if ((name as string) === "Evening") name = "Night";
        return { ...s, shiftName: name };
      });
    }
    return db;
  } catch (error) {
    console.error("Error reading database:", error);
    return {
      users: [],
      fuelRates: [],
      shifts: [],
      sales: [],
      creditCustomers: [],
      creditTransactions: [],
      tasks: [],
      auditLogs: [],
      meterState: { "795": { petrol: 0, diesel: 0 }, "796": { petrol: 0, diesel: 0 } }
    };
  }
}

// Utility to write DB
function writeDB(state: DBState) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Log audit action
function logAudit(userId: string, username: string, role: any, action: string, details: string) {
  const db = readDB();
  const log: AuditLog = {
    id: `a_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId,
    username,
    role,
    action,
    details
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  writeDB(db);
}

// ================= API ENDPOINTS =================

// Auth login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ error: "Your account is deactivated. Contact Owner." });
  }

  const { password: _, ...userWithoutPassword } = user;
  logAudit(user.id, user.username, user.role, "USER_LOGIN", `${user.name} logged in successfully.`);
  
  res.json({
    user: userWithoutPassword,
    token: `simulated-jwt-${user.id}-${user.role}`
  });
});

// GET users
app.get("/api/users", (req, res) => {
  const db = readDB();
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// CREATE/UPDATE user
app.post("/api/users", (req, res) => {
  const { id, username, password, role, name, contact, status, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  if (id) {
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: "User not found" });
    
    const existing = db.users[index];
    db.users[index] = {
      ...existing,
      username: username || existing.username,
      role: role || existing.role,
      name: name || existing.name,
      contact: contact || existing.contact,
      status: status || existing.status,
      password: password || existing.password
    };
    logAudit(currentUserId, currentUsername, currentUserRole, "USER_UPDATED", `Updated user ${name} (${role})`);
  } else {
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const newUser: User = {
      id: `u_${Date.now()}`,
      username,
      password: password || "123456",
      role,
      name,
      contact,
      status: "active"
    };
    db.users.push(newUser);
    logAudit(currentUserId, currentUsername, currentUserRole, "USER_CREATED", `Created new user ${name} (${role})`);
  }
  
  writeDB(db);
  res.json({ success: true });
});

// Toggle user status
app.post("/api/users/toggle-status", (req, res) => {
  const { targetUserId, currentUserId, currentUsername, currentUserRole } = req.body;
  if (targetUserId === currentUserId) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === targetUserId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.status = user.status === "active" ? "inactive" : "active";
  logAudit(currentUserId, currentUsername, currentUserRole, "USER_STATUS_TOGGLED", `Toggled status of ${user.name} to ${user.status}`);
  writeDB(db);
  res.json({ success: true, newStatus: user.status });
});

// GET fuel rates
app.get("/api/fuel-rates", (req, res) => {
  const db = readDB();
  res.json(db.fuelRates);
});

// UPDATE fuel rates
app.post("/api/fuel-rates", (req, res) => {
  const { rates, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  rates.forEach((r: { fuelType: 'petrol' | 'diesel', rate: number }) => {
    const existing = db.fuelRates.find(f => f.fuelType === r.fuelType);
    if (existing) {
      existing.rate = r.rate;
      existing.updatedBy = currentUsername;
      existing.updatedAt = new Date().toISOString();
    }
  });

  logAudit(currentUserId, currentUsername, currentUserRole, "FUEL_RATES_UPDATED", `Rates updated: Petrol: ${rates.find((r: any) => r.fuelType === 'petrol')?.rate}, Diesel: ${rates.find((r: any) => r.fuelType === 'diesel')?.rate}`);
  writeDB(db);
  res.json({ success: true, fuelRates: db.fuelRates });
});

// GET shifts
app.get("/api/shifts", (req, res) => {
  const db = readDB();
  res.json(db.shifts);
});

// OPEN shift
app.post("/api/shifts/open", (req, res) => {
  const { shiftName, machineId, workerId, date, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  const validShiftName = shiftName === "Night" ? "Night" : "Morning";

  // Check if there is already an open shift for this machine
  const alreadyOpen = db.shifts.find(s => s.machineId === machineId && (s.status === "open" || s.status === "submitted_by_worker" || s.status === "pending_approval"));
  if (alreadyOpen) {
    return res.status(400).json({ error: `Machine ${machineId} already has an active shift (${alreadyOpen.shiftName}). Manager & Owner must approve it first.` });
  }

  // Get start readings from meterState
  const petrolStartReading = db.meterState[machineId as '795' | '796'].petrol;
  const dieselStartReading = db.meterState[machineId as '795' | '796'].diesel;

  const worker = db.users.find(u => u.id === workerId);
  const workerName = worker ? worker.name : workerId;

  const shiftDate = date || new Date().toISOString().split('T')[0];

  const newShift: Shift = {
    id: `sh_${Date.now()}`,
    date: shiftDate,
    shiftName: validShiftName,
    machineId,
    workerId,
    workerName,
    status: "open",
    openedAt: new Date().toISOString(),
    petrolStartReading,
    dieselStartReading,
    cashCollected: 0,
    onlineCollected: 0,
    creditCollected: 0,
    totalCollected: 0
  };

  db.shifts.unshift(newShift);
  logAudit(currentUserId, currentUsername, currentUserRole, "SHIFT_OPENED", `Opened ${validShiftName} shift on Machine ${machineId} for date ${shiftDate}`);
  writeDB(db);
  res.json(newShift);
});

// SUBMIT shift (by worker)
app.post("/api/shifts/submit-for-manager", (req, res) => {
  const { shiftId, petrolEndReading, dieselEndReading, petrolLitersSold, dieselLitersSold, expectedAmount, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();
  const shift = db.shifts.find(s => s.id === shiftId);

  if (!shift) return res.status(404).json({ error: "Shift not found" });
  if (shift.status !== "open") return res.status(400).json({ error: "Only an open shift can be submitted to manager" });

  // Task validation: check if worker has pending tasks
  const pendingTasks = db.tasks.filter(t => t.assignedTo === shift.workerId && t.status === "pending");
  if (pendingTasks.length > 0) {
    return res.status(400).json({ 
      error: `Worker cannot submit shift! You have ${pendingTasks.length} pending task(s) ("${pendingTasks[0].title}") that must be submitted first.` 
    });
  }

  if (petrolEndReading < shift.petrolStartReading || dieselEndReading < shift.dieselStartReading) {
    return res.status(400).json({ error: "Closing readings cannot be lower than opening readings" });
  }

  shift.status = "submitted_by_worker";
  shift.petrolEndReading = Number(petrolEndReading);
  shift.dieselEndReading = Number(dieselEndReading);
  shift.petrolLitersSold = Number(petrolLitersSold);
  shift.dieselLitersSold = Number(dieselLitersSold);
  shift.expectedAmount = Number(expectedAmount);
  shift.submittedToManagerAt = new Date().toISOString();
  shift.submittedBy = currentUserId;

  logAudit(currentUserId, currentUsername, currentUserRole, "SHIFT_SUBMITTED_BY_WORKER", `Worker submitted ${shift.shiftName} shift on Machine ${shift.machineId} for manager approval.`);
  writeDB(db);
  res.json(shift);
});

// APPROVE shift by Manager (Step 2 of approval flow)
app.post("/api/shifts/approve-manager", (req, res) => {
  const { 
    shiftId, petrolEndReading, dieselEndReading, 
    cashCollected, onlineCollected, creditCollected, 
    notes, onlinePayments, creditParties,
    currentUserId, currentUsername, currentUserRole 
  } = req.body;

  const db = readDB();
  const shift = db.shifts.find(s => s.id === shiftId);

  if (!shift) return res.status(404).json({ error: "Shift not found" });

  // Worker submission check: Manager cannot close until worker submits
  if (shift.status === "open") {
    return res.status(400).json({ error: "Shift cannot be approved by manager yet. Worker must submit shift first!" });
  }

  if (shift.status === "closed") {
    return res.status(400).json({ error: "Shift is already fully closed and audited by Owner" });
  }

  // Task validation check
  const pendingTasks = db.tasks.filter(t => t.assignedTo === shift.workerId && t.status === "pending");
  if (pendingTasks.length > 0) {
    return res.status(400).json({ 
      error: `Manager cannot approve shift! Worker ${shift.workerName || shift.workerId} has pending tasks that must be completed.` 
    });
  }

  const pEnd = Number(petrolEndReading ?? shift.petrolEndReading ?? shift.petrolStartReading);
  const dEnd = Number(dieselEndReading ?? shift.dieselEndReading ?? shift.dieselStartReading);

  if (pEnd < shift.petrolStartReading || dEnd < shift.dieselStartReading) {
    return res.status(400).json({ error: "End readings cannot be lower than start readings!" });
  }

  const petrolLitersSold = Number((pEnd - shift.petrolStartReading).toFixed(2));
  const dieselLitersSold = Number((dEnd - shift.dieselStartReading).toFixed(2));

  const petrolRate = db.fuelRates.find(r => r.fuelType === "petrol")?.rate || 100;
  const dieselRate = db.fuelRates.find(r => r.fuelType === "diesel")?.rate || 90;

  const expectedAmount = Number(((petrolLitersSold * petrolRate) + (dieselLitersSold * dieselRate)).toFixed(2));

  // Allow cash = 0, online = 0, credit = 0
  const cash = Number(cashCollected || 0);
  const online = Number(onlineCollected || 0);
  const credit = Number(creditCollected || 0);
  const total = Number((cash + online + credit).toFixed(2));
  const shortExcess = Number((total - expectedAmount).toFixed(2));

  shift.status = "approved_by_manager";
  shift.managerName = currentUsername;
  shift.managerId = currentUserId;
  shift.managerApprovedAt = new Date().toISOString();

  shift.petrolEndReading = pEnd;
  shift.dieselEndReading = dEnd;
  shift.petrolLitersSold = petrolLitersSold;
  shift.dieselLitersSold = dieselLitersSold;
  shift.expectedAmount = expectedAmount;
  shift.cashCollected = cash;
  shift.onlineCollected = online;
  shift.creditCollected = credit;
  shift.totalCollected = total;
  shift.shortExcessAmount = shortExcess;
  shift.notes = notes;

  if (Array.isArray(onlinePayments)) {
    shift.onlinePayments = onlinePayments;
  }
  if (Array.isArray(creditParties)) {
    shift.creditParties = creditParties;

    // Automatically update Credit Customer ledger & record transactions
    creditParties.forEach((party: CreditPartyEntry) => {
      if (!party.customerName || !party.amount) return;
      let customer = db.creditCustomers.find(c => c.name.toLowerCase() === party.customerName.toLowerCase() || c.id === party.customerId);
      if (!customer) {
        customer = {
          id: `cc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: party.customerName,
          contact: "+91 00000 00000",
          creditLimit: 100000,
          balance: 0
        };
        db.creditCustomers.push(customer);
      }
      customer.balance = Number((customer.balance + party.amount).toFixed(2));

      const creditTx: CreditTransaction = {
        id: `ct_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        customerId: customer.id,
        date: shift.date,
        type: "charge",
        amount: party.amount,
        shiftId: shift.id,
        remarks: party.remarks || `Shift ${shift.shiftName} credit sale on Machine ${shift.machineId}`,
        recordedBy: currentUsername
      };
      db.creditTransactions.unshift(creditTx);
    });
  }

  logAudit(currentUserId, currentUsername, currentUserRole, "SHIFT_APPROVED_BY_MANAGER", `Manager approved ${shift.shiftName} shift on Machine ${shift.machineId}. Total collected: ₹${total}. Pending Owner final closure.`);
  writeDB(db);
  res.json(shift);
});

// APPROVE / CLOSE shift by Owner (Step 3 of approval flow)
app.post("/api/shifts/approve-owner", (req, res) => {
  const { shiftId, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  const shift = db.shifts.find(s => s.id === shiftId);
  if (!shift) return res.status(404).json({ error: "Shift not found" });

  shift.status = "closed";
  shift.ownerName = currentUsername;
  shift.ownerId = currentUserId;
  shift.ownerApprovedAt = new Date().toISOString();
  shift.approvedBy = currentUsername;
  shift.approvedAt = new Date().toISOString();
  shift.closedAt = new Date().toISOString();

  // Update meterState with final reading positions
  if (shift.petrolEndReading !== undefined && shift.dieselEndReading !== undefined) {
    db.meterState[shift.machineId as '795' | '796'].petrol = shift.petrolEndReading;
    db.meterState[shift.machineId as '795' | '796'].diesel = shift.dieselEndReading;
  }

  logAudit(currentUserId, currentUsername, currentUserRole, "SHIFT_CLOSED_BY_OWNER", `Owner fully closed and audited ${shift.shiftName} shift on Machine ${shift.machineId}.`);
  writeDB(db);
  res.json(shift);
});

// Legacy close / fallback
app.post("/api/shifts/close", (req, res) => {
  req.url = "/api/shifts/approve-manager";
  app._router.handle(req, res);
});

app.post("/api/shifts/approve", (req, res) => {
  req.url = "/api/shifts/approve-owner";
  app._router.handle(req, res);
});

// GET sales
app.get("/api/sales", (req, res) => {
  const db = readDB();
  res.json(db.sales);
});

// CREATE sale
app.post("/api/sales", (req, res) => {
  const { shiftId, fuelType, liters, amount, paymentMethod, customerId, customerName, remarks, proofImage, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  const shift = db.shifts.find(s => s.id === shiftId);
  if (!shift) return res.status(404).json({ error: "Shift not found" });
  if (shift.status !== "open" && shift.status !== "submitted_by_worker") {
    return res.status(400).json({ error: "Cannot add sales to a closed or approved shift" });
  }

  const newSale: Sale = {
    id: `s_${Date.now()}`,
    date: shift.date,
    shiftId,
    machineId: shift.machineId,
    fuelType,
    liters,
    amount,
    paymentMethod,
    customerName: paymentMethod === 'credit' ? customerName : undefined,
    workerId: shift.workerId,
    createdAt: new Date().toISOString(),
    remarks,
    proofImage
  };

  db.sales.unshift(newSale);

  if (paymentMethod === "credit" && (customerId || customerName)) {
    let customer = db.creditCustomers.find(c => c.id === customerId || c.name.toLowerCase() === customerName?.toLowerCase());
    if (!customer && customerName) {
      customer = {
        id: `cc_${Date.now()}`,
        name: customerName,
        contact: "+91 00000 00000",
        creditLimit: 50000,
        balance: 0
      };
      db.creditCustomers.push(customer);
    }
    if (customer) {
      customer.balance = Number((customer.balance + amount).toFixed(2));
      const creditTx: CreditTransaction = {
        id: `ct_${Date.now()}`,
        customerId: customer.id,
        date: shift.date,
        type: "charge",
        amount,
        shiftId,
        remarks: remarks || `Fuel charge for ${liters}L of ${fuelType}`,
        recordedBy: currentUsername
      };
      db.creditTransactions.unshift(creditTx);
    }
  }

  logAudit(currentUserId, currentUsername, currentUserRole, "SALE_CREATED", `Recorded ${liters}L ${fuelType} sale (₹${amount}) via ${paymentMethod} on Machine ${shift.machineId}`);
  writeDB(db);
  res.json(newSale);
});

// GET credit customers
app.get("/api/credit-customers", (req, res) => {
  const db = readDB();
  res.json(db.creditCustomers);
});

// CREATE / UPDATE credit customer
app.post("/api/credit-customers", (req, res) => {
  const { id, name, contact, creditLimit, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  if (id) {
    const index = db.creditCustomers.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Customer not found" });
    const existing = db.creditCustomers[index];
    db.creditCustomers[index] = {
      ...existing,
      name: name || existing.name,
      contact: contact || existing.contact,
      creditLimit: creditLimit || existing.creditLimit
    };
    logAudit(currentUserId, currentUsername, currentUserRole, "CREDIT_CUSTOMER_UPDATED", `Updated credit customer ${name}`);
  } else {
    const newCustomer: CreditCustomer = {
      id: `cc_${Date.now()}`,
      name,
      contact: contact || "+91 00000 00000",
      creditLimit: creditLimit || 50000,
      balance: 0
    };
    db.creditCustomers.push(newCustomer);
    logAudit(currentUserId, currentUsername, currentUserRole, "CREDIT_CUSTOMER_CREATED", `Created credit customer ${name}`);
  }

  writeDB(db);
  res.json({ success: true, customers: db.creditCustomers });
});

// RECORD credit payment
app.post("/api/credit-transactions/pay", (req, res) => {
  const { customerId, amount, remarks, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  const customer = db.creditCustomers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  customer.balance = Number((customer.balance - amount).toFixed(2));

  const creditTx: CreditTransaction = {
    id: `ct_${Date.now()}`,
    customerId,
    date: new Date().toISOString().split('T')[0],
    type: "payment",
    amount,
    remarks: remarks || "Received payment",
    recordedBy: currentUsername
  };

  db.creditTransactions.unshift(creditTx);
  logAudit(currentUserId, currentUsername, currentUserRole, "CREDIT_PAYMENT_RECEIVED", `Payment of ₹${amount} received from ${customer.name}. New Balance: ₹${customer.balance}`);
  writeDB(db);
  res.json({ success: true, transaction: creditTx, customer });
});

// GET credit transactions
app.get("/api/credit-transactions", (req, res) => {
  const db = readDB();
  res.json(db.creditTransactions);
});

// GET tasks
app.get("/api/tasks", (req, res) => {
  const db = readDB();
  res.json(db.tasks);
});

// CREATE task
app.post("/api/tasks", (req, res) => {
  const { title, description, assignedTo, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  const newTask: Task = {
    id: `t_${Date.now()}`,
    title,
    description,
    assignedTo,
    status: "pending",
    createdBy: currentUserId,
    createdAt: new Date().toISOString()
  };

  db.tasks.unshift(newTask);
  logAudit(currentUserId, currentUsername, currentUserRole, "TASK_CREATED", `Created task "${title}" assigned to user ID ${assignedTo}`);
  writeDB(db);
  res.json(newTask);
});

// SUBMIT task
app.post("/api/tasks/submit", (req, res) => {
  const { taskId, submissionNotes, submissionPhoto, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = "submitted";
  task.submissionNotes = submissionNotes;
  task.submissionPhoto = submissionPhoto;
  task.submittedAt = new Date().toISOString();

  logAudit(currentUserId, currentUsername, currentUserRole, "TASK_SUBMITTED", `Submitted task "${task.title}" with notes: ${submissionNotes}`);
  writeDB(db);
  res.json(task);
});

// APPROVE/REJECT task
app.post("/api/tasks/approve-reject", (req, res) => {
  const { taskId, status, remarks, currentUserId, currentUsername, currentUserRole } = req.body;
  const db = readDB();

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = status;
  task.remarks = remarks;
  task.completedAt = status === "approved" ? new Date().toISOString() : undefined;

  logAudit(currentUserId, currentUsername, currentUserRole, `TASK_${status.toUpperCase()}`, `Task "${task.title}" has been ${status}. Remarks: ${remarks}`);
  writeDB(db);
  res.json(task);
});

// GET audit logs
app.get("/api/audit-logs", (req, res) => {
  const db = readDB();
  res.json(db.auditLogs);
});

// STATS / ANALYTICS
app.get("/api/stats", (req, res) => {
  const db = readDB();
  const shifts = db.shifts;
  const customers = db.creditCustomers;

  let totalSalesVal = 0;
  let cashSalesVal = 0;
  let onlineSalesVal = 0;
  let creditSalesVal = 0;

  const validShifts = shifts.filter(s => s.status === 'closed' || s.status === 'approved_by_manager');

  validShifts.forEach(s => {
    cashSalesVal += s.cashCollected || 0;
    onlineSalesVal += s.onlineCollected || 0;
    creditSalesVal += s.creditCollected || 0;
    totalSalesVal += s.totalCollected || 0;
  });

  let totalPetrolLiters = 0;
  let totalDieselLiters = 0;
  validShifts.forEach(s => {
    totalPetrolLiters += s.petrolLitersSold || 0;
    totalDieselLiters += s.dieselLitersSold || 0;
  });

  const m795Shifts = validShifts.filter(s => s.machineId === '795');
  const m796Shifts = validShifts.filter(s => s.machineId === '796');

  const stats = {
    revenue: {
      total: Number(totalSalesVal.toFixed(2)),
      cash: Number(cashSalesVal.toFixed(2)),
      online: Number(onlineSalesVal.toFixed(2)),
      credit: Number(creditSalesVal.toFixed(2)),
    },
    fuel: {
      petrol: Number(totalPetrolLiters.toFixed(2)),
      diesel: Number(totalDieselLiters.toFixed(2)),
      total: Number((totalPetrolLiters + totalDieselLiters).toFixed(2))
    },
    machines: {
      "795": {
        petrol: Number(m795Shifts.reduce((acc, s) => acc + (s.petrolLitersSold || 0), 0).toFixed(2)),
        diesel: Number(m795Shifts.reduce((acc, s) => acc + (s.dieselLitersSold || 0), 0).toFixed(2)),
        revenue: Number(m795Shifts.reduce((acc, s) => acc + (s.totalCollected || 0), 0).toFixed(2))
      },
      "796": {
        petrol: Number(m796Shifts.reduce((acc, s) => acc + (s.petrolLitersSold || 0), 0).toFixed(2)),
        diesel: Number(m796Shifts.reduce((acc, s) => acc + (s.dieselLitersSold || 0), 0).toFixed(2)),
        revenue: Number(m796Shifts.reduce((acc, s) => acc + (s.totalCollected || 0), 0).toFixed(2))
      }
    },
    credit: {
      totalOutstanding: Number(customers.reduce((acc, c) => acc + c.balance, 0).toFixed(2)),
      customerCount: customers.length
    }
  };

  res.json(stats);
});

// BACKUP & RESTORE
app.get("/api/backup", (req, res) => {
  const db = readDB();
  res.setHeader("Content-Disposition", "attachment; filename=petrol_pump_backup.json");
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(db, null, 2));
});

app.post("/api/restore", (req, res) => {
  const { backupData, currentUserId, currentUsername, currentUserRole } = req.body;
  if (!backupData || !backupData.users || !backupData.fuelRates || !backupData.shifts) {
    return res.status(400).json({ error: "Invalid backup data structure" });
  }

  writeDB(backupData);
  logAudit(currentUserId, currentUsername, currentUserRole, "DATABASE_RESTORE", "Full system database restore performed.");
  res.json({ success: true });
});

// Serve Vite or Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
