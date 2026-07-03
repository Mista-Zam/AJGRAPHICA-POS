import { useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, Edit3, Printer, Save } from "lucide-react";
import type { Jobbing, JobStage, PaymentStatus } from "../data/mock-data";
import { formatPeso, formatDateLong, getPickupColor, PAYMENT_COLORS } from "../data/utils";

interface JobDetailProps {
  jobbing: Jobbing;
  onBack: () => void;
  onUpdate: (updated: Jobbing) => void;
  onSaved?: () => void;
  onEdit?: () => void;
  onPrintReceipt?: () => void;
  backLabel?: string;
}

const STAGES: JobStage[] = ["Received", "In Progress", "For Pickup", "Completed"];

function getPickupColorDetail(isoDate: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "text-[#991B1B] dark:text-[#e87070] font-bold";
  if (diff === 0) return "text-[#0F6E56] dark:text-[#5abb9e] font-semibold";
  return "text-gray-800 dark:text-gray-300";
}

export function JobDetail({ jobbing, onBack, onUpdate, onSaved, onEdit, onPrintReceipt, backLabel = "Back to Jobbings" }: JobDetailProps) {
  const [notes, setNotes] = useState(jobbing.notes);

  const handleSaveNotes = () => {
    onUpdate({ ...jobbing, notes });
    onSaved?.();
  };

  const handleStage = (stage: JobStage) => {
    onUpdate({
      ...jobbing,
      stage,
      status: stage === "Completed" ? "Done" : stage === "For Pickup" ? "For Pickup" : jobbing.isUrgent ? "Urgent" : jobbing.status,
    });
  };

  const handlePayment = (p: PaymentStatus) => onUpdate({ ...jobbing, paymentStatus: p });

  const stageIdx = STAGES.indexOf(jobbing.stage);
  const balance = jobbing.amount - jobbing.downPayment;
  const isUrgentActive = jobbing.isUrgent && jobbing.status !== "Done";

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in">
      <div className="p-3 sm:p-4 md:p-6 max-w-3xl mx-auto">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400 hover:text-[#C53030] dark:hover:text-[#f87171] mb-4 transition-all duration-200 py-2 hover:-translate-x-0.5">
          <ArrowLeft size={18} /> {backLabel}
        </button>

        {/* Header card */}
        <div className={`card-shadow rounded-xl border p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 ${isUrgentActive ? "bg-[#FEF2F2] dark:bg-[#3a1010] border-[#FECACA] dark:border-[#6a2020]" : "bg-white dark:bg-[#1a1a1a] border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]"}`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                {isUrgentActive && <AlertTriangle size={16} className="text-[#991B1B] shrink-0" />}
                <span className="text-[10px] sm:text-xs font-mono text-gray-400">{jobbing.id}</span>
              </div>
              <h2 className={`truncate text-lg sm:text-xl ${isUrgentActive ? "text-[#991B1B] dark:text-[#e87070]" : "text-gray-900 dark:text-gray-100"}`}>{jobbing.customerName}</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{jobbing.contactNumber}</p>
              {jobbing.address && <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-0.5">{jobbing.address}</p>}
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${PAYMENT_COLORS[jobbing.paymentStatus]}`}>{jobbing.paymentStatus}</span>
              <div className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mt-1">{formatPeso(jobbing.amount)}</div>
              {balance > 0 && (
                <div className="text-[10px] sm:text-xs text-[#991B1B] dark:text-[#e87070] font-medium">Bal: {formatPeso(balance)}</div>
              )}
            </div>
          </div>
          {(onEdit || onPrintReceipt) && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
              {onEdit && (
                <button onClick={onEdit}
                  className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200 font-medium">
                  <Edit3 size={16} /> Edit
                </button>
              )}
              {onPrintReceipt && (
                <button onClick={onPrintReceipt}
                  className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200 font-medium">
                  <Printer size={16} /> Print Receipt
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info + Payment â€” stacked on mobile, side-by-side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Job Info */}
          <div className="card-shadow bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 sm:mb-3">Job Info</div>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <Row label="Type" value={jobbing.jobType} />
              {jobbing.fabric && <Row label="Fabric" value={jobbing.fabric} />}
              <Row label="Quantity" value={`${jobbing.quantity} pc${jobbing.quantity !== 1 ? "s" : ""}`} />
              <div>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Description</span>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{jobbing.description}</p>
              </div>
              <div>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Pickup Date</span>
                <p className={`text-xs sm:text-sm mt-0.5 ${getPickupColorDetail(jobbing.pickupDate)}`}>{formatDateLong(jobbing.pickupDate)}</p>
              </div>
              {jobbing.attachment && (
                <div>
                  <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Attachment</span>
                  <div className="mt-1 rounded-xl overflow-hidden border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                    <img
                      src={jobbing.attachment}
                      alt="Job attachment"
                      className="max-h-48 w-full object-contain bg-gray-50 dark:bg-[#2a2a2a]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="card-shadow bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 sm:mb-3">Payment</div>
            <div className="flex flex-col gap-2 sm:gap-2.5 mb-3 sm:mb-4">
              <Row label="Total Amount" value={formatPeso(jobbing.amount)} />
              <Row label="Down Payment" value={formatPeso(jobbing.downPayment)} />
              <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-2">
                <Row label="Balance Due" value={formatPeso(balance)} highlight={balance > 0} />
              </div>
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">Payment Status</div>
            <div className="flex gap-2">
              {(["Unpaid", "Partial", "Paid"] as PaymentStatus[]).map((p) => (
                <button key={p} onClick={() => handlePayment(p)}
                  className={`flex-1 text-sm py-2.5 rounded-xl border transition-all duration-200 font-medium ${
                    jobbing.paymentStatus === p
                      ? p === "Paid" ? "bg-[#0F6E56] text-white border-[#0F6E56] shadow-sm"
                        : p === "Partial" ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-[#991B1B] text-white border-[#991B1B] shadow-sm"
                      : "bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Stepper */}
        <div className="card-shadow bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Progress</div>
          <div className="flex items-start justify-between sm:justify-start gap-0 sm:gap-1 overflow-x-auto pb-1">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center flex-1 last:flex-none min-w-0">
                <button onClick={() => handleStage(stage)} className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-shrink-0 px-0.5 sm:px-0">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    i <= stageIdx
                      ? "bg-[#C53030] border-[#C53030] text-white shadow-md"
                      : "bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 group-hover:border-[#C53030] dark:group-hover:border-[#f87171] group-hover:scale-110"
                  }`}>
                    {i < stageIdx ? <CheckCircle size={16} /> : <span className="text-sm font-semibold">{i + 1}</span>}
                  </div>
                  <span className={`text-[10px] sm:text-xs text-center leading-tight max-w-[48px] sm:max-w-[64px] ${i <= stageIdx ? "text-[#C53030] dark:text-[#f87171] font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                    {stage}
                  </span>
                </button>
                {i < STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-0.5 sm:mx-1 mb-3 sm:mb-4 rounded-full ${i < stageIdx ? "bg-[#C53030]" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card-shadow bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 sm:mb-2">Worker Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes for this job..."
            className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 resize-none bg-white dark:bg-[#1a1a1a] dark:text-gray-200 dark:placeholder-gray-500 transition-all duration-200"
          />
          <button onClick={handleSaveNotes} className="mt-3 flex items-center gap-2 text-base py-3 px-5 rounded-xl transition-all duration-200 bg-[#C53030] hover:bg-[#991B1B] text-white font-medium shadow-sm hover:shadow-md active:scale-[0.98]">
            <Save size={18} />
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight ? "font-semibold text-[#991B1B] dark:text-[#e87070]" : "text-gray-700 dark:text-gray-300"}`}>{value}</span>
    </div>
  );
}
