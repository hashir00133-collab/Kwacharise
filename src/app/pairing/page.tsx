"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PairingRecord = {
  id: string;
  user_id: string;
  paired_with_user_id: string | null;
  level: number;
  pairing_amount: number;
  status: "waiting" | "matched" | "completed" | "cancelled";
  notes: string | null;
  completed_at: string | null;
  created_at: string;
};

type PublicSettings = {
  minimum_withdrawal: number;
  pairing_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
};

export default function PairingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [balance, setBalance] = useState(0);
  const [pairingEnabled, setPairingEnabled] = useState(false);
  const [pairings, setPairings] = useState<PairingRecord[]>([]);

  const [level, setLevel] = useState("1");
  const [amount, setAmount] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadPairingPage();
  }, []);

  async function loadPairingPage() {
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
      .select("balance")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    setBalance(Number(profile?.balance || 0));

    const { data: settingsData, error: settingsError } = await supabase
      .rpc("get_public_system_settings", {})
      .single();

    if (settingsError) {
      setErrorMessage(settingsError.message);
      setLoading(false);
      return;
    }

    const settings = settingsData as PublicSettings;
    setPairingEnabled(Boolean(settings.pairing_enabled));

    await loadPairings(user.id);

    setLoading(false);
  }

  async function loadPairings(userId: string) {
    const { data, error } = await supabase
      .from("pairings")
      .select(
        "id, user_id, paired_with_user_id, level, pairing_amount, status, notes, completed_at, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setPairings((data || []) as PairingRecord[]);
  }

  async function handleCreatePairing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const pairingLevel = Number(level);
    const pairingAmount = Number(amount);

    if (!pairingEnabled) {
      setErrorMessage("Pairing system is currently disabled.");
      return;
    }

    if (!pairingLevel || pairingLevel < 1) {
      setErrorMessage("Please enter a valid pairing level.");
      return;
    }

    if (!pairingAmount || pairingAmount <= 0) {
      setErrorMessage("Please enter a valid pairing amount.");
      return;
    }

    if (pairingAmount > balance) {
      setErrorMessage("You do not have enough balance for this pairing request.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.rpc("create_pairing_request", {
      p_level: pairingLevel,
      p_pairing_amount: pairingAmount,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Pairing request submitted successfully.");
    setAmount("");

    await loadPairingPage();
  }

  async function cancelPairing(pairingId: string) {
    setMessage("");
    setErrorMessage("");
    setActionLoadingId(pairingId);

    const { error } = await supabase.rpc("cancel_my_pairing_request", {
      p_pairing_id: pairingId,
    });

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Pairing request cancelled and amount refunded.");
    await loadPairingPage();
  }

  function statusBadge(status: string) {
    if (status === "completed") return "bg-green-500/10 text-green-400";
    if (status === "matched") return "bg-blue-500/10 text-blue-400";
    if (status === "cancelled") return "bg-red-500/10 text-red-400";
    return "bg-yellow-500/10 text-yellow-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading pairing page...
      </main>
    );
  }

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
          <h1 className="mb-2 text-3xl font-extrabold">Pairing System</h1>

          <p className="mb-6 text-[#7a9abd]">
            Submit a pairing request. The system will automatically match you
            with another waiting member using the same level and amount.
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
                Pairing Status
              </p>
              <p
                className={
                  pairingEnabled
                    ? "mt-2 text-2xl font-bold text-green-400"
                    : "mt-2 text-2xl font-bold text-red-400"
                }
              >
                {pairingEnabled ? "Enabled" : "Disabled"}
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

          <form onSubmit={handleCreatePairing}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Pairing Level
                </label>
                <input
                  type="number"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="1"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Pairing Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Example: 50"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !pairingEnabled}
              className="mt-6 w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Pairing Request →"}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">My Pairing Requests</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Level</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Matched With</th>
                  <th className="py-3">Notes</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {pairings.map((pairing) => (
                  <tr key={pairing.id} className="border-b border-[#172036]">
                    <td className="py-4 font-bold">{pairing.level}</td>
                    <td className="py-4">{pairing.pairing_amount}</td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          pairing.status
                        )}`}
                      >
                        {pairing.status}
                      </span>
                    </td>

                    <td className="max-w-[180px] truncate py-4 text-[#7a9abd]">
                      {pairing.paired_with_user_id || "-"}
                    </td>

                    <td className="max-w-[220px] truncate py-4 text-[#7a9abd]">
                      {pairing.notes || "-"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {new Date(pairing.created_at).toLocaleString()}
                    </td>

                    <td className="py-4">
                      {pairing.status === "waiting" ? (
                        <button
                          onClick={() => cancelPairing(pairing.id)}
                          disabled={actionLoadingId === pairing.id}
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
                        >
                          {actionLoadingId === pairing.id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      ) : (
                        <span className="text-sm text-[#7a9abd]">-</span>
                      )}
                    </td>
                  </tr>
                ))}

                {pairings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#7a9abd]">
                      No pairing requests yet.
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