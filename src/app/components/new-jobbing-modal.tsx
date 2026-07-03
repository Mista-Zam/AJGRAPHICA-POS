import { useState } from "react";
import { X, AlertTriangle, Paperclip } from "lucide-react";
import type { Jobbing, JobType, Fabric } from "../data/mock-data";

interface NewJobbingModalProps {
  onClose: () => void;
  onSave: (jobbing: Omit<Jobbing, "id" | "createdAt" | "stage" | "paymentStatus" | "notes">) => void;
}

const JOB_TYPES: JobType[] = ["T-Shirt", "Polo Shirt", "Tarpaulin", "Uniform", "Alteration", "Jacket", "Other"];
const FABRICS: Fabric[] = ["Cotton", "Sublimation"];
const today = new Date().toISOString().split("T")[0];

export function NewJobbingModal({ onClose, onSave }: NewJobbingModalProps) {
  const [form, setForm] = useState({
    customerName: "",
    contactNumber: "",
    address: "",
    jobType: "T-Shirt" as JobType,
    fabric: undefined as Fabric | undefined,
    description: "",
    quantity: "1",
    rate: "",
    pickupDate: today,
    downPayment: "",
    isUrgent: false,
    attachment: undefined as string | undefined,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const qty = parseInt(form.quantity) || 0;
  const rate = parseFloat(form.rate) || 0;
  const down = parseFloat(form.downPayment) || 0;
  const amount = qty * rate;
  const balance = amount - down;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("attachment", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customerName: form.customerName,
      contactNumber: form.contactNumber,
      address: form.address,
      jobType: form.jobType,
      fabric: form.fabric,
      description: form.description,
      quantity: qty,
      pickupDate: form.pickupDate,
      amount,
      downPayment: down,
      isUrgent: form.isUrgent,
      attachment: form.attachment,
      status: form.isUrgent ? "Urgent" : "Normal",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[min(560px,95vw)] max-h-[90vh] bg-white dark:bg-[#1a1a1a] overflow-y-auto flex flex-col rounded-2xl border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0">
          <h2 className="text-gray-900 dark:text-gray-100 text-lg sm:text-xl font-semibold">New Jobbing</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 dark:text-gray-500 transition-all duration-200 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4 flex-1">
            {/* Urgent Toggle */}
            <div
              onClick={() => set("isUrgent", !form.isUrgent)}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                form.isUrgent
                  ? "bg-[#FEF2F2] dark:bg-[#3a1010] border-[#FECACA] dark:border-[#6a2020] text-[#991B1B] dark:text-[#e87070]"
                  : "bg-gray-50 dark:bg-[#2a2a2a] border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#555555]"
              }`}
            >
              <AlertTriangle size={17} className={form.isUrgent ? "text-[#991B1B]" : "text-gray-400"} />
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium">Mark as Urgent</div>
                <div className="text-[10px] sm:text-xs opacity-60">Highlights this job in red across the app</div>
              </div>
              <div className={`w-9 sm:w-10 h-5 rounded-full transition-colors duration-200 relative shrink-0 ${form.isUrgent ? "bg-[#991B1B]" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${form.isUrgent ? "left-[17px] sm:left-5" : "left-0.5"}`} />
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Customer Name *</label>
              <input required value={form.customerName} onChange={(e) => set("customerName", e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
            </div>

            {/* Contact */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Contact Number</label>
              <input value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)}
                placeholder="09xxxxxxxxx"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)}
                placeholder="Customer address"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Job Type *</label>
              <select required value={form.jobType} onChange={(e) => set("jobType", e.target.value)}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200">
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Fabric */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Fabric</label>
              <select value={form.fabric ?? ""} onChange={(e) => set("fabric", (e.target.value || undefined) as Fabric | undefined)}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200">
                <option value="">Select fabric...</option>
                {FABRICS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Description / Specs *</label>
              <textarea required value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={3}                 placeholder="Size, color, design details, material..."
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 resize-none transition-all duration-200" />
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Attachment (optional)</label>
              {form.attachment ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-[#2a2a2a] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5">
                    <Paperclip size={16} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">Image attached</span>
                  </div>
                  <button type="button" onClick={() => set("attachment", undefined)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#555555] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-[#2a2a2a] border border-dashed border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 hover:bg-gray-100 dark:hover:bg-[#555555] transition-all duration-200">
                  <Paperclip size={16} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Upload image...</span>
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
              )}
            </div>

            {/* Quantity + Rate */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Quantity</label>
                <input type="text" inputMode="numeric" value={form.quantity} onChange={(e) => set("quantity", e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Rate (₱)</label>
                <input type="text" inputMode="decimal" value={form.rate} onChange={(e) => set("rate", e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
              </div>
            </div>

            {/* Pickup Date + Down Payment */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Pickup Date *</label>
                <input type="date" required value={form.pickupDate} onChange={(e) => set("pickupDate", e.target.value)}
                  className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Down Payment (₱)</label>
                <input type="text" inputMode="decimal" value={form.downPayment} onChange={(e) => set("downPayment", e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
              </div>
            </div>

            {/* Total & Balance */}
            {amount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 bg-gray-50 dark:bg-[#2a2a2a] rounded-xl">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Total Amount</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">₱{amount.toLocaleString("en-PH")}</span>
                </div>
                <div className={`flex items-center justify-between text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-xl ${balance > 0 ? "bg-[#FEF2F2] dark:bg-[#3a1010] text-[#991B1B] dark:text-[#e87070]" : "bg-[#E8F5F1] dark:bg-[#064E3B] text-[#0F6E56] dark:text-[#5abb9e]"}`}>
                  <span className="font-medium">{balance > 0 ? "Remaining Balance" : "Fully Paid"}</span>
                  <span className="font-bold">₱{Math.max(0, balance).toLocaleString("en-PH")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] flex gap-2 sm:gap-3 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-base py-3 px-5 rounded-xl transition-all duration-200 font-medium">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-[#C53030] hover:bg-[#991B1B] text-white text-base py-3 px-5 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98]">
              Save Jobbing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
