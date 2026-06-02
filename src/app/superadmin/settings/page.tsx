"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SystemSettings = {
  referral_bonus_fixed: number;
  referral_bonus_percent: number;
  minimum_withdrawal: number;
  pairing_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
};

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [referralBonusFixed, setReferralBonusFixed] = useState("0");
  const [referralBonusPercent, setReferralBonusPercent] = useState("0");
  const [minimumWithdrawal, setMinimumWithdrawal] = useState("0");
  const [pairingEnabled, setPairingEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkSuperAdminAndLoadSettings();
  }, []);

  async function checkSuperAdminAndLoadSettings() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    await loadSettings();
    setLoading(false);
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from("system_settings")
      .select(
        "referral_bonus_fixed, referral_bonus_percent, minimum_withdrawal, pairing_enabled, whatsapp_notifications_enabled"
      )
      .eq("id", 1)
      .single();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const settings = data as SystemSettings;

    setReferralBonusFixed(String(settings.referral_bonus_fixed || 0));
    setReferralBonusPercent(String(settings.referral_bonus_percent || 0));
    setMinimumWithdrawal(String(settings.minimum_withdrawal || 0));
    setPairingEnabled(Boolean(settings.pairing_enabled));
    setWhatsappEnabled(Boolean(settings.whatsapp_notifications_enabled));
  }

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const fixedBonus = Number(referralBonusFixed || 0);
    const percentBonus = Number(referralBonusPercent || 0);
    const minWithdrawal = Number(minimumWithdrawal || 0);

    if (fixedBonus < 0 || percentBonus < 0 || minWithdrawal < 0) {
      setErrorMessage("Settings values cannot be negative.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.rpc("update_system_settings", {
      p_referral_bonus_fixed: fixedBonus,
      p_referral_bonus_percent: percentBonus,
      p_minimum_withdrawal: minWithdrawal,
      p_pairing_enabled: pairingEnabled,
      p_whatsapp_notifications_enabled: whatsappEnabled,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("System settings updated successfully.");
    await loadSettings();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading system settings...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] text-[#dde2ef]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#172036] bg-[#0b0f1c] p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00b86b] text-xl font-bold text-white">
              K
            </div>
            <h1 className="text-2xl font-extrabold">KwachaRise</h1>
          </div>

          <div className="mb-8 rounded-2xl border border-[#ffd70033] bg-[#ffd70018] p-5">
            <h2 className="font-bold text-[#ffd700]">⭐ Super Admin</h2>
            <p className="mt-2 text-sm text-[#7a9abd]">
              Manage system settings
            </p>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a href="/superadmin" className="block rounded-xl px-4 py-3">
              Payment Methods
            </a>

            <a className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]">
              System Settings
            </a>

            <a href="/admin" className="block rounded-xl px-4 py-3">
              Admin Dashboard
            </a>

            <a href="/dashboard" className="block rounded-xl px-4 py-3">
              Member Dashboard
            </a>
          </nav>

          <button
            onClick={handleSignOut}
            className="mt-10 w-full rounded-xl bg-[#172036] px-4 py-3 text-[#7a9abd]"
          >
            Sign Out
          </button>
        </aside>

        <section className="p-6 lg:p-10">
          <h1 className="text-4xl font-extrabold lg:text-5xl">
            System Settings
          </h1>

          <p className="mt-3 text-lg text-[#7a9abd]">
            Control referral bonuses, withdrawals, pairing, and notifications.
          </p>

          {errorMessage && (
            <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          {message && (
            <p className="mt-6 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {message}
            </p>
          )}

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Referral Bonus Settings</h2>

            <p className="mt-2 text-[#7a9abd]">
              These values are used when a referred user’s deposit is approved.
            </p>

            <form onSubmit={handleSaveSettings} className="mt-6 grid gap-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Fixed Referral Bonus
                  </label>
                  <input
                    type="number"
                    value={referralBonusFixed}
                    onChange={(e) => setReferralBonusFixed(e.target.value)}
                    placeholder="25"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />
                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Example: 25 means referrer gets 25 bonus.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Referral Bonus Percentage
                  </label>
                  <input
                    type="number"
                    value={referralBonusPercent}
                    onChange={(e) => setReferralBonusPercent(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />
                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Example: 10 means 10% of approved deposit amount.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
                <h3 className="text-xl font-bold">Withdrawal Settings</h3>

                <label className="mt-4 mb-2 block text-sm font-semibold text-[#4e6880]">
                  Minimum Withdrawal
                </label>
                <input
                  type="number"
                  value={minimumWithdrawal}
                  onChange={(e) => setMinimumWithdrawal(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-xl border border-[#172036] bg-[#07090f] px-4 py-3 outline-none"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <input
                    type="checkbox"
                    checked={pairingEnabled}
                    onChange={(e) => setPairingEnabled(e.target.checked)}
                  />
                  <span>
                    <span className="block font-bold">Enable Pairing System</span>
                    <span className="text-sm text-[#7a9abd]">
                      This will be used later when we build pairing logic.
                    </span>
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  />
                  <span>
                    <span className="block font-bold">
                      Enable WhatsApp Notifications
                    </span>
                    <span className="text-sm text-[#7a9abd]">
                      This is only a setting for now. API integration comes later.
                    </span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#00b86b] px-6 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save System Settings"}
              </button>
            </form>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Current Meaning</h2>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                <p className="text-sm text-[#7a9abd]">Referral Bonus</p>
                <p className="mt-2 text-2xl font-bold text-[#00b86b]">
                  {Number(referralBonusFixed || 0).toFixed(2)} fixed
                </p>
                <p className="mt-1 text-sm text-[#7a9abd]">
                  + {Number(referralBonusPercent || 0)}% of deposit
                </p>
              </div>

              <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                <p className="text-sm text-[#7a9abd]">Minimum Withdrawal</p>
                <p className="mt-2 text-2xl font-bold">
                  {Number(minimumWithdrawal || 0).toFixed(2)}
                </p>
              </div>

              <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                <p className="text-sm text-[#7a9abd]">Pairing System</p>
                <p className="mt-2 text-2xl font-bold">
                  {pairingEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}