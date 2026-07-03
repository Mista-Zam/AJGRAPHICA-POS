import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, ShoppingBag, Calendar, ChevronDown, Eye, ArrowLeft } from "lucide-react";
import type { FinanceRecord } from "@/lib/supabase-service";
import type { Jobbing } from "../data/mock-data";
import { formatPeso, formatDate } from "../data/utils";

interface FinancesPageProps {
  finances: FinanceRecord[];
  jobbings: Jobbing[];
  onViewJobbing: (id: string) => void;
}

type Period = "weekly" | "monthly" | "annually";

function getWeekNumber(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatPeriodLabel(periodKey: string, mode: Period): string {
  if (mode === "monthly") {
    const [, m] = periodKey.split("-");
    return MONTHS_FULL[parseInt(m) - 1] + " " + periodKey.split("-")[0];
  }
  if (mode === "weekly") {
    return "Week " + periodKey.split("-W")[1] + ", " + periodKey.split("-")[0];
  }
  return periodKey;
}

export function FinancesPage({ finances, jobbings, onViewJobbing }: FinancesPageProps) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);

  const { chartData, summary, breakdown } = useMemo(() => {
    const done = finances;

    if (period === "weekly") {
      const weekMap = new Map<string, { revenue: number; jobs: number; label: string }>();
      const now = new Date();
      for (let i = -11; i <= 0; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i * 7);
        const week = getWeekNumber(d);
        const key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
        const label = `W${week}`;
        if (!weekMap.has(key)) weekMap.set(key, { revenue: 0, jobs: 0, label });
      }
      for (const j of done) {
        const d = new Date(j.completedAt);
        const week = getWeekNumber(d);
        const key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
        if (weekMap.has(key)) {
          const entry = weekMap.get(key)!;
          entry.revenue += j.amount;
          entry.jobs += 1;
        }
      }
      const entries = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      const totalRevenue = entries.reduce((s, [, e]) => s + e.revenue, 0);
      const totalJobs = entries.reduce((s, [, e]) => s + e.jobs, 0);
      return {
        chartData: entries.map(([, e]) => ({ name: e.label, revenue: e.revenue, jobs: e.jobs })),
        summary: { totalRevenue, totalJobs, avgPerJob: totalJobs > 0 ? Math.round(totalRevenue / totalJobs) : 0 },
        breakdown: entries.map(([key, e]) => ({
          period: key,
          label: e.label,
          revenue: e.revenue,
          jobs: e.jobs,
          avg: e.jobs > 0 ? Math.round(e.revenue / e.jobs) : 0,
        })),
      };
    }

    if (period === "monthly") {
      const monthMap = new Map<string, { revenue: number; jobs: number; label: string }>();
      const years = [...new Set(done.map((j) => new Date(j.completedAt).getFullYear()))].sort();
      const year = years.length > 0 ? years[years.length - 1] : new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const key = `${year}-${String(m + 1).padStart(2, "0")}`;
        monthMap.set(key, { revenue: 0, jobs: 0, label: MONTHS[m] });
      }
      for (const j of done) {
        const d = new Date(j.completedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthMap.has(key)) {
          const entry = monthMap.get(key)!;
          entry.revenue += j.amount;
          entry.jobs += 1;
        }
      }
      const entries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      const totalRevenue = entries.reduce((s, [, e]) => s + e.revenue, 0);
      const totalJobs = entries.reduce((s, [, e]) => s + e.jobs, 0);
      return {
        chartData: entries.map(([, e]) => ({ name: e.label, revenue: e.revenue, jobs: e.jobs })),
        summary: { totalRevenue, totalJobs, avgPerJob: totalJobs > 0 ? Math.round(totalRevenue / totalJobs) : 0 },
        breakdown: entries.map(([key, e]) => ({
          period: key,
          label: e.label,
          revenue: e.revenue,
          jobs: e.jobs,
          avg: e.jobs > 0 ? Math.round(e.revenue / e.jobs) : 0,
        })),
      };
    }

    // annually
    const yearMap = new Map<string, { revenue: number; jobs: number; label: string }>();
    for (const j of done) {
      const d = new Date(j.completedAt);
      const key = String(d.getFullYear());
      if (!yearMap.has(key)) yearMap.set(key, { revenue: 0, jobs: 0, label: key });
      const entry = yearMap.get(key)!;
      entry.revenue += j.amount;
      entry.jobs += 1;
    }
    const entries = Array.from(yearMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    const totalRevenue = entries.reduce((s, [, e]) => s + e.revenue, 0);
    const totalJobs = entries.reduce((s, [, e]) => s + e.jobs, 0);
    return {
      chartData: entries.map(([, e]) => ({ name: e.label, revenue: e.revenue, jobs: e.jobs })),
      summary: { totalRevenue, totalJobs, avgPerJob: totalJobs > 0 ? Math.round(totalRevenue / totalJobs) : 0 },
      breakdown: entries.map(([key, e]) => ({
        period: key,
        label: e.label,
        revenue: e.revenue,
        jobs: e.jobs,
        avg: e.jobs > 0 ? Math.round(e.revenue / e.jobs) : 0,
      })),
    };
  }, [finances, period]);

  const periodJobbings = useMemo(() => {
    if (!selectedPeriodKey) return [];
    const matchedFinIds = new Set(
      finances.filter((f) => {
        const d = new Date(f.completedAt);
        if (period === "monthly") {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return key === selectedPeriodKey;
        }
        if (period === "weekly") {
          const week = getWeekNumber(d);
          const key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
          return key === selectedPeriodKey;
        }
        const key = String(d.getFullYear());
        return key === selectedPeriodKey;
      }).map((f) => f.id)
    );
    return jobbings.filter((j) => matchedFinIds.has(j.id));
  }, [finances, jobbings, selectedPeriodKey, period]);

  const periodLabels: Record<Period, string> = {
    weekly: "Weekly Revenue",
    monthly: "Monthly Revenue",
    annually: "Annual Revenue",
  };

  const periodRevenue = periodJobbings.reduce((s, j) => s + j.amount, 0);

  if (selectedPeriodKey) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
          {/* Back */}
          <button onClick={() => setSelectedPeriodKey(null)} className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400 hover:text-[#C53030] dark:hover:text-[#f87171] mb-4 transition-colors py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] px-3 -ml-3">
            <ArrowLeft size={18} /> Back to overview
          </button>

          {/* Period header */}
          <div className="mb-4">
            <h1 className="text-gray-900 dark:text-gray-100">{formatPeriodLabel(selectedPeriodKey, period)}</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {periodJobbings.length} job{periodJobbings.length !== 1 ? "s" : ""} completed â€” {formatPeso(periodRevenue)} total revenue
            </p>
          </div>

          {/* Mobile: Cards */}
          <div className="sm:hidden flex flex-col gap-2">
            {periodJobbings.length === 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl py-12 text-center text-sm text-gray-400 dark:text-gray-500 card-shadow">No jobbings found for this period.</div>
            )}
            {periodJobbings.map((j) => (
              <div key={j.id} className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl card-shadow overflow-hidden">
                <div className="px-3 pt-2.5 pb-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{j.customerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 flex-wrap">
                        <span className="font-mono">{j.id}</span>
                        <span>Â·</span>
                        <span>{j.jobType}</span>
                        {j.fabric && <><span>Â·</span><span>{j.fabric}</span></>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatPeso(j.amount)}</div>
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-1.5">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{j.description}</p>
                </div>
                <div className="px-2 py-1.5 border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]">
                  <button onClick={() => onViewJobbing(j.id)} className="w-full text-sm py-3 rounded-lg border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#2a2a2a] flex items-center justify-center gap-1.5 transition-colors font-medium">
                    <Eye size={15} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl card-shadow overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] bg-gray-50 dark:bg-[#2a2a2a] sticky top-0 z-10">
                    {["Job ID", "Customer", "Type", "Fabric", "Description", "Amount", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-400 dark:text-gray-500 font-medium px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodJobbings.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No jobbings found for this period.</td></tr>
                  )}
                  {periodJobbings.map((j, idx) => (
                    <tr key={j.id} className={`border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0 transition-colors ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                        : "bg-gray-50/50 dark:bg-[#1a1a1a]/50 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                    }`}>
                      <td className="px-3 sm:px-4 py-3">
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{j.id}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{j.customerName}</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-sm">{j.jobType}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{j.fabric ?? "â€”"}</td>
                      <td className="px-3 sm:px-4 py-3 max-w-[160px]">
                        <span className="block truncate text-sm text-gray-500 dark:text-gray-400">{j.description}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatPeso(j.amount)}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <button onClick={() => onViewJobbing(j.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#3a1010] text-gray-400 dark:text-gray-500 hover:text-[#C53030] dark:hover:text-[#f87171] transition-colors">
                          <Eye size={17} />
                        </button>
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

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Finances</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Sales analytics from completed jobbings
            </p>
          </div>
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="appearance-none bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 cursor-pointer font-medium card-shadow"
            >
              <option value="weekly">Weekly Revenue</option>
              <option value="monthly">Monthly Revenue</option>
              <option value="annually">Annual Revenue</option>
            </select>
            <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4 flex items-center gap-3 card-shadow">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-[#FEF2F2] dark:bg-[#3a1010] flex items-center justify-center text-[#C53030] dark:text-[#f87171] shrink-0">
              <DollarSign size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Total Revenue</div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {formatPeso(summary.totalRevenue)}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4 flex items-center gap-3 card-shadow">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-[#FEF2F2] dark:bg-[#3a1010] flex items-center justify-center text-[#C53030] dark:text-[#f87171] shrink-0">
              <ShoppingBag size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Jobs Completed</div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">{summary.totalJobs}</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4 flex items-center gap-3 card-shadow">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-[#E8F5F1] dark:bg-[#0a3a2e] flex items-center justify-center text-[#0F6E56] dark:text-[#5abb9e] shrink-0">
              <TrendingUp size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Avg. Per Job</div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {formatPeso(summary.avgPerJob)}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-3 sm:p-4 mb-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Revenue â€” {periodLabels[period]}</div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0F6E56]" />
                  Revenue
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#991B1B]" />
                  Jobs
                </span>
            </div>
          </div>
          <div style={{ height: "clamp(160px, 25vw, 240px)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, boxShadow: "none", background: "var(--card, #fff)" }}
                    cursor={{ fill: "transparent" }}
                  formatter={(value, name) => [
                    name === "revenue" ? formatPeso(value as number) : value,
                    name === "revenue" ? "Revenue" : "Jobs",
                  ] as [string | number, string]}
                />
                <Bar dataKey="revenue" fill="#0F6E56" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="jobs" fill="#991B1B" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl card-shadow overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                {periodLabels[period]} Breakdown
              </span>
            </div>
          </div>
          <div className="sm:hidden divide-y divide-[rgba(0,0,0,0.05)] dark:divide-[rgba(255,255,255,0.05)]">
            {breakdown.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No data for this period.</div>
            )}
            {breakdown.map((row) => (
              <div key={row.period} onClick={() => row.jobs > 0 && setSelectedPeriodKey(row.period)} className={`px-3 py-2.5 ${row.jobs > 0 ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a]" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPeso(row.revenue)}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
                  <span>{row.jobs} job{row.jobs !== 1 ? "s" : ""}</span>
                  <span>Avg: {formatPeso(row.avg)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden sm:block overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] bg-gray-50 dark:bg-[#2a2a2a] sticky top-0 z-10">
                  <th className="text-left text-xs text-gray-400 dark:text-gray-500 font-medium px-3 sm:px-4 py-3 whitespace-nowrap">
                    {period === "monthly" ? "Month" : period === "weekly" ? "Week" : "Year"}
                  </th>
                  <th className="text-right text-xs text-gray-400 dark:text-gray-500 font-medium px-3 sm:px-4 py-3 whitespace-nowrap">Revenue</th>
                  <th className="text-right text-xs text-gray-400 dark:text-gray-500 font-medium px-3 sm:px-4 py-3 whitespace-nowrap">Jobs</th>
                  <th className="text-right text-xs text-gray-400 dark:text-gray-500 font-medium px-3 sm:px-4 py-3 whitespace-nowrap">Avg Per Job</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No data for this period.</td></tr>
                )}
                {breakdown.map((row, idx) => (
                  <tr key={row.period} onClick={() => row.jobs > 0 && setSelectedPeriodKey(row.period)}
                    className={`border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0 transition-colors ${row.jobs > 0 ? "cursor-pointer" : ""} ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                        : "bg-gray-50/50 dark:bg-[#1a1a1a]/50 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                    }`}>
                    <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.label}</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold whitespace-nowrap">{formatPeso(row.revenue)}</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.jobs}</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatPeso(row.avg)}</td>
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
