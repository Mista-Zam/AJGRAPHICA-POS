import { useState, useMemo } from "react";
import { Search, CreditCard, Wallet, AlertTriangle, Calendar, ChevronLeft, ChevronRight, CheckCircle2, Trash2, Eye } from "lucide-react";
import type { Jobbing } from "../data/mock-data";

interface PurchaseOrdersPageProps {
  jobbings: Jobbing[];
  onViewJobbing: (id: string) => void;
  onReceivePayment: (id: string) => void;
  onDeleteJobbing?: (id: string) => void;
}

const PAGE_SIZE = 10;
const today = new Date().toISOString().split("T")[0];

export function PurchaseOrdersPage({ jobbings, onViewJobbing, onReceivePayment, onDeleteJobbing }: PurchaseOrdersPageProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(0);

  const poJobbings = useMemo(() => {
    return jobbings
      .filter((j) => j.isPurchaseOrder)
      .filter((j) => j.poStatus === "pending_payment" || j.poStatus === "partially_paid");
  }, [jobbings]);

  const filtered = useMemo(() => {
    let list = poJobbings;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.id.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.jobType.toLowerCase().includes(q)
      );
    }
    if (filterStatus === "overdue") {
      list = list.filter((j) => (j.dueDate || j.pickupDate) < today);
    } else if (filterStatus === "due_today") {
      list = list.filter((j) => (j.dueDate || j.pickupDate) === today);
    } else if (filterStatus === "partial") {
      list = list.filter((j) => j.poStatus === "partially_paid");
    } else if (filterStatus === "pending") {
      list = list.filter((j) => j.poStatus === "pending_payment");
    }
    return list;
  }, [poJobbings, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const outstandingBalance = useMemo(
    () => poJobbings.reduce((s, j) => s + (j.amount - j.downPayment), 0),
    [poJobbings]
  );
  const overdueCount = useMemo(
    () => poJobbings.filter((j) => (j.dueDate || j.pickupDate) < today).length,
    [poJobbings]
  );

  const paidSoFar = (j: Jobbing) => {
    if (j.poStatus === "paid") return j.amount;
    const payments = j.amount - (j.amount - j.downPayment);
    return j.downPayment;
  };

  const remainingBalance = (j: Jobbing) => Math.max(0, j.amount - paidSoFar(j));
  const isOverdue = (j: Jobbing) => (j.dueDate || j.pickupDate) < today;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Purchase Orders</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pay-later jobs requiring payment collection</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-1">
            <Wallet size={16} />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Outstanding</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            ₱{outstandingBalance.toLocaleString("en-PH")}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-1">
            <CreditCard size={16} />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Open POs</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{poJobbings.length}</div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-1">
            <AlertTriangle size={16} />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Overdue</span>
          </div>
          <div className={`text-lg sm:text-2xl font-bold ${overdueCount > 0 ? "text-[#991B1B]" : "text-gray-900 dark:text-gray-100"}`}>
            {overdueCount}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-1">
            <Calendar size={16} />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Due Today</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {poJobbings.filter((j) => (j.dueDate || j.pickupDate) === today).length}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by PO#, customer, or job type..."
            className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl bg-white dark:bg-[#1a1a1a] dark:text-gray-200 focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 transition-all duration-200"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="w-full sm:w-auto border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#1a1a1a] dark:text-gray-200 focus:outline-none focus:border-[#C53030] transition-all duration-200"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending Payment</option>
          <option value="partial">Partially Paid</option>
          <option value="overdue">Overdue</option>
          <option value="due_today">Due Today</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] bg-gray-50 dark:bg-[#222]">
                <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">PO#</th>
                <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider hidden sm:table-cell">Job Type</th>
                <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Amount</th>
                <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider hidden sm:table-cell">Balance</th>
                <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider hidden sm:table-cell">Due</th>
                <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((j) => {
                const overdue = isOverdue(j);
                const balance = remainingBalance(j);
                const isPartial = j.poStatus === "partially_paid";
                return (
                  <tr
                    key={j.id}
                    className="border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors cursor-pointer"
                    onClick={() => onViewJobbing(j.id)}
                  >
                    <td className="px-3 sm:px-4 py-3 font-mono text-[11px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
                      {j.id}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="text-gray-900 dark:text-gray-100 font-medium text-xs sm:text-sm">{j.customerName}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell text-xs">{j.jobType}</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                      ₱{j.amount.toLocaleString("en-PH")}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right hidden sm:table-cell">
                      <span className={`font-semibold text-xs sm:text-sm ${balance > 0 ? "text-[#991B1B]" : "text-[#0F6E56]"}`}>
                        ₱{balance.toLocaleString("en-PH")}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-[10px] sm:text-xs font-medium ${overdue ? "text-[#991B1B]" : "text-gray-500 dark:text-gray-400"}`}>
                        {j.dueDate || j.pickupDate}
                        {overdue && <span className="ml-1">(Overdue)</span>}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                        isPartial
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          : overdue
                          ? "bg-red-50 dark:bg-red-900/20 text-[#991B1B] dark:text-red-400"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        {isPartial ? "Partial" : overdue ? "Overdue" : "Pending"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewJobbing(j.id); }}
                          className="inline-flex items-center gap-1 px-2 py-1.5 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-[10px] sm:text-xs font-medium rounded-lg transition-all duration-200"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onReceivePayment(j.id); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#C53030] hover:bg-[#991B1B] text-white text-[10px] sm:text-xs font-medium rounded-lg transition-all duration-200 active:scale-[0.97]"
                        >
                          <CheckCircle2 size={14} />
                          Pay
                        </button>
                        {onDeleteJobbing && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${j.id}?`)) onDeleteJobbing(j.id); }}
                            className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-[#991B1B] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                    No purchase orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {safePage * PAGE_SIZE + 1}-{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] disabled:opacity-30 text-gray-600 dark:text-gray-400 transition-all duration-200"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] disabled:opacity-30 text-gray-600 dark:text-gray-400 transition-all duration-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
