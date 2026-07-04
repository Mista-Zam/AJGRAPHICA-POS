import { useState } from "react";
import { Eye, CheckCircle, AlertCircle, ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
import type { Jobbing, JobType, JobStatus, JobStage } from "../data/mock-data";
import { formatPeso, formatDate, getPickupColor, STATUS_COLORS } from "../data/utils";

interface JobbingsPageProps {
  jobbings: Jobbing[];
  onViewJobbing: (id: string) => void;
  onMarkDone: (id: string) => void;
  onNewJobbing: () => void;
  onEditJobbing?: (id: string) => void;
  isSuperadmin?: boolean;
  onBulkStageUpdate?: (ids: string[], stage: JobStage) => void;
  onDeleteJobbing?: (id: string) => void;
}

const JOB_TYPES: JobType[] = ["T-Shirt", "Polo Shirt", "Tarpaulin", "Uniform", "Alteration", "Jacket", "Other"];
const STATUSES: JobStatus[] = ["Urgent", "In Progress", "For Pickup", "Normal"];
const BULK_STAGES: JobStage[] = ["Received", "In Progress", "For Pickup"];

export function JobbingsPage({ jobbings, onViewJobbing, onMarkDone, onNewJobbing, onEditJobbing, isSuperadmin, onBulkStageUpdate, onDeleteJobbing }: JobbingsPageProps) {
  const [filterType, setFilterType] = useState<JobType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<JobStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDoneId, setConfirmDoneId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<JobStage>("In Progress");

  const filtered = jobbings.filter((j) => {
    if (j.status === "Done") return false;
    if (filterType !== "All" && j.jobType !== filterType) return false;
    if (filterStatus !== "All") {
      if (filterStatus === "Urgent" && !j.isUrgent) return false;
      if (filterStatus !== "Urgent" && j.status !== filterStatus) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!j.customerName.toLowerCase().includes(q) && !j.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statusKey = (j: Jobbing) => {
    if (j.status === "For Pickup" || j.status === "Done") return j.status;
    if (j.isUrgent) return "Urgent";
    return j.status;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((j) => j.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleApplyBulk = () => {
    if (selectedIds.size > 0 && onBulkStageUpdate) {
      onBulkStageUpdate([...selectedIds], bulkStage);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-gray-900 dark:text-gray-100 truncate">Jobbings</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} job{filtered.length !== 1 ? "s" : ""} shown</p>
          </div>
          <button
            onClick={onNewJobbing}
            className="hidden sm:flex bg-[#778873] hover:bg-[#DC2626] text-white text-base py-3 px-5 sm:px-6 rounded-xl items-center gap-2 transition-colors shrink-0 shadow-sm"
          >
            <Plus size={18} /> New Jobbing
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[140px] sm:min-w-[180px] max-w-xs">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer or ID..."
              className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg pl-7 pr-2 py-1.5 text-[9px] sm:text-xs md:text-sm focus:outline-none focus:border-[#778873] focus:ring-2 focus:ring-[#778873]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as JobType | "All")}
              className="appearance-none bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg px-2 sm:px-3 py-1.5 text-[9px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 pr-5 sm:pr-6 focus:outline-none focus:border-[#778873] focus:ring-2 focus:ring-[#778873]/20 cursor-pointer"
            >
              <option value="All">All Types</option>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as JobStatus | "All")}
              className="appearance-none bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg px-2 sm:px-3 py-1.5 text-[9px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 pr-5 sm:pr-6 focus:outline-none focus:border-[#778873] focus:ring-2 focus:ring-[#778873]/20 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {(filterType !== "All" || filterStatus !== "All" || searchQuery) && (
            <button onClick={() => { setFilterType("All"); setFilterStatus("All"); setSearchQuery(""); }} className="text-sm text-[#778873] hover:underline whitespace-nowrap font-medium">Clear</button>
          )}
        </div>

        {/* Bulk action bar */}
        {isSuperadmin && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 p-2.5 sm:p-3 bg-[#1a1a1a] dark:bg-[#2a2a2a] border border-[rgba(255,255,255,0.12)] rounded-xl card-shadow">
            <button onClick={clearSelection} className="text-gray-400 hover:text-white transition-colors p-1">
              <X size={16} />
            </button>
            <span className="text-xs sm:text-sm text-white font-medium">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-[rgba(255,255,255,0.15)]" />
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value as JobStage)}
              className="appearance-none bg-white/10 border border-[rgba(255,255,255,0.2)] rounded-lg px-2 py-1.5 text-xs text-white pr-5 focus:outline-none focus:ring-2 focus:ring-[#778873]/20 cursor-pointer"
            >
              {BULK_STAGES.map((s) => <option key={s} value={s} style={{ color: "#111", background: "#fff" }}>{s}</option>)}
            </select>
            <button
              onClick={handleApplyBulk}
              className="bg-[#DC2626] hover:bg-[#DC2626] text-white text-xs sm:text-sm py-1.5 px-3 sm:px-4 rounded-lg transition-colors font-medium shrink-0"
            >
              Apply
            </button>
          </div>
        )}

        {/* Mobile: Cards */}
        <div className="sm:hidden flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl py-12 text-center text-sm text-gray-400 dark:text-gray-500 card-shadow">No jobbings found.</div>
          )}
          {filtered.map((j) => {
            const balance = j.amount - j.downPayment;
            const sk = statusKey(j);
            return (
              <div
                key={j.id}
                className={`border rounded-xl card-shadow overflow-hidden ${j.isUrgent && j.status !== "Done" ? "border-[#FECACA] dark:border-[#9a6060] bg-[#FEE2E2] dark:bg-[#5a2020]" : j.isPurchaseOrder ? "bg-[#EDE0CC] dark:bg-[#8a7a5a] border-[#DCCFC0] dark:border-[#8a8a6a]" : "bg-white dark:bg-[#1a1a1a] border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]"}`}
              >
                {/* Card header */}
                <div className="px-3 pt-2.5 pb-1.5 flex items-start justify-between gap-2">
                  {isSuperadmin && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(j.id)}
                      onChange={() => toggleSelect(j.id)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#778873] focus:ring-[#778873] shrink-0 cursor-pointer"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {j.isUrgent && j.status !== "Done" && <AlertCircle size={15} className="text-[#DC2626] shrink-0" />}
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{j.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-300 flex-wrap">
                      <span className="font-mono">{j.id}</span>
                      <span>·</span>
                      <span>{j.jobType}</span>
                      {j.fabric && <><span>·</span><span>{j.fabric}</span></>}
                      <span>·</span>
                      <span>Qty {j.quantity}</span>
                    </div>
                  </div>
                   <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[sk]}`}>{sk}</span>
                 </div>

                {/* Description */}
                <div className="px-3 pb-1.5">
                  <p className="text-[9px] text-gray-600 dark:text-gray-300 line-clamp-2">{j.description}</p>
                </div>

                {/* Footer row */}
                <div className={`px-3 py-2 flex items-center justify-between border-t ${j.isUrgent && j.status !== "Done" ? "border-[#FECACA]/40 dark:border-[#9a6060]/40" : j.isPurchaseOrder ? "border-[#DCCFC0]/40 dark:border-[#8a8a6a]/40" : "border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]"}`}>
                  <div className="min-w-0">
                    <div className={`text-[9px] font-semibold ${getPickupColor(j.pickupDate)}`}>{formatDate(j.pickupDate)}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400">Pickup date</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatPeso(j.amount)}</div>
                    <div className={`text-[9px] font-medium ${balance > 0 ? "text-[#DC2626]" : "text-[#0F6E56]"}`}>
                      {balance > 0 ? `Bal: ${formatPeso(balance)}` : "Fully Paid"}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={`px-2 py-1.5 flex gap-1 border-t ${j.isUrgent && j.status !== "Done" ? "border-[#FECACA]/40 dark:border-[#9a6060]/40" : j.isPurchaseOrder ? "border-[#DCCFC0]/40 dark:border-[#8a8a6a]/40" : "border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]"}`}>
                  <button onClick={() => onViewJobbing(j.id)} className="flex-1 text-sm py-3 rounded-lg border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2a2a2a] flex items-center justify-center gap-1.5 transition-colors font-medium">
                    <Eye size={15} /> View
                  </button>
                  {j.status !== "Done" && (
                    <button onClick={() => setConfirmDoneId(j.id)} className="flex-1 text-sm py-3 rounded-lg border border-[#A7D9CC] dark:border-[#2a6a5a] text-[#0F6E56] dark:text-[#5abb9e] hover:bg-[#E8F5F1] dark:hover:bg-[#0a3a2e] flex items-center justify-center gap-1.5 transition-colors font-medium">
                      <CheckCircle size={15} /> Done
                    </button>
                  )}
                  {isSuperadmin && (
                    <button onClick={() => setDeleteId(j.id)} className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-[#FEE2E2] dark:hover:bg-[#5a2020] hover:text-[#DC2626] dark:hover:text-[#A1BC98] transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Table */}
        <div className="hidden sm:block bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl card-shadow overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] bg-gray-50 dark:bg-[#2a2a2a] sticky top-0 z-10">
                  {isSuperadmin && (
                    <th className="px-2 sm:px-3 md:px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#778873] focus:ring-[#778873] cursor-pointer"
                      />
                    </th>
                  )}
                  {["Job ID", "Customer", "Type", "Fabric", "Description", "Status", "Pickup Date", "Amount / Balance", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={isSuperadmin ? 10 : 9} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No jobbings found.</td></tr>
                )}
                {filtered.map((j, idx) => {
                  const balance = j.amount - j.downPayment;
                  const sk = statusKey(j);
                  return (
                    <tr
                      key={j.id}
                      className={`border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0 transition-colors ${
                        j.isUrgent && j.status !== "Done"
                          ? "bg-[#FEE2E2] dark:bg-[#5a2020] hover:bg-[#fde8e8] dark:hover:bg-[#7a3030]"
                          : j.isPurchaseOrder
                          ? "bg-[#EDE0CC] dark:bg-[#8a7a5a] hover:bg-[#E5D5BD] dark:hover:bg-[#9a8a6a]"
                          : idx % 2 === 0
                          ? "bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                          : "bg-gray-50/50 dark:bg-[#1a1a1a]/50 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                      }`}
                    >
                      {isSuperadmin && (
                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(j.id)}
                            onChange={() => toggleSelect(j.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#778873] focus:ring-[#778873] cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-2 sm:px-3 md:px-4 py-3">
                        <span className="text-[9px] sm:text-xs font-mono text-gray-600 dark:text-gray-300">{j.id}</span>
                        {j.isUrgent && j.status !== "Done" && <AlertCircle size={15} className="inline ml-1 text-[#DC2626] dark:text-[#e87070]" />}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap max-w-[100px] sm:max-w-[140px]">
                        <span className="block truncate text-sm">{j.customerName}</span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs sm:text-sm">{j.jobType}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-3 text-[9px] sm:text-xs text-gray-600 dark:text-gray-300">{j.fabric ?? "—"}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-3 max-w-[100px] sm:max-w-[160px]">
                        <span className="block truncate text-[9px] sm:text-xs text-gray-600 dark:text-gray-300">{j.description}</span>
                        <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">Qty: {j.quantity}</span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3">
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[sk]}`}>{sk}</span>
                      </td>
                      <td className={`px-2 sm:px-3 md:px-4 py-3 text-[10px] sm:text-xs whitespace-nowrap ${getPickupColor(j.pickupDate)}`}>
                        {formatDate(j.pickupDate)}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-800 dark:text-gray-200 font-medium text-xs sm:text-sm">{formatPeso(j.amount)}</div>
                        <div className={`text-[10px] sm:text-xs font-medium ${balance > 0 ? "text-[#DC2626] dark:text-[#e87070]" : "text-[#0F6E56] dark:text-[#5abb9e]"}`}>
                          {balance > 0 ? `Bal: ${formatPeso(balance)}` : "Paid"}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-3">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <button onClick={() => onViewJobbing(j.id)} title="View"
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#5a2020] text-gray-500 dark:text-gray-400 hover:text-[#778873] dark:hover:text-[#A1BC98] transition-colors">
                            <Eye size={17} />
                          </button>
                          {j.status !== "Done" && (
                            <button onClick={() => setConfirmDoneId(j.id)} title="Mark Done"
                              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#E8F5F1] dark:hover:bg-[#0a3a2e] text-gray-500 dark:text-gray-400 hover:text-[#0F6E56] dark:hover:text-[#5abb9e] transition-colors">
                              <CheckCircle size={17} />
                            </button>
                          )}
                          {isSuperadmin && (
                            <button onClick={() => setDeleteId(j.id)} title="Delete"
                              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#5a2020] text-gray-500 dark:text-gray-400 hover:text-[#DC2626] dark:hover:text-[#A1BC98] transition-colors">
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Confirm Done Dialog */}
      {confirmDoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDoneId(null)} />
          <div className="relative bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl p-4 sm:p-5 max-w-xs w-full shadow-xl card-shadow">
            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Mark as Done?</div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">This will move the jobbing to the transaction history and record it in finances.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDoneId(null)}
                className="flex-1 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-base py-3 rounded-lg transition-colors font-medium">
                Cancel
              </button>
              <button onClick={() => { onMarkDone(confirmDoneId); setConfirmDoneId(null); }}
                className="flex-1 bg-[#0F6E56] hover:bg-[#047857] text-white text-base py-3 rounded-lg transition-colors font-medium">
                Confirm
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
                className="flex-1 bg-[#DC2626] hover:bg-[#DC2626] text-white text-base py-3 rounded-lg transition-colors font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




