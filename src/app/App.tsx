import { useState, useEffect } from "react";
import { LoginPage } from "./components/login-page";
import { Sidebar } from "./components/sidebar";
import { Dashboard } from "./components/dashboard";
import { JobbingsPage } from "./components/jobbings-page";
import { NewJobbingModal } from "./components/new-jobbing-modal";
import { EditJobbingModal } from "./components/edit-jobbing-modal";
import { JobDetail } from "./components/job-detail";
import { ReceiptDialog } from "./components/receipt-dialog";
import { TransactionHistory } from "./components/transaction-history";
import { SettingsPage } from "./components/settings-page";
import { FinancesPage } from "./components/finances-page";
import { UserManagementPage } from "./components/user-management-page";
import { PurchaseOrdersPage } from "./components/purchase-orders-page";
import { ReceivePaymentModal } from "./components/receive-payment-modal";
import { type Jobbing, type JobStage, type JobStatus } from "./data/mock-data";
import { getAllJobbings, addJobbing, updateJobbing, saveFinanceRecord, getAllFinances, getSettings, deleteJobbing, deleteFinanceRecord, type FinanceRecord, type ShopSettings } from "@/lib/supabase-service";
import { restoreSession, logout as authLogout } from "@/lib/auth";

/* MARKER-MAKE-KIT-INVOKED */

type Page = "dashboard" | "jobbings" | "history" | "settings" | "finances" | "users" | "purchases";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [loggedIn, setLoggedIn] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [page, setPage] = useState<Page>("dashboard");
  const [jobbings, setJobbings] = useState<Jobbing[]>([]);
  const [showNewJobbing, setShowNewJobbing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editJobbingId, setEditJobbingId] = useState<string | null>(null);
  const [receiptJobbingId, setReceiptJobbingId] = useState<string | null>(null);
  const [receivePaymentJobId, setReceivePaymentJobId] = useState<string | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    restoreSession().then((result) => {
      if (result) {
        setRole((result.profile.role as "admin" | "superadmin") ?? "admin");
        setLoggedIn(true);
      }
    }).finally(() => setSessionLoaded(true));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    Promise.all([getAllJobbings(), getAllFinances(), getSettings()]).then(([jobs, fin, settings]) => {
      setJobbings(jobs);
      setFinances(fin);
      setShopSettings(settings);
      setDbReady(true);
    }).catch((err) => console.error("Failed to load data:", err));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const selectedJob = jobbings.find((j) => j.id === selectedJobId) ?? null;
  const editJobbing = jobbings.find((j) => j.id === editJobbingId) ?? null;
  const receiptJobbing = jobbings.find((j) => j.id === receiptJobbingId) ?? null;
  const receivePaymentJobbing = jobbings.find((j) => j.id === receivePaymentJobId) ?? null;

  const handleNewJobbing = (data: Omit<Jobbing, "id" | "createdAt" | "stage" | "paymentStatus" | "notes" | "poStatus" | "paymentCompletedAt">) => {
    const count = jobbings.length + 1;
    const id = `JB-${String(count).padStart(3, "0")}`;
    const newJob: Jobbing = {
      ...data,
      id,
      createdAt: new Date().toISOString().split("T")[0],
      stage: "Received" as JobStage,
      paymentStatus: data.downPayment >= data.amount ? "Paid" : data.downPayment > 0 ? "Partial" : "Unpaid",
      poStatus: data.isPurchaseOrder ? "pending_payment" : "none",
      paymentCompletedAt: undefined,
      notes: "",
    };
    addJobbing(newJob).then(() => {
      setJobbings((prev) => [newJob, ...prev]);
      setPage("jobbings");
      setShowNewJobbing(false);
      setToast("Jobbing Saved!");
    }).catch((err) => console.error("Failed to add jobbing:", err));
  };

  const handleMarkDone = async (id: string) => {
    const now = new Date().toISOString().split("T")[0];
    const job = jobbings.find((j) => j.id === id);
    if (!job) return;
    const updated = { ...job, status: "Done" as const, stage: "Completed" as const };
    setJobbings((prev) => prev.map((j) => j.id === id ? updated : j));
    try {
      await updateJobbing(updated);
      if (!job.isPurchaseOrder) {
        const record: FinanceRecord = {
          id: job.id,
          customerName: job.customerName,
          jobType: job.jobType,
          description: job.description,
          quantity: job.quantity,
          amount: job.amount,
          downPayment: job.downPayment,
          paymentStatus: job.paymentStatus,
          pickupDate: job.pickupDate,
          completedAt: now,
          createdAt: job.createdAt,
        };
        await saveFinanceRecord(record);
        setFinances((prev) => {
          const idx = prev.findIndex((f) => f.id === record.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = record;
            return copy;
          }
          return [record, ...prev];
        });
      }
    } catch (err) {
      console.error("Failed to mark job as done:", err);
      setJobbings((prev) => prev.map((j) => j.id === id ? job : j));
    }
  };

  const handleUpdateJobbing = (updated: Jobbing) => {
    updateJobbing(updated).then(() => {
      setJobbings((prev) => prev.map((j) => j.id === updated.id ? updated : j));
    }).catch((err) => console.error("Failed to update jobbing:", err));
    if (updated.status === "Done" && !updated.isPurchaseOrder) {
      const record: FinanceRecord = {
        id: updated.id,
        customerName: updated.customerName,
        jobType: updated.jobType,
        description: updated.description,
        quantity: updated.quantity,
        amount: updated.amount,
        downPayment: updated.downPayment,
        paymentStatus: updated.paymentStatus,
        pickupDate: updated.pickupDate,
        completedAt: new Date().toISOString().split("T")[0],
        createdAt: updated.createdAt,
      };
      saveFinanceRecord(record).then(() => {
        setFinances((prev) => {
          const idx = prev.findIndex((f) => f.id === record.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = record;
            return copy;
          }
          return [record, ...prev];
        });
      }).catch((err) => console.error("Failed to save finance record:", err));
    }
  };

  const handleReopenJob = async (id: string) => {
    try {
      const job = jobbings.find((j) => j.id === id);
      if (!job) {
        console.error("Job not found in state:", id);
        return;
      }
      const wasPaidPO = job.isPurchaseOrder && job.poStatus === "paid";
      const updated: Jobbing = {
        ...job,
        status: "Normal",
        stage: "For Pickup",
        isPurchaseOrder: wasPaidPO ? false : job.isPurchaseOrder,
        poStatus: wasPaidPO ? "none" : job.isPurchaseOrder ? "pending_payment" : "none",
        paymentStatus: "Unpaid",
        downPayment: 0,
        paymentCompletedAt: undefined,
      };
      await Promise.all([updateJobbing(updated), deleteFinanceRecord(id)]);
      setJobbings((prev) => prev.map((j) => j.id === id ? updated : j));
      setFinances((prev) => prev.filter((f) => f.id !== id));
      setSelectedJobId(null);
      setToast("Job reopened!");
    } catch (err) {
      console.error("Failed to reopen job:", err);
    }
  };

  const handleDeleteJobbing = (id: string) => {
    deleteJobbing(id).then(() => {
      setJobbings((prev) => prev.filter((j) => j.id !== id));
      setFinances((prev) => prev.filter((f) => f.id !== id));
      setToast("Job deleted!");
    }).catch((err) => console.error("Failed to delete job:", err));
  };

  const handleEditJobbing = (updated: Jobbing) => {
    updateJobbing(updated).then(() => {
      setJobbings((prev) => prev.map((j) => j.id === updated.id ? updated : j));
      setEditJobbingId(null);
      setToast("Jobbing Updated!");
    }).catch((err) => console.error("Failed to update jobbing:", err));
  };

  const handleBulkStageUpdate = (ids: string[], stage: JobStage) => {
    const statusMap: Record<JobStage, JobStatus> = {
      Received: "Normal",
      "In Progress": "In Progress",
      "For Pickup": "For Pickup",
      Completed: "Done",
    };
    const newStatus = statusMap[stage];
    const updates = jobbings.filter((j) => ids.includes(j.id)).map((j) => ({ ...j, stage, status: newStatus }));
    Promise.all(updates.map((j) => updateJobbing(j))).then(() => {
      setJobbings((prev) => prev.map((j) => ids.includes(j.id) ? { ...j, stage, status: newStatus } : j));
      setToast(`${ids.length} job${ids.length > 1 ? "s" : ""} updated to ${stage}!`);
    }).catch((err) => console.error("Failed to bulk update:", err));
  };

  if (!dbReady || !sessionLoaded) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm font-medium">Loading...</div>
      </div>
    );
  }

  const handleViewJobbing = (id: string) => {
    setSelectedJobId(id);
    setPage("jobbings");
  };

  const handleViewHistoryJobbing = (id: string) => {
    setSelectedJobId(id);
  };

  const handleNavigate = (p: Page) => {
    setPage(p);
    setSelectedJobId(null);
    setSidebarOpen(false);
  };

  if (!loggedIn) {
    return <LoginPage onLogin={(r) => { setRole(r); setLoggedIn(true); }} />;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar
          role={role}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
          activePage={selectedJob && page === "jobbings" ? "jobbings" : page}
          onNavigate={handleNavigate}
          jobbings={jobbings}
          onNewJobbing={() => { setShowNewJobbing(true); setSidebarOpen(false); }}
          onViewJobbing={handleViewJobbing}
          onLogout={() => { authLogout().catch(console.error); setLoggedIn(false); }}
          shopName={shopSettings?.shopName || "Shop"}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-2 py-2 bg-white dark:bg-[#1a1a1a] border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center">
            <div className="w-5 h-5 rounded bg-[#778873] flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            </div>
            <span className="text-xs font-semibold text-[#778873] tracking-wide uppercase truncate">{shopSettings?.shopName || "Shop"}</span>
          </div>
          <button
            onClick={() => setShowNewJobbing(true)}
            className="text-sm bg-[#778873] hover:bg-[#5A6B56] text-white px-3 py-1.5 rounded-lg shrink-0 font-medium shadow-sm"
          >
            + New
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden flex">
          {page === "dashboard" && (
            <Dashboard jobbings={jobbings} finances={finances} onViewJobbing={handleViewJobbing} />
          )}
          {page === "jobbings" && !selectedJob && (
            <JobbingsPage
              jobbings={jobbings}
              onViewJobbing={handleViewJobbing}
              onMarkDone={handleMarkDone}
              onNewJobbing={() => setShowNewJobbing(true)}
              onEditJobbing={(id) => setEditJobbingId(id)}
              isSuperadmin={role === "superadmin"}
              onBulkStageUpdate={handleBulkStageUpdate}
              onDeleteJobbing={role === "superadmin" ? handleDeleteJobbing : undefined}
            />
          )}
          {page === "jobbings" && selectedJob && (
            <JobDetail
              jobbing={selectedJob}
              onBack={() => setSelectedJobId(null)}
              onUpdate={handleUpdateJobbing}
              onSaved={() => { setSelectedJobId(null); setToast("Changes Saved!"); }}
              onEdit={() => setEditJobbingId(selectedJob.id)}
              onPrintReceipt={() => setReceiptJobbingId(selectedJob.id)}
            />
          )}
          {page === "history" && !selectedJob && (
            <TransactionHistory finances={finances} onViewJobbing={handleViewHistoryJobbing} onReopenJob={role === "superadmin" ? handleReopenJob : undefined} onDeleteJobbing={role === "superadmin" ? handleDeleteJobbing : undefined} />
          )}
          {page === "history" && selectedJob && (
            <JobDetail
              jobbing={selectedJob}
              onBack={() => setSelectedJobId(null)}
              onUpdate={handleUpdateJobbing}
              onSaved={() => { setSelectedJobId(null); setToast("Changes Saved!"); }}
              backLabel="Back to History"
              onPrintReceipt={() => setReceiptJobbingId(selectedJob.id)}
            />
          )}
          {page === "finances" && !selectedJob && role === "superadmin" && <FinancesPage finances={finances} jobbings={jobbings} onViewJobbing={handleViewHistoryJobbing} />}
          {page === "finances" && selectedJob && (
            <JobDetail
              jobbing={selectedJob}
              onBack={() => setSelectedJobId(null)}
              onUpdate={handleUpdateJobbing}
              onSaved={() => { setSelectedJobId(null); setToast("Changes Saved!"); }}
              backLabel="Back to Finances"
              onPrintReceipt={() => setReceiptJobbingId(selectedJob.id)}
            />
          )}
          {page === "settings" && <SettingsPage role={role} />}
          {page === "users" && role === "superadmin" && <UserManagementPage />}
          {page === "purchases" && !selectedJob && (
            <PurchaseOrdersPage
              jobbings={jobbings}
              onViewJobbing={handleViewJobbing}
              onReceivePayment={(id) => setReceivePaymentJobId(id)}
              onDeleteJobbing={role === "superadmin" ? handleDeleteJobbing : undefined}
            />
          )}
          {page === "purchases" && selectedJob && (
            <JobDetail
              jobbing={selectedJob}
              onBack={() => setSelectedJobId(null)}
              onUpdate={handleUpdateJobbing}
              onSaved={() => { setSelectedJobId(null); setToast("Changes Saved!"); }}
              backLabel="Back to Purchase Orders"
              onPrintReceipt={() => setReceiptJobbingId(selectedJob.id)}
            />
          )}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="lg:hidden shrink-0 flex border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#1a1a1a] safe-area-bottom overflow-x-auto">
          {(
            [
              { id: "dashboard" as Page, label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
              { id: "jobbings" as Page, label: "Jobs", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="11" y2="16"/></svg> },
              { id: "purchases" as Page, label: "POs", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
              ...(role === "superadmin" ? [
                { id: "finances" as Page, label: "Finance", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
                { id: "users" as Page, label: "Users", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              ] : []),
              { id: "history" as Page, label: "History", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 15 15"/></svg> },
              { id: "settings" as Page, label: "Settings", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
            ] as { id: Page; label: string; icon: React.ReactNode }[]
          ).map((item) => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-w-0 ${
                  isActive
                    ? "text-[#778873] dark:text-[#A1BC98]"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {item.icon}
                <span className="truncate max-w-full px-0.5 leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {showNewJobbing && (
        <NewJobbingModal
          onClose={() => setShowNewJobbing(false)}
          onSave={handleNewJobbing}
        />
      )}

      {editJobbing && (
        <EditJobbingModal
          jobbing={editJobbing}
          onClose={() => setEditJobbingId(null)}
          onUpdate={handleEditJobbing}
        />
      )}

      {receivePaymentJobbing && (
        <ReceivePaymentModal
          jobbing={receivePaymentJobbing}
          onClose={() => setReceivePaymentJobId(null)}
          onComplete={(updated) => {
            setJobbings((prev) => prev.map((j) => j.id === updated.id ? updated : j));
            if (updated.poStatus === "paid") {
              const record = {
                id: updated.id,
                customerName: updated.customerName,
                jobType: updated.jobType,
                description: updated.description,
                quantity: updated.quantity,
                amount: updated.amount,
                downPayment: updated.downPayment,
                paymentStatus: "Paid",
                pickupDate: updated.pickupDate,
                completedAt: updated.paymentCompletedAt || new Date().toISOString().split("T")[0],
                createdAt: updated.createdAt,
              };
              setFinances((prev) => {
                const idx = prev.findIndex((f) => f.id === record.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = record;
                  return copy;
                }
                return [record, ...prev];
              });
            }
            setReceivePaymentJobId(null);
            setToast(updated.poStatus === "paid" ? "Payment complete! PO marked as paid." : "Payment recorded!");
          }}
        />
      )}

      {receiptJobbing && shopSettings && (
        <ReceiptDialog
          jobbing={receiptJobbing}
          shopName={shopSettings.shopName}
          shopAddress={shopSettings.address}
          shopContact={shopSettings.contactNumber}
          shopFacebook={shopSettings.facebookPage}
          onClose={() => setReceiptJobbingId(null)}
        />
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#778873] text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}


