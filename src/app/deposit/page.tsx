"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PaymentMethod = {
  id: string;
  method_name?: string | null;
  name?: string | null;
  slug?: string | null;
  method_type?: string | null;

  receiving_number_or_address?: string | null;
  receiving_details?: string | null;
  receiving_number_or_wallet?: string | null;
  receiving_number?: string | null;
  account_number?: string | null;
  wallet_address?: string | null;

  payment_instructions?: string | null;
  instructions?: string | null;
  minimum_deposit?: number | null;
  is_active?: boolean | null;
};

type DepositRequest = {
  id: string;
  amount: number;
  status: string;
  transaction_reference: string | null;
  created_at: string;
  maturity_date: string | null;
  expected_profit: number | null;
  maturity_status: string | null;
};

type PublicSettings = {
  minimum_withdrawal: number;
  minimum_deposit: number;
  return_percentage: number;
  maturity_timer_days: number;
  pairing_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  allow_same_or_higher_deposit_only: boolean;
};

export default function DepositPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");

  const [minimumDeposit, setMinimumDeposit] = useState(250);
  const [returnPercentage, setReturnPercentage] = useState(0);
  const [maturityDays, setMaturityDays] = useState(0);
  const [previousApprovedDeposit, setPreviousApprovedDeposit] = useState(0);
  const [sameOrHigherOnly, setSameOrHigherOnly] = useState(true);

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);

  const [amount, setAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDepositPage();
  }, []);

  async function loadDepositPage() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    setSenderName(profile?.full_name || "");
    setSenderPhone(profile?.phone || "");

    const { data: settingsData, error: settingsError } = await supabase
      .rpc("get_public_system_settings", {})
      .single();

    if (settingsError) {
      setErrorMessage(settingsError.message);
      setLoading(false);
      return;
    }

    const settings = settingsData as PublicSettings;

    setMinimumDeposit(Number(settings.minimum_deposit || 250));
    setReturnPercentage(Number(settings.return_percentage || 0));
    setMaturityDays(Number(settings.maturity_timer_days || 0));
    setSameOrHigherOnly(Boolean(settings.allow_same_or_higher_deposit_only));

    const { data: methods, error: methodsError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (methodsError) {
      setErrorMessage(methodsError.message);
      setLoading(false);
      return;
    }

    const activeMethods = (methods || []) as PaymentMethod[];
    setPaymentMethods(activeMethods);

    if (activeMethods.length > 0) {
      setSelectedPaymentMethodId(activeMethods[0].id);
    }

    const { data: lastDeposit } = await supabase
      .from("deposit_requests")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setPreviousApprovedDeposit(Number(lastDeposit?.amount || 0));

    await loadDeposits(user.id);

    setLoading(false);
  }

  async function loadDeposits(userId: string) {
    const { data, error } = await supabase
      .from("deposit_requests")
      .select(
        "id, amount, status, transaction_reference, created_at, maturity_date, expected_profit, maturity_status"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setDeposits((data || []) as DepositRequest[]);
  }

  function getMethodName(method: PaymentMethod) {
    return method.method_name || method.name || "Payment Method";
  }

  function getReceivingDetails(method: PaymentMethod | undefined) {
    if (!method) return "Not set";

    return (
      method.receiving_number_or_address ||
      method.receiving_details ||
      method.receiving_number_or_wallet ||
      method.receiving_number ||
      method.account_number ||
      method.wallet_address ||
      "Not set"
    );
  }

  function getInstructions(method: PaymentMethod | undefined) {
    if (!method) return "-";

    return (
      method.payment_instructions ||
      method.instructions ||
      "Send payment to the receiving number or wallet address, then upload your payment screenshot."
    );
  }

  function selectedMethod() {
    return paymentMethods.find((method) => method.id === selectedPaymentMethodId);
  }

  function requiredMinimumAmount() {
    const method = selectedMethod();
    const methodMinimum = Number(method?.minimum_deposit || 0);
    const previousMinimum = sameOrHigherOnly ? previousApprovedDeposit : 0;

    return Math.max(minimumDeposit, methodMinimum, previousMinimum);
  }

  function expectedProfit() {
    const depositAmount = Number(amount || 0);

    if (!depositAmount || depositAmount <= 0) return 0;

    return (depositAmount * returnPercentage) / 100;
  }

  async function handleSubmitDeposit(e: React.FormEvent<HTMLFormElement>) {
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

    const depositAmount = Number(amount);
    const minimumAllowed = requiredMinimumAmount();

    if (!selectedPaymentMethodId) {
      setErrorMessage("Please select a payment method.");
      return;
    }

    if (!depositAmount || depositAmount <= 0) {
      setErrorMessage("Please enter a valid deposit amount.");
      return;
    }

    if (depositAmount < minimumAllowed) {
      setErrorMessage(
        `Deposit amount cannot be less than ${minimumAllowed.toFixed(2)}.`
      );
      return;
    }

    if (!senderName.trim()) {
      setErrorMessage("Please enter sender name.");
      return;
    }

    if (!senderPhone.trim()) {
      setErrorMessage("Please enter sender phone number.");
      return;
    }

    if (!transactionReference.trim()) {
      setErrorMessage("Please enter transaction reference.");
      return;
    }

    if (!paymentScreenshot) {
      setErrorMessage("Please upload payment screenshot.");
      return;
    }

    if (paymentScreenshot.size > 5 * 1024 * 1024) {
      setErrorMessage("Payment screenshot must be 5MB or less.");
      return;
    }

    setSubmitting(true);

    const extension = paymentScreenshot.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("deposit-screenshots")
      .upload(filePath, paymentScreenshot, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setSubmitting(false);
      setErrorMessage(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("deposit_requests").insert({
      user_id: user.id,
      payment_method_id: selectedPaymentMethodId,
      amount: depositAmount,
      sender_name: senderName.trim(),
      sender_phone: senderPhone.trim(),
      transaction_reference: transactionReference.trim(),
      payment_screenshot_url: filePath,
      status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setErrorMessage(insertError.message);
      return;
    }

    setMessage("Deposit request submitted successfully. Admin will review it shortly.");
    setAmount("");
    setTransactionReference("");
    setPaymentScreenshot(null);

    await loadDeposits(user.id);
  }

  function statusBadge(status: string) {
    if (status === "approved" || status === "matured") {
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
        Loading deposit page...
      </main>
    );
  }

  const method = selectedMethod();
  const minimumAllowed = requiredMinimumAmount();

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-4xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="mb-2 text-3xl font-extrabold">Make a Deposit</h1>

          <p className="mb-6 text-[#7a9abd]">
            Submit your payment details. Admin will verify and approve your deposit.
          </p>

          <div className="mb-6 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Minimum Deposit</p>
              <p className="mt-2 text-2xl font-extrabold text-[#00b86b]">
                {minimumAllowed.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Return Percentage</p>
              <p className="mt-2 text-2xl font-extrabold">
                {returnPercentage}%
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Maturity Timer</p>
              <p className="mt-2 text-2xl font-extrabold">
                {maturityDays} days
              </p>
            </div>
          </div>

          {sameOrHigherOnly && previousApprovedDeposit > 0 && (
            <p className="mb-5 rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
              Your previous approved deposit was {previousApprovedDeposit.toFixed(2)}.
              Your next deposit must be the same amount or higher.
            </p>
          )}

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

          <form onSubmit={handleSubmitDeposit}>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Payment Method
            </label>

            <select
              value={selectedPaymentMethodId}
              onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            >
              {paymentMethods.map((paymentMethod) => (
                <option key={paymentMethod.id} value={paymentMethod.id}>
                  {getMethodName(paymentMethod)}
                </option>
              ))}
            </select>

            {method && (
              <div className="mb-6 rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Send Payment To
                </p>

                <p className="mt-2 break-all text-2xl font-extrabold text-[#00b86b]">
                  {getReceivingDetails(method)}
                </p>

                <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Instructions
                </p>

                <p className="mt-2 text-[#7a9abd]">{getInstructions(method)}</p>
              </div>
            )}

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Amount
            </label>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ${minimumAllowed.toFixed(2)}`}
              className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            {Number(amount || 0) > 0 && (
              <p className="mb-5 rounded-lg bg-[#172036] px-4 py-3 text-sm text-[#7a9abd]">
                Expected profit after maturity:{" "}
                <span className="font-bold text-[#00b86b]">
                  {expectedProfit().toFixed(2)}
                </span>
              </p>
            )}

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Sender Name
            </label>

            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Name used for payment"
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Sender Phone
            </label>

            <input
              type="text"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="Phone used for payment"
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Transaction Reference
            </label>

            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="Example: TXN123456"
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Payment Screenshot
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
              className="mb-6 w-full rounded-xl border border-dashed border-[#172036] bg-[#0b0f1c] px-4 py-5 text-sm text-[#7a9abd]"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Deposit Request →"}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">My Deposit Requests</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Amount</th>
                  <th className="py-3">Expected Profit</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Maturity</th>
                  <th className="py-3">Reference</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-[#172036]">
                    <td className="py-4 font-bold">{deposit.amount}</td>

                    <td className="py-4 text-[#00b86b]">
                      {Number(deposit.expected_profit || 0).toFixed(2)}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          deposit.status
                        )}`}
                      >
                        {deposit.status}
                      </span>
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {deposit.maturity_date
                        ? new Date(deposit.maturity_date).toLocaleString()
                        : "-"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {deposit.transaction_reference || "-"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {new Date(deposit.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {deposits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#7a9abd]">
                      No deposit requests yet.
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