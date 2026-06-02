export default function ReferralPage() {
  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-2xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="mb-2 text-3xl font-extrabold">Refer & Earn</h1>
          <p className="mb-8 text-[#7a9abd]">
            Invite new members and earn K50 when they complete their first
            confirmed deposit.
          </p>

          <div className="mb-6 rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
              Your Referral Link
            </p>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex-1 rounded-xl border border-[#172036] bg-[#07090f] px-4 py-3 font-mono text-sm text-[#00b86b]">
                kwacharise.com/join?ref=john
              </div>

              <button className="rounded-xl bg-[#172036] px-5 py-3 font-semibold text-[#7a9abd]">
                Copy Link
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                Referrals Made
              </p>
              <p className="text-4xl font-extrabold text-[#a78bfa]">3</p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                Bonus Earned
              </p>
              <p className="text-4xl font-extrabold text-[#00b86b]">K 150</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5 text-sm leading-7 text-[#7a9abd]">
            <p>1. Share your referral link with a new member.</p>
            <p>2. They register using your link.</p>
            <p>3. Admin confirms their first deposit.</p>
            <p>4. You receive a K50 referral bonus.</p>
          </div>
        </div>
      </div>
    </main>
  );
}