import { useState } from "react";
import { Download, ChevronDown, Eye, RotateCcw, Trash2, Search } from "lucide-react";
import type { FinanceRecord } from "@/lib/supabase-service";
import { formatPeso, formatDate, PAYMENT_COLORS, JOB_TYPES } from "../data/utils";

interface TransactionHistoryProps {
  finances: FinanceRecord[];
  onViewJobbing?: (id: string) => void;
  onReopenJob?: (id: string) => void;
  onDeleteJobbing?: (id: string) => void;
}

export function TransactionHistory({ finances, onViewJobbing, onReopenJob, onDeleteJobbing }: TransactionHistoryProps) {
  const [filterType, setFilterType] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reopenId, setReopenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const completed = finances.filter((j) => {
    if (filterType !== "All" && j.jobType !== filterType) return false;
    if (dateFrom && j.completedAt < dateFrom) return false;
    if (dateTo && j.completedAt > dateTo) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!j.customerName.toLowerCase().includes(q) &&
          !j.id.toLowerCase().includes(q) &&
          !j.description.toLowerCase().includes(q) &&
          !j.jobType.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleExport = () => {
    const header = "Job ID,Customer,Type,Description,Qty,Pickup Date,Amount,Down Payment,Payment Status,Completed";
    const rows = completed.map((j) =>
      [j.id, `"${j.customerName}"`, j.jobType, `"${j.description}"`, j.quantity, j.pickupDate, j.amount, j.downPayment, j.paymentStatus, j.completedAt].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "aj-graphica-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-gray-900 dark:text-gray-100 truncate">Transaction History</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{completed.length} completed job{completed.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-[#FEF2F2] dark:hover:bg-[#2a2a2a] hover:text-[#C53030] dark:hover:text-[#f87171] text-sm py-2.5 px-4 sm:px-5 rounded-xl transition-colors shrink-0 font-medium card-shadow">
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div className="relative flex-1 min-w-[140px] sm:min-w-[180px] max-w-xs">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer or ID..."
              className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg pl-7 pr-2 py-1.5 text-[11px] sm:text-xs md:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
          <div className="relative">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 pr-5 sm:pr-6 focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20">
              <option value="All">All Types</option>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg px-1.5 sm:px-2 py-1.5 text-[11px] sm:text-xs md:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-300 max-w-[130px] sm:max-w-[150px]" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg px-1.5 sm:px-2 py-1.5 text-[11px] sm:text-xs md:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-300 max-w-[130px] sm:max-w-[150px]" />
          {(filterType !== "All" || dateFrom || dateTo || searchQuery) && (
            <button onClick={() => { setFilterType("All"); setDateFrom(""); setDateTo(""); setSearchQuery(""); }}
              className="text-sm text-[#C53030] hover:underline whitespace-nowrap font-medium">Clear</button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 card-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C53030] rounded-l-xl" />
            <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mb-0.5 sm:mb-1 leading-tight">Jobs Completed</div>
            <div className="text-sm sm:text-lg md:text-xl font-bold text-[#C53030] dark:text-[#f87171]">{completed.length}</div>
          </div>
        </div>

        {/* Mobile: Cards */}
        <div className="sm:hidden flex flex-col gap-2">
          {completed.length === 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl py-12 text-center text-sm text-gray-400 dark:text-gray-500 card-shadow">No transactions yet.</div>
          )}
          {completed.map((j) => (
            <div key={j.id} className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2.5 card-shadow">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{j.customerName}</div>
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{j.id} Â· {j.jobType}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${PAYMENT_COLORS[j.paymentStatus]}`}>{j.paymentStatus}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-1.5">{j.description}</p>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-gray-500 dark:text-gray-400 truncate">Pickup: {formatDate(j.pickupDate)}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 shrink-0">{formatPeso(j.amount)}</span>
              </div>
              <div className="flex gap-1.5">
                {onViewJobbing && (
                  <button onClick={() => onViewJobbing(j.id)}
                    className="flex-1 text-sm py-3 rounded-lg border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#2a2a2a] flex items-center justify-center gap-1.5 transition-colors font-medium">
                    <Eye size={15} /> View
                  </button>
                )}
                {onReopenJob && (
                  <button onClick={() => setReopenId(j.id)}
                    className="flex-1 text-sm py-3 rounded-lg border border-[#FECACA] dark:border-[#5a1a1a] text-[#991B1B] dark:text-[#f87171] hover:bg-[#FEF2F2] dark:hover:bg-[#2a0a0a] flex items-center justify-center gap-1.5 transition-colors font-medium">
                    <RotateCcw size={15} /> Reopen
                  </button>
                )}
                {onDeleteJobbing && (
                  <button onClick={() => setDeleteId(j.id)}
                    className="flex-1 text-sm py-3 rounded-lg border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] text-gray-500 dark:text-gray-400 hover:bg-[#FEF2F2] dark:hover:bg-[#3a1010] hover:text-[#991B1B] dark:hover:text-[#f87171] flex items-center justify-center gap-1.5 transition-colors font-medium">
                    <Trash2 size={15} /> Delete
                  </button>
                )}
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
                  {["Job ID", "Customer", "Type", "Description", "Pickup Date", "Amount", "Payment", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completed.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No transactions yet.</td></tr>
                )}
                {completed.map((j, idx) => (
                  <tr key={j.id} className={`border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0 transition-colors ${
                    idx % 2 === 0
                      ? "bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                      : "bg-gray-50/50 dark:bg-[#1a1a1a]/50 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                  }`}>
                    <td className="px-2 sm:px-3 md:px-4 py-3 text-[11px] sm:text-xs font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap">{j.id}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap text-xs sm:text-sm">{j.customerName}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs sm:text-sm">{j.jobType}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-3 max-w-[120px] sm:max-w-[200px]"><span className="block truncate text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{j.description}</span></td>
                    <td className="px-2 sm:px-3 md:px-4 py-3 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(j.pickupDate)}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium text-xs sm:text-sm">{formatPeso(j.amount)}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-3">
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${PAYMENT_COLORS[j.paymentStatus]}`}>{j.paymentStatus}</span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-3">
                      <div className="flex items-center gap-1">
                        {onViewJobbing && (
                          <button onClick={() => onViewJobbing(j.id)} title="View Details"
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#3a1010] text-gray-400 dark:text-gray-500 hover:text-[#C53030] dark:hover:text-[#f87171] transition-colors">
                            <Eye size={17} />
                          </button>
                        )}
                        {onReopenJob && (
                          <button onClick={() => setReopenId(j.id)} title="Reopen Job"
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#2a0a0a] text-gray-400 dark:text-gray-500 hover:text-[#991B1B] dark:hover:text-[#f87171] transition-colors">
                            <RotateCcw size={17} />
                          </button>
                        )}
                        {onDeleteJobbing && (
                          <button onClick={() => setDeleteId(j.id)} title="Delete Job"
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#3a1010] text-gray-400 dark:text-gray-500 hover:text-[#991B1B] dark:hover:text-[#f87171] transition-colors">
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reopen Confirmation Dialog */}
      {reopenId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReopenId(null)} />
          <div className="relative bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 sm:p-5 max-w-xs w-full shadow-xl card-shadow">
            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Reopen this job?</div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">This will move the jobbing back to active jobbings with "For Pickup" stage.</p>
            <div className="flex gap-2">
              <button onClick={() => setReopenId(null)}
                className="flex-1 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-base py-3 rounded-lg transition-colors font-medium">
                Cancel
              </button>
              <button onClick={() => { onReopenJob?.(reopenId); setReopenId(null); }}
                className="flex-1 bg-[#991B1B] hover:bg-[#991B1B] text-white text-base py-3 rounded-lg transition-colors font-medium">
                Reopen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 sm:p-5 max-w-xs w-full shadow-xl card-shadow">
            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete this job?</div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">This will permanently remove this jobbing and its finance record. This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-base py-3 rounded-lg transition-colors font-medium">
                Cancel
              </button>
              <button onClick={() => { onDeleteJobbing?.(deleteId); setDeleteId(null); }}
                className="flex-1 bg-[#991B1B] hover:bg-[#991B1B] text-white text-base py-3 rounded-lg transition-colors font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
