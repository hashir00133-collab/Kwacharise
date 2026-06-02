import ActionButton from "@/app/components/ActionButton";

const pendingDeposits = [
  {
    id: "D001",
    name: "Mary Phiri",
    email: "mary@test.com",
    amount: "K 2,000",
    method: "Airtel Money",
    reference: "MM-99123",
    screenshot: "Uploaded",
    date: "20 May",
  },
  {
    id: "D002",
    name: "Faith Zulu",
    email: "faith@test.com",
    amount: "K 500",
    method: "USDT TRC20",
    reference: "0xAB3f...",
    screenshot: "Missing",
    date: "21 May",
  },
];

const pairingQueue = [
  {
    name: "John Banda",
    tier: "🥉 Bronze",
    profit: "K 500",
    phone: "0991-234-567",
    status: "Waiting for pairing",
  },
  {
    name: "Grace Tembo",
    tier: "🥇 Gold",
    profit: "K 250",
    phone: "0888-765-432",
    status: "Priority queue",
  },
];

const members = [
  {
    name: "John Banda",
    email: "john@test.com",
    kyc: "Verified",
    capital: "K 1,000",
    profit: "K 500",
    status: "Matured",
  },
  {
    name: "Mary Phiri",
    email: "mary@test.com",
    kyc: "Verified",
    capital: "K 2,000",
    profit: "K 0",
    status: "Pending",
  },
  {
    name: "Peter Mwale",
    email: "peter@test.com",
    kyc: "Pending",
    capital: "K 500",
    profit: "K 0",
    status: "Active",
  },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#07090f] text-[#dde2ef]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 border-r border-[#172036] bg-[#0a0e1a] p-5 md:block">
          <a href="/" className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b86b] font-bold text-white">
              K
            </div>
            <span className="text-xl font-bold">KwachaRise</span>
          </a>

          <div className="mb-6 rounded-xl border border-[#60a5fa33] bg-[#60a5fa18] p-4">
            <p className="text-sm font-semibold text-[#93c5fd]">
              🛡 Admin Panel
            </p>
            <p className="mt-1 text-xs text-[#7a9abd]">Admin Mwape</p>
          </div>

          <nav className="space-y-2">
            <a
              href="/admin"
              className="block rounded-lg bg-[#172036] px-4 py-3 text-sm text-[#00b86b]"
            >
              Pending Deposits
            </a>

            <a
              href="#pairing"
              className="block rounded-lg px-4 py-3 text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
            >
              Pairing Queue
            </a>

            <a
              href="#members"
              className="block rounded-lg px-4 py-3 text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
            >
              Members
            </a>

            <a
              href="/ledger"
              className="block rounded-lg px-4 py-3 text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
            >
              Payment Ledger
            </a>

            <a
              href="/superadmin"
              className="block rounded-lg px-4 py-3 text-sm text-[#ffd700] hover:bg-[#172036]"
            >
              Super Admin
            </a>
          </nav>

          <a
            href="/"
            className="mt-8 block rounded-lg bg-[#172036] px-4 py-3 text-center text-sm text-[#7a9abd]"
          >
            Sign Out
          </a>
        </aside>

        {/* Main content */}
        <section className="flex-1 p-6 md:p-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
              <p className="mt-2 text-[#7a9abd]">
                Manage deposits, pairings, members, and payment activity.
              </p>
            </div>

            <a
              href="/dashboard"
              className="rounded-xl bg-[#172036] px-5 py-3 text-sm font-semibold text-[#7a9abd]"
            >
              View Member Dashboard
            </a>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                Pending Deposits
              </p>
              <p className="text-3xl font-extrabold text-[#fbbf24]">2</p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                Pairing Queue
              </p>
              <p className="text-3xl font-extrabold text-[#00b86b]">2</p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                Active Members
              </p>
              <p className="text-3xl font-extrabold text-[#60a5fa]">1,284</p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4e6880]">
                Paid Out
              </p>
              <p className="text-3xl font-extrabold text-[#a78bfa]">K 4.2M</p>
            </div>
          </div>

          {/* Pending Deposits */}
          <div className="mb-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <h2 className="mb-2 text-xl font-bold">Pending Deposits</h2>
            <p className="mb-6 text-sm text-[#7a9abd]">
              Verify payment details and confirm or reject deposits.
            </p>

            <div className="space-y-4">
              {pendingDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{deposit.name}</p>
                      <p className="text-sm text-[#7a9abd]">{deposit.email}</p>
                      <p className="mt-2 text-sm text-[#4e6880]">
                        Ref: {deposit.reference} · {deposit.date}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-extrabold text-[#00b86b]">
                        {deposit.amount}
                      </p>
                      <p className="text-sm text-[#7a9abd]">
                        {deposit.method}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        deposit.screenshot === "Uploaded"
                          ? "border border-[#00b86b33] bg-[#00b86b18] text-[#00d07a]"
                          : "border border-[#f8717133] bg-[#f8717118] text-[#f87171]"
                      }`}
                    >
                      Screenshot: {deposit.screenshot}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        message="Payment proof preview opened."
                        className="rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
                      >
                        View Proof
                      </ActionButton>

                      <ActionButton
                        message="Deposit confirmed successfully. Member timer has started."
                        className="rounded-lg bg-[#00b86b] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Confirm
                      </ActionButton>

                      <ActionButton
                        message="Deposit rejected successfully."
                        className="rounded-lg bg-[#2a1020] px-4 py-2 text-sm text-[#f87171]"
                      >
                        Reject
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pairing Queue */}
          <div
            id="pairing"
            className="mb-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6"
          >
            <h2 className="mb-2 text-xl font-bold">Pairing Queue</h2>
            <p className="mb-6 text-sm text-[#7a9abd]">
              Members waiting to receive withdrawal payments.
            </p>

            <div className="space-y-4">
              {pairingQueue.map((member) => (
                <div
                  key={member.name}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#172036] bg-[#0b0f1c] p-5"
                >
                  <div>
                    <p className="font-bold">{member.name}</p>
                    <p className="text-sm text-[#7a9abd]">{member.phone}</p>
                    <span className="mt-2 inline-block rounded-md border border-[#172036] bg-[#07090f] px-2 py-1 text-xs">
                      {member.tier}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-extrabold text-[#00b86b]">
                      {member.profit}
                    </p>
                    <p className="text-sm text-[#fbbf24]">{member.status}</p>
                  </div>

                  <ActionButton
                    message="Member paired successfully."
                    className="rounded-lg bg-[#00b86b] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Pair Member
                  </ActionButton>
                </div>
              ))}
            </div>
          </div>

          {/* Members */}
          <div
            id="members"
            className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6"
          >
            <h2 className="mb-2 text-xl font-bold">Members List</h2>
            <p className="mb-6 text-sm text-[#7a9abd]">
              Overview of registered members and account status.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#172036] text-[#4e6880]">
                  <tr>
                    <th className="p-4">Member</th>
                    <th className="p-4">KYC</th>
                    <th className="p-4">Capital</th>
                    <th className="p-4">Profit</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.email}
                      className="border-b border-[#172036] last:border-b-0"
                    >
                      <td className="p-4">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-[#7a9abd]">
                          {member.email}
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-md px-2 py-1 text-xs ${
                            member.kyc === "Verified"
                              ? "border border-[#00b86b33] bg-[#00b86b18] text-[#00d07a]"
                              : "border border-[#f8717133] bg-[#f8717118] text-[#f87171]"
                          }`}
                        >
                          {member.kyc}
                        </span>
                      </td>

                      <td className="p-4 text-[#60a5fa]">{member.capital}</td>
                      <td className="p-4 text-[#00b86b]">{member.profit}</td>
                      <td className="p-4 text-[#fbbf24]">{member.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}