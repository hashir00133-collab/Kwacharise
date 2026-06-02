import ActionButton from "../components/ActionButton";

export default function WithdrawPage() {
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
          <h1 className="mb-2 text-3xl font-extrabold">Withdraw Profit</h1>
          <p className="mb-8 text-[#7a9abd]">
            Your investment has matured. You can withdraw your available profit.
          </p>

          <div className="mb-6 rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
              Available Profit
            </p>
            <p className="text-4xl font-extrabold text-[#00b86b]">K 500</p>
            <p className="mt-2 text-sm text-[#7a9abd]">
              Capital K 1,000 auto-reinvests. You have 2 withdrawal cycles left.
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-[#172036] bg-[#0b0f1c] p-5 text-sm leading-7 text-[#7a9abd]">
            <p>1. Admin finds matching depositors.</p>
            <p>2. The depositor sends K 500 directly to your mobile number.</p>
            <p>3. You confirm once funds are received.</p>
            <p>4. Your capital automatically starts the next cycle.</p>
          </div>

          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Confirm Receiving Mobile Number
          </label>
          <input
            type="text"
            placeholder="0991-234-567"
            className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
          />

          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Preferred Payment Method
          </label>
          <select className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none">
            <option>Airtel Money</option>
            <option>MTN MoMo</option>
            <option>USDT TRC20</option>
          </select>

          <ActionButton
  message="Withdrawal requested! Admin will place you in the pairing queue."
  className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
>
  Request Withdrawal →
</ActionButton>

          <p className="mt-5 text-center text-sm text-[#7a9abd]">
            Admin will review your request and place you in the pairing queue.
          </p>
        </div>
      </div>
    </main>
  );
}