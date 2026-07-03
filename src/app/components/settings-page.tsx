import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { getSettings, saveSettings, type ShopSettings } from "@/lib/supabase-service";

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "AJ Graphica",
  address: "Malita, Davao Occidental",
  contactNumber: "0970 265 4944",
  facebookPage: "A&J Graphica",
  defaultPaymentTerms: "50% down payment required upon order. Balance upon pickup.",
  smsReminders: true,
};

export function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((s) => { if (s) setSettings(s); });
  }, []);

  const set = (k: keyof ShopSettings, v: string | boolean) =>
    setSettings((s) => ({ ...s, [k]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in">
      <div className="p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-4 sm:mb-5">
          <h1 className="text-gray-900 dark:text-gray-100 text-xl sm:text-2xl font-semibold">Settings</h1>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage shop info and preferences</p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3 sm:gap-4">
          {/* Shop Info */}
          <Section title="Shop Information">
            <Field label="Shop Name">
              <input value={settings.shopName} onChange={(e) => set("shopName", e.target.value)}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
            </Field>
            <Field label="Address">
              <input value={settings.address} onChange={(e) => set("address", e.target.value)}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
            </Field>
            <Field label="Contact Number">
              <input value={settings.contactNumber} onChange={(e) => set("contactNumber", e.target.value)}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
            </Field>
            <Field label="Facebook Page">
              <input value={settings.facebookPage} onChange={(e) => set("facebookPage", e.target.value)}
                placeholder="facebook.com/yourpage"
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200" />
            </Field>
          </Section>

          {/* Payment */}
          <Section title="Payment & Terms">
            <Field label="Default Payment Terms">
              <textarea
                value={settings.defaultPaymentTerms}
                onChange={(e) => set("defaultPaymentTerms", e.target.value)}
                rows={3}
                className="w-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#C53030] focus:ring-2 focus:ring-[#C53030]/20 resize-none bg-white dark:bg-[#1a1a1a] dark:text-gray-200 transition-all duration-200"
              />
            </Field>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <div className="flex items-center justify-between py-1 sm:py-1.5 gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Pickup Reminder Notifications</div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">Alert when a job is nearing its pickup date</div>
              </div>
              <button
                type="button"
                onClick={() => set("smsReminders", !settings.smsReminders)}
                className={`w-11 sm:w-12 h-6 rounded-full transition-all duration-200 relative shrink-0 ${settings.smsReminders ? "bg-[#C53030]" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 shadow-sm ${settings.smsReminders ? "left-[21px] sm:left-[23px]" : "left-0.5"}`} />
              </button>
            </div>
          </Section>

          {/* Save */}
          <div className="flex justify-end pt-1 sm:pt-2">
            <button
              type="submit"
              className={`flex items-center gap-2 text-base py-3 px-5 sm:px-6 rounded-xl transition-all duration-200 font-medium ${
                saved ? "bg-[#E8F5F1] text-[#0F6E56]" : "bg-[#C53030] hover:bg-[#991B1B] text-white shadow-sm hover:shadow-md active:scale-[0.98]"
              }`}
            >
              {saved && <CheckCircle size={16} />}
              {saved ? "Saved!" : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
