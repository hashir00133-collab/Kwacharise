"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PaymentMethod = {
  id: string;
  name: string;
  method_type: string;
  receiving_number_or_address: string;
  instructions: string | null;
  minimum_deposit: number;
  is_active: boolean;
};

export default function DepositPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");

  const [amount, setAmount] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedMethod = paymentMethods.find(
    (method) => method.id === selectedMethodId
  );

  useEffect(() => {
    loadDepositPage();
  }, []);

  async function loadDepositPage() {
    setLoading(true);

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

    if (profile) {
      setProfileName(profile.full_name || "");
      setProfilePhone(profile.phone || "");
    }

    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setPaymentMethods(data || []);

    if (data && data.length > 0) {
      setSelectedMethodId(data[0].id);
    }

    setLoading(false);
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

    if (!selectedMethod) {
      setErrorMessage("Please select a payment method.");
      return;
    }

    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      setErrorMessage("Please enter a valid deposit amount.");
      return;
    }

    if (depositAmount < Number(selectedMethod.minimum_deposit || 0)) {
      setErrorMessage(
        `Minimum deposit for ${selectedMethod.name} is ${selectedMethod.minimum_deposit}.`
      );
      return;
    }

    if (!transactionReference) {
      setErrorMessage("Please enter your transaction reference.");
      return;
    }

    if (!screenshot) {
      setErrorMessage("Please upload your payment screenshot.");
      return;
    }

    setSubmitting(true);

    const fileExtension = screenshot.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("deposit-screenshots")
      .upload(filePath, screenshot, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setSubmitting(false);
      setErrorMessage(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("deposit_requests")
      .insert({
        user_id: user.id,
        payment_method_id: selectedMethod.id,
        amount: depositAmount,
        sender_name: profileName,
        sender_phone: profilePhone,
        transaction_reference: transactionReference,
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
    setScreenshot(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading deposit page...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="mb-2 text-3xl font-extrabold">Make a Deposit</h1>
          <p className="mb-8 text-[#7a9abd]">
            Submit your payment details. Admin will verify and approve your
            deposit.
          </p>

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

          {paymentMethods.length === 0 ? (
            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5 text-[#7a9abd]">
              No active payment methods are available right now. Please contact
              support.
            </div>
          ) : (
            <form onSubmit={handleSubmitDeposit}>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Payment Method
              </label>

              <select
                value={selectedMethodId}
                onChange={(e) => setSelectedMethodId(e.target.value)}
                className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>

              {selectedMethod && (
                <div className="mb-5 rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                    Send payment to
                  </p>
                  <p className="break-all text-xl font-extrabold text-[#00b86b]">
                    {selectedMethod.receiving_number_or_address}
                  </p>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                    Instructions
                  </p>
                  <p className="mt-1 text-sm text-[#7a9abd]">
                    {selectedMethod.instructions ||
                      "Send payment and upload your proof below."}
                  </p>

                  <p className="mt-4 text-sm text-[#7a9abd]">
                    Minimum deposit:{" "}
                    <span className="font-bold text-[#dde2ef]">
                      {selectedMethod.minimum_deposit}
                    </span>
                  </p>
                </div>
              )}

              <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Minimum ${selectedMethod?.minimum_deposit || 0}`}
                className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Transaction Reference
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. MM-TXN-12345"
                className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Upload Payment Screenshot
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="mb-6 w-full rounded-xl border border-dashed border-[#172036] bg-[#0b0f1c] px-4 py-5 text-sm text-[#7a9abd]"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Deposit →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}