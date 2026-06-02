"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type WithdrawalRequest = {
  id: string;
  amount: number;
  withdrawal_method: string;
  account_name: string | null;
  account_number_or_wallet: string;
  status: string;
  created_at: string;
};

export default function WithdrawPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [balance, setBalance] = useState(0);
  const [minimumWithdrawal, setMinimumWithdrawal] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const [amount, setAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("Airtel Money");
  const [accountName, setAccountName] = useState("");
  const [accountNumberOrWallet, setAccountNumberOrWallet] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadWithdrawPage();
  }, []);

  async function loadWithdrawPage() {
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
      .select("balance, full_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    setBalance(Number(profile?.balance || 0));
    setAccountName(profile?.full_name || "");

    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("minimum_withdrawal")
      .eq("id", 1)
      .single();

    if (settingsError) {
      setErrorMessage(settingsError.message);
      setLoading(false);
      return;
    }

    setMinimumWithdrawal(Number(settings?.minimum_withdrawal || 0));

    await loadWithdrawals(user.id);

    setLoading(false);
  }

  async function loadWithdrawals(userId: string) {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setWithdrawals(data || []);
  }

  async function handleSubmitWithdrawal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const withdrawalAmount = Number(amount);

    if (!withdrawalAmount || withdrawalAmount <= 0) {
      setErrorMessage("Please enter a valid withdrawal amount.");
      return;
    }

    if (withdrawalAmount < minimumWithdrawal) {
      setErrorMessage(
        `Minimum withdrawal amount is ${minimumWithdrawal.toFixed(2)}.`
      );
      return;
    }

    if (withdrawalAmount > balance) {
      setErrorMessage("You do not have enough balance for this withdrawal.");
      return;
    }

    if (!withdrawalMethod) {
      setErrorMessage("Please select a withdrawal method.");
      return;
    }

    if (!accountName.trim()) {
      setErrorMessage("Please enter your account name.");
      return;
    }

    if (!accountNumberOrWallet.trim()) {
      setErrorMessage(
        "Please enter your mobile number, account number, or wallet address."
      );
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount: withdrawalAmount,
      withdrawal_method: withdrawalMethod,
      account_name: accountName.trim(),
      account_number_or_wallet: accountNumberOrWallet.trim(),
      status: "pending",
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Withdrawal request submitted successfully. Admin will review it shortly."
    );
    setAmount("");
    setAccountNumberOrWallet("");

    await loadWithdrawals(user.id);
  }

  function statusBadge(status: string) {
    if (status === "approved" || status === "completed" || status === "paid") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "rejected" || status === "cancelled") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading withdrawal page...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-3xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="mb-2 text-3xl font-extrabold">Withdraw Funds</h1>

          <p className="mb-6 text-[#7a9abd]">
            Submit your withdrawal request. Admin will process it after review.
          </p>

          <div className="mb-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Available Balance
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
                {balance.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Minimum Withdrawal
              </p>
              <p className="mt-2 text-3xl font-extrabold">
                {minimumWithdrawal.toFixed(2)}
              </p>
            </div>
          </div>

          {errorMessage && (
            <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          {message && (
            <p className="mb-5 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmitWithdrawal}>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Withdrawal Method
            </label>
            <select
              value={withdrawalMethod}
              onChange={(e) => setWithdrawalMethod(e.target.value)}
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            >
              <option value="Airtel Money">Airtel Money</option>
              <option value="MTN MoMo">MTN MoMo</option>
              <option value="USDT TRC20">USDT TRC20</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ${minimumWithdrawal.toFixed(2)}`}
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Account holder name"
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Mobile Number / Wallet Address / Account Number
            </label>
            <input
              type="text"
              value={accountNumberOrWallet}
              onChange={(e) => setAccountNumberOrWallet(e.target.value)}
              placeholder="Example: 0991234567 or wallet address"
              className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Withdrawal →"}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">My Withdrawal Requests</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Amount</th>
                  <th className="py-3">Method</th>
                  <th className="py-3">Account / Wallet</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-[#172036]">
                    <td className="py-4 font-bold">{withdrawal.amount}</td>

                    <td className="py-4 text-[#7a9abd]">
                      {withdrawal.withdrawal_method}
                    </td>

                    <td className="max-w-[250px] truncate py-4 text-[#7a9abd]">
                      {withdrawal.account_number_or_wallet}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          withdrawal.status
                        )}`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {new Date(withdrawal.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7a9abd]">
                      No withdrawal requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}