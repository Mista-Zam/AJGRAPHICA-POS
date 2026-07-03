import {
  LayoutDashboard,
  ClipboardList,
  History,
  Settings,
  LogOut,
  Plus,
  TrendingUp,
  Moon,
  Sun,
  Calendar,
} from "lucide-react";
import type { Jobbing } from "../data/mock-data";

type Page = "dashboard" | "jobbings" | "history" | "settings" | "finances";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  jobbings: Jobbing[];
  onNewJobbing: () => void;
  onLogout: () => void;
  role: "admin" | "superadmin";
  darkMode: boolean;
  onToggleDarkMode: () => void;
  shopName: string;
}

const baseNavItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "jobbings", label: "Jobbings", icon: <ClipboardList size={20} /> },
  { id: "history", label: "History", icon: <History size={20} /> },
  { id: "finances", label: "Finances", icon: <TrendingUp size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

function getUrgencyColor(daysUntil: number, isUrgent: boolean) {
  if (isUrgent || daysUntil < 0) return { dot: "bg-[#991B1B]", text: "text-[#991B1B]", label: daysUntil < 0 ? "Overdue" : "Urgent" };
  if (daysUntil === 0) return { dot: "bg-[#0F6E56]", text: "text-[#0F6E56]", label: "Today" };
  if (daysUntil <= 2) return { dot: "bg-amber-500", text: "text-amber-600", label: `${daysUntil}d` };
  return { dot: "bg-gray-300", text: "text-gray-500", label: `${daysUntil}d` };
}

export function Sidebar({ activePage, onNavigate, jobbings, onNewJobbing, onLogout, role, darkMode, onToggleDarkMode, shopName }: SidebarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = jobbings
    .filter((j) => j.status !== "Done")
    .map((j) => {
      const pickup = new Date(j.pickupDate);
      pickup.setHours(0, 0, 0, 0);
      const diff = Math.round((pickup.getTime() - today.getTime()) / 86400000);
      return { ...j, daysUntil: diff };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);

  const navItems = role === "superadmin" ? baseNavItems : baseNavItems.filter((n) => n.id !== "finances");

  return (
    <aside className="w-[260px] shrink-0 flex flex-col h-full bg-white dark:bg-[#1a1a1a] border-r border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#C53030] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <img src="/logo.jpg" alt="AJ Graphica" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-[#C53030] tracking-widest uppercase">{shopName}</div>
            <div className="text-[10px] text-gray-400 leading-tight">Print & Tailoring</div>
          </div>
        </div>
        {role === "superadmin" && (
          <div className="mt-2 text-[10px] font-semibold text-[#C53030] dark:text-[#f87171] tracking-wider uppercase">Superadmin</div>
        )}
      </div>

      {/* New Jobbing */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={onNewJobbing}
          className="w-full bg-gradient-to-r from-[#C53030] to-[#f87171] hover:from-[#991B1B] hover:to-[#C53030] text-white text-base py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-[1.02]"
        >
          <Plus size={18} />
          New Jobbing
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2 pt-2 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm w-full text-left transition-all duration-200 ${
              activePage === item.id
                ? "bg-[#FEF2F2] dark:bg-[#3a1010] text-[#C53030] dark:text-[#f87171] font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:translate-x-0.5"
            }`}
          >
            {activePage === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C53030] dark:bg-[#f87171] rounded-r-full" />
            )}
            <span className={
              activePage === item.id
                ? "text-[#C53030] dark:text-[#f87171]"
                : "text-gray-400 dark:text-gray-500"
            }>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Upcoming Pickups */}
      <div className="flex-1 overflow-hidden flex flex-col mt-4 px-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 mb-2">
            <Calendar size={12} className="text-gray-400 dark:text-gray-500" />
            Upcoming Pickups
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {upcoming.map((j) => {
              const urg = getUrgencyColor(j.daysUntil, j.isUrgent);
              return (
                <div
                  key={j.id}
                  className={`px-2 py-2 rounded text-xs flex items-start gap-2 transition-colors ${
                    j.isUrgent || j.daysUntil < 0
                      ? "bg-[#FEF2F2] dark:bg-[#3a1010]"
                      : j.daysUntil === 0
                      ? "bg-[#E8F5F1] dark:bg-[#0a3a2e]"
                      : "hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                  }`}
                >
                  <span className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${urg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-gray-700 dark:text-gray-300 font-medium leading-tight text-[11px]">{j.customerName}</div>
                    <div className="text-gray-400 dark:text-gray-500 text-[9px]">{j.jobType}</div>
                  </div>
                  <span className={`text-[10px] font-bold shrink-0 ${urg.text}`}>{urg.label}</span>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 px-2 py-3 text-center">No active pickups</div>
            )}
          </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#C53030] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {role === "superadmin" ? "SA" : "A"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {role === "superadmin" ? "Super Admin" : "Admin"}
          </div>
        </div>
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? "Light mode" : "Dark mode"}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={onLogout}
          title="Sign out"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-[#C53030] dark:hover:text-[#f87171] transition-all duration-200"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
