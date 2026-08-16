"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PairingDeposit = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  amount: number;
  status: string;
  transaction_reference: string | null;
  created_at: string;
  approved_at: string | null;
  paired_amount: number;
  remaining_amount: number;
};

type PairingWithdrawal = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  amount: number;
  status: string;
  withdrawal_method: string | null;
  account_name: string | null;
  account_number_or_wallet: string | null;
  created_at: string;
  reviewed_at: string | null;
  paired_amount: number;
  remaining_amount: number;
};

type AdminPairing = {
  id: string;
  deposit_request_id: string | null;
  withdrawal_request_id: string | null;
  payer_user_id: string | null;
  receiver_user_id: string | null;
  payer_name: string | null;
  payer_email: string | null;
  receiver_name: string | null;
  receiver_email: string | null;
  amount: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  completed_at: string | null;
};

export default function AdminPairingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [deposits, setDeposits] = useState<PairingDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<PairingWithdrawal[]>([]);
  const [pairings, setPairings] = useState<AdminPairing[]>([]);

  const [selectedDepositId, setSelectedDepositId] = useState("");
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState("");
  const [amount, setAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkAdminAndLoadPairingPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAdminAndLoadPairingPage() {
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

    if (profile.role !== "admin" && profile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    if (profile.status === "blocked" || profile.status === "suspended") {
      router.push("/login");
      return;
    }

    await loadPairingData();
    setLoading(false);
  }

  async function loadPairingData() {
    setErrorMessage("");

    const { data: candidateData, error: candidateError } = await supabase.rpc(
      "get_pairing_candidates_for_admin",
      {}
    );

    if (candidateError) {
      setErrorMessage(candidateError.message);
      return;
    }

    const candidates = candidateData as {
      approved_deposits?: PairingDeposit[];
      approved_withdrawals?: PairingWithdrawal[];
    };

    setDeposits(candidates?.approved_deposits || []);
    setWithdrawals(candidates?.approved_withdrawals || []);

    const { data: pairingData, error: pairingError } = await supabase.rpc(
      "get_pairings_for_admin",
      {}
    );

    if (pairingError) {
      setErrorMessage(pairingError.message);
      return;
    }

    setPairings((pairingData || []) as AdminPairing[]);
  }

  function selectedDeposit() {
    return deposits.find((deposit) => deposit.id === selectedDepositId);
  }

  function selectedWithdrawal() {
    return withdrawals.find(
      (withdrawal) => withdrawal.id === selectedWithdrawalId
    );
  }

  function maxPairableAmount() {
    const deposit = selectedDeposit();
    const withdrawal = selectedWithdrawal();

    if (!deposit || !withdrawal) return 0;

    return Math.min(
      Number(deposit.remaining_amount || 0),
      Number(withdrawal.remaining_amount || 0)
    );
  }

  function useMaxAmount() {
    const maxAmount = maxPairableAmount();

    if (maxAmount <= 0) {
      setErrorMessage("Please select a valid deposit and withdrawal first.");
      return;
    }

    setAmount(String(maxAmount));
  }

  async function handleCreatePairing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const deposit = selectedDeposit();
    const withdrawal = selectedWithdrawal();
    const pairingAmount = Number(amount);
    const maxAmount = maxPairableAmount();

    if (!deposit) {
      setErrorMessage("Please select an approved deposit.");
      return;
    }

    if (!withdrawal) {
      setErrorMessage("Please select an approved withdrawal.");
      return;
    }

    if (deposit.user_id === withdrawal.user_id) {
      setErrorMessage("A member cannot be paired with their own withdrawal.");
      return;
    }

    if (!pairingAmount || pairingAmount <= 0) {
      setErrorMessage("Please enter a valid pairing amount.");
      return;
    }

    if (pairingAmount > maxAmount) {
      setErrorMessage(
        `Pairing amount cannot be greater than ${maxAmount.toFixed(2)}.`
      );
      return;
    }

    setCreating(true);

    const { error } = await supabase.rpc("create_deposit_withdrawal_pairing", {
      p_deposit_request_id: selectedDepositId,
      p_withdrawal_request_id: selectedWithdrawalId,
      p_amount: pairingAmount,
      p_admin_note: adminNote.trim() || null,
    });

    if (error) {
      setCreating(false);
      setErrorMessage(error.message);
      return;
    }

    let whatsappStatus = " WhatsApp notification processed successfully.";

    try {
      const notificationResponse = await fetch(
        "/api/notifications/pairing-created",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiverUserId: withdrawal.user_id,
            payerName: deposit.full_name || deposit.email || "A member",
            payerPhone: deposit.phone || "",
            amount: pairingAmount,
            withdrawalMethod: withdrawal.withdrawal_method || "",
            accountNumberOrWallet: withdrawal.account_number_or_wallet || "",
          }),
        }
      );

      const notificationData = await notificationResponse
        .json()
        .catch(() => null);

      if (!notificationResponse.ok || notificationData?.success === false) {
        whatsappStatus = ` Pairing created, but WhatsApp notification failed: ${
          notificationData?.error || "Unknown notification error."
        }`;
      } else if (notificationData?.result?.skipped) {
        whatsappStatus = ` Pairing created, but WhatsApp notification was skipped: ${
          notificationData.result.reason ||
          "Receiver is not eligible for WhatsApp."
        }`;
      }
    } catch (notificationError) {
      whatsappStatus = ` Pairing created, but WhatsApp notification failed: ${
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown notification error."
      }`;
    }

    setCreating(false);

    setMessage(`Pairing created successfully.${whatsappStatus}`);
    setSelectedDepositId("");
    setSelectedWithdrawalId("");
    setAmount("");
    setAdminNote("");

    await loadPairingData();
  }

  async function updatePairingStatus(pairingId: string, status: string) {
    setMessage("");
    setErrorMessage("");
    setUpdatingId(pairingId);

    const { error } = await supabase.rpc("update_pairing_status", {
      p_pairing_id: pairingId,
      p_status: status,
    });

    if (error) {
      setUpdatingId(null);
      setErrorMessage(error.message);
      return;
    }

    let whatsappStatus = "";

    if (status === "completed") {
      whatsappStatus = " WhatsApp notification processed successfully.";

      try {
        const notificationResponse = await fetch(
          "/api/notifications/pairing-completed",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pairingId,
            }),
          }
        );

        const notificationData = await notificationResponse
          .json()
          .catch(() => null);

        if (!notificationResponse.ok || notificationData?.success === false) {
          whatsappStatus = ` Pairing completed, but WhatsApp notification failed: ${
            notificationData?.error || "Unknown notification error."
          }`;
        } else if (notificationData?.result?.skipped) {
          whatsappStatus = ` Pairing completed, but WhatsApp notification was skipped: ${
            notificationData.result.reason ||
            "Payer is not eligible for WhatsApp."
          }`;
        }
      } catch (notificationError) {
        whatsappStatus = ` Pairing completed, but WhatsApp notification failed: ${
          notificationError instanceof Error
            ? notificationError.message
            : "Unknown notification error."
        }`;
      }
    }

    setUpdatingId(null);
    setMessage(`Pairing status updated successfully.${whatsappStatus}`);

    await loadPairingData();
  }

  function statusBadge(status: string) {
    if (status === "completed" || status === "approved") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "cancelled" || status === "rejected") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading pairing system...
      </main>
    );
  }

  const maxAmount = maxPairableAmount();

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-7xl">
        <a
          href="/admin"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Admin Dashboard
        </a>

        <section className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="text-3xl font-extrabold">Pairing System</h1>

          <p className="mt-2 text-[#7a9abd]">
            Pair approved deposit members with approved withdrawal members.
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
            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Approved Deposits</p>
              <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
                {deposits.length}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Approved Withdrawals</p>
              <p className="mt-2 text-3xl font-extrabold text-yellow-400">
                {withdrawals.length}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Active Pairings</p>
              <p className="mt-2 text-3xl font-extrabold">
                {pairings.filter((pairing) => pairing.status === "active").length}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Completed Pairings</p>
              <p className="mt-2 text-3xl font-extrabold text-green-400">
                {
                  pairings.filter((pairing) => pairing.status === "completed")
                    .length
                }
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">Create New Pairing</h2>

          <p className="mt-2 text-[#7a9abd]">
            Select one approved deposit and one approved withdrawal. The amount
            cannot exceed the remaining balance of either request.
          </p>

          <form onSubmit={handleCreatePairing} className="mt-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Approved Deposit / Payer
                </label>

                <select
                  value={selectedDepositId}
                  onChange={(e) => setSelectedDepositId(e.target.value)}
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                >
                  <option value="">Select approved deposit</option>

                  {deposits.map((deposit) => (
                    <option key={deposit.id} value={deposit.id}>
                      {deposit.full_name || "Unknown"} | Remaining{" "}
                      {Number(deposit.remaining_amount || 0).toFixed(2)} | Total{" "}
                      {Number(deposit.amount || 0).toFixed(2)}
                    </option>
                  ))}
                </select>

                {selectedDeposit() && (
                  <div className="mt-4 rounded-xl border border-[#172036] bg-[#0b0f1c] p-4 text-sm text-[#7a9abd]">
                    <p>
                      <strong className="text-white">Name:</strong>{" "}
                      {selectedDeposit()?.full_name || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Email:</strong>{" "}
                      {selectedDeposit()?.email || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Phone:</strong>{" "}
                      {selectedDeposit()?.phone || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Reference:</strong>{" "}
                      {selectedDeposit()?.transaction_reference || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Remaining:</strong>{" "}
                      {Number(
                        selectedDeposit()?.remaining_amount || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Approved Withdrawal / Receiver
                </label>

                <select
                  value={selectedWithdrawalId}
                  onChange={(e) => setSelectedWithdrawalId(e.target.value)}
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                >
                  <option value="">Select approved withdrawal</option>

                  {withdrawals.map((withdrawal) => (
                    <option key={withdrawal.id} value={withdrawal.id}>
                      {withdrawal.full_name || "Unknown"} | Remaining{" "}
                      {Number(withdrawal.remaining_amount || 0).toFixed(2)} |{" "}
                      {withdrawal.withdrawal_method || "Method"}
                    </option>
                  ))}
                </select>

                {selectedWithdrawal() && (
                  <div className="mt-4 rounded-xl border border-[#172036] bg-[#0b0f1c] p-4 text-sm text-[#7a9abd]">
                    <p>
                      <strong className="text-white">Name:</strong>{" "}
                      {selectedWithdrawal()?.full_name || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Email:</strong>{" "}
                      {selectedWithdrawal()?.email || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Phone:</strong>{" "}
                      {selectedWithdrawal()?.phone || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Method:</strong>{" "}
                      {selectedWithdrawal()?.withdrawal_method || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Account / Wallet:</strong>{" "}
                      {selectedWithdrawal()?.account_number_or_wallet || "-"}
                    </p>
                    <p>
                      <strong className="text-white">Remaining:</strong>{" "}
                      {Number(
                        selectedWithdrawal()?.remaining_amount || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Pairing Amount
                </label>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={
                    maxAmount > 0
                      ? `Maximum ${maxAmount.toFixed(2)}`
                      : "Select deposit and withdrawal first"
                  }
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={useMaxAmount}
                className="self-end rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-3 font-semibold text-[#7a9abd]"
              >
                Use Max Amount
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Admin Note Optional
              </label>

              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Optional note for this pairing..."
                className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-6 w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Creating Pairing..." : "Create Pairing →"}
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <h2 className="text-2xl font-bold">Approved Deposits Waiting</h2>

            <div className="mt-5 space-y-3">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        {deposit.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-[#7a9abd]">
                        {deposit.email || "-"} | {deposit.phone || "-"}
                      </p>
                      <p className="mt-2 text-sm text-[#7a9abd]">
                        Reference: {deposit.transaction_reference || "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-[#00b86b]">
                        {Number(deposit.remaining_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-[#4e6880]">remaining</p>
                    </div>
                  </div>
                </div>
              ))}

              {deposits.length === 0 && (
                <p className="text-[#7a9abd]">
                  No approved deposits waiting for pairing.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <h2 className="text-2xl font-bold">Approved Withdrawals Waiting</h2>

            <div className="mt-5 space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        {withdrawal.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-[#7a9abd]">
                        {withdrawal.email || "-"} | {withdrawal.phone || "-"}
                      </p>
                      <p className="mt-2 text-sm text-[#7a9abd]">
                        Method: {withdrawal.withdrawal_method || "-"}
                      </p>
                      <p className="text-sm text-[#7a9abd]">
                        Account: {withdrawal.account_number_or_wallet || "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-yellow-400">
                        {Number(withdrawal.remaining_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-[#4e6880]">remaining</p>
                    </div>
                  </div>
                </div>
              ))}

              {withdrawals.length === 0 && (
                <p className="text-[#7a9abd]">
                  No approved withdrawals waiting for pairing.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">Existing Pairings</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Payer</th>
                  <th className="py-3">Receiver</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Admin Note</th>
                  <th className="py-3">Created</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {pairings.map((pairing) => (
                  <tr key={pairing.id} className="border-b border-[#172036]">
                    <td className="py-4">
                      <p className="font-bold">
                        {pairing.payer_name || "Unknown"}
                      </p>
                      <p className="text-sm text-[#7a9abd]">
                        {pairing.payer_email || "-"}
                      </p>
                    </td>

                    <td className="py-4">
                      <p className="font-bold">
                        {pairing.receiver_name || "Unknown"}
                      </p>
                      <p className="text-sm text-[#7a9abd]">
                        {pairing.receiver_email || "-"}
                      </p>
                    </td>

                    <td className="py-4 font-bold text-[#00b86b]">
                      {Number(pairing.amount || 0).toFixed(2)}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          pairing.status
                        )}`}
                      >
                        {pairing.status}
                      </span>
                    </td>

                    <td className="max-w-[240px] py-4 text-[#7a9abd]">
                      {pairing.admin_note || "-"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {new Date(pairing.created_at).toLocaleString()}
                    </td>

                    <td className="py-4">
                      <div className="flex gap-2">
                        {pairing.status !== "completed" && (
                          <button
                            onClick={() =>
                              updatePairingStatus(pairing.id, "completed")
                            }
                            disabled={updatingId === pairing.id}
                            className="rounded-lg bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-400 disabled:opacity-60"
                          >
                            Complete
                          </button>
                        )}

                        {pairing.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              updatePairingStatus(pairing.id, "cancelled")
                            }
                            disabled={updatingId === pairing.id}
                            className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {pairings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7a9abd]">
                      No pairings created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}