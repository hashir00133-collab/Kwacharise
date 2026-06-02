import ActionButton from "@/app/components/ActionButton";

const admins = [
  {
    name: "Admin Mwape",
    email: "mod@kwacharise.com",
    role: "Admin",
    since: "01 Apr 2025",
  },
  {
    name: "Super Admin",
    email: "admin@kwacharise.com",
    role: "Super Admin",
    since: "01 Jan 2025",
  },
];

export default function SuperAdminPage() {
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

          <div className="mb-6 rounded-xl border border-[#ffd70033] bg-[#ffd70018] p-4">
            <p className="text-sm font-semibold text-[#ffd700]">
              ⭐ Super Admin Panel
            </p>
            <p className="mt-1 text-xs text-[#7a9abd]">
              Full system control
            </p>
          </div>

          <nav className="space-y-2">
            <a
              href="#settings"
              className="block rounded-lg bg-[#172036] px-4 py-3 text-sm text-[#00b86b]"
            >
              System Settings
            </a>

            <a
              href="#admins"
              className="block rounded-lg px-4 py-3 text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
            >
              Manage Admins
            </a>

            <a
              href="#wallet"
              className="block rounded-lg px-4 py-3 text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
            >
              Crypto Wallet
            </a>

            <a
              href="#broadcast"
              className="block rounded-lg px-4 py-3 text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
            >
              Broadcast Message
            </a>

            <a
              href="/admin"
              className="block rounded-lg px-4 py-3 text-sm text-[#7a9abd] hover:bg-[#172036] hover:text-white"
            >
              Admin Dashboard
            </a>
          </nav>

          <a
            href="/"
            className="mt-8 block rounded-lg bg-[#172036] px-4 py-3 text-center text-sm text-[#7a9abd]"
          >
            Sign Out
          </a>
        </aside>

        {/* Main */}
        <section className="flex-1 p-6 md:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold">
              Super Admin Dashboard
            </h1>
            <p className="mt-2 text-[#7a9abd]">
              Control system rules, admins, wallet address, and platform-wide
              announcements.
            </p>
          </div>

          {/* System Settings */}
          <div
            id="settings"
            className="mb-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8"
          >
            <h2 className="mb-2 text-xl font-bold">System Settings</h2>
            <p className="mb-6 text-sm text-[#7a9abd]">
              These settings will apply to new deposits and future investment
              cycles.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Maturity Timer Days
                </label>
                <input
                  type="number"
                  defaultValue="3"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Minimum Deposit
                </label>
                <input
                  type="number"
                  defaultValue="250"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
                />
              </div>
            </div>

            <ActionButton
              message="System settings saved successfully."
              className="mt-6 rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
            >
              Save Settings
            </ActionButton>
          </div>

          {/* Manage Admins */}
          <div
            id="admins"
            className="mb-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8"
          >
            <h2 className="mb-2 text-xl font-bold">Manage Admins</h2>
            <p className="mb-6 text-sm text-[#7a9abd]">
              Create new admin accounts and review existing admin access.
            </p>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <input
                type="text"
                placeholder="Admin name"
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <input
                type="email"
                placeholder="Admin email"
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <input
                type="password"
                placeholder="Temporary password"
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />
            </div>

            <ActionButton
              message="Admin account created successfully."
              className="mb-6 rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
            >
              Create Admin
            </ActionButton>

            <div className="overflow-x-auto rounded-xl border border-[#172036]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#172036] text-[#4e6880]">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Since</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {admins.map((admin) => (
                    <tr
                      key={admin.email}
                      className="border-b border-[#172036] last:border-b-0"
                    >
                      <td className="p-4 font-semibold">{admin.name}</td>

                      <td className="p-4 text-[#7a9abd]">{admin.email}</td>

                      <td className="p-4">
                        <span className="rounded-md border border-[#60a5fa33] bg-[#60a5fa18] px-2 py-1 text-xs text-[#93c5fd]">
                          {admin.role}
                        </span>
                      </td>

                      <td className="p-4 text-[#7a9abd]">{admin.since}</td>

                      <td className="p-4">
                        <ActionButton
                          message="Admin access revoked successfully."
                          className="rounded-lg bg-[#2a1020] px-3 py-2 text-xs text-[#f87171]"
                        >
                          Revoke
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Crypto Wallet */}
          <div
            id="wallet"
            className="mb-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8"
          >
            <h2 className="mb-2 text-xl font-bold">Crypto Wallet</h2>
            <p className="mb-6 text-sm text-[#7a9abd]">
              This USDT TRC20 wallet address will be shown on the member
              deposit page.
            </p>

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              USDT TRC20 Wallet Address
            </label>

            <input
              type="text"
              defaultValue="TQtE2NsoKn7hSTMLjsRc5GhFXsWZw9BxDE"
              className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <ActionButton
              message="Wallet address updated successfully."
              className="rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
            >
              Update Wallet
            </ActionButton>
          </div>

          {/* Broadcast */}
          <div
            id="broadcast"
            className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8"
          >
            <h2 className="mb-2 text-xl font-bold">Broadcast Message</h2>
            <p className="mb-6 text-sm text-[#7a9abd]">
              Send an announcement to all members through in-app notification
              and WhatsApp.
            </p>

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Message
            </label>

            <textarea
              rows={5}
              placeholder="Type your announcement here..."
              className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <ActionButton
              message="Broadcast message sent to all members."
              className="rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
            >
              Send Broadcast
            </ActionButton>
          </div>
        </section>
      </div>
    </main>
  );
}