"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
full_name: string | null;
kyc_status: string;
capital_balance: number | null;
profit_balance: number | null;
bonus_balance: number | null;
reactivation_required: boolean | null;
completed_withdrawal_cycles: number | null;
};

type WithdrawalRequest = {
id: string;
amount: number;
withdrawal_method: string;
account_name: string | null;
account_number_or_wallet: string;
status: string;
source_profit_amount: number | null;
source_bonus_amount: number | null;
created_at: string;
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

export default function WithdrawPage() {
const router = useRouter();
const supabase = createClient();

const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);

const [profile, setProfile] = useState<Profile | null>(null);
const [minimumWithdrawal, setMinimumWithdrawal] = useState(0);

const [
referralBonusMinimumWithdrawal,
setReferralBonusMinimumWithdrawal,
] = useState(1000);

const [withdrawals, setWithdrawals] = useState<
WithdrawalRequest[]

> ([]);

const [amount, setAmount] = useState("");
const [withdrawalMethod, setWithdrawalMethod] =
useState("Airtel Money");
const [accountName, setAccountName] = useState("");
const [
accountNumberOrWallet,
setAccountNumberOrWallet,
] = useState("");

const [message, setMessage] = useState("");
const [errorMessage, setErrorMessage] = useState("");

useEffect(() => {
loadWithdrawPage();
}, []);

async function loadWithdrawPage(keepMessages = false) {
setLoading(true);

if (!keepMessages) {
  setErrorMessage("");
  setMessage("");
}

const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  router.push("/login");
  return;
}

const { data: profileData, error: profileError } =
  await supabase
    .from("profiles")
    .select(
      "full_name, kyc_status, capital_balance, profit_balance, bonus_balance, reactivation_required, completed_withdrawal_cycles"
    )
    .eq("id", user.id)
    .single();

if (profileError) {
  setErrorMessage(profileError.message);
  setLoading(false);
  return;
}

setProfile(profileData as Profile);
setAccountName(profileData?.full_name || "");

const { data: settingsData, error: settingsError } =
  await supabase
    .rpc("get_public_system_settings", {})
    .single();

if (settingsError) {
  setErrorMessage(settingsError.message);
  setLoading(false);
  return;
}

const settings = settingsData as PublicSettings;

setMinimumWithdrawal(
  Number(settings.minimum_withdrawal || 0)
);

const {
  data: referralMinimumData,
  error: referralMinimumError,
} = await supabase.rpc(
  "get_referral_bonus_minimum_withdrawal"
);

if (referralMinimumError) {
  setErrorMessage(referralMinimumError.message);
  setLoading(false);
  return;
}

setReferralBonusMinimumWithdrawal(
  Number(referralMinimumData ?? 1000)
);

await loadWithdrawals(user.id);

setLoading(false);

}

async function loadWithdrawals(userId: string) {
const { data, error } = await supabase
.from("withdrawal_requests")
.select(
"id, amount, withdrawal_method, account_name, account_number_or_wallet, status, source_profit_amount, source_bonus_amount, created_at"
)
.eq("user_id", userId)
.order("created_at", { ascending: false });

if (error) {
  setErrorMessage(error.message);
  return;
}

setWithdrawals(
  (data || []) as WithdrawalRequest[]
);

}

async function handleSubmitWithdrawal(
e: React.FormEvent<HTMLFormElement>
) {
e.preventDefault();

setMessage("");
setErrorMessage("");

const withdrawalAmount = Number(amount);
const profitBalance = Number(
  profile?.profit_balance || 0
);
const bonusBalance = Number(
  profile?.bonus_balance || 0
);

const referralMinimum = Number(
  referralBonusMinimumWithdrawal || 0
);

const eligibleBonusBalance =
  referralMinimum <= 0 ||
  bonusBalance >= referralMinimum
    ? bonusBalance
    : 0;

const totalEligibleWithdrawable =
  profitBalance + eligibleBonusBalance;

const bonusPortion = Math.max(
  0,
  withdrawalAmount - profitBalance
);

const reactivationRequired = Boolean(
  profile?.reactivation_required
);

if (profile?.kyc_status !== "approved") {
  setErrorMessage(
    "Your KYC must be approved before you can withdraw."
  );
  return;
}

if (reactivationRequired) {
  setErrorMessage(
    "Your account has completed 4 withdrawal cycles. Please make a reactivation deposit before requesting another withdrawal."
  );
  return;
}

if (totalEligibleWithdrawable <= 0) {
  if (
    bonusBalance > 0 &&
    bonusBalance < referralMinimum
  ) {
    setErrorMessage(
      `Your referral bonus balance is K${bonusBalance.toFixed(
        2
      )}. It must reach at least K${referralMinimum.toFixed(
        2
      )} before it can be withdrawn.`
    );
  } else {
    setErrorMessage(
      "You do not have any matured profit or eligible referral bonus available for withdrawal yet."
    );
  }

  return;
}

if (
  !Number.isFinite(withdrawalAmount) ||
  withdrawalAmount <= 0
) {
  setErrorMessage(
    "Please enter a valid withdrawal amount."
  );
  return;
}

if (withdrawalAmount < minimumWithdrawal) {
  setErrorMessage(
    `The general minimum withdrawal amount is K${minimumWithdrawal.toFixed(
      2
    )}.`
  );
  return;
}

if (
  bonusBalance > 0 &&
  bonusBalance < referralMinimum &&
  withdrawalAmount > profitBalance
) {
  setErrorMessage(
    `Your referral bonus cannot be used yet. Its balance must reach at least K${referralMinimum.toFixed(
      2
    )}. You may currently withdraw only your available profit of K${profitBalance.toFixed(
      2
    )}.`
  );
  return;
}

if (
  bonusPortion > 0 &&
  bonusPortion < referralMinimum
) {
  setErrorMessage(
    `When referral bonus is included, the referral bonus portion must be at least K${referralMinimum.toFixed(
      2
    )}. The current bonus portion would be K${bonusPortion.toFixed(
      2
    )}.`
  );
  return;
}

if (
  withdrawalAmount > totalEligibleWithdrawable
) {
  setErrorMessage(
    "You can withdraw only matured profit and eligible referral bonus. Initial capital cannot be withdrawn."
  );
  return;
}

if (!withdrawalMethod) {
  setErrorMessage(
    "Please select a withdrawal method."
  );
  return;
}

if (!accountName.trim()) {
  setErrorMessage(
    "Please enter your account name."
  );
  return;
}

if (!accountNumberOrWallet.trim()) {
  setErrorMessage(
    "Please enter your mobile number, account number, or wallet address."
  );
  return;
}

setSubmitting(true);

const { error } = await supabase.rpc(
  "submit_withdrawal_request",
  {
    p_amount: withdrawalAmount,
    p_withdrawal_method: withdrawalMethod,
    p_account_name: accountName.trim(),
    p_account_number_or_wallet:
      accountNumberOrWallet.trim(),
  }
);

setSubmitting(false);

if (error) {
  setErrorMessage(error.message);
  return;
}

setAmount("");
setAccountNumberOrWallet("");

setMessage(
  "Withdrawal request submitted successfully. The amount is now reserved for Admin review."
);

await loadWithdrawPage(true);

}

function statusBadge(status: string) {
if (
status === "approved" ||
status === "completed" ||
status === "paid"
) {
return "bg-green-500/10 text-green-400";
}

if (
  status === "rejected" ||
  status === "cancelled"
) {
  return "bg-red-500/10 text-red-400";
}

return "bg-yellow-500/10 text-yellow-400";

}

if (loading) {
return ( <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
Loading withdrawal page... </main>
);
}

const capitalBalance = Number(
profile?.capital_balance || 0
);

const profitBalance = Number(
profile?.profit_balance || 0
);

const bonusBalance = Number(
profile?.bonus_balance || 0
);

const referralMinimum = Number(
referralBonusMinimumWithdrawal || 0
);

const bonusIsEligible =
referralMinimum <= 0 ||
bonusBalance >= referralMinimum;

const eligibleBonusBalance = bonusIsEligible
? bonusBalance
: 0;

const totalEligibleWithdrawable =
profitBalance + eligibleBonusBalance;

const kycApproved =
profile?.kyc_status === "approved";

const reactivationRequired = Boolean(
profile?.reactivation_required
);

const completedCycles = Number(
profile?.completed_withdrawal_cycles || 0
);

const pendingWithdrawals = withdrawals.filter(
(withdrawal) =>
withdrawal.status === "pending"
);

const pendingWithdrawalTotal =
pendingWithdrawals.reduce(
(total, withdrawal) =>
total + Number(withdrawal.amount || 0),
0
);

const canSubmitWithdrawal =
kycApproved &&
totalEligibleWithdrawable > 0 &&
!reactivationRequired;

return ( <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]"> <div className="mx-auto max-w-5xl"> <a
       href="/dashboard"
       className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
     >
← Back to Dashboard </a>

    <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
      <h1 className="mb-2 text-3xl font-extrabold">
        Withdraw Funds
      </h1>

      <p className="mb-6 text-[#7a9abd]">
        You can withdraw only matured profit and eligible
        referral bonus. Initial capital is locked and
        cannot be withdrawn.
      </p>

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Locked Capital
          </p>

          <p className="mt-2 text-2xl font-extrabold text-[#00b86b]">
            K{capitalBalance.toFixed(2)}
          </p>

          <p className="mt-2 text-xs text-[#4e6880]">
            Not withdrawable
          </p>
        </div>

        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Profit Balance
          </p>

          <p className="mt-2 text-2xl font-extrabold">
            K{profitBalance.toFixed(2)}
          </p>

          <p className="mt-2 text-xs text-[#4e6880]">
            Uses general minimum
          </p>
        </div>

        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Bonus Balance
          </p>

          <p className="mt-2 text-2xl font-extrabold">
            K{bonusBalance.toFixed(2)}
          </p>

          <p
            className={
              bonusIsEligible
                ? "mt-2 text-xs text-green-400"
                : "mt-2 text-xs text-yellow-400"
            }
          >
            {bonusIsEligible
              ? "Eligible"
              : "Below referral minimum"}
          </p>
        </div>

        <div className="rounded-xl border border-[#ffd70033] bg-[#ffd7000a] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Referral Minimum
          </p>

          <p className="mt-2 text-2xl font-extrabold text-[#ffd700]">
            K{referralMinimum.toFixed(2)}
          </p>

          <p className="mt-2 text-xs text-[#4e6880]">
            Controlled by Super Admin
          </p>
        </div>

        <div className="rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Eligible Now
          </p>

          <p className="mt-2 text-2xl font-extrabold text-[#00b86b]">
            K{totalEligibleWithdrawable.toFixed(2)}
          </p>

          <p className="mt-2 text-xs text-[#4e6880]">
            Capital excluded
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            General Minimum
          </p>

          <p className="mt-2 text-2xl font-extrabold">
            K{minimumWithdrawal.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            KYC Status
          </p>

          <p
            className={
              kycApproved
                ? "mt-2 inline-block rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400"
                : "mt-2 inline-block rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400"
            }
          >
            {profile?.kyc_status ||
              "not_submitted"}
          </p>
        </div>

        <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Completed Cycles
          </p>

          <p className="mt-2 text-2xl font-extrabold">
            {completedCycles}
          </p>
        </div>
      </div>

      {bonusBalance > 0 && !bonusIsEligible && (
        <p className="mb-5 rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          Your referral bonus balance is currently
          K{bonusBalance.toFixed(2)}. It will become eligible
          when it reaches K{referralMinimum.toFixed(2)}.
          Normal profit withdrawals are not affected.
        </p>
      )}

      {bonusBalance >= referralMinimum &&
        referralMinimum > 0 && (
          <p className="mb-5 rounded-lg bg-blue-500/10 px-4 py-3 text-sm text-blue-400">
            Your referral bonus is eligible. When a request
            uses referral bonus, at least
            K{referralMinimum.toFixed(2)} of the request must
            come from the referral bonus balance.
          </p>
        )}

      {reactivationRequired && (
        <p className="mb-5 rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          Your account has completed 4 withdrawal cycles.
          Please make a reactivation deposit before
          requesting another withdrawal.
        </p>
      )}

      {pendingWithdrawalTotal > 0 && (
        <p className="mb-5 rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          You already have pending withdrawal request(s)
          totaling K
          {pendingWithdrawalTotal.toFixed(2)}. This amount
          is reserved until Admin review.
        </p>
      )}

      {!kycApproved && (
        <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Your KYC is not approved. Please complete KYC
          verification before requesting a withdrawal.
        </p>
      )}

      {kycApproved &&
        !reactivationRequired &&
        totalEligibleWithdrawable <= 0 &&
        pendingWithdrawalTotal <= 0 && (
          <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            You do not currently have matured profit or
            eligible referral bonus available for
            withdrawal.
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

      <form onSubmit={handleSubmitWithdrawal}>
        <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
          Withdrawal Method
        </label>

        <select
          value={withdrawalMethod}
          onChange={(e) =>
            setWithdrawalMethod(e.target.value)
          }
          disabled={!canSubmitWithdrawal}
          className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="Airtel Money">
            Airtel Money
          </option>

          <option value="MTN MoMo">
            MTN MoMo
          </option>

          <option value="USDT TRC20">
            USDT TRC20
          </option>

          <option value="Bank Transfer">
            Bank Transfer
          </option>
        </select>

        <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
          Amount
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          disabled={!canSubmitWithdrawal}
          placeholder={`Maximum K${totalEligibleWithdrawable.toFixed(
            2
          )}`}
          className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mb-5 text-sm text-[#7a9abd]">
          Profit is used first. If the amount exceeds your
          profit balance, the remaining amount will come
          from eligible referral bonus.
        </p>

        <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
          Account Name
        </label>

        <input
          type="text"
          value={accountName}
          onChange={(e) =>
            setAccountName(e.target.value)
          }
          disabled={!canSubmitWithdrawal}
          placeholder="Account holder name"
          className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />

        <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
          Mobile Number / Wallet Address / Account Number
        </label>

        <input
          type="text"
          value={accountNumberOrWallet}
          onChange={(e) =>
            setAccountNumberOrWallet(
              e.target.value
            )
          }
          disabled={!canSubmitWithdrawal}
          placeholder="Example: 0991234567 or wallet address"
          className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={
            submitting ||
            !kycApproved ||
            totalEligibleWithdrawable <= 0 ||
            reactivationRequired
          }
          className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Submitting..."
            : "Submit Withdrawal Request →"}
        </button>
      </form>
    </div>

    <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
      <h2 className="text-2xl font-bold">
        My Withdrawal Requests
      </h2>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
              <th className="py-3">Amount</th>
              <th className="py-3">
                From Profit
              </th>
              <th className="py-3">
                From Bonus
              </th>
              <th className="py-3">Method</th>
              <th className="py-3">
                Account / Wallet
              </th>
              <th className="py-3">Status</th>
              <th className="py-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {withdrawals.map((withdrawal) => (
              <tr
                key={withdrawal.id}
                className="border-b border-[#172036]"
              >
                <td className="py-4 font-bold">
                  K
                  {Number(
                    withdrawal.amount || 0
                  ).toFixed(2)}
                </td>

                <td className="py-4 text-[#7a9abd]">
                  K
                  {Number(
                    withdrawal.source_profit_amount ||
                      0
                  ).toFixed(2)}
                </td>

                <td className="py-4 text-[#7a9abd]">
                  K
                  {Number(
                    withdrawal.source_bonus_amount ||
                      0
                  ).toFixed(2)}
                </td>

                <td className="py-4 text-[#7a9abd]">
                  {withdrawal.withdrawal_method}
                </td>

                <td className="max-w-[220px] truncate py-4 text-[#7a9abd]">
                  {
                    withdrawal.account_number_or_wallet
                  }
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
                  {new Date(
                    withdrawal.created_at
                  ).toLocaleString()}
                </td>
              </tr>
            ))}

            {withdrawals.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-[#7a9abd]"
                >
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
