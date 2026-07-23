/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
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
import { Fuel, Award, HelpCircle, Activity } from "lucide-react";

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
  // Payment split data
  const paymentSplitData = [
    { name: "Cash Sales", value: stats.revenue.cash, color: "#10B981" }, // Emerald
    { name: "Online UPI", value: stats.revenue.online, color: "#3B82F6" }, // Blue
    { name: "Credit Book", value: stats.revenue.credit, color: "#F59E0B" } // Amber
  ].filter(item => item.value > 0);

  // Machine Comparison Data
  const machineData = [
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

  // Recent Shift Trend Data
  const shiftTrendData = [...shifts]
    .filter(s => s.status === 'closed')
    .slice(0, 6)
    .reverse()
    .map(s => ({
      name: `${s.date.substring(5)} (${s.shiftName[0]})`,
      Petrol: s.petrolLitersSold || 0,
      Diesel: s.dieselLitersSold || 0,
      Revenue: s.totalCollected || 0
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Sales & Revenue Trend */}
      <div className="lg:col-span-2 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-base">
              Shift Sales & Volume Trend
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400">
              Fuel volume (Liters) recorded during the last 6 shifts
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
      <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-base mb-1">
            Payment Mode Share
          </h3>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-4">
            Collection channels across approved sales
          </p>
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
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
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
              ₹{stats.revenue.total.toLocaleString()}
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
                ₹{item.value.toLocaleString()} ({((item.value / (stats.revenue.total || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Machine Performance comparison */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Comparison chart */}
        <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm">
          <div>
            <h4 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-sm mb-1">
              Machine Wise Fuel Comparison (795 vs 796)
            </h4>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-4">
              Detailed fuel volume logs demonstrating separate machine sales registers
            </p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => `${value} Liters`}
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
        <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-sm mb-1">
              Separate Machine Ledger Registry
            </h4>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-3">
              Isolating and auditing machine records for precise billing
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Machine 795 Block */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 dark:bg-emerald-500/5">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                Machine #795 Register
              </span>
              <span className="text-lg font-bold font-display text-neutral-800 dark:text-zinc-100 block mt-1">
                ₹{stats.machines["795"].revenue.toLocaleString()}
              </span>
              <div className="mt-2 space-y-0.5 text-xs text-neutral-500 dark:text-zinc-400">
                <div>Petrol: <strong>{stats.machines["795"].petrol} L</strong></div>
                <div>Diesel: <strong>{stats.machines["795"].diesel} L</strong></div>
              </div>
            </div>

            {/* Machine 796 Block */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 dark:bg-blue-500/5">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">
                Machine #796 Register
              </span>
              <span className="text-lg font-bold font-display text-neutral-800 dark:text-zinc-100 block mt-1">
                ₹{stats.machines["796"].revenue.toLocaleString()}
              </span>
              <div className="mt-2 space-y-0.5 text-xs text-neutral-500 dark:text-zinc-400">
                <div>Petrol: <strong>{stats.machines["796"].petrol} L</strong></div>
                <div>Diesel: <strong>{stats.machines["796"].diesel} L</strong></div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5 border-t border-neutral-200/40 dark:border-zinc-800/40 pt-2">
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            <span>Machines operate independent nozzle pipelines, fuel grades, and totals.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
