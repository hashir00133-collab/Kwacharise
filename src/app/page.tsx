export default function Home() {
  return (
    <main className="min-h-screen bg-[#07090f] text-[#dde2ef]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b86b] font-bold text-white">
            K
          </div>
          <span className="text-xl font-bold tracking-tight">KwachaRise</span>
        </div>

        <div className="hidden items-center gap-3 md:flex">
  <a
    href="/faq"
    className="rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
  >
    FAQ
  </a>

  <a
    href="/ledger"
    className="rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
  >
    Live Ledger
  </a>

<a
  href="/login"
  className="rounded-lg border border-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
>
  Sign In
</a>

<a
  href="/register"
  className="rounded-lg bg-[#00b86b] px-4 py-2 text-sm font-semibold text-white"
>
  Join Free →
</a>
</div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#00b86b33] bg-[#00b86b12] px-4 py-2 text-sm font-semibold text-[#00b86b]">
          <span className="h-2 w-2 rounded-full bg-[#00b86b]" />
          Live · 1,284 active members today
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Zambia&apos;s Community <br />
          <span className="text-[#00b86b]">Wealth Network</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#7a9abd]">
          Deposit. Mature in 3 days. Earn 50% profit. Members pay members —
          directly to mobile.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
<a
  href="/register"
  className="rounded-xl bg-[#00b86b] px-7 py-3 font-semibold text-white"
>
  Start with K250 →
</a>
          <button className="rounded-xl bg-[#172036] px-7 py-3 font-semibold text-[#dde2ef]">
            See Live Payments
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["👥", "1,284", "Members"],
          ["💸", "K 4.2M", "Paid Out"],
          ["📈", "50%", "Return"],
          ["💰", "K 250", "Min Deposit"],
          ["🔗", "37", "Pairs Today"],
        ].map(([icon, value, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5 text-center"
          >
            <div className="mb-2 text-2xl">{icon}</div>
            <div className="text-2xl font-extrabold text-[#00b86b]">
              {value}
            </div>
            <div className="mt-1 text-sm text-[#4e6880]">{label}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-8 text-center text-3xl font-extrabold">
          How It Works
        </h2>

        <div className="grid gap-5 md:grid-cols-4">
          {[
            [
              "01",
              "⬇️",
              "Deposit",
              "Minimum K250 via Airtel Money, MTN MoMo, or USDT TRC20.",
            ],
            [
              "02",
              "⏱️",
              "Mature",
              "3-day countdown begins after admin confirms your deposit.",
            ],
            [
              "03",
              "💎",
              "Earn 50%",
              "Profit unlocks at Day 0. Capital auto-reinvests.",
            ],
            [
              "04",
              "📲",
              "Get Paid",
              "Admin pairs you with new depositors who pay directly.",
            ],
          ].map(([num, icon, title, desc]) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-2xl border border-[#172036] bg-[#0e1526] p-6"
            >
              <div className="absolute right-4 top-2 text-5xl font-black text-[#172036]">
                {num}
              </div>
              <div className="mb-3 text-3xl">{icon}</div>
              <h3 className="mb-2 font-bold">{title}</h3>
              <p className="text-sm leading-6 text-[#7a9abd]">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}