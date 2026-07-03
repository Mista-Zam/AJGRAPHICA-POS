export function formatPeso(n: number) {
  return "₱" + n.toLocaleString("en-PH");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

export function getPickupColor(isoDate: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "text-[#991B1B] dark:text-[#e87070] font-semibold";
  if (diff === 0) return "text-[#0F6E56] dark:text-[#5abb9e] font-semibold";
  return "text-gray-600 dark:text-gray-400";
}

export const STATUS_COLORS: Record<string, string> = {
  Urgent: "bg-[#FEF2F2] dark:bg-[#3a1010] text-[#991B1B] dark:text-[#e87070] border border-[#FECACA] dark:border-[#6a2020]",
  "In Progress": "bg-amber-50 dark:bg-[#3a2e00] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-[#5a4e00]",
  "For Pickup": "bg-blue-50 dark:bg-[#0a1a3a] text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-[#2a4a6a]",
  Done: "bg-[#E8F5F1] dark:bg-[#0a3a2e] text-[#0F6E56] dark:text-[#5abb9e] border border-[#A7D9CC] dark:border-[#2a6a5a]",
  Normal: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
};

export const PAYMENT_COLORS: Record<string, string> = {
  Unpaid: "bg-[#FEF2F2] dark:bg-[#3a1010] text-[#991B1B] dark:text-[#e87070] border border-[#FECACA] dark:border-[#6a2020]",
  Partial: "bg-amber-50 dark:bg-[#3a2e00] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-[#5a4e00]",
  Paid: "bg-[#E8F5F1] dark:bg-[#0a3a2e] text-[#0F6E56] dark:text-[#5abb9e] border border-[#A7D9CC] dark:border-[#2a6a5a]",
};

export const JOB_TYPES = ["T-Shirt", "Polo Shirt", "Tarpaulin", "Uniform", "Alteration", "Jacket", "Other"] as const;
