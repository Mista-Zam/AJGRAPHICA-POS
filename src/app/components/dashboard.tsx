import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertCircle, ClipboardList, Clock, PhilippinePeso, Bell, CreditCard, AlertTriangle } from "lucide-react";
import type { Jobbing } from "../data/mock-data";
import type { FinanceRecord } from "@/lib/supabase-service";
import { formatPeso, formatDate, getPickupColor, STATUS_COLORS } from "../data/utils";

interface DashboardProps {
  jobbings: Jobbing[];
  finances: FinanceRecord[];
  onViewJobbing: (id: string) => void;
}

export function Dashboard({ jobbings, finances, onViewJobbing }: DashboardProps) {
  const [showNotif, setShowNotif] = useState(false);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = DAYS.map((day, i) => ({
    day,
    jobs: finances.filter((f) => new Date(f.completedAt).getDay() === i).length,
  }));

  const active = jobbings.filter((j) => j.status !== "Done");
  const urgent = jobbings.filter((j) => j.isUrgent && j.status !== "Done");
  const dueToday = jobbings.filter((j) => {
    const d = new Date(j.pickupDate); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && j.status !== "Done";
  });
  const earnedToday = jobbings
    .filter((j) => {
      const c = new Date(j.createdAt); c.setHours(0, 0, 0, 0);
      return c.getTime() === today.getTime();
    })
    .reduce((s, j) => s + j.downPayment, 0);

  const overdue = jobbings.filter((j) => {
    const d = new Date(j.pickupDate); d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime() && j.status !== "Done";
  });

  const poJobbings = jobbings.filter((j) => j.isPurchaseOrder && (j.poStatus === "pending_payment" || j.poStatus === "partially_paid"));
  const poOverdue = poJobbings.filter((j) => (j.dueDate || j.pickupDate) < today.toISOString().split("T")[0]);
  const allAlerts = [...dueToday, ...overdue, ...poOverdue];

  const recent = [...jobbings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const alertJobs = jobbings
    .filter((j) => j.status !== "Done")
    .map((j) => {
      const d = new Date(j.pickupDate); d.setHours(0, 0, 0, 0);
      return { ...j, diff: Math.round((d.getTime() - today.getTime()) / 86400000) };
    })
    .filter((j) => j.diff <= 1 || j.isUrgent)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5);

  const cards = [
    { label: "Active Jobbings", value: active.length, icon: <ClipboardList size={22} />, color: "text-[#C53030]", bg: "bg-[#FEF2F2]" },
    { label: "Urgent", value: urgent.length, icon: <AlertCircle size={22} />, color: "text-[#991B1B]", bg: "bg-[#FEF2F2]" },
    { label: "Due Today", value: dueToday.length, icon: <Clock size={22} />, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Collected Today", value: formatPeso(earnedToday), icon: <PhilippinePeso size={22} />, color: "text-[#0F6E56]", bg: "bg-[#E8F5F1]" },
    { label: "Purchase Orders", value: poJobbings.length, icon: <CreditCard size={22} />, color: "text-[#C53030]", bg: "bg-[#FEF2F2]" },
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in">
        {/* Header with notification bell */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          {(dueToday.length > 0 || overdue.length > 0 || poOverdue.length > 0) && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotif((v) => !v)}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 transition-colors"
              >
                <Bell size={20} />
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center rounded-full bg-[#991B1B] text-white text-[9px] font-bold leading-none">
                  {allAlerts.length}
                </span>
              </button>
              {showNotif && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl shadow-xl overflow-hidden card-shadow">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                      Pickup & PO Alerts
                    </div>
                    <div className="max-h-60 overflow-y-auto scrollbar-thin">
                      {allAlerts.map((j) => {
                        const isPO = j.isPurchaseOrder;
                        const overdueDate = new Date(j.pickupDate) < today || (j.dueDate && new Date(j.dueDate) < today);
                        return (
                          <button
                            key={j.id}
                            onClick={() => { onViewJobbing(j.id); setShowNotif(false); }}
                            className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0"
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${overdueDate ? "bg-[#991B1B]" : "bg-amber-500"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{j.customerName}</div>
                              <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                                {j.jobType} · {j.id}
                                {isPO && <span className="ml-1 text-amber-600 font-semibold">[PO]</span>}
                              </div>
                            </div>
                            <span className={`text-[10px] font-semibold shrink-0 ${overdueDate ? "text-[#991B1B]" : "text-amber-600"}`}>
                              {overdueDate ? "Overdue" : "Today"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Summary Cards â€” 2-col on mobile, 3-col on sm, 4-col on md+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {cards.map((c) => (
            <div key={c.label} className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-2.5 sm:p-4 card-shadow relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C53030] rounded-l-xl" />
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight truncate">{c.label}</span>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${c.bg} flex items-center justify-center ${c.color} shrink-0`}>{c.icon}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-base sm:text-xl md:text-2xl font-bold ${c.color} truncate`}>{c.value}</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F6E56] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Alerts â€” stacked on mobile, side-by-side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-5">
          {/* Bar Chart */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4 card-shadow">
            <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Weekly Job Completions</div>
            <div className="h-[140px] sm:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, background: "#fff" }}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar dataKey="jobs" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {weeklyData.map((_, i) => (
                        <Cell key={i} fill={i === new Date().getDay() ? "#C53030" : "#D1D5DB"} />
                      ))}
                    </Bar>
                  </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Urgent & Overdue */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4 card-shadow">
            <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Urgent & Overdue</div>
            <div className="flex flex-col gap-1.5">
              {alertJobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => onViewJobbing(j.id)}
                  className={`text-left text-base px-4 py-3 rounded-lg flex items-center gap-2 w-full transition-colors hover:opacity-80 font-medium ${
                    j.isUrgent || j.diff < 0
                      ? "bg-[#FEF2F2] dark:bg-[#3a1010] text-[#991B1B] dark:text-[#e87070]"
                      : j.diff === 0
                      ? "bg-[#E8F5F1] dark:bg-[#0a3a2e] text-[#0F6E56] dark:text-[#5abb9e]"
                      : "bg-amber-50 dark:bg-[#3a2e00] text-amber-700 dark:text-amber-400"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${j.isUrgent || j.diff < 0 ? "bg-[#991B1B]" : j.diff === 0 ? "bg-[#0F6E56]" : "bg-amber-500"}`} />
                  <span className="truncate flex-1 min-w-0">{j.customerName}</span>
                  <span className="font-semibold shrink-0 text-[10px] sm:text-xs">
                    {j.diff < 0 ? "Overdue" : j.diff === 0 ? "Today" : `${j.diff}d`}
                  </span>
                </button>
              ))}
              {alertJobs.length === 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">All clear! No urgent pickups.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Jobbings â€” table on sm+, cards on mobile */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl card-shadow overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
            <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Recent Jobbings</div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-[rgba(0,0,0,0.05)] dark:divide-[rgba(255,255,255,0.05)]">
            {recent.map((j) => (
              <button
                key={j.id}
                onClick={() => onViewJobbing(j.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors ${j.isUrgent ? "bg-[#FEF2F2] dark:bg-[#3a1010]" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{j.customerName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[(j.status as string) === "For Pickup" || (j.status as string) === "Done" ? j.status : j.isUrgent ? "Urgent" : j.status]}`}>
                      {(j.status as string) === "For Pickup" || (j.status as string) === "Done" ? j.status : j.isUrgent && (j.status as string) !== "Done" ? "Urgent" : j.status}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 truncate">{j.jobType} Â· {j.id}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatPeso(j.amount)}</div>
                  <div className={`text-[10px] sm:text-xs ${getPickupColor(j.pickupDate)}`}>{formatDate(j.pickupDate)}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] sticky top-0 bg-white dark:bg-[#1a1a1a] z-10">
                  {["Job ID", "Customer", "Type", "Pickup Date", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-400 dark:text-gray-500 font-medium px-3 sm:px-4 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((j, idx) => (
                  <tr
                    key={j.id}
                    onClick={() => onViewJobbing(j.id)}
                    className={`border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0 cursor-pointer transition-colors ${
                      j.isUrgent
                        ? "bg-[#FEF2F2] dark:bg-[#3a1010] hover:bg-[#fde8e8] dark:hover:bg-[#4a1515]"
                        : idx % 2 === 0
                        ? "bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                        : "bg-gray-50/50 dark:bg-[#1a1a1a]/50 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <td className="px-3 sm:px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap">{j.id}</td>
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{j.customerName}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{j.jobType}</td>
                    <td className={`px-3 sm:px-4 py-2.5 text-xs whitespace-nowrap ${getPickupColor(j.pickupDate)}`}>{formatDate(j.pickupDate)}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatPeso(j.amount)}</td>
                    <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[(j.status as string) === "For Pickup" || (j.status as string) === "Done" ? j.status : j.isUrgent ? "Urgent" : j.status]}`}>
                        {(j.status as string) === "For Pickup" || (j.status as string) === "Done" ? j.status : j.isUrgent && (j.status as string) !== "Done" ? "Urgent" : j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
