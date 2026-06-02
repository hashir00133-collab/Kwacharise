"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DepositRequest = {
  id: string;
  user_id: string;
  payment_method_id: string | null;
  amount: number;
  sender_name: string | null;
  sender_phone: string | null;
  transaction_reference: string | null;
  payment_screenshot_url: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "paid" | "completed";
  admin_note: string | null;
  created_at: string;
};

type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount: number;
  withdrawal_method: string;
  account_name: string | null;
  account_number_or_wallet: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "paid" | "completed";
  admin_note: string | null;
  processed_reference: string | null;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const [depositAdminNote, setDepositAdminNote] = useState("");
  const [withdrawalAdminNote, setWithdrawalAdminNote] = useState("");
  const [processedReference, setProcessedReference] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  async function checkAdminAndLoadData() {
    setLoading(true);

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

    if (
      profileError ||
      !profile ||
      (profile.role !== "admin" && profile.role !== "super_admin")
    ) {
      router.push("/dashboard");
      return;
    }

    await loadDeposits();
    await loadWithdrawals();

    setLoading(false);
  }

  async function loadDeposits() {
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setDeposits(data || []);
  }

  async function loadWithdrawals() {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setWithdrawals(data || []);
  }

  async function approveDeposit(depositId: string) {
    setMessage("");
    setErrorMessage("");
    setActionLoadingId(`deposit-${depositId}`);

    const { error } = await supabase.rpc("approve_deposit_request", {
      p_deposit_id: depositId,
      p_admin_note: depositAdminNote || null,
    });

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setDepositAdminNote("");
    setMessage("Deposit approved successfully.");
    await loadDeposits();
  }

  async function rejectDeposit(depositId: string) {
    setMessage("");
    setErrorMessage("");
    setActionLoadingId(`deposit-${depositId}`);

    const { error } = await supabase.rpc("reject_deposit_request", {
      p_deposit_id: depositId,
      p_admin_note: depositAdminNote || "Deposit rejected by admin.",
    });

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setDepositAdminNote("");
    setMessage("Deposit rejected successfully.");
    await loadDeposits();
  }

  async function approveWithdrawal(withdrawalId: string) {
    setMessage("");
    setErrorMessage("");
    setActionLoadingId(`withdrawal-${withdrawalId}`);

    const { error } = await supabase.rpc("approve_withdrawal_request", {
      p_withdrawal_id: withdrawalId,
      p_processed_reference: processedReference || null,
      p_admin_note: withdrawalAdminNote || null,
    });

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setWithdrawalAdminNote("");
    setProcessedReference("");
    setMessage("Withdrawal approved successfully.");

    await loadWithdrawals();
  }

  async function rejectWithdrawal(withdrawalId: string) {
    setMessage("");
    setErrorMessage("");
    setActionLoadingId(`withdrawal-${withdrawalId}`);

    const { error } = await supabase.rpc("reject_withdrawal_request", {
      p_withdrawal_id: withdrawalId,
      p_admin_note: withdrawalAdminNote || "Withdrawal rejected by admin.",
    });

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setWithdrawalAdminNote("");
    setProcessedReference("");
    setMessage("Withdrawal rejected successfully.");

    await loadWithdrawals();
  }

  async function openPaymentProof(filePath: string | null) {
    if (!filePath) {
      setErrorMessage("No payment screenshot found for this deposit.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("deposit-screenshots")
      .createSignedUrl(filePath, 300);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading Admin Dashboard...
      </main>
    );
  }

  const pendingDeposits = deposits.filter((deposit) => deposit.status === "pending");
  const reviewedDeposits = deposits.filter((deposit) => deposit.status !== "pending");

  const pendingWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.status === "pending"
  );
  const reviewedWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.status !== "pending"
  );

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

          <div className="mb-8 rounded-2xl border border-[#00b86b33] bg-[#00b86b18] p-5">
            <h2 className="font-bold text-[#00b86b]">Admin Panel</h2>
            <p className="mt-2 text-sm text-[#7a9abd]">
              Review deposits and withdrawals
            </p>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]">
              Admin Controls
            </a>
            <a href="/dashboard" className="block rounded-xl px-4 py-3">
              Member Dashboard
            </a>
            <a href="/superadmin" className="block rounded-xl px-4 py-3">
              Super Admin Dashboard
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
            Admin Dashboard
          </h1>
          <p className="mt-3 text-lg text-[#7a9abd]">
            Approve or reject member deposits and withdrawals.
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

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Pending Deposits</p>
              <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
                {pendingDeposits.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Reviewed Deposits</p>
              <p className="mt-2 text-3xl font-extrabold">
                {reviewedDeposits.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Pending Withdrawals</p>
              <p className="mt-2 text-3xl font-extrabold text-yellow-400">
                {pendingWithdrawals.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Reviewed Withdrawals</p>
              <p className="mt-2 text-3xl font-extrabold">
                {reviewedWithdrawals.length}
              </p>
            </div>
          </div>

          {/* DEPOSIT APPROVALS */}
          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Pending Deposits</h2>
            <p className="mt-2 text-[#7a9abd]">
              Review payment proof before approving deposits.
            </p>

            <label className="mt-6 mb-2 block text-sm font-semibold text-[#4e6880]">
              Deposit Admin Note Optional
            </label>
            <textarea
              value={depositAdminNote}
              onChange={(e) => setDepositAdminNote(e.target.value)}
              placeholder="Example: Payment verified successfully."
              rows={3}
              className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            />

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">Member</th>
                    <th className="py-3">Phone</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Reference</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Proof</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingDeposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-[#172036]">
                      <td className="py-4 font-semibold">
                        {deposit.sender_name || "Unknown"}
                      </td>
                      <td className="py-4 text-[#7a9abd]">
                        {deposit.sender_phone || "-"}
                      </td>
                      <td className="py-4 font-bold">{deposit.amount}</td>
                      <td className="py-4 text-[#7a9abd]">
                        {deposit.transaction_reference || "-"}
                      </td>
                      <td className="py-4 text-[#7a9abd]">
                        {new Date(deposit.created_at).toLocaleString()}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() =>
                            openPaymentProof(deposit.payment_screenshot_url)
                          }
                          className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd]"
                        >
                          View Proof
                        </button>
                      </td>
                      <td className="space-x-2 py-4">
                        <button
                          onClick={() => approveDeposit(deposit.id)}
                          disabled={actionLoadingId === `deposit-${deposit.id}`}
                          className="rounded-lg bg-[#00b86b] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {actionLoadingId === `deposit-${deposit.id}`
                            ? "Working..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() => rejectDeposit(deposit.id)}
                          disabled={actionLoadingId === `deposit-${deposit.id}`}
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}

                  {pendingDeposits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#7a9abd]">
                        No pending deposits.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* WITHDRAWAL APPROVALS */}
          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Pending Withdrawals</h2>
            <p className="mt-2 text-[#7a9abd]">
              Review withdrawal details before approving payment.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                  Processed Reference Optional
                </label>
                <input
                  value={processedReference}
                  onChange={(e) => setProcessedReference(e.target.value)}
                  placeholder="Example: PAID-TXN-12345"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                  Withdrawal Admin Note Optional
                </label>
                <input
                  value={withdrawalAdminNote}
                  onChange={(e) => setWithdrawalAdminNote(e.target.value)}
                  placeholder="Example: Paid successfully."
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">Account Name</th>
                    <th className="py-3">Method</th>
                    <th className="py-3">Account / Wallet</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-[#172036]">
                      <td className="py-4 font-semibold">
                        {withdrawal.account_name || "Unknown"}
                      </td>
                      <td className="py-4 text-[#7a9abd]">
                        {withdrawal.withdrawal_method}
                      </td>
                      <td className="max-w-[300px] truncate py-4 text-[#7a9abd]">
                        {withdrawal.account_number_or_wallet}
                      </td>
                      <td className="py-4 font-bold">{withdrawal.amount}</td>
                      <td className="py-4 text-[#7a9abd]">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </td>
                      <td className="space-x-2 py-4">
                        <button
                          onClick={() => approveWithdrawal(withdrawal.id)}
                          disabled={
                            actionLoadingId === `withdrawal-${withdrawal.id}`
                          }
                          className="rounded-lg bg-[#00b86b] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {actionLoadingId === `withdrawal-${withdrawal.id}`
                            ? "Working..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() => rejectWithdrawal(withdrawal.id)}
                          disabled={
                            actionLoadingId === `withdrawal-${withdrawal.id}`
                          }
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}

                  {pendingWithdrawals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#7a9abd]">
                        No pending withdrawals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REVIEWED DEPOSITS */}
          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Reviewed Deposits</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">Member</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Reference</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {reviewedDeposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-[#172036]">
                      <td className="py-4 font-semibold">
                        {deposit.sender_name || "Unknown"}
                      </td>
                      <td className="py-4">{deposit.amount}</td>
                      <td className="py-4 text-[#7a9abd]">
                        {deposit.transaction_reference || "-"}
                      </td>
                      <td className="py-4">
                        {deposit.status === "approved" ? (
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                            Approved
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
                            {deposit.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-[#7a9abd]">
                        {new Date(deposit.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {reviewedDeposits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#7a9abd]">
                        No reviewed deposits yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REVIEWED WITHDRAWALS */}
          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Reviewed Withdrawals</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">Account Name</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Method</th>
                    <th className="py-3">Account / Wallet</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Processed Ref</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {reviewedWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-[#172036]">
                      <td className="py-4 font-semibold">
                        {withdrawal.account_name || "Unknown"}
                      </td>
                      <td className="py-4">{withdrawal.amount}</td>
                      <td className="py-4 text-[#7a9abd]">
                        {withdrawal.withdrawal_method}
                      </td>
                      <td className="max-w-[250px] truncate py-4 text-[#7a9abd]">
                        {withdrawal.account_number_or_wallet}
                      </td>
                      <td className="py-4">
                        {withdrawal.status === "approved" ? (
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                            Approved
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
                            {withdrawal.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-[#7a9abd]">
                        {withdrawal.processed_reference || "-"}
                      </td>
                      <td className="py-4 text-[#7a9abd]">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {reviewedWithdrawals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#7a9abd]">
                        No reviewed withdrawals yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}