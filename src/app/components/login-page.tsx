import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Shield, User, Lock, Mail } from "lucide-react";
import { login } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const RESOLVE_USERNAME_URL = "https://pxaklzjiuncwgbzuqvis.supabase.co/functions/v1/server/resolve-username";

interface LoginPageProps {
  onLogin: (role: "admin" | "superadmin") => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Please enter your username."); return; }
    if (!password) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      const res = await fetch(RESOLVE_USERNAME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error ?? "Invalid username or password");
      }
      const { email } = await res.json();
      await login(email, password);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      onLogin((profile?.role as "admin" | "superadmin") ?? "admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[min(38vw,520px)] shrink-0 flex-col relative bg-[#C53030] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col justify-between h-full px-10 xl:px-14 py-10 xl:py-14">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/10 shadow-lg">
              <img src="/logo.jpg" alt="AJ Graphica" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold tracking-wide uppercase text-sm">AJ Graphica</div>
              <div className="text-white/50 text-xs">Print & Tailoring</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/80 text-xs border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </div>
            <h1 className="text-white leading-tight" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
              Shop Management<br />System
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Track jobbings, manage deadlines, and keep your print shop running smoothly — all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { dot: "bg-white", label: "Normal jobs" },
              { dot: "bg-amber-300", label: "Upcoming pickups" },
              { dot: "bg-red-300", label: "Urgent & overdue" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm text-white/70">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                {item.label}
              </div>
            ))}
            <div className="mt-4 text-white/30 text-xs">v1.0 &middot; AJ Graphica POS</div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#C53030] flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/logo.jpg" alt="AJ Graphica" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[#C53030] font-bold uppercase tracking-wide text-sm">AJ Graphica</div>
              <div className="text-gray-400 text-xs">Print & Tailoring</div>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-gray-900" style={{ fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1.5">Sign in to your shop dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-[#991B1B] text-sm px-4 py-3 rounded-xl animate-slide-in-up">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/15 bg-white text-gray-900 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/15 bg-white text-gray-900 transition-all duration-200 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C53030] hover:bg-[#991B1B] text-white text-sm font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 mt-1 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in&hellip;
                </>
              ) : (
                <>
                  Sign In
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200/60">
            <p className="text-xs text-gray-400 text-center">
              AJ Graphica Shop Management System &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
