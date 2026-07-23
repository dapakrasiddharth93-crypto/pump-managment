/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Gauge, Fuel } from "lucide-react";

interface NozzleWidgetProps {
  machineId: '795' | '796';
  petrolMeter: number;
  dieselMeter: number;
  onUpdateClick?: () => void;
}

export default function NozzleWidget({ machineId, petrolMeter, dieselMeter, onUpdateClick }: NozzleWidgetProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 p-5 glass-panel shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
      {/* Decorative background shape */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -mr-4 -mt-4 ${machineId === '795' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${machineId === '795' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-medium text-neutral-800 dark:text-zinc-200 text-sm">
              Pump Machine #{machineId}
            </h4>
            <p className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase tracking-wider font-bold">
              Isolated Pipeline Flow
            </p>
          </div>
        </div>
        {onUpdateClick && (
          <button
            id={`update-nozzle-btn-${machineId}`}
            onClick={onUpdateClick}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
          >
            Update Meter Rates
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Petrol Nozzle Block */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-zinc-900/40 border border-neutral-200/30 dark:border-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block">Nozzle 1 (Petrol)</span>
              <span className="font-mono text-sm font-semibold text-neutral-700 dark:text-zinc-300">Unleaded 91 Premium</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 dark:text-zinc-500 block">Meter Reading</span>
            <span className="font-mono text-lg font-bold text-neutral-800 dark:text-zinc-100">
              {petrolMeter.toFixed(2)} <span className="text-xs font-sans text-neutral-400">L</span>
            </span>
          </div>
        </div>

        {/* Diesel Nozzle Block */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-zinc-900/40 border border-neutral-200/30 dark:border-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 dark:text-zinc-500 uppercase tracking-wider block">Nozzle 2 (Diesel)</span>
              <span className="font-mono text-sm font-semibold text-neutral-700 dark:text-zinc-300">High Speed Diesel</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 dark:text-zinc-500 block">Meter Reading</span>
            <span className="font-mono text-lg font-bold text-neutral-800 dark:text-zinc-100">
              {dieselMeter.toFixed(2)} <span className="text-xs font-sans text-neutral-400">L</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
