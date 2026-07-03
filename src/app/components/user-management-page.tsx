import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, Plus, Key, User } from "lucide-react";
import { ADMIN_FUNCTION_URL } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  full_name: string;
  role: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-shadow bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] bg-gray-50 dark:bg-[#2a2a2a]">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</div>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function UserManagementPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "superadmin">("admin");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [changeUserId, setChangeUserId] = useState("");
  const [changePassword, setChangePassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) { setError("Not authenticated"); setLoading(false); return; }
      const res = await fetch(`${ADMIN_FUNCTION_URL}/profiles`, {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
      if (!res.ok) { setError(await res.text()); setProfiles([]); } else setProfiles(await res.json());
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!newUsername.trim() || !newPassword || !newName.trim()) { setCreateError("All fields required"); return; }
    setCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${ADMIN_FUNCTION_URL}/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData?.session?.access_token}` },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, name: newName.trim(), role: newRole }),
      });
      if (!res.ok) { setCreateError((await res.json()).error ?? "Failed to create user"); return; }
      setNewUsername(""); setNewPassword(""); setNewName(""); setNewRole("admin");
      await fetchProfiles();
    } catch {
      setCreateError("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!changePassword.trim()) return;
    setChanging(true);
    setChangeError("");
    setChangeSuccess(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${ADMIN_FUNCTION_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData?.session?.access_token}` },
        body: JSON.stringify({ userId, newPassword: changePassword }),
      });
      if (!res.ok) { setChangeError((await res.json()).error ?? "Failed to change password"); return; }
      setChangeSuccess(true);
      setChangePassword("");
      setChangeUserId("");
      setTimeout(() => setChangeSuccess(false), 2000);
    } catch {
      setChangeError("Failed to change password");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in">
      <div className="p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-4 sm:mb-5">
          <h1 className="text-gray-900 dark:text-gray-100 text-xl sm:text-2xl font-semibold">User Management</h1>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage accounts and permissions</p>
        </div>

        <Section title="Users">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-[#991B1B] text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-xs text-gray-400 text-center py-4">Loading users...</div>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#C53030]/10 flex items-center justify-center shrink-0">
                      <User size={14} className="text-[#C53030]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name || p.full_name || "Unnamed"}</div>
                      <div className="text-[10px] sm:text-xs text-gray-400 truncate">@{p.username || "—"} &middot; {p.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {changeUserId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={changePassword}
                          onChange={(e) => setChangePassword(e.target.value)}
                          placeholder="New password"
                          className="w-28 sm:w-36 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#C53030] bg-white dark:bg-[#1a1a1a] dark:text-gray-200"
                        />
                        <button
                          onClick={() => handleChangePassword(p.user_id)}
                          disabled={changing || !changePassword.trim()}
                          className="text-xs bg-[#C53030] hover:bg-[#991B1B] text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          {changing ? "..." : "Save"}
                        </button>
                        <button
                          onClick={() => { setChangeUserId(""); setChangePassword(""); }}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setChangeUserId(p.id); setChangePassword(""); setChangeSuccess(false); }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#C53030] px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Key size={12} />
                        Change Password
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {changeSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
              <CheckCircle size={16} /> Password changed successfully
            </div>
          )}

          {changeError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-[#991B1B] text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {changeError}
            </div>
          )}
        </Section>

        <div className="mt-3 sm:mt-4">
          <Section title="Create New User">
            {createError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-[#991B1B] text-sm px-4 py-3 rounded-xl mb-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Username">
                  <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="e.g. juan"
                    className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] bg-white dark:bg-[#1a1a1a] dark:text-gray-200" />
                </Field>
                <Field label="Name">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name"
                    className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] bg-white dark:bg-[#1a1a1a] dark:text-gray-200" />
                </Field>
                <Field label="Password">
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters"
                    className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] bg-white dark:bg-[#1a1a1a] dark:text-gray-200" />
                </Field>
                <Field label="Role">
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "superadmin")}
                    className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] bg-white dark:bg-[#1a1a1a] dark:text-gray-200">
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </Field>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="self-start flex items-center gap-2 bg-[#C53030] hover:bg-[#991B1B] text-white text-xs font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {creating ? "Creating..." : <><Plus size={14} /> Create User</>}
              </button>
            </form>
          </Section>
        </div>
      </div>
    </div>
  );
}
