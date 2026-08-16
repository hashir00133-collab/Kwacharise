"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SystemSettings = {
  referral_bonus_fixed: number | null;
  referral_bonus_percent: number | null;
  referral_bonus_minimum_withdrawal: number | null;
  return_percentage: number | null;
  minimum_deposit: number | null;
  maturity_timer_days: number | null;
  minimum_withdrawal: number | null;
  allow_same_or_higher_deposit_only: boolean | null;
  pairing_enabled: boolean | null;
  whatsapp_notifications_enabled: boolean | null;
};

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [referralBonusFixed, setReferralBonusFixed] = useState("0");
  const [referralBonusPercent, setReferralBonusPercent] = useState("0");
  const [
    referralBonusMinimumWithdrawal,
    setReferralBonusMinimumWithdrawal,
  ] = useState("1000");

  const [returnPercentage, setReturnPercentage] = useState("20");
  const [minimumDeposit, setMinimumDeposit] = useState("250");
  const [maturityTimerDays, setMaturityTimerDays] = useState("3");
  const [minimumWithdrawal, setMinimumWithdrawal] = useState("200");

  const [sameOrHigherDepositOnly, setSameOrHigherDepositOnly] =
    useState(true);
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
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      router.push("/dashboard");
      return;
    }

    if (profile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    if (
      profile.status === "blocked" ||
      profile.status === "suspended"
    ) {
      await supabase.auth.signOut();
      router.push("/login");
      return;
    }

    await loadSettings();
    setLoading(false);
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from("system_settings")
      .select(
        "referral_bonus_fixed, referral_bonus_percent, referral_bonus_minimum_withdrawal, return_percentage, minimum_deposit, maturity_timer_days, minimum_withdrawal, allow_same_or_higher_deposit_only, pairing_enabled, whatsapp_notifications_enabled"
      )
      .eq("id", 1)
      .single();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const settings = data as SystemSettings;

    setReferralBonusFixed(
      String(settings.referral_bonus_fixed ?? 0)
    );

    setReferralBonusPercent(
      String(settings.referral_bonus_percent ?? 0)
    );

    setReferralBonusMinimumWithdrawal(
      String(settings.referral_bonus_minimum_withdrawal ?? 1000)
    );

    setReturnPercentage(
      String(settings.return_percentage ?? 20)
    );

    setMinimumDeposit(
      String(settings.minimum_deposit ?? 250)
    );

    setMaturityTimerDays(
      String(settings.maturity_timer_days ?? 3)
    );

    setMinimumWithdrawal(
      String(settings.minimum_withdrawal ?? 200)
    );

    setSameOrHigherDepositOnly(
      Boolean(
        settings.allow_same_or_higher_deposit_only ?? true
      )
    );

    setPairingEnabled(
      Boolean(settings.pairing_enabled ?? false)
    );

    setWhatsappEnabled(
      Boolean(
        settings.whatsapp_notifications_enabled ?? false
      )
    );
  }

  async function handleSaveSettings(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const fixedBonus = Number(referralBonusFixed || 0);
    const percentBonus = Number(referralBonusPercent || 0);

    const referralBonusMinimum = Number(
      referralBonusMinimumWithdrawal || 0
    );

    const returnPercent = Number(returnPercentage || 0);
    const minDeposit = Number(minimumDeposit || 0);
    const maturityDays = Number(maturityTimerDays || 0);
    const minWithdrawal = Number(minimumWithdrawal || 0);

    if (!Number.isFinite(fixedBonus) || fixedBonus < 0) {
      setErrorMessage(
        "Referral bonus fixed amount cannot be negative."
      );
      return;
    }

    if (!Number.isFinite(percentBonus) || percentBonus < 0) {
      setErrorMessage(
        "Referral bonus percentage cannot be negative."
      );
      return;
    }

    if (
      !Number.isFinite(referralBonusMinimum) ||
      referralBonusMinimum < 0
    ) {
      setErrorMessage(
        "Referral bonus minimum withdrawal cannot be negative."
      );
      return;
    }

    if (
      !Number.isFinite(returnPercent) ||
      returnPercent < 0
    ) {
      setErrorMessage(
        "Return percentage cannot be negative."
      );
      return;
    }

    if (!Number.isFinite(minDeposit) || minDeposit < 0) {
      setErrorMessage(
        "Minimum deposit cannot be negative."
      );
      return;
    }

    if (
      !Number.isFinite(maturityDays) ||
      maturityDays < 1
    ) {
      setErrorMessage(
        "Maturity timer days must be at least 1."
      );
      return;
    }

    if (
      !Number.isFinite(minWithdrawal) ||
      minWithdrawal < 0
    ) {
      setErrorMessage(
        "Minimum withdrawal cannot be negative."
      );
      return;
    }

    setSaving(true);

    const { error: settingsError } = await supabase.rpc(
      "update_system_settings",
      {
        p_referral_bonus_fixed: fixedBonus,
        p_referral_bonus_percent: percentBonus,
        p_return_percentage: returnPercent,
        p_minimum_deposit: minDeposit,
        p_maturity_timer_days: maturityDays,
        p_minimum_withdrawal: minWithdrawal,
        p_allow_same_or_higher_deposit_only:
          sameOrHigherDepositOnly,
        p_pairing_enabled: pairingEnabled,
        p_whatsapp_notifications_enabled: whatsappEnabled,
      }
    );

    if (settingsError) {
      setSaving(false);
      setErrorMessage(settingsError.message);
      return;
    }

    const { error: referralMinimumError } =
      await supabase.rpc(
        "update_referral_bonus_minimum_withdrawal",
        {
          p_amount: referralBonusMinimum,
        }
      );

    if (referralMinimumError) {
      setSaving(false);
      setErrorMessage(referralMinimumError.message);
      return;
    }

    await loadSettings();

    setSaving(false);
    setMessage("System settings updated successfully.");
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

            <h1 className="text-2xl font-extrabold">
              KwachaRise
            </h1>
          </div>

          <div className="mb-8 rounded-2xl border border-[#ffd70033] bg-[#ffd70018] p-5">
            <h2 className="font-bold text-[#ffd700]">
              ⭐ Super Admin
            </h2>

            <p className="mt-2 text-sm text-[#7a9abd]">
              Manage platform settings and business rules.
            </p>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a
              href="/superadmin"
              className="block rounded-xl px-4 py-3"
            >
              Payment Methods
            </a>

            <a className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]">
              System Settings
            </a>

            <a
              href="/admin"
              className="block rounded-xl px-4 py-3"
            >
              Admin Dashboard
            </a>

            <a
              href="/dashboard"
              className="block rounded-xl px-4 py-3"
            >
              Member Dashboard
            </a>
          </nav>

          <button
            type="button"
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
            Super Admin controls maturity timer, return
            percentage, deposit rules, withdrawal rules, and
            referral bonuses.
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

          <form onSubmit={handleSaveSettings}>
            <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
              <h2 className="text-2xl font-bold">
                Investment Rules
              </h2>

              <p className="mt-2 text-[#7a9abd]">
                These settings control approved deposit maturity
                and profit calculation.
              </p>

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                    Return Percentage
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={returnPercentage}
                    onChange={(e) =>
                      setReturnPercentage(e.target.value)
                    }
                    placeholder="20"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Example: 20 means the member earns 20%
                    profit after maturity.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                    Maturity Timer Days
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={maturityTimerDays}
                    onChange={(e) =>
                      setMaturityTimerDays(e.target.value)
                    }
                    placeholder="3"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Number of days before profit becomes
                    withdrawable.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                    Minimum Deposit
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minimumDeposit}
                    onChange={(e) =>
                      setMinimumDeposit(e.target.value)
                    }
                    placeholder="250"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Members cannot deposit less than this
                    amount.
                  </p>
                </div>
              </div>

              <label className="mt-6 flex items-center gap-3 rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
                <input
                  type="checkbox"
                  checked={sameOrHigherDepositOnly}
                  onChange={(e) =>
                    setSameOrHigherDepositOnly(
                      e.target.checked
                    )
                  }
                />

                <span>
                  <span className="block font-bold">
                    Enforce Same or Higher Deposit Rule
                  </span>

                  <span className="text-sm text-[#7a9abd]">
                    Member&apos;s next deposit cannot be lower
                    than their previous approved deposit.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
              <h2 className="text-2xl font-bold">
                Withdrawal Rules
              </h2>

              <p className="mt-2 text-[#7a9abd]">
                Withdrawals are restricted to members with
                approved KYC and only matured profit or eligible
                referral bonus. This setting controls the
                general minimum withdrawal amount.
              </p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Minimum Withdrawal
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumWithdrawal}
                  onChange={(e) =>
                    setMinimumWithdrawal(e.target.value)
                  }
                  placeholder="200"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />

                <p className="mt-2 text-sm text-[#7a9abd]">
                  This is the minimum amount for a normal profit
                  withdrawal.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
              <h2 className="text-2xl font-bold">
                Referral Bonus Settings
              </h2>

              <p className="mt-2 text-[#7a9abd]">
                These values are used when a referred
                user&apos;s first eligible deposit is approved.
              </p>

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                    Fixed Referral Bonus
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={referralBonusFixed}
                    onChange={(e) =>
                      setReferralBonusFixed(e.target.value)
                    }
                    placeholder="25"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Fixed amount awarded to the referrer.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                    Referral Bonus Percentage
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={referralBonusPercent}
                    onChange={(e) =>
                      setReferralBonusPercent(e.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Percentage-based bonus added when applicable.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                    Referral Bonus Minimum Withdrawal
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={referralBonusMinimumWithdrawal}
                    onChange={(e) =>
                      setReferralBonusMinimumWithdrawal(
                        e.target.value
                      )
                    }
                    placeholder="1000"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Minimum referral bonus portion that a member
                    may include in one withdrawal.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
              <h2 className="text-2xl font-bold">
                Platform Features
              </h2>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <input
                    type="checkbox"
                    checked={pairingEnabled}
                    onChange={(e) =>
                      setPairingEnabled(e.target.checked)
                    }
                  />

                  <span>
                    <span className="block font-bold">
                      Enable Pairing System
                    </span>

                    <span className="text-sm text-[#7a9abd]">
                      Controls whether eligible deposits and
                      withdrawals may be paired.
                    </span>
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) =>
                      setWhatsappEnabled(e.target.checked)
                    }
                  />

                  <span>
                    <span className="block font-bold">
                      Enable WhatsApp Notifications
                    </span>

                    <span className="text-sm text-[#7a9abd]">
                      Controls WhatsApp notifications for members
                      who opted in.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#00b86b33] bg-[#00b86b0a] p-6 lg:p-8">
              <h2 className="text-2xl font-bold">
                Current Rule Summary
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <p className="text-sm text-[#7a9abd]">
                    Return
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#00b86b]">
                    {Number(
                      returnPercentage || 0
                    ).toFixed(2)}
                    %
                  </p>
                </div>

                <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <p className="text-sm text-[#7a9abd]">
                    Maturity
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {Number(maturityTimerDays || 0)} days
                  </p>
                </div>

                <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <p className="text-sm text-[#7a9abd]">
                    Minimum Deposit
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    K
                    {Number(
                      minimumDeposit || 0
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <p className="text-sm text-[#7a9abd]">
                    Minimum Withdrawal
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    K
                    {Number(
                      minimumWithdrawal || 0
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
                  <p className="text-sm text-[#7a9abd]">
                    Referral Bonus Minimum
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#ffd700]">
                    K
                    {Number(
                      referralBonusMinimumWithdrawal || 0
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-8 w-full rounded-xl bg-[#00b86b] px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving Settings..."
                : "Save System Settings"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
