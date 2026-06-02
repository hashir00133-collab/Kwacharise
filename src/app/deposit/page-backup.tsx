import ActionButton from "../components/ActionButton";

export default function DepositPage() {
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
            Submit your payment details. Admin will verify and start your timer.
          </p>

          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Payment Method
          </label>

          <select className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none">
            <option>Airtel Money</option>
            <option>MTN MoMo</option>
            <option>USDT TRC20</option>
          </select>

          <div className="mb-5 rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
              Send payment to
            </p>
            <p className="text-xl font-extrabold text-[#00b86b]">
              0991 - 000 - ADMIN
            </p>
            <p className="mt-1 text-sm text-[#7a9abd]">
              Use your full name as payment reference.
            </p>
          </div>

          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Amount
          </label>
          <input
            type="number"
            placeholder="Minimum K250"
            className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
          />

          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Transaction Reference
          </label>
          <input
            type="text"
            placeholder="e.g. MM-TXN-12345"
            className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
          />

          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
            Upload Payment Screenshot
          </label>
          <input
            type="file"
            className="mb-6 w-full rounded-xl border border-dashed border-[#172036] bg-[#0b0f1c] px-4 py-5 text-sm text-[#7a9abd]"
          />

   <ActionButton
  message="Deposit submitted! Admin will confirm shortly."
  className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
>
  Submit Deposit →
</ActionButton>
        </div>
      </div>
    </main>
  );
}