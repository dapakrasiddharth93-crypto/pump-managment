import React, { useState } from "react";
import { CreditCustomer, CreditTransaction, Shift } from "../types.js";
import { X, Download, DollarSign, FileText, ArrowDownLeft, ArrowUpRight, Phone, CreditCard } from "lucide-react";

interface CustomerLedgerModalProps {
  customer: CreditCustomer;
  transactions: CreditTransaction[];
  shifts: Shift[];
  onClose: () => void;
  onRecordPayment?: (customerId: string, amount: number, remarks: string) => Promise<void>;
}

export default function CustomerLedgerModal({
  customer,
  transactions,
  shifts,
  onClose,
  onRecordPayment
}: CustomerLedgerModalProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sortedTx = [...transactions]
    .filter(t => t.customerId === customer.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentRunningBalance = 0;
  const ledgerEntries = sortedTx.map(tx => {
    const isCharge = tx.type === "charge";
    const debit = isCharge ? tx.amount : 0;
    const credit = !isCharge ? tx.amount : 0;
    currentRunningBalance += (debit - credit);

    const shiftInfo = tx.shiftId ? shifts.find(s => s.id === tx.shiftId) : null;
    const refText = shiftInfo 
      ? `Shift ${shiftInfo.shiftName} (M#${shiftInfo.machineId})` 
      : (tx.shiftId || "Direct Entry");

    return {
      ...tx,
      debit,
      credit,
      runningBalance: currentRunningBalance,
      refText
    };
  });

  const finalBalance = ledgerEntries.length > 0 
    ? ledgerEntries[ledgerEntries.length - 1].runningBalance 
    : customer.balance;

  const availableCredit = customer.creditLimit - finalBalance;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRecordPayment) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      setErrorMsg("Please enter a valid positive payment amount.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await onRecordPayment(customer.id, amt, payRemarks);
      setPayAmount("");
      setPayRemarks("");
      setShowPaymentForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log payment.");
    } finally {
      setLoading(false);
    }
  };

  const exportSingleLedgerCSV = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "Type",
      "Reference / Shift",
      "Vehicle / Remarks",
      "Recorded By",
      "Debit (+₹ Charge)",
      "Credit (-₹ Payment)",
      "Running Balance (₹)"
    ];

    const rows = ledgerEntries.map(entry => [
      entry.id,
      entry.date,
      entry.type === "charge" ? "Credit Fuel Sale" : "Payment Received",
      entry.refText,
      entry.remarks || "-",
      entry.recordedBy || "System",
      entry.debit > 0 ? entry.debit.toFixed(2) : "0.00",
      entry.credit > 0 ? entry.credit.toFixed(2) : "0.00",
      entry.runningBalance.toFixed(2)
    ]);

    const csvLines = [
      `"CREDIT LEDGER STATEMENT - ${customer.name.toUpperCase()}"`,
      `"Contact: ${customer.contact}","Credit Limit: ₹${customer.creditLimit}","Outstanding Balance: ₹${finalBalance.toFixed(2)}"`,
      `"Statement Date: ${new Date().toLocaleDateString()}"`,
      "",
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvLines.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Credit_Ledger_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-neutral-200 dark:border-zinc-800 bg-neutral-50/80 dark:bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
                {customer.name}
              </h3>
              <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                <Phone className="w-3.5 h-3.5" /> {customer.contact} • Account ID: <span className="font-mono">{customer.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportSingleLedgerCSV}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Download className="w-4 h-4" /> Download Statement
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 bg-neutral-100/50 dark:bg-zinc-800/40 border-b border-neutral-200 dark:border-zinc-800">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Approved Credit Limit</span>
            <span className="text-lg font-bold text-neutral-800 dark:text-zinc-100 font-display">₹{customer.creditLimit.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Outstanding Balance</span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-display">₹{finalBalance.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Available Credit</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-display">₹{Math.max(0, availableCredit).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {onRecordPayment && (
            <div className="flex justify-between items-center bg-indigo-50/60 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                Log New Payment / Collection for {customer.name}
              </span>
              <button
                type="button"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
              >
                <DollarSign className="w-4 h-4" /> Record Payment
              </button>
            </div>
          )}

          {showPaymentForm && (
            <form onSubmit={handlePaymentSubmit} className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Record Credit Payment</h4>
              {errorMsg && <p className="text-xs text-rose-600 font-bold">{errorMsg}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  required
                  placeholder="Amount Received (₹)"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Remarks / Cheque / UTR #"
                  value={payRemarks}
                  onChange={e => setPayRemarks(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Save Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" /> Transaction Ledger History ({ledgerEntries.length} entries)
              </h4>
            </div>

            {ledgerEntries.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 border border-dashed rounded-2xl">
                No credit transactions or payment entries recorded yet for this customer.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-zinc-800/80 border-b border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400">
                      <th className="p-3 font-bold">Date</th>
                      <th className="p-3 font-bold">Type</th>
                      <th className="p-3 font-bold">Reference / Shift</th>
                      <th className="p-3 font-bold">Vehicle / Remarks</th>
                      <th className="p-3 font-bold text-right text-rose-600 dark:text-rose-400">Debit (+₹)</th>
                      <th className="p-3 font-bold text-right text-emerald-600 dark:text-emerald-400">Credit (-₹)</th>
                      <th className="p-3 font-bold text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...ledgerEntries].reverse().map(entry => (
                      <tr key={entry.id} className="border-b border-neutral-100 dark:border-zinc-800/60 hover:bg-neutral-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3 font-mono text-[11px] font-semibold">{entry.date}</td>
                        <td className="p-3 font-bold">
                          {entry.type === "charge" ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md text-[10px]">
                              <ArrowUpRight className="w-3 h-3" /> Credit Sale
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-[10px]">
                              <ArrowDownLeft className="w-3 h-3" /> Payment Received
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-neutral-600 dark:text-zinc-400 font-medium">{entry.refText}</td>
                        <td className="p-3 text-neutral-700 dark:text-zinc-300">{entry.remarks || "-"}</td>
                        <td className="p-3 font-bold text-right text-rose-600 dark:text-rose-400">
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 font-bold text-right text-emerald-600 dark:text-emerald-400">
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 font-bold font-display text-right text-neutral-900 dark:text-zinc-100">
                          ₹{entry.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-zinc-800 font-bold text-xs text-neutral-700 dark:text-zinc-300 hover:bg-neutral-300 dark:hover:bg-zinc-700 transition-all"
          >
            Close Ledger
          </button>
        </div>

      </div>
    </div>
  );
}