import { useState, useEffect } from "react";
import { X, CheckCircle2, Receipt } from "lucide-react";
import type { Jobbing } from "../data/mock-data";
import { getPaymentHistory, savePayment, updateJobbing, saveFinanceRecord, type PaymentRecord } from "@/lib/supabase-service";

interface ReceivePaymentModalProps {
  jobbing: Jobbing;
  onClose: () => void;
  onComplete: (updatedJobbing: Jobbing) => void;
}

const PAYMENT_METHODS = ["Cash", "GCash", "Bank Transfer", "Check"];

export function ReceivePaymentModal({ jobbing, onClose, onComplete }: ReceivePaymentModalProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0) + jobbing.downPayment;
  const remaining = Math.max(0, jobbing.amount - totalPaid);
  const isFullPayment = parseFloat(amount) >= remaining;

  useEffect(() => {
    getPaymentHistory(jobbing.id).then((data) => {
      setPayments(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [jobbing.id]);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    setSubmitting(true);
    try {
      await savePayment({
        jobbing_id: jobbing.id,
        amount: amt,
        payment_method: method,
        payment_date: paymentDate,
        notes,
        reference_number: referenceNumber || undefined,
        received_by: receivedBy || undefined,
      });

      const newTotalPaid = totalPaid + amt;
      const fullyPaid = newTotalPaid >= jobbing.amount;
      const newPoStatus = fullyPaid ? "paid" : "partially_paid";
      const newPaymentStatus = fullyPaid ? "Paid" : newTotalPaid > jobbing.downPayment ? "Partial" : jobbing.paymentStatus;

      const updated: Jobbing = {
        ...jobbing,
        poStatus: newPoStatus,
        paymentStatus: newPaymentStatus,
        paymentCompletedAt: fullyPaid ? paymentDate : undefined,
      };

      await updateJobbing(updated);

      if (fullyPaid) {
        const record = {
          id: jobbing.id,
          customerName: jobbing.customerName,
          jobType: jobbing.jobType,
          description: jobbing.description,
          quantity: jobbing.quantity,
          amount: jobbing.amount,
          downPayment: jobbing.downPayment,
          paymentStatus: "Paid",
          pickupDate: jobbing.pickupDate,
          completedAt: paymentDate,
          createdAt: jobbing.createdAt,
        };
        await saveFinanceRecord(record);
      }

      onComplete(updated);
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[min(480px,95vw)] max-h-[90vh] bg-white dark:bg-[#1a1a1a] overflow-y-auto flex flex-col rounded-2xl border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] shadow-2xl">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0">
          <h2 className="text-gray-900 dark:text-gray-100 text-lg sm:text-xl font-semibold">Receive Payment</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 dark:text-gray-500 transition-all duration-200 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4 flex-1">
          {/* Job Summary */}
          <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-xl p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">PO#</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{jobbing.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Customer</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{jobbing.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Job Type</span>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{jobbing.jobType}</span>
            </div>
            <hr className="border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] my-1" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Total Amount</span>
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">₱{jobbing.amount.toLocaleString("en-PH")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Down Payment</span>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">₱{jobbing.downPayment.toLocaleString("en-PH")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Total Paid</span>
              <span className="text-xs sm:text-sm font-medium text-[#0F6E56]">₱{totalPaid.toLocaleString("en-PH")}</span>
            </div>
            <div className={`flex items-center justify-between ${remaining > 0 ? "text-[#991B1B]" : "text-[#0F6E56]"}`}>
              <span className="text-[10px] sm:text-xs font-medium">Remaining Balance</span>
              <span className="text-xs sm:text-sm font-bold">₱{remaining.toLocaleString("en-PH")}</span>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Receipt size={15} />
              Payment History
            </h3>
            {loading ? (
              <div className="text-xs text-gray-400 py-2">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="text-xs text-gray-400 dark:text-gray-500 py-2">No payments yet</div>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-[#2a2a2a] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#0F6E56]" />
                      <div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">₱{Number(p.amount).toLocaleString("en-PH")}</span>
                        <span className="text-[10px] text-gray-400 ml-1.5">{p.payment_method}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">{p.payment_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Payment Form */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">New Payment</h3>

            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Payment Amount *</label>
              <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all">
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Payment Date</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Reference Number</label>
              <input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Optional"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Received By</label>
              <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Optional"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} placeholder="Optional notes about this payment"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 resize-none transition-all" />
            </div>

            {parseFloat(amount) > 0 && remaining > 0 && (
              <div className={`text-[10px] sm:text-xs px-3 py-2 rounded-xl font-medium ${isFullPayment ? "bg-[#E8F5F1] dark:bg-[#064E3B] text-[#0F6E56] dark:text-[#5abb9e]" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"}`}>
                {isFullPayment
                  ? "This will complete the payment and mark the PO as paid."
                  : `Remaining after payment: ₱${(remaining - parseFloat(amount)).toLocaleString("en-PH")}`}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] flex gap-2 sm:gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-base py-3 px-5 rounded-xl transition-all duration-200 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-[#C53030] hover:bg-[#991B1B] disabled:opacity-50 disabled:cursor-not-allowed text-white text-base py-3 px-5 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {submitting ? "Processing..." : `Receive ₱${parseFloat(amount || "0").toLocaleString("en-PH")}`}
          </button>
        </div>
      </div>
    </div>
  );
}
