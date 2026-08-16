import { createClient } from "@supabase/supabase-js";

type HomeStats = {
  activeMembers: number;
  paidOut: number;
  returnPercentage: number;
  minimumDeposit: number;
  maturityDays: number;
  pairsToday: number;
};

type PublicSettings = {
  minimum_withdrawal: number | null;
  minimum_deposit: number | null;
  return_percentage: number | null;
  maturity_timer_days: number | null;
  pairing_enabled: boolean | null;
  whatsapp_notifications_enabled: boolean | null;
  allow_same_or_higher_deposit_only: boolean | null;
};

type WithdrawalRow = {
  amount: number | string | null;
};

async function getHomeStats(): Promise<HomeStats> {
  const fallbackStats: HomeStats = {
    activeMembers: 0,
    paidOut: 0,
    returnPercentage: 25,
    minimumDeposit: 250,
    maturityDays: 3,
    pairsToday: 0,
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return fallbackStats;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      settingsResult,
      membersResult,
      withdrawalsResult,
      pairingsResult,
    ] = await Promise.all([
      supabase.rpc("get_public_system_settings", {}).single(),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("withdrawal_requests")
        .select("amount")
        .in("status", ["approved", "paid", "completed"]),
      supabase
        .from("pairings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
    ]);

    const settings = settingsResult.data as PublicSettings | null;
    const withdrawals = (withdrawalsResult.data || []) as WithdrawalRow[];

    const paidOut = withdrawals.reduce((total, row) => {
      return total + Number(row.amount || 0);
    }, 0);

    return {
      activeMembers: membersResult.count ?? fallbackStats.activeMembers,
      paidOut,
      returnPercentage: Number(
        settings?.return_percentage ?? fallbackStats.returnPercentage
      ),
      minimumDeposit: Number(
        settings?.minimum_deposit ?? fallbackStats.minimumDeposit
      ),
      maturityDays: Number(
        settings?.maturity_timer_days ?? fallbackStats.maturityDays
      ),
      pairsToday: pairingsResult.count ?? fallbackStats.pairsToday,
    };
  } catch {
    return fallbackStats;
  }
}

function formatMoney(amount: number) {
  if (amount >= 1000000) {
    return `K ${(amount / 1000000).toFixed(1)}M`;
  }

  if (amount >= 1000) {
    return `K ${(amount / 1000).toFixed(1)}K`;
  }

  return `K ${amount.toFixed(0)}`;
}

export default async function Home() {
  const stats = await getHomeStats();

  const statCards = [
    ["👥", stats.activeMembers.toLocaleString(), "Active Members"],
    ["💸", formatMoney(stats.paidOut), "Paid Out"],
    ["📈", `${stats.returnPercentage}%`, "Return"],
    ["💰", `K ${stats.minimumDeposit}`, "Min Deposit"],
    ["🔗", stats.pairsToday.toString(), "Pairs Today"],
  ];

  const howItWorks = [
    [
      "01",
      "⬇️",
      "Deposit",
      `Start from K${stats.minimumDeposit} using the available mobile money or crypto payment method.`,
    ],
    [
      "02",
      "✅",
      "Admin Confirms",
      "Your timer only starts after an admin manually verifies and approves your deposit.",
    ],
    [
      "03",
      "⏱️",
      "Countdown Starts",
      `Each approved deposit receives its own ${stats.maturityDays}-day maturity countdown.`,
    ],
    [
      "04",
      "💎",
      "Profit Unlocks",
      "After maturity, only profit and bonus become withdrawable. Initial capital remains locked.",
    ],
  ];

  const tiers = [
    [
      "🥉",
      "Bronze",
      "0–3 completed cycles",
      "Standard pairing queue",
      "Best for new members getting started.",
    ],
    [
      "🥈",
      "Silver",
      "4–7 completed cycles",
      "Priority pairing queue",
      "Higher priority after more completed cycles.",
    ],
    [
      "🥇",
      "Gold",
      "8+ completed cycles",
      "VIP pairing priority",
      "Gold members appear first in the pairing queue.",
    ],
  ];

  const faqs = [
    [
      "When does the countdown start?",
      "The countdown starts only after an admin approves your deposit.",
    ],
    [
      "Can I withdraw my capital?",
      "No. Members can withdraw only matured profit and bonus balance.",
    ],
    [
      "Is KYC required?",
      "Yes. KYC must be approved before any withdrawal request is allowed.",
    ],
  ];

  return (
    <main className="min-h-screen bg-[#07090f] text-[#dde2ef]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b86b] font-bold text-white">
            K
          </div>
          <span className="text-xl font-bold tracking-tight">KwachaRise</span>
        </a>

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
          Live platform · {stats.activeMembers.toLocaleString()} active members
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Zambia&apos;s Community <br />
          <span className="text-[#00b86b]">Wealth Network</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#7a9abd]">
          Deposit securely, wait for admin confirmation, follow your maturity
          countdown, and withdraw only matured profit and approved bonuses.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/register"
            className="rounded-xl bg-[#00b86b] px-7 py-3 font-semibold text-white"
          >
            Start with K{stats.minimumDeposit} →
          </a>

          <a
            href="/ledger"
            className="rounded-xl bg-[#172036] px-7 py-3 font-semibold text-[#dde2ef]"
          >
            See Live Payments
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map(([icon, value, label]) => (
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
        <h2 className="mb-3 text-center text-3xl font-extrabold">
          How It Works
        </h2>

        <p className="mx-auto mb-8 max-w-2xl text-center text-[#7a9abd]">
          The process is controlled by database rules, admin approval, maturity
          timers, KYC verification, and pairing logic.
        </p>

        <div className="grid gap-5 md:grid-cols-4">
          {howItWorks.map(([num, icon, title, desc]) => (
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

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-3 text-center text-3xl font-extrabold">
          Member Tier System
        </h2>

        <p className="mx-auto mb-8 max-w-2xl text-center text-[#7a9abd]">
          Tiers are calculated automatically from completed withdrawal cycles.
          No manual assignment is required.
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          {tiers.map(([icon, tier, cycles, perk, desc]) => (
            <div
              key={tier}
              className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6"
            >
              <div className="text-4xl">{icon}</div>

              <h3 className="mt-4 text-2xl font-extrabold">{tier}</h3>

              <p className="mt-2 text-sm font-semibold text-[#00b86b]">
                {cycles}
              </p>

              <p className="mt-4 font-semibold">{perk}</p>

              <p className="mt-2 text-sm leading-6 text-[#7a9abd]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-[#172036] bg-[#0e1526] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold">
                Built with clear business rules
              </h2>

              <p className="mt-4 text-[#7a9abd]">
                The system is designed so important restrictions are enforced by
                backend/database rules, not only by frontend form validation.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "Minimum deposit is enforced server-side.",
                "Members cannot withdraw initial capital.",
                "KYC must be approved before withdrawal.",
                "Withdrawal unlocks only after maturity timer reaches zero.",
                "New deposit must be same or higher than previous approved deposit.",
              ].map((rule) => (
                <div
                  key={rule}
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-sm text-[#7a9abd]"
                >
                  ✅ {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-8 text-center text-3xl font-extrabold">
          Quick Questions
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {faqs.map(([question, answer]) => (
            <div
              key={question}
              className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6"
            >
              <h3 className="font-bold">{question}</h3>

              <p className="mt-3 text-sm leading-6 text-[#7a9abd]">
                {answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/faq"
            className="rounded-xl bg-[#172036] px-6 py-3 font-semibold text-[#dde2ef]"
          >
            View Full FAQ →
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-[#00b86b33] bg-[#00b86b0a] p-8 text-center md:p-10">
          <h2 className="text-3xl font-extrabold">Ready to get started?</h2>

          <p className="mx-auto mt-4 max-w-2xl text-[#7a9abd]">
            Create your account, accept the Terms & Conditions, submit KYC, and
            start with the minimum deposit amount configured by Super Admin.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="/register"
              className="rounded-xl bg-[#00b86b] px-7 py-3 font-semibold text-white"
            >
              Create Account →
            </a>

            <a
              href="/login"
              className="rounded-xl bg-[#172036] px-7 py-3 font-semibold text-[#dde2ef]"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#172036] bg-[#0b0f1c] px-6 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b86b] font-bold text-white">
                K
              </div>

              <span className="text-xl font-bold tracking-tight">
                KwachaRise
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#7a9abd]">
              Community-based deposit, maturity, withdrawal, KYC, pairing, and
              member management platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Public Pages</h3>

            <div className="mt-4 space-y-3 text-sm text-[#7a9abd]">
              <a href="/" className="block hover:text-[#00b86b]">
                Home
              </a>
              <a href="/ledger" className="block hover:text-[#00b86b]">
                Live Ledger
              </a>
              <a href="/faq" className="block hover:text-[#00b86b]">
                FAQ
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Account</h3>

            <div className="mt-4 space-y-3 text-sm text-[#7a9abd]">
              <a href="/register" className="block hover:text-[#00b86b]">
                Register
              </a>
              <a href="/login" className="block hover:text-[#00b86b]">
                Login
              </a>
              <a href="/support" className="block hover:text-[#00b86b]">
                Support
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Legal</h3>

            <div className="mt-4 space-y-3 text-sm text-[#7a9abd]">
              <a href="/terms" className="block hover:text-[#00b86b]">
                Terms & Conditions
              </a>
              <a href="/privacy" className="block hover:text-[#00b86b]">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-[#172036] pt-6 text-center text-sm text-[#4e6880]">
          © {new Date().getFullYear()} KwachaRise. All rights reserved.
        </div>
      </footer>
    </main>
  );
}