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
};

type DepositRequest = {
  id: string;
  amount: number;
  status: string;
  transaction_reference: string | null;
  created_at: string;
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "full_name, phone, role, status, referral_code, balance, bonus_balance, kyc_status"
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
      .select("id, amount, status, transaction_reference, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

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

    setDeposits(depositData || []);
    setWithdrawals(withdrawalData || []);
    setLedger(ledgerData || []);
    setNotifications(notificationData || []);

    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function statusBadge(status: string) {
    if (status === "approved" || status === "active") {
      return "bg-green-500/10 text-green-400";
    }

    if (
      status === "rejected" ||
      status === "blocked" ||
      status === "suspended" ||
      status === "cancelled"
    ) {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

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
            This dashboard shows your real account data from Supabase.
          </p>

          {errorMessage && (
            <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Available Balance</p>
              <p className="mt-3 text-3xl font-extrabold text-[#00b86b]">
                {Number(profile?.balance || 0).toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
              <p className="text-sm text-[#7a9abd]">Bonus Balance</p>
              <p className="mt-3 text-3xl font-extrabold">
                {Number(profile?.bonus_balance || 0).toFixed(2)}
              </p>
            </div>

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
                  Withdraw Funds
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
                  href="/account"
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd]"
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
              <h2 className="text-2xl font-bold">Recent Deposits</h2>

              <div className="mt-5 space-y-3">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">{deposit.amount}</p>
                        <p className="text-sm text-[#7a9abd]">
                          Ref: {deposit.transaction_reference || "-"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          deposit.status
                        )}`}
                      >
                        {deposit.status}
                      </span>
                    </div>
                  </div>
                ))}

                {deposits.length === 0 && (
                  <p className="text-[#7a9abd]">No deposit requests yet.</p>
                )}
              </div>
            </div>

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
                        <p className="font-bold">{withdrawal.amount}</p>
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
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
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
                      {entry.amount}
                    </p>
                  </div>
                ))}

                {ledger.length === 0 && (
                  <p className="text-[#7a9abd]">No ledger activity yet.</p>
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
        </section>
      </div>
    </main>
  );
}