/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers: string[];
  keys: string[];
  title?: string;
}

export default function ExportButton({ data, filename, headers, keys, title = "Report" }: ExportButtonProps) {
  
  // Export as CSV (which opens flawlessly in Microsoft Excel & Google Sheets)
  const exportToCSV = () => {
    if (data.length === 0) return;
    
    const csvContent = [
      headers.join(","),
      ...data.map(item => 
        keys.map(key => {
          let val = item[key];
          if (val === undefined || val === null) val = "";
          // Format objects or arrays if present
          if (typeof val === 'object') val = JSON.stringify(val);
          // Escape commas
          const valStr = String(val).replace(/"/g, '""');
          return valStr.includes(",") ? `"${valStr}"` : valStr;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modern clean Print handler
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlTable = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 5px; color: #111; }
            .date { font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px 10px; text-align: left; font-size: 14px; }
            th { background-color: #f5f5f5; font-weight: 600; color: #111; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="date">Generated on: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  ${keys.map(key => {
                    const val = item[key];
                    return `<td>${val !== undefined && val !== null ? val : '-'}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Petrol Pump Management System - Secure Audit Report
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlTable);
    printWindow.document.close();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        id={`export-csv-btn-${filename}`}
        onClick={exportToCSV}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-500/10 dark:bg-teal-500/5 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20 dark:hover:bg-teal-500/10 transition-colors cursor-pointer"
        title="Export to Excel / CSV"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        <span>Export CSV</span>
      </button>

      <button
        id={`print-report-btn-${filename}`}
        onClick={printReport}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-zinc-800 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        title="Print PDF / Report"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print Report</span>
      </button>
    </div>
  );
}
