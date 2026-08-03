/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";
import { Fuel, Award, HelpCircle, Activity, Calendar, Filter, RotateCcw, Eye, X, Layers, FileText } from "lucide-react";

interface AnalyticsProps {
  stats: {
    revenue: { total: number; cash: number; online: number; credit: number };
    fuel: { petrol: number; diesel: number; total: number };
    machines: {
      "795": { petrol: number; diesel: number; revenue: number };
      "796": { petrol: number; diesel: number; revenue: number };
    };
    credit: { totalOutstanding: number; customerCount: number };
  };
  shifts: any[];
}

export default function DashboardAnalytics({ stats, shifts }: AnalyticsProps) {
  // Shift Sales & Volume Trend Date Filters
  const [trendSingleDate, setTrendSingleDate] = useState("");
  const [trendStartDate, setTrendStartDate] = useState("");
  const [trendEndDate, setTrendEndDate] = useState("");

  // Payment Mode Share Date Filters
  const [paySingleDate, setPaySingleDate] = useState("");
  const [payStartDate, setPayStartDate] = useState("");
  const [payEndDate, setPayEndDate] = useState("");

  // Machine Wise Fuel Comparison Date Filters
  const [mcSingleDate, setMcSingleDate] = useState("");
  const [mcStartDate, setMcStartDate] = useState("");
  const [mcEndDate, setMcEndDate] = useState("");

  // Separate Machine Ledger Registry Date Filters
  const [mlSingleDate, setMlSingleDate] = useState("");
  const [mlStartDate, setMlStartDate] = useState("");
  const [mlEndDate, setMlEndDate] = useState("");

  // Modal / Expanded detail view for machine shifts
  const [selectedMachineLedger, setSelectedMachineLedger] = useState<"795" | "796" | null>(null);

  // Dynamic calculation for Payment Revenue based on Payment Mode date filter
  const getPaymentRevenue = () => {
    if (!paySingleDate && !payStartDate && !payEndDate) {
      return stats.revenue;
    }
    const filteredShifts = shifts.filter(s => {
      if (s.status !== 'closed' && s.status !== 'approved_by_manager' && s.status !== 'submitted_by_worker') return false;
      if (paySingleDate && s.date !== paySingleDate) return false;
      if (payStartDate && s.date < payStartDate) return false;
      if (payEndDate && s.date > payEndDate) return false;
      return true;
    });

    const cash = filteredShifts.reduce((acc, s) => acc + (s.cashCollected || 0), 0);
    const online = filteredShifts.reduce((acc, s) => acc + (s.onlineCollected || 0), 0);
    const credit = filteredShifts.reduce((acc, s) => acc + (s.creditCollected || 0), 0);
    const total = cash + online + credit;

    return { total, cash, online, credit };
  };

  const payRevenue = getPaymentRevenue();

  // Payment split data
  const paymentSplitData = [
    { name: "Cash Sales", value: payRevenue.cash, color: "#10B981" }, // Emerald
    { name: "Online UPI", value: payRevenue.online, color: "#3B82F6" }, // Blue
    { name: "Credit Book", value: payRevenue.credit, color: "#F59E0B" } // Amber
  ].filter(item => item.value > 0);

  // Machine Comparison Data dynamically calculated based on mc date filter
  const getMachineCompData = () => {
    if (!mcSingleDate && !mcStartDate && !mcEndDate) {
      return [
        {
          name: "Machine 795",
          Petrol: stats.machines["795"].petrol,
          Diesel: stats.machines["795"].diesel,
          Revenue: stats.machines["795"].revenue
        },
        {
          name: "Machine 796",
          Petrol: stats.machines["796"].petrol,
          Diesel: stats.machines["796"].diesel,
          Revenue: stats.machines["796"].revenue
        }
      ];
    }
    const filteredShifts = shifts.filter(s => {
      if (s.status !== 'closed' && s.status !== 'approved_by_manager' && s.status !== 'submitted_by_worker') return false;
      if (mcSingleDate && s.date !== mcSingleDate) return false;
      if (mcStartDate && s.date < mcStartDate) return false;
      if (mcEndDate && s.date > mcEndDate) return false;
      return true;
    });

    const m795 = filteredShifts.filter(s => s.machineId === '795');
    const m796 = filteredShifts.filter(s => s.machineId === '796');

    return [
      {
        name: "Machine 795",
        Petrol: Number(m795.reduce((acc, s) => acc + (s.petrolLitersSold || 0), 0).toFixed(2)),
        Diesel: Number(m795.reduce((acc, s) => acc + (s.dieselLitersSold || 0), 0).toFixed(2)),
        Revenue: Number(m795.reduce((acc, s) => acc + (s.totalCollected || ((s.cashCollected || 0) + (s.onlineCollected || 0) + (s.creditCollected || 0))), 0).toFixed(2))
      },
      {
        name: "Machine 796",
        Petrol: Number(m796.reduce((acc, s) => acc + (s.petrolLitersSold || 0), 0).toFixed(2)),
        Diesel: Number(m796.reduce((acc, s) => acc + (s.dieselLitersSold || 0), 0).toFixed(2)),
        Revenue: Number(m796.reduce((acc, s) => acc + (s.totalCollected || ((s.cashCollected || 0) + (s.onlineCollected || 0) + (s.creditCollected || 0))), 0).toFixed(2))
      }
    ];
  };

  const machineData = getMachineCompData();

  // Separate Machine Ledger Registry data dynamically calculated based on ml date filter
  const getMachineLedgerData = () => {
    const isFiltered = Boolean(mlSingleDate || mlStartDate || mlEndDate);
    const filteredShifts = shifts.filter(s => {
      if (s.status !== 'closed' && s.status !== 'approved_by_manager' && s.status !== 'submitted_by_worker') return false;
      if (mlSingleDate && s.date !== mlSingleDate) return false;
      if (mlStartDate && s.date < mlStartDate) return false;
      if (mlEndDate && s.date > mlEndDate) return false;
      return true;
    });

    const m795Shifts = isFiltered
      ? filteredShifts.filter(s => s.machineId === '795')
      : shifts.filter(s => s.machineId === '795');

    const m796Shifts = isFiltered
      ? filteredShifts.filter(s => s.machineId === '796')
      : shifts.filter(s => s.machineId === '796');

    const m795Rev = isFiltered
      ? Number(m795Shifts.reduce((acc, s) => acc + (s.totalCollected || ((s.cashCollected || 0) + (s.onlineCollected || 0) + (s.creditCollected || 0))), 0).toFixed(2))
      : stats.machines["795"].revenue;
    const m795Petrol = isFiltered
      ? Number(m795Shifts.reduce((acc, s) => acc + (s.petrolLitersSold || 0), 0).toFixed(2))
      : stats.machines["795"].petrol;
    const m795Diesel = isFiltered
      ? Number(m795Shifts.reduce((acc, s) => acc + (s.dieselLitersSold || 0), 0).toFixed(2))
      : stats.machines["795"].diesel;

    const m796Rev = isFiltered
      ? Number(m796Shifts.reduce((acc, s) => acc + (s.totalCollected || ((s.cashCollected || 0) + (s.onlineCollected || 0) + (s.creditCollected || 0))), 0).toFixed(2))
      : stats.machines["796"].revenue;
    const m796Petrol = isFiltered
      ? Number(m796Shifts.reduce((acc, s) => acc + (s.petrolLitersSold || 0), 0).toFixed(2))
      : stats.machines["796"].petrol;
    const m796Diesel = isFiltered
      ? Number(m796Shifts.reduce((acc, s) => acc + (s.dieselLitersSold || 0), 0).toFixed(2))
      : stats.machines["796"].diesel;

    return {
      "795": {
        revenue: m795Rev,
        petrol: m795Petrol,
        diesel: m795Diesel,
        shifts: m795Shifts,
        cash: Number(m795Shifts.reduce((acc, s) => acc + (s.cashCollected || 0), 0).toFixed(2)),
        online: Number(m795Shifts.reduce((acc, s) => acc + (s.onlineCollected || 0), 0).toFixed(2)),
        credit: Number(m795Shifts.reduce((acc, s) => acc + (s.creditCollected || 0), 0).toFixed(2))
      },
      "796": {
        revenue: m796Rev,
        petrol: m796Petrol,
        diesel: m796Diesel,
        shifts: m796Shifts,
        cash: Number(m796Shifts.reduce((acc, s) => acc + (s.cashCollected || 0), 0).toFixed(2)),
        online: Number(m796Shifts.reduce((acc, s) => acc + (s.onlineCollected || 0), 0).toFixed(2)),
        credit: Number(m796Shifts.reduce((acc, s) => acc + (s.creditCollected || 0), 0).toFixed(2))
      }
    };
  };

  const machineLedger = getMachineLedgerData();

  // Filtered Shift Trend Data based on Date filter
  const filteredShiftsForTrend = [...shifts].filter(s => {
    if (s.status !== 'closed' && s.status !== 'approved_by_manager' && s.status !== 'submitted_by_worker') return false;
    if (trendSingleDate && s.date !== trendSingleDate) return false;
    if (trendStartDate && s.date < trendStartDate) return false;
    if (trendEndDate && s.date > trendEndDate) return false;
    return true;
  });

  // Sort chronologically by date
  const sortedTrendShifts = [...filteredShiftsForTrend].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // If no date filter is active and we have many shifts, show recent shifts
  const displayShifts = (!trendSingleDate && !trendStartDate && !trendEndDate && sortedTrendShifts.length > 6)
    ? sortedTrendShifts.slice(-6)
    : sortedTrendShifts;

  const shiftTrendData = displayShifts.map(s => ({
    name: `${s.date.substring(5)} (${s.shiftName ? s.shiftName[0] : 'S'})`,
    Petrol: s.petrolLitersSold || 0,
    Diesel: s.dieselLitersSold || 0,
    Revenue: s.totalCollected || 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Sales & Revenue Trend */}
      <div className="lg:col-span-2 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Shift Sales & Volume Trend
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400">
              Fuel volume (Liters) recorded across recorded shifts
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Petrol
            </span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Diesel
            </span>
          </div>
        </div>

        {/* Date Filter Bar for Shift Sales & Volume Trend */}
        <div className="bg-neutral-100/70 dark:bg-zinc-900/70 p-3 rounded-xl border border-neutral-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-neutral-600 dark:text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Trend Date Filter:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-0.5">Single Date</span>
              <input
                type="date"
                value={trendSingleDate}
                onChange={e => {
                  setTrendSingleDate(e.target.value);
                  setTrendStartDate("");
                  setTrendEndDate("");
                }}
                className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-0.5">Start Date</span>
              <input
                type="date"
                value={trendStartDate}
                onChange={e => {
                  setTrendStartDate(e.target.value);
                  setTrendSingleDate("");
                }}
                className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-0.5">End Date</span>
              <input
                type="date"
                value={trendEndDate}
                onChange={e => {
                  setTrendEndDate(e.target.value);
                  setTrendSingleDate("");
                }}
                className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium"
              />
            </div>
            {(trendSingleDate || trendStartDate || trendEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setTrendSingleDate("");
                  setTrendStartDate("");
                  setTrendEndDate("");
                }}
                className="self-end px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 font-bold text-[11px] flex items-center gap-1"
                title="Reset Date Filter"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="h-64 w-full">
          {shiftTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={shiftTrendData}>
                <defs>
                  <linearGradient id="colorPetrol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#1f2937'
                  }} 
                />
                <Area type="monotone" dataKey="Petrol" stroke="#10B981" fillOpacity={1} fill="url(#colorPetrol)" strokeWidth={2} />
                <Area type="monotone" dataKey="Diesel" stroke="#3B82F6" fillOpacity={1} fill="url(#colorDiesel)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-zinc-600">
              <Activity className="w-8 h-8 mb-2 animate-pulse" />
              <p className="text-sm">No closed shift transactions available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Split Pie */}
      <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-base mb-1">
            Payment Mode Share
          </h3>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-2">
            Collection channels across approved sales
          </p>

          {/* Date Filter Bar for Payment Mode Share */}
          <div className="bg-neutral-100/70 dark:bg-zinc-900/70 p-2 rounded-xl border border-neutral-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 text-xs mt-1">
            <div className="flex items-center gap-1 font-bold text-neutral-600 dark:text-zinc-300 text-[10px]">
              <Calendar className="w-3 h-3 text-indigo-500" />
              <span>Date Filter:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <input
                type="date"
                value={paySingleDate}
                title="Single Date"
                onChange={e => {
                  setPaySingleDate(e.target.value);
                  setPayStartDate("");
                  setPayEndDate("");
                }}
                className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
              />
              <input
                type="date"
                value={payStartDate}
                title="Start Date"
                onChange={e => {
                  setPayStartDate(e.target.value);
                  setPaySingleDate("");
                }}
                className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
              />
              <input
                type="date"
                value={payEndDate}
                title="End Date"
                onChange={e => {
                  setPayEndDate(e.target.value);
                  setPaySingleDate("");
                }}
                className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
              />
              {(paySingleDate || payStartDate || payEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setPaySingleDate("");
                    setPayStartDate("");
                    setPayEndDate("");
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                  title="Reset Filter"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="h-44 w-full relative flex items-center justify-center">
          {paymentSplitData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSplitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`}
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-neutral-400 dark:text-zinc-600 text-center">No payment data</div>
          )}
          
          <div className="absolute text-center">
            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block uppercase tracking-wider">Total Revenue</span>
            <span className="text-lg font-bold font-display text-neutral-800 dark:text-zinc-100">
              ₹{payRevenue.total.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 mt-2">
          {paymentSplitData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                {item.name}
              </span>
              <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                ₹{item.value.toLocaleString()} ({((item.value / (payRevenue.total || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Machine Performance comparison */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Comparison chart */}
        <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Machine Wise Fuel Comparison (795 vs 796)
                </h4>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  Detailed fuel volume logs comparing machine sales registers
                </p>
              </div>
              {(mcSingleDate || mcStartDate || mcEndDate) && (
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Filter Active
                </span>
              )}
            </div>

            {/* Date Filter Bar for Machine Comparison */}
            <div className="bg-neutral-100/70 dark:bg-zinc-900/70 p-2.5 rounded-xl border border-neutral-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 text-xs mb-3">
              <div className="flex items-center gap-1 font-bold text-neutral-600 dark:text-zinc-300 text-[10px]">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>Date Option:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">Single Date</span>
                  <input
                    type="date"
                    value={mcSingleDate}
                    title="Single Date"
                    onChange={e => {
                      setMcSingleDate(e.target.value);
                      setMcStartDate("");
                      setMcEndDate("");
                    }}
                    className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">Start Date</span>
                  <input
                    type="date"
                    value={mcStartDate}
                    title="Start Date"
                    onChange={e => {
                      setMcStartDate(e.target.value);
                      setMcSingleDate("");
                    }}
                    className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">End Date</span>
                  <input
                    type="date"
                    value={mcEndDate}
                    title="End Date"
                    onChange={e => {
                      setMcEndDate(e.target.value);
                      setMcSingleDate("");
                    }}
                    className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
                  />
                </div>
                {(mcSingleDate || mcStartDate || mcEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMcSingleDate("");
                      setMcStartDate("");
                      setMcEndDate("");
                    }}
                    className="self-end px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 text-neutral-700 dark:text-zinc-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Reset Date Filter"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => `${value || 0} Liters`}
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Petrol" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Diesel" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Financial Breakdown */}
        <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Separate Machine Ledger Registry
                </h4>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  Isolating and auditing machine records for precise billing
                </p>
              </div>
              {(mlSingleDate || mlStartDate || mlEndDate) && (
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  Filter Active
                </span>
              )}
            </div>

            {/* Date Filter Bar for Separate Machine Ledger Registry */}
            <div className="bg-neutral-100/70 dark:bg-zinc-900/70 p-2.5 rounded-xl border border-neutral-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-1.5 text-xs mb-3">
              <div className="flex items-center gap-1 font-bold text-neutral-600 dark:text-zinc-300 text-[10px]">
                <Calendar className="w-3 h-3 text-blue-500" />
                <span>Date Option:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">Single Date</span>
                  <input
                    type="date"
                    value={mlSingleDate}
                    title="Single Date"
                    onChange={e => {
                      setMlSingleDate(e.target.value);
                      setMlStartDate("");
                      setMlEndDate("");
                    }}
                    className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">Start Date</span>
                  <input
                    type="date"
                    value={mlStartDate}
                    title="Start Date"
                    onChange={e => {
                      setMlStartDate(e.target.value);
                      setMlSingleDate("");
                    }}
                    className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">End Date</span>
                  <input
                    type="date"
                    value={mlEndDate}
                    title="End Date"
                    onChange={e => {
                      setMlEndDate(e.target.value);
                      setMlSingleDate("");
                    }}
                    className="px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-medium"
                  />
                </div>
                {(mlSingleDate || mlStartDate || mlEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMlSingleDate("");
                      setMlStartDate("");
                      setMlEndDate("");
                    }}
                    className="self-end px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 text-neutral-700 dark:text-zinc-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Reset Date Filter"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Machine 795 Block */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 dark:bg-emerald-500/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                    Machine #795 Register
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400">
                    {machineLedger["795"].shifts.length} Shifts
                  </span>
                </div>
                <span className="text-lg font-bold font-display text-neutral-800 dark:text-zinc-100 block mt-1">
                  ₹{machineLedger["795"].revenue.toLocaleString()}
                </span>
                <div className="mt-2 space-y-0.5 text-xs text-neutral-500 dark:text-zinc-400">
                  <div>Petrol: <strong>{machineLedger["795"].petrol} L</strong></div>
                  <div>Diesel: <strong>{machineLedger["795"].diesel} L</strong></div>
                  {(mlSingleDate || mlStartDate || mlEndDate) && (
                    <div className="pt-1 text-[10px] text-neutral-400 border-t border-emerald-500/10 mt-1">
                      Cash: ₹{machineLedger["795"].cash.toLocaleString()} | UPI: ₹{machineLedger["795"].online.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMachineLedger("795")}
                className="mt-3 w-full py-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Eye className="w-3 h-3" /> View Machine #795 Ledger
              </button>
            </div>

            {/* Machine 796 Block */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 dark:bg-blue-500/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">
                    Machine #796 Register
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400">
                    {machineLedger["796"].shifts.length} Shifts
                  </span>
                </div>
                <span className="text-lg font-bold font-display text-neutral-800 dark:text-zinc-100 block mt-1">
                  ₹{machineLedger["796"].revenue.toLocaleString()}
                </span>
                <div className="mt-2 space-y-0.5 text-xs text-neutral-500 dark:text-zinc-400">
                  <div>Petrol: <strong>{machineLedger["796"].petrol} L</strong></div>
                  <div>Diesel: <strong>{machineLedger["796"].diesel} L</strong></div>
                  {(mlSingleDate || mlStartDate || mlEndDate) && (
                    <div className="pt-1 text-[10px] text-neutral-400 border-t border-blue-500/10 mt-1">
                      Cash: ₹{machineLedger["796"].cash.toLocaleString()} | UPI: ₹{machineLedger["796"].online.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMachineLedger("796")}
                className="mt-3 w-full py-1 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Eye className="w-3 h-3" /> View Machine #796 Ledger
              </button>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5 border-t border-neutral-200/40 dark:border-zinc-800/40 pt-2">
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            <span>Machines operate independent nozzle pipelines, fuel grades, and totals.</span>
          </div>
        </div>
      </div>

      {/* Separate Machine Ledger Details Modal */}
      {selectedMachineLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-display font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Machine #{selectedMachineLedger} Detailed Ledger Registry
                </h3>
                <p className="text-xs text-neutral-500">
                  Shift-wise log breakdown for Machine #{selectedMachineLedger} 
                  {(mlSingleDate || mlStartDate || mlEndDate) ? ` (Filtered by selected date option)` : ` (All recorded shifts)`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMachineLedger(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-4 gap-3 bg-neutral-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-neutral-200/50 dark:border-zinc-800/50 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Total Revenue</span>
                <span className="text-sm font-bold font-display text-emerald-600 dark:text-emerald-400">
                  ₹{machineLedger[selectedMachineLedger].revenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Petrol Sold</span>
                <span className="text-sm font-bold font-mono text-neutral-800 dark:text-zinc-200">
                  {machineLedger[selectedMachineLedger].petrol} L
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Diesel Sold</span>
                <span className="text-sm font-bold font-mono text-neutral-800 dark:text-zinc-200">
                  {machineLedger[selectedMachineLedger].diesel} L
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Total Shifts</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {machineLedger[selectedMachineLedger].shifts.length}
                </span>
              </div>
            </div>

            {/* Shift List Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-zinc-800/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300 font-bold">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Shift</th>
                    <th className="p-2.5 text-right">Petrol (L)</th>
                    <th className="p-2.5 text-right">Diesel (L)</th>
                    <th className="p-2.5 text-right">Cash (₹)</th>
                    <th className="p-2.5 text-right">UPI (₹)</th>
                    <th className="p-2.5 text-right">Credit (₹)</th>
                    <th className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">Total (₹)</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
                  {machineLedger[selectedMachineLedger].shifts.length > 0 ? (
                    machineLedger[selectedMachineLedger].shifts.map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-zinc-850">
                        <td className="p-2.5 font-medium">{s.date}</td>
                        <td className="p-2.5 font-bold">{s.shiftName}</td>
                        <td className="p-2.5 text-right font-mono">{s.petrolLitersSold ?? 0} L</td>
                        <td className="p-2.5 text-right font-mono">{s.dieselLitersSold ?? 0} L</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">₹{(s.cashCollected || 0).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono text-blue-600 dark:text-blue-400">₹{(s.onlineCollected || 0).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono text-amber-600 dark:text-amber-400">₹{(s.creditCollected || 0).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{(s.totalCollected || ((s.cashCollected || 0) + (s.onlineCollected || 0) + (s.creditCollected || 0))).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            s.status === 'closed' || s.status === 'approved_by_manager'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-neutral-400 text-xs italic">
                        No shift ledger entries found for Machine #{selectedMachineLedger} for the selected date criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedMachineLedger(null)}
                className="px-4 py-2 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Machine Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
