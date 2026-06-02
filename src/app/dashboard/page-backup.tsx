const stats = [
  { label: "Capital", value: "K 1,000", color: "text-[#60a5fa]" },
  { label: "Profit Available", value: "K 500", color: "text-[#00b86b]" },
  { label: "Withdrawals Left", value: "2/4", color: "text-[#fbbf24]" },
  { label: "Referrals", value: "3", color: "text-[#a78bfa]" },
];

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Deposit", href: "/deposit" },
  { label: "Withdraw", href: "/withdraw" },
  { label: "Refer & Earn", href: "/referral" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "FAQ", href: "/faq" },
  { label: "Account", href: "/account" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#07090f] text-[#dde2ef]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-[#172036] bg-[#0a0e1a] p-5 md:block">
          <a href="/" className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b86b] font-bold text-white">
              K
            </div>
            <span className="text-xl font-bold">KwachaRise</span>
          </a>

          <div className="mb-5 rounded-xl bg-[#172036] p-4">
            <p className="font-semibold">John Banda</p>
            <span className="mt-2 inline-block rounded-md border border-[#cd7f3244] bg-[#cd7f3222] px-2 py-1 text-xs text-[#cd7f32]">
              🥉 Bronze
            </span>
          </div>

         <nav className="space-y-2">
  {navItems.map((item) => (
    <a
      key={item.label}
      href={item.href}
      className="block w-full rounded-lg px-4 py-3 text-left text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
    >
      {item.label}
    </a>
  ))}
</nav>

          <a
            href="/"
            className="mt-8 block rounded-lg bg-[#172036] px-4 py-3 text-center text-sm text-[#7a9abd]"
          >
            Sign Out
          </a>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-6 md:p-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Muli Bwanji, John 👋</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-[#cd7f3244] bg-[#cd7f3222] px-2 py-1 text-xs text-[#cd7f32]">
                  🥉 Bronze
                </span>
                <span className="rounded-md border border-[#128C7E44] bg-[#128C7E18] px-2 py-1 text-xs text-[#25D366]">
                  📲 Alerts On
                </span>
                <span className="rounded-md border border-[#00b86b33] bg-[#00b86b18] px-2 py-1 text-xs text-[#00d07a]">
                  ✓ KYC Verified
                </span>
              </div>
            </div>

            <a
              href="/deposit"
              className="rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
            >
              + Deposit
            </a>
          </div>

          {/* Tier Progress */}
          <div className="mb-5 rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
              Tier Progress
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className={`h-2 flex-1 rounded-full ${
                    item <= 2 ? "bg-[#cd7f32]" : "bg-[#172036]"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-sm text-[#7a9abd]">
              Cycle 2 · Standard pairing queue
            </p>
          </div>

          {/* Stats */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5"
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                  {stat.label}
                </p>
                <p className={`text-2xl font-extrabold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Maturity Card */}
          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#00b86b] bg-[#00b86b12]">
                <span className="text-2xl font-extrabold text-[#00b86b]">
                  0
                </span>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">🎉 Investment Matured!</h2>
                <p className="mt-2 text-[#7a9abd]">
                  K 500 profit is ready to withdraw.
                </p>
              </div>

              <a
                href="/withdraw"
                className="rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
              >
                Withdraw →
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}