"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MyPairing = {
id: string;
deposit_request_id: string | null;
withdrawal_request_id: string | null;
role_in_pairing: string;
counterparty_name: string | null;
counterparty_phone: string | null;
amount: number;
status: string;
withdrawal_method: string | null;
payment_account_name: string | null;
payment_account_or_wallet: string | null;
admin_note: string | null;
created_at: string;
completed_at: string | null;
};

type ConfirmationResult = {
success?: boolean;
pairing_id?: string;
pairing_status?: string;
deposit_amount?: number;
confirmed_amount?: number;
countdown_started?: boolean;
maturity_date?: string | null;
};

export default function PairingPage() {
const router = useRouter();
const supabase = createClient();

const [loading, setLoading] = useState(true);
const [pairings, setPairings] = useState<MyPairing[]>([]);
const [confirmingPairingId, setConfirmingPairingId] = useState<
string | null

> (null);

const [errorMessage, setErrorMessage] = useState("");
const [successMessage, setSuccessMessage] = useState("");
const [copiedValue, setCopiedValue] = useState("");

useEffect(() => {
void loadPairings();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

async function loadPairings(keepMessages = false) {
setLoading(true);

if (!keepMessages) {
  setErrorMessage("");
  setSuccessMessage("");
}

try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    router.push("/login");
    return;
  }

  const { data, error } = await supabase.rpc("get_my_pairings");

  if (error) {
    setErrorMessage(error.message);
    return;
  }

  setPairings((data || []) as MyPairing[]);
} catch {
  setErrorMessage(
    "An unexpected error occurred while loading your pairings."
  );
} finally {
  setLoading(false);
}

}

async function copyValue(value: string | null, label: string) {
if (!value) {
return;
}

try {
  await navigator.clipboard.writeText(value);
  setCopiedValue(label);

  window.setTimeout(() => {
    setCopiedValue("");
  }, 2000);
} catch {
  setErrorMessage("The value could not be copied automatically.");
}

}

async function handleConfirmPaymentReceived(pairing: MyPairing) {
setErrorMessage("");
setSuccessMessage("");

if (pairing.role_in_pairing !== "receiver") {
  setErrorMessage(
    "Only the withdrawal receiver can confirm that payment was received."
  );
  return;
}

if (pairing.status !== "active") {
  setErrorMessage("Only an active pairing can be confirmed.");
  return;
}

const paymentAmount = Number(pairing.amount || 0).toFixed(2);
const payerName = pairing.counterparty_name || "the payer";

const confirmed = window.confirm(
  `Confirm that you have received K${paymentAmount} from ${payerName}?\n\nOnly continue after the payment is visible in your account or wallet.`
);

if (!confirmed) {
  return;
}

setConfirmingPairingId(pairing.id);

try {
  const { data, error } = await supabase.rpc(
    "confirm_pairing_payment_received",
    {
      p_pairing_id: pairing.id,
    }
  );

  if (error) {
    setErrorMessage(error.message);
    return;
  }

  const result = (data || {}) as ConfirmationResult;

  if (result.countdown_started) {
    const maturityDate = result.maturity_date
      ? new Date(result.maturity_date).toLocaleString()
      : "the configured maturity date";

    setSuccessMessage(
      `Payment received successfully. The pairing is complete and the payer's maturity countdown has started. Maturity date: ${maturityDate}.`
    );
  } else {
    setSuccessMessage(
      "Payment received successfully. This pairing is complete. The payer's countdown will start after the full deposit amount has been confirmed."
    );
  }

  await loadPairings(true);
} catch {
  setErrorMessage(
    "An unexpected error occurred while confirming the payment."
  );
} finally {
  setConfirmingPairingId(null);
}

}

function statusBadge(status: string) {
if (status === "completed") {
return "bg-green-500/10 text-green-400";
}

if (status === "cancelled") {
  return "bg-red-500/10 text-red-400";
}

return "bg-yellow-500/10 text-yellow-400";

}

function roleText(role: string) {
if (role === "payer") {
return "You are the deposit payer";
}

if (role === "receiver") {
  return "You are the withdrawal receiver";
}

return "Pairing member";

}

function paymentInstruction(role: string) {
if (role === "payer") {
return "Send the paired amount using the receiver's payment details below. The receiver will confirm after the funds arrive.";
}


if (role === "receiver") {
  return "The payer will use your payment details below. After the full payment arrives, click Payment Received.";
}

return "Review the pairing and payment information below.";


}

if (loading) {
return ( <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
Loading pairing page... </main>
);
}

const activePairings = pairings.filter(
(pairing) => pairing.status === "active"
).length;

const completedPairings = pairings.filter(
(pairing) => pairing.status === "completed"
).length;

return ( <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]"> <div className="mx-auto max-w-5xl"> <a
       href="/dashboard"
       className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
     >
← Back to Dashboard </a>


    <section className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6 md:p-8">
      <h1 className="text-3xl font-extrabold">My Pairings</h1>

      <p className="mt-2 text-[#7a9abd]">
        View payment details, contact your counterparty and confirm received
        payments.
      </p>

      {errorMessage && (
        <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="mt-6 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {successMessage}
        </p>
      )}

      {copiedValue && (
        <p className="mt-6 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {copiedValue} copied successfully.
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm text-[#7a9abd]">Total Pairings</p>
          <p className="mt-2 text-3xl font-extrabold">{pairings.length}</p>
        </div>

        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm text-[#7a9abd]">Active Pairings</p>
          <p className="mt-2 text-3xl font-extrabold text-yellow-400">
            {activePairings}
          </p>
        </div>

        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm text-[#7a9abd]">Completed Pairings</p>
          <p className="mt-2 text-3xl font-extrabold text-green-400">
            {completedPairings}
          </p>
        </div>
      </div>
    </section>

    <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 md:p-8">
      <h2 className="text-2xl font-bold">Pairing History</h2>

      <div className="mt-6 space-y-5">
        {pairings.map((pairing) => {
          const isReceiver = pairing.role_in_pairing === "receiver";
          const isPayer = pairing.role_in_pairing === "payer";
          const isActive = pairing.status === "active";
          const isCompleted = pairing.status === "completed";
          const isConfirming = confirmingPairingId === pairing.id;

          return (
            <div
              key={pairing.id}
              className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5 md:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                    {roleText(pairing.role_in_pairing)}
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Amount:{" "}
                    <span className="text-[#00b86b]">
                      K{Number(pairing.amount || 0).toFixed(2)}
                    </span>
                  </h3>

                  <p className="mt-2 text-[#7a9abd]">
                    Counterparty:{" "}
                    <span className="font-semibold text-[#dde2ef]">
                      {pairing.counterparty_name || "Unknown"}
                    </span>
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm ${statusBadge(
                    pairing.status
                  )}`}
                >
                  {pairing.status}
                </span>
              </div>

              <p className="mt-5 rounded-lg bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                {paymentInstruction(pairing.role_in_pairing)}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#172036] bg-[#0e1526] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#4e6880]">
                    Counterparty Contact Phone
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-[#dde2ef]">
                      {pairing.counterparty_phone || "Not provided"}
                    </p>

                    {pairing.counterparty_phone && (
                      <button
                        type="button"
                        onClick={() =>
                          copyValue(
                            pairing.counterparty_phone,
                            "Phone number"
                          )
                        }
                        className="rounded-lg bg-[#172036] px-3 py-2 text-xs font-semibold text-[#7a9abd]"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#172036] bg-[#0e1526] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#4e6880]">
                    Payment Method
                  </p>

                  <p className="mt-2 font-semibold text-[#dde2ef]">
                    {pairing.withdrawal_method || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#172036] bg-[#0e1526] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#4e6880]">
                    Payment Account Name
                  </p>

                  <p className="mt-2 font-semibold text-[#dde2ef]">
                    {pairing.payment_account_name || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#172036] bg-[#0e1526] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#4e6880]">
                    Mobile Number / Wallet / Account
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="break-all font-semibold text-[#00b86b]">
                      {pairing.payment_account_or_wallet || "Not provided"}
                    </p>

                    {pairing.payment_account_or_wallet && (
                      <button
                        type="button"
                        onClick={() =>
                          copyValue(
                            pairing.payment_account_or_wallet,
                            "Payment details"
                          )
                        }
                        className="rounded-lg bg-[#172036] px-3 py-2 text-xs font-semibold text-[#7a9abd]"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isReceiver && isActive && (
                <div className="mt-6 rounded-xl border border-[#00b86b55] bg-[#00b86b0a] p-5">
                  <h4 className="text-lg font-bold text-[#00b86b]">
                    Have you received the payment?
                  </h4>

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    Confirm only after the complete paired amount is visible
                    in your mobile-money account, bank account or wallet.
                    This action cannot be reversed.
                  </p>

                  <button
                    type="button"
                    disabled={isConfirming}
                    onClick={() =>
                      void handleConfirmPaymentReceived(pairing)
                    }
                    className="mt-4 w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConfirming
                      ? "Confirming Payment..."
                      : "✓ Payment Received"}
                  </button>
                </div>
              )}

              {isPayer && isActive && (
                <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
                  <h4 className="font-bold text-yellow-400">
                    Waiting for receiver confirmation
                  </h4>

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    After sending the money, contact the receiver if
                    necessary. Your maturity countdown starts after the full
                    deposit amount has been confirmed.
                  </p>
                </div>
              )}

              {isCompleted && (
                <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-5">
                  <h4 className="font-bold text-green-400">
                    ✓ Payment confirmed
                  </h4>

                  <p className="mt-2 text-sm text-[#7a9abd]">
                    This pairing has been completed and the payment receipt
                    was confirmed.
                  </p>
                </div>
              )}

              {pairing.admin_note && (
                <p className="mt-5 text-sm text-[#7a9abd]">
                  <span className="font-semibold text-[#dde2ef]">
                    Admin Note:
                  </span>{" "}
                  {pairing.admin_note}
                </p>
              )}

              <div className="mt-5 grid gap-4 border-t border-[#172036] pt-5 text-sm text-[#7a9abd] md:grid-cols-2">
                <p>
                  Created:{" "}
                  {new Date(pairing.created_at).toLocaleString()}
                </p>

                <p>
                  Completed:{" "}
                  {pairing.completed_at
                    ? new Date(pairing.completed_at).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
          );
        })}

        {pairings.length === 0 && (
          <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-6 text-center text-[#7a9abd]">
            No pairings found yet.
          </div>
        )}
      </div>
    </section>
  </div>
</main>

);
}
