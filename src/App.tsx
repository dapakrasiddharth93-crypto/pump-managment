/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Fuel, UserCheck, LogOut, Shield, MapPin, Sparkles, Key, 
  BarChart3, RefreshCw, Layers, TrendingUp, HelpCircle, 
  BookOpen, Zap, DollarSign, Calendar, ListChecks
} from "lucide-react";
import ThemeToggle from "./components/ThemeToggle.js";
import NozzleWidget from "./components/NozzleWidget.js";
import ExportButton from "./components/ExportButton.js";
import DashboardAnalytics from "./components/DashboardAnalytics.js";
import OwnerView from "./components/OwnerView.js";
import ManagerView from "./components/ManagerView.js";
import WorkerView from "./components/WorkerView.js";
import { api } from "./utils/api.js";
import { User, Shift, Sale, CreditCustomer } from "./types.js";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Login credentials form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // System stats
  const [stats, setStats] = useState({
    revenue: { total: 0, cash: 0, online: 0, credit: 0 },
    fuel: { petrol: 0, diesel: 0, total: 0 },
    machines: {
      "795": { petrol: 0, diesel: 0, revenue: 0 },
      "796": { petrol: 0, diesel: 0, revenue: 0 }
    },
    credit: { totalOutstanding: 0, customerCount: 0 }
  });

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([]);
  const [rates, setRates] = useState<any[]>([]);

  // Reports Builder filtration
  const [reportType, setReportType] = useState<'shift' | 'sales' | 'credit'>('shift');
  const [filterMachine, setFilterMachine] = useState<'all' | '795' | '796'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'online' | 'credit'>('all');

  // Load overall system statistics
  const fetchStats = async () => {
    try {
      const [st, sh, sl, cr, rt] = await Promise.all([
        api.getStats(),
        api.getShifts(),
        api.getSales(),
        api.getCreditCustomers(),
        api.getFuelRates()
      ]);
      setStats(st);
      setShifts(sh);
      setSales(sl);
      setCreditCustomers(cr);
      setRates(rt);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  // Handle manual login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const data = await api.login(username, password);
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials. Try again.");
    }
  };

  // Demo shortcut login helper
  const handleDemoLogin = async (role: 'owner' | 'manager' | 'worker1' | 'worker2') => {
    setLoginError("");
    try {
      let u = "owner";
      let p = "owner123";
      if (role === 'manager') { u = "manager"; p = "manager123"; }
      if (role === 'worker1') { u = "worker1"; p = "worker123"; }
      if (role === 'worker2') { u = "worker2"; p = "worker123"; }
      
      const data = await api.login(u, p);
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err: any) {
      setLoginError(err.message || "Demo login failed");
    }
  };

  // Log Out
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setUsername("");
    setPassword("");
    localStorage.removeItem("user");
  };

  // Rehydrate session
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Filtered reports calculation
  const getFilteredShifts = () => {
    return shifts.filter(s => {
      if (filterMachine !== 'all' && s.machineId !== filterMachine) return false;
      return true;
    });
  };

  const getFilteredSales = () => {
    return sales.filter(s => {
      if (filterMachine !== 'all' && s.machineId !== filterMachine) return false;
      if (filterPayment !== 'all' && s.paymentMethod !== filterPayment) return false;
      return true;
    });
  };

  // If not logged in, render the login page
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-slate-100 to-slate-200 dark:from-zinc-950 dark:to-zinc-900 font-sans text-neutral-800 dark:text-zinc-100 transition-colors duration-300">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(156,163,175,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="w-full max-w-md rounded-3xl border border-white/20 dark:border-zinc-800/40 p-8 glass-panel shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle colored glow blur blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
          
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-2xl mb-3 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Fuel className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold tracking-tight text-center">
              OM PUSHPANJALI FILLING STATION
            </h2>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 text-center mt-1">
              Production-ready enterprise management terminal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Username</label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="e.g. owner"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Secret Keyphrase</label>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-500 font-medium">{loginError}</p>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Key className="w-4 h-4" />
              <span>Initialize Terminal</span>
            </button>
          </form>

          {/* Quick-Click Demo accounts section */}
          <div className="mt-6 pt-5 border-t border-neutral-200/40 dark:border-zinc-800/40 space-y-2">
            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase block tracking-wider text-center">
              Quick-Access Credentials Demo
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                id="demo-owner-login"
                onClick={() => handleDemoLogin('owner')}
                className="p-2 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 rounded-xl text-left cursor-pointer"
              >
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[10px]">Owner Account</span>
                <span className="text-neutral-500 truncate block">Rajesh (owner/owner123)</span>
              </button>
              <button
                id="demo-manager-login"
                onClick={() => handleDemoLogin('manager')}
                className="p-2 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 rounded-xl text-left cursor-pointer"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 block text-[10px]">Manager Account</span>
                <span className="text-neutral-500 truncate block">Sanjay (manager/manager123)</span>
              </button>
              <button
                id="demo-worker1-login"
                onClick={() => handleDemoLogin('worker1')}
                className="p-2 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 rounded-xl text-left cursor-pointer"
              >
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[10px]">Worker (Amit)</span>
                <span className="text-neutral-500 truncate block"> अमित (worker1/worker123)</span>
              </button>
              <button
                id="demo-worker2-login"
                onClick={() => handleDemoLogin('worker2')}
                className="p-2 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 rounded-xl text-left cursor-pointer"
              >
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[10px]">Worker (Rohan)</span>
                <span className="text-neutral-500 truncate block"> रोहन (worker2/worker123)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active terminal screen
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 font-sans text-neutral-800 dark:text-zinc-100 pb-12 transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      {/* Main Header navigation */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 border-b border-neutral-200/50 dark:border-zinc-900/50 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-tight">
                OM PUSHPANJALI FILLING STATION
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <MapPin className="w-3 h-3 text-red-500" />
                <span>Station Unit SUWASRA</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile display */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200/50 dark:border-zinc-800/50 bg-neutral-100/40 dark:bg-zinc-900/20 text-xs">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="font-semibold block">{currentUser.name}</span>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">{currentUser.role}</span>
              </div>
            </div>

            <ThemeToggle />

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="p-2 rounded-xl border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-neutral-600 dark:text-zinc-400 cursor-pointer"
              title="Disconnect Terminal"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main dashboard content container */}
      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Overall System Overview Cards - only available for Owner/Manager */}
        {['Owner', 'Manager'].includes(currentUser.role) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cash Collected card */}
            <div className="rounded-2xl border border-neutral-200/50 dark:border-zinc-800/40 p-4.5 bg-white dark:bg-zinc-900/60 shadow-sm relative overflow-hidden">
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block font-bold">Total Tariff sales</span>
              <span className="text-xl font-bold font-display text-neutral-800 dark:text-zinc-100 block mt-1.5">
                ₹{stats.revenue.total.toLocaleString()}
              </span>
              <div className="flex justify-between items-center text-[10px] text-neutral-500 dark:text-zinc-400 mt-2 pt-2 border-t border-neutral-100 dark:border-zinc-800/50">
                <span>Cash: ₹{stats.revenue.cash.toLocaleString()}</span>
                <span>Online: ₹{stats.revenue.online.toLocaleString()}</span>
              </div>
            </div>

            {/* Volume sold Card */}
            <div className="rounded-2xl border border-neutral-200/50 dark:border-zinc-800/40 p-4.5 bg-white dark:bg-zinc-900/60 shadow-sm relative overflow-hidden">
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block font-bold">Total Fuel Sold</span>
              <span className="text-xl font-bold font-display text-neutral-800 dark:text-zinc-100 block mt-1.5">
                {stats.fuel.total.toLocaleString()} <span className="text-xs font-sans text-neutral-400">Liters</span>
              </span>
              <div className="flex justify-between items-center text-[10px] text-neutral-500 dark:text-zinc-400 mt-2 pt-2 border-t border-neutral-100 dark:border-zinc-800/50">
                <span>Petrol: {stats.fuel.petrol.toLocaleString()} L</span>
                <span>Diesel: {stats.fuel.diesel.toLocaleString()} L</span>
              </div>
            </div>

            {/* Credit Ledger Book Card */}
            <div className="rounded-2xl border border-neutral-200/50 dark:border-zinc-800/40 p-4.5 bg-white dark:bg-zinc-900/60 shadow-sm relative overflow-hidden">
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block font-bold">Corporate Outstanding</span>
              <span className="text-xl font-bold font-display text-rose-500 block mt-1.5">
                ₹{stats.credit.totalOutstanding.toLocaleString()}
              </span>
              <div className="flex justify-between items-center text-[10px] text-neutral-500 dark:text-zinc-400 mt-2 pt-2 border-t border-neutral-100 dark:border-zinc-800/50">
                <span>Registry: {stats.credit.customerCount} accounts</span>
                <span className="text-rose-400">OMCredit</span>
              </div>
            </div>

            {/* Fuel Rates Card */}
            <div className="rounded-2xl border border-neutral-200/50 dark:border-zinc-800/40 p-4.5 bg-white dark:bg-zinc-900/60 shadow-sm relative overflow-hidden">
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block font-bold">Today Tariffs</span>
              <div className="mt-1.5 space-y-0.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Premium Petrol</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{rates.find(r => r.fuelType === 'petrol')?.rate || 104.25}/L</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Regular Diesel</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">₹{rates.find(r => r.fuelType === 'diesel')?.rate || 92.50}/L</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Analytics Graphs block - only available for Owner/Manager */}
        {['Owner', 'Manager'].includes(currentUser.role) && (
          <DashboardAnalytics stats={stats} shifts={shifts} />
        )}

        {/* Dynamic Panel: Role specific views */}
        <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-6 glass-panel shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 dark:border-zinc-800 pb-3">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-display font-semibold tracking-tight uppercase">
              {currentUser.role} Workstation Panel
            </h2>
          </div>

          {currentUser.role === 'Owner' && (
            <OwnerView currentUser={currentUser} onRefreshStats={fetchStats} />
          )}

          {currentUser.role === 'Manager' && (
            <ManagerView currentUser={currentUser} onRefreshStats={fetchStats} />
          )}

          {currentUser.role === 'Worker' && (
            <WorkerView currentUser={currentUser} onRefreshStats={fetchStats} />
          )}
        </div>

        {/* Reports Engine block - only available for Owner/Manager */}
        {['Owner', 'Manager'].includes(currentUser.role) && (
          <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-6 glass-panel shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-display font-semibold tracking-tight uppercase">
                  Consolidated Reports Engine
                </h2>
              </div>

              {/* Filtration controls */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Source Machine</label>
                  <select
                    id="filter-machine-select"
                    value={filterMachine}
                    onChange={e => setFilterMachine(e.target.value as any)}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <option value="all">All Machines (795 & 796)</option>
                    <option value="795">Machine 795 Only</option>
                    <option value="796">Machine 796 Only</option>
                  </select>
                </div>

                {reportType === 'sales' && (
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Billing Channel</label>
                    <select
                      id="filter-payment-select"
                      value={filterPayment}
                      onChange={e => setFilterPayment(e.target.value as any)}
                      className="p-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    >
                      <option value="all">All Channels</option>
                      <option value="cash">Cash Only</option>
                      <option value="online">Online UPI</option>
                      <option value="credit">Corporate Credit</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Inner report tabs */}
            <div className="flex gap-2">
              <button
                id="report-tab-shift"
                onClick={() => setReportType('shift')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  reportType === 'shift' ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600'
                }`}
              >
                Shift Audits
              </button>
              <button
                id="report-tab-sales"
                onClick={() => setReportType('sales')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  reportType === 'sales' ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600'
                }`}
              >
                Detailed Sales Ledger
              </button>
              <button
                id="report-tab-credit"
                onClick={() => setReportType('credit')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  reportType === 'credit' ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600'
                }`}
              >
                Credit Accounts CRM
              </button>
            </div>

            {/* Reports Display tables */}
            {reportType === 'shift' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-semibold">Listing all shifts matching filters</span>
                  <ExportButton 
                    data={getFilteredShifts()} 
                    filename="shift_audits_report" 
                    headers={["Date", "Shift", "Machine", "Petrol Sold (L)", "Diesel Sold (L)", "Expected Amount", "Actual Collected", "Variance Gap", "Status", "Audited By"]} 
                    keys={["date", "shiftName", "machineId", "petrolLitersSold", "dieselLitersSold", "expectedAmount", "totalCollected", "shortExcessAmount", "status", "approvedBy"]} 
                    title="Consolidated Shift-wise Operational Audits"
                  />
                </div>
                <div className="overflow-x-auto rounded-xl border border-neutral-200/40 dark:border-zinc-800/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50/70 dark:bg-zinc-900/50 text-neutral-500 dark:text-zinc-400 font-bold border-b border-neutral-200/40 dark:border-zinc-800/40">
                        <th className="p-3">Date</th>
                        <th className="p-3">Shift</th>
                        <th className="p-3">Machine</th>
                        <th className="p-3 text-right">Petrol Sold (L)</th>
                        <th className="p-3 text-right">Diesel Sold (L)</th>
                        <th className="p-3 text-right">Expected (INR)</th>
                        <th className="p-3 text-right">Collected (INR)</th>
                        <th className="p-3 text-right">Variance</th>
                        <th className="p-3 text-center">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/40 dark:divide-zinc-800/40">
                      {getFilteredShifts().map((s, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/20 dark:hover:bg-zinc-900/10 text-neutral-700 dark:text-zinc-300">
                          <td className="p-3">{s.date}</td>
                          <td className="p-3 font-semibold">{s.shiftName}</td>
                          <td className="p-3">#{s.machineId}</td>
                          <td className="p-3 text-right font-mono">{s.petrolLitersSold ?? "-"} L</td>
                          <td className="p-3 text-right font-mono">{s.dieselLitersSold ?? "-"} L</td>
                          <td className="p-3 text-right font-mono">₹{s.expectedAmount?.toLocaleString() ?? "-"}</td>
                          <td className="p-3 text-right font-mono">₹{s.totalCollected?.toLocaleString() ?? "-"}</td>
                          <td className={`p-3 text-right font-mono font-bold ${
                            (s.shortExcessAmount || 0) < 0 ? 'text-rose-500' : (s.shortExcessAmount || 0) > 0 ? 'text-emerald-500' : ''
                          }`}>
                            ₹{s.shortExcessAmount?.toLocaleString() ?? "0"}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              s.approvedBy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {s.approvedBy ? `Audited (${s.approvedBy})` : 'Pending Audit'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'sales' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-semibold">Listing all detailed transactions</span>
                  <ExportButton 
                    data={getFilteredSales()} 
                    filename="sales_ledger_report" 
                    headers={["Date", "Time", "Machine", "Fuel Type", "Liters Sold", "Amount Charged", "Billing Method", "Corporate Client"]} 
                    keys={["date", "createdAt", "machineId", "fuelType", "liters", "amount", "paymentMethod", "customerName"]} 
                    title="Consolidated Transaction-wise Sales Ledger"
                  />
                </div>
                <div className="overflow-x-auto rounded-xl border border-neutral-200/40 dark:border-zinc-800/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50/70 dark:bg-zinc-900/50 text-neutral-500 dark:text-zinc-400 font-bold border-b border-neutral-200/40 dark:border-zinc-800/40">
                        <th className="p-3">Time</th>
                        <th className="p-3">Machine</th>
                        <th className="p-3">Fuel Type</th>
                        <th className="p-3 text-right">Liters</th>
                        <th className="p-3 text-right">Amount (INR)</th>
                        <th className="p-3">Billing Channel</th>
                        <th className="p-3">Customer Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/40 dark:divide-zinc-800/40">
                      {getFilteredSales().map((s, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/20 dark:hover:bg-zinc-900/10 text-neutral-700 dark:text-zinc-300">
                          <td className="p-3 whitespace-nowrap text-neutral-400">{new Date(s.createdAt).toLocaleString()}</td>
                          <td className="p-3">#{s.machineId}</td>
                          <td className="p-3 font-semibold capitalize">{s.fuelType}</td>
                          <td className="p-3 text-right font-mono">{s.liters} L</td>
                          <td className="p-3 text-right font-mono font-semibold">₹{s.amount.toLocaleString()}</td>
                          <td className="p-3 capitalize">{s.paymentMethod}</td>
                          <td className="p-3 font-medium text-neutral-800 dark:text-zinc-200">{s.customerName || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'credit' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-semibold">Corporate credit summaries</span>
                  <ExportButton 
                    data={creditCustomers} 
                    filename="credit_accounts_report" 
                    headers={["Customer ID", "Name", "Contact", "Credit Limit", "Outstanding Balance"]} 
                    keys={["id", "name", "contact", "creditLimit", "balance"]} 
                    title="Corporate Credit Accounts Overview"
                  />
                </div>
                <div className="overflow-x-auto rounded-xl border border-neutral-200/40 dark:border-zinc-800/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50/70 dark:bg-zinc-900/50 text-neutral-500 dark:text-zinc-400 font-bold border-b border-neutral-200/40 dark:border-zinc-800/40">
                        <th className="p-3">Customer ID</th>
                        <th className="p-3">Client Company Name</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3 text-right">Allowed Limit (INR)</th>
                        <th className="p-3 text-right">Outstanding (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/40 dark:divide-zinc-800/40">
                      {creditCustomers.map((c, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/20 dark:hover:bg-zinc-900/10 text-neutral-700 dark:text-zinc-300">
                          <td className="p-3 font-mono text-neutral-400">{c.id}</td>
                          <td className="p-3 font-semibold">{c.name}</td>
                          <td className="p-3">{c.contact}</td>
                          <td className="p-3 text-right font-mono">₹{c.creditLimit.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-semibold text-rose-500">₹{c.balance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
