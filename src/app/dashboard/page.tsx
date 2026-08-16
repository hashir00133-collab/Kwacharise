"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  phone: string | null;
  role: "member" | "admin" | "super_admin";
  status: string;
  referral_code: string | null;
  balance: number;
  bonus_balance: number;
  kyc_status: string;
  capital_balance: number | null;
  profit_balance: number | null;
  total_deposited: number | null;
  completed_withdrawal_cycles: number | null;
  membership_tier: string | null;
  reactivation_required: boolean | null;
};

type DepositRequest = {
  id: string;
  amount: number;
  status: string;
  transaction_reference: string | null;
  created_at: string;
  approved_at: string | null;
  maturity_date: string | null;
  return_percentage: number | null;
  expected_profit: number | null;
  maturity_status: string | null;
  profit_released_at: string | null;
};

type WithdrawalRequest = {
  id: string;
  amount: number;
  withdrawal_method: string;
  status: string;
  created_at: string;
};

type LedgerEntry = {
  id: string;
  entry_type: string;
  direction: "credit" | "debit";
  amount: number;
  description: string | null;
  created_at: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  notification_type: string | null;
  is_read: boolean;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [refreshingProfit, setRefreshingProfit] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase.rpc("release_my_matured_profits", {});

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "full_name, phone, role, status, referral_code, balance, bonus_balance, kyc_status, capital_balance, profit_balance, total_deposited, completed_withdrawal_cycles, membership_tier, reactivation_required"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    const { data: depositData } = await supabase
      .from("deposit_requests")
      .select(
        "id, amount, status, transaction_reference, created_at, approved_at, maturity_date, return_percentage, expected_profit, maturity_status, profit_released_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: withdrawalData } = await supabase
      .from("withdrawal_requests")
      .select("id, amount, withdrawal_method, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: ledgerData } = await supabase
      .from("ledger_entries")
      .select("id, entry_type, direction, amount, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: notificationData } = await supabase
      .from("notifications")
      .select("id, title, message, notification_type, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setDeposits((depositData || []) as DepositRequest[]);
    setWithdrawals((withdrawalData || []) as WithdrawalRequest[]);
    setLedger((ledgerData || []) as LedgerEntry[]);
    setNotifications((notificationData || []) as Notification[]);

    setLoading(false);
  }

  async function releaseMaturedProfits() {
    setRefreshingProfit(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase.rpc("release_my_matured_profits", {});

    setRefreshingProfit(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const releasedCount = Number(data || 0);

    if (releasedCount > 0) {
      setMessage(`${releasedCount} matured deposit profit released successfully.`);
    } else {
      setMessage("No matured profit available yet.");
    }

    await loadDashboard();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function statusBadge(status: string) {
    if (
      status === "approved" ||
      status === "active" ||
      status === "matured" ||
      status === "completed"
    ) {
      return "bg-green-500/10 text-green-400";
    }

    if (
      status === "rejected" ||
      status === "blocked" ||
      status === "suspended" ||
      status === "cancelled" ||
      status === "expired"
    ) {
      return "bg-red-500/10 text-red-400";
    }

    if (status === "waiting" || status === "matched") {
      return "bg-blue-500/10 text-blue-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  function tierBadge(tierName: string) {
    if (tierName === "Gold") {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }

    if (tierName === "Silver") {
      return "bg-slate-300/10 text-slate-200 border-slate-300/20";
    }

    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  }

  function tierIcon(tierName: string) {
    if (tierName === "Gold") {
      return "🥇";
    }

    if (tierName === "Silver") {
      return "🥈";
    }

    return "🥉";
  }

  function getCountdownText(deposit: DepositRequest) {
    if (deposit.status !== "approved") {
      return "-";
    }

    if (deposit.profit_released_at) {
      return "Profit released";
    }

    if (!deposit.maturity_date) {
      return "No maturity date";
    }

    const maturityTime = new Date(deposit.maturity_date).getTime();
    const currentTime = now.getTime();
    const diff = maturityTime - currentTime;

    if (diff <= 0) {
      return "Matured - profit ready";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  function countdownColor(deposit: DepositRequest) {
    if (deposit.profit_released_at) {
      return "text-green-400";
    }

    if (!deposit.maturity_date) {
      return "text-[#7a9abd]";
    }

    const maturityTime = new Date(deposit.maturity_date).getTime();
    const diff = maturityTime - now.getTime();

    if (diff <= 0) {
      return "text-green-400";
    }

    if (diff < 24 * 60 * 60 * 1000) {
      return "text-yellow-400";
    }

    return "text-[#00b86b]";
  }

  const activeDeposits = deposits.filter(
    (deposit) => deposit.status === "approved"
  );

  const pendingDeposits = deposits.filter(
    (deposit) => deposit.status === "pending"
  );

  const withdrawableAmount =
    Number(profile?.profit_balance || 0) + Number(profile?.bonus_balance || 0);

  const completedCycles = Number(profile?.completed_withdrawal_cycles || 0);
  const rawTierName = profile?.membership_tier || "bronze";

  const tierName =
    rawTierName === "gold"
      ? "Gold"
      : rawTierName === "silver"
      ? "Silver"
      : "Bronze";

  const tierPerk =
    tierName === "Gold"
      ? "VIP — first in pairing queue"
      : tierName === "Silver"
      ? "Priority pairing queue"
      : "Standard pairing queue";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading dashboard...
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

          <div className="mb-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
            <p className="text-sm text-[#7a9abd]">Logged in as</p>
            <h2 className="mt-1 font-bold">{profile?.full_name || "Member"}</h2>
            <p className="mt-1 text-sm text-[#00b86b]">{profile?.role}</p>

            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${tierBadge(
                tierName
              )}`}
            >
              <span>{tierIcon(tierName)}</span>
              <span>{tierName} Tier</span>
            </div>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a
              href="/dashboard"
              className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]"
            >
              Dashboard
            </a>

            <a href="/deposit" className="block rounded-xl px-4 py-3">
              Deposit
            </a>

            <a href="/withdraw" className="block rounded-xl px-4 py-3">
              Withdraw
            </a>

            <a href="/pairing" className="block rounded-xl px-4 py-3">
              Pairing
            </a>

            <a href="/kyc" className="block rounded-xl px-4 py-3">
              KYC Verification
            </a>

            <a href="/referral" className="block rounded-xl px-4 py-3">
              Referral
            </a>

            <a href="/leaderboard" className="block rounded-xl px-4 py-3">
              Leaderboard
            </a>

            <a href="/ledger" className="block rounded-xl px-4 py-3">
              Live Ledger
            </a>

            <a href="/support" className="block rounded-xl px-4 py-3">
              Support Center
            </a>

            <a href="/account" className="block rounded-xl px-4 py-3">
              Account Settings
            </a>

            {(profile?.role === "admin" || profile?.role === "super_admin") && (
              <a href="/admin" className="block rounded-xl px-4 py-3">
                Admin Dashboard
              </a>
            )}

            {profile?.role === "super_admin" && (
              <a href="/superadmin" className="block rounded-xl px-4 py-3">
                Super Admin Dashboard
              </a>
            )}
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
            Welcome, {profile?.full_name || "Member"}
          </h1>

          <p className="mt-3 text-lg text-[#7a9abd]">
            Your dashboard shows locked capital, matured profit, bonuses,
            deposit countdowns, and membership tier.
          </p>

          {profile?.reactivation_required && (
            <p className="mt-6 rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
              Your account has completed 4 withdrawal cycles. Please make a
              reactivation deposit to restart your withdrawal cycle count.
            </p>
          )}

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

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Locked Capital</p>
              <p className="mt-3 text-3xl font-extrabold text-[#00b86b]">
                {Number(profile?.capital_balance || 0).toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-[#4e6880]">
                Initial deposit capital is not withdrawable.
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Withdrawable Profit</p>
              <p className="mt-3 text-3xl font-extrabold">
                {Number(profile?.profit_balance || 0).toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-[#4e6880]">
                Profit becomes available after maturity.
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Bonus Balance</p>
              <p className="mt-3 text-3xl font-extrabold">
                {Number(profile?.bonus_balance || 0).toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-[#4e6880]">
                Referral bonuses are withdrawable.
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Total Withdrawable</p>
              <p className="mt-3 text-3xl font-extrabold text-[#00b86b]">
                {withdrawableAmount.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-[#4e6880]">
                Profit balance + bonus balance.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-5">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">KYC Status</p>
              <p
                className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(
                  profile?.kyc_status || "pending"
                )}`}
              >
                {profile?.kyc_status || "not_submitted"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Account Status</p>
              <p
                className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(
                  profile?.status || "active"
                )}`}
              >
                {profile?.status || "active"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Active Deposits</p>
              <p className="mt-3 text-3xl font-extrabold">
                {activeDeposits.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Pending Deposits</p>
              <p className="mt-3 text-3xl font-extrabold text-yellow-400">
                {pendingDeposits.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Membership Tier</p>
              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${tierBadge(
                  tierName
                )}`}
              >
                <span>{tierIcon(tierName)}</span>
                <span>{tierName}</span>
              </div>
              <p className="mt-2 text-xs text-[#4e6880]">
                {completedCycles} completed withdrawal cycle
                {completedCycles === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {tierIcon(tierName)} {tierName} Tier Benefits
                </h2>
                <p className="mt-2 text-[#7a9abd]">{tierPerk}</p>
              </div>

              <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4">
                <p className="text-sm text-[#7a9abd]">Tier Rule</p>
                <p className="mt-1 text-sm text-[#dde2ef]">
                  Bronze: 0–3 cycles | Silver: 4–7 cycles | Gold: 8+ cycles
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Deposit Maturity Countdown</h2>
                <p className="mt-2 text-[#7a9abd]">
                  Each approved deposit has its own maturity countdown and
                  expected profit.
                </p>
              </div>

              <button
                onClick={releaseMaturedProfits}
                disabled={refreshingProfit}
                className="rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {refreshingProfit ? "Checking..." : "Release Matured Profit"}
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">Deposit Amount</th>
                    <th className="py-3">Return %</th>
                    <th className="py-3">Expected Profit</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Countdown</th>
                    <th className="py-3">Maturity Date</th>
                    <th className="py-3">Reference</th>
                  </tr>
                </thead>

                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-[#172036]">
                      <td className="py-4 font-bold">
                        {Number(deposit.amount || 0).toFixed(2)}
                      </td>

                      <td className="py-4">
                        {Number(deposit.return_percentage || 0).toFixed(2)}%
                      </td>

                      <td className="py-4 font-bold text-[#00b86b]">
                        {Number(deposit.expected_profit || 0).toFixed(2)}
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                            deposit.maturity_status || deposit.status
                          )}`}
                        >
                          {deposit.maturity_status || deposit.status}
                        </span>
                      </td>

                      <td
                        className={`py-4 font-bold ${countdownColor(deposit)}`}
                      >
                        {getCountdownText(deposit)}
                      </td>

                      <td className="py-4 text-[#7a9abd]">
                        {deposit.maturity_date
                          ? new Date(deposit.maturity_date).toLocaleString()
                          : "-"}
                      </td>

                      <td className="py-4 text-[#7a9abd]">
                        {deposit.transaction_reference || "-"}
                      </td>
                    </tr>
                  ))}

                  {deposits.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-[#7a9abd]"
                      >
                        No deposits yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <h2 className="text-2xl font-bold">Quick Actions</h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href="/deposit"
                  className="rounded-xl bg-[#00b86b] px-5 py-4 text-center font-semibold text-white"
                >
                  Make Deposit
                </a>

                <a
                  href="/withdraw"
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd]"
                >
                  Withdraw Profit
                </a>

                <a
                  href="/pairing"
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd]"
                >
                  Pairing System
                </a>

                <a
                  href="/kyc"
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd]"
                >
                  KYC Verification
                </a>

                <a
                  href="/referral"
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd]"
                >
                  Referral Page
                </a>

                <a
                  href="/support"
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd]"
                >
                  Support Center
                </a>

                <a
                  href="/account"
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd] sm:col-span-2"
                >
                  Account Settings
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <h2 className="text-2xl font-bold">Referral Code</h2>
              <p className="mt-2 text-[#7a9abd]">
                Share this code with new members.
              </p>

              <div className="mt-5 rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5">
                <p className="text-3xl font-extrabold text-[#00b86b]">
                  {profile?.referral_code || "Not available"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <h2 className="text-2xl font-bold">Recent Withdrawals</h2>

              <div className="mt-5 space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">
                          {Number(withdrawal.amount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-[#7a9abd]">
                          {withdrawal.withdrawal_method}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          withdrawal.status
                        )}`}
                      >
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                ))}

                {withdrawals.length === 0 && (
                  <p className="text-[#7a9abd]">No withdrawal requests yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <h2 className="text-2xl font-bold">Notifications</h2>

              <div className="mt-5 space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-4"
                  >
                    <p className="font-bold">{notification.title}</p>
                    <p className="mt-1 text-sm text-[#7a9abd]">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-[#4e6880]">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <p className="text-[#7a9abd]">No notifications yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <h2 className="text-2xl font-bold">Ledger Activity</h2>

            <div className="mt-5 space-y-3">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-[#172036] bg-[#0b0f1c] p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {entry.description || entry.entry_type}
                    </p>
                    <p className="text-sm text-[#7a9abd]">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>

                  <p
                    className={
                      entry.direction === "credit"
                        ? "font-bold text-green-400"
                        : "font-bold text-red-400"
                    }
                  >
                    {entry.direction === "credit" ? "+" : "-"}
                    {Number(entry.amount || 0).toFixed(2)}
                  </p>
                </div>
              ))}

              {ledger.length === 0 && (
                <p className="text-[#7a9abd]">No ledger activity yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}