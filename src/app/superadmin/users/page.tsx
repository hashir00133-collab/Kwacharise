"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "member" | "admin" | "super_admin";
  status: "active" | "blocked" | "suspended";
  kyc_status: "not_submitted" | "pending" | "approved" | "rejected";
  capital_balance: number;
  profit_balance: number;
  bonus_balance: number;
  total_deposited: number;
  referral_code: string | null;
  created_at: string;
};

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkSuperAdminAndLoadUsers();
  }, []);

  async function checkSuperAdminAndLoadUsers() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      router.push("/dashboard");
      return;
    }

    if (profile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    if (profile.status === "blocked" || profile.status === "suspended") {
      router.push("/login");
      return;
    }

    await loadUsers();
    setLoading(false);
  }

  async function loadUsers() {
    setErrorMessage("");

    const { data, error } = await supabase.rpc("get_users_for_super_admin", {});

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setUsers((data || []) as ManagedUser[]);
  }

  async function updateUserAccess(
    userId: string,
    role: string,
    status: string,
    kycStatus: string
  ) {
    setMessage("");
    setErrorMessage("");
    setSavingUserId(userId);

    const { error } = await supabase.rpc("update_user_access_by_super_admin", {
      p_user_id: userId,
      p_role: role,
      p_status: status,
      p_kyc_status: kycStatus,
    });

    setSavingUserId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("User access updated successfully.");
    await loadUsers();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function statusBadge(status: string) {
    if (status === "active" || status === "approved") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "blocked" || status === "suspended" || status === "rejected") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();

    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.referral_code?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading user management...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] text-[#dde2ef]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#172036] bg-[#0b0f1c] p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00b86b] text-xl font-bold text-white">
              K
            </div>
            <h1 className="text-2xl font-extrabold">KwachaRise</h1>
          </div>

          <div className="mb-8 rounded-2xl border border-[#ffd70033] bg-[#ffd70018] p-5">
            <h2 className="font-bold text-[#ffd700]">⭐ Super Admin</h2>
            <p className="mt-2 text-sm text-[#7a9abd]">
              Manage users, admins, and access rights.
            </p>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a href="/superadmin" className="block rounded-xl px-4 py-3">
              Payment Methods
            </a>

            <a href="/superadmin/settings" className="block rounded-xl px-4 py-3">
              System Settings
            </a>

            <a className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]">
              User Management
            </a>

            <a href="/admin" className="block rounded-xl px-4 py-3">
              Admin Dashboard
            </a>

            <a href="/dashboard" className="block rounded-xl px-4 py-3">
              Member Dashboard
            </a>
          </nav>

          <button
            onClick={handleSignOut}
            className="mt-10 w-full rounded-xl bg-[#172036] px-4 py-3 text-[#7a9abd]"
          >
            Sign Out
          </button>
        </aside>

        <section className="p-6 lg:p-10">
          <h1 className="text-4xl font-extrabold lg:text-5xl">
            User Management
          </h1>

          <p className="mt-3 text-lg text-[#7a9abd]">
            Super Admin can grant admin rights, block users, activate users, and
            manage KYC status.
          </p>

          {errorMessage && (
            <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          {message && (
            <p className="mt-6 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {message}
            </p>
          )}

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Total Users</p>
              <p className="mt-2 text-3xl font-extrabold">{users.length}</p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Members</p>
              <p className="mt-2 text-3xl font-extrabold">
                {users.filter((user) => user.role === "member").length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Admins</p>
              <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
                {users.filter((user) => user.role === "admin").length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Super Admins</p>
              <p className="mt-2 text-3xl font-extrabold text-[#ffd700]">
                {users.filter((user) => user.role === "super_admin").length}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">All Users</h2>
                <p className="mt-2 text-[#7a9abd]">
                  Search users and update their role or account access.
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone, role..."
                className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none lg:max-w-md"
              />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1300px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">User</th>
                    <th className="py-3">Phone</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">KYC</th>
                    <th className="py-3">Capital</th>
                    <th className="py-3">Profit</th>
                    <th className="py-3">Bonus</th>
                    <th className="py-3">Referral</th>
                    <th className="py-3">Joined</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      saving={savingUserId === user.id}
                      onSave={updateUserAccess}
                      statusBadge={statusBadge}
                    />
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="py-8 text-center text-[#7a9abd]"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function UserRow({
  user,
  saving,
  onSave,
  statusBadge,
}: {
  user: ManagedUser;
  saving: boolean;
  onSave: (
    userId: string,
    role: string,
    status: string,
    kycStatus: string
  ) => void;
  statusBadge: (status: string) => string;
}) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [kycStatus, setKycStatus] = useState(user.kyc_status);

  const hasChanges =
    role !== user.role || status !== user.status || kycStatus !== user.kyc_status;

  return (
    <tr className="border-b border-[#172036] align-top">
      <td className="py-4">
        <p className="font-bold">{user.full_name || "Unnamed User"}</p>
        <p className="text-sm text-[#7a9abd]">{user.email || "No email"}</p>
      </td>

      <td className="py-4 text-[#7a9abd]">{user.phone || "-"}</td>

      <td className="py-4">
        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "member" | "admin" | "super_admin")
          }
          className="rounded-lg border border-[#172036] bg-[#0b0f1c] px-3 py-2 text-sm"
        >
          <option value="member">member</option>
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
      </td>

      <td className="py-4">
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "active" | "blocked" | "suspended")
          }
          className="rounded-lg border border-[#172036] bg-[#0b0f1c] px-3 py-2 text-sm"
        >
          <option value="active">active</option>
          <option value="blocked">blocked</option>
          <option value="suspended">suspended</option>
        </select>

        <p
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${statusBadge(
            status
          )}`}
        >
          {status}
        </p>
      </td>

      <td className="py-4">
        <select
          value={kycStatus}
          onChange={(e) =>
            setKycStatus(
              e.target.value as
                | "not_submitted"
                | "pending"
                | "approved"
                | "rejected"
            )
          }
          className="rounded-lg border border-[#172036] bg-[#0b0f1c] px-3 py-2 text-sm"
        >
          <option value="not_submitted">not_submitted</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>

        <p
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${statusBadge(
            kycStatus
          )}`}
        >
          {kycStatus}
        </p>
      </td>

      <td className="py-4">{Number(user.capital_balance || 0).toFixed(2)}</td>

      <td className="py-4">{Number(user.profit_balance || 0).toFixed(2)}</td>

      <td className="py-4">{Number(user.bonus_balance || 0).toFixed(2)}</td>

      <td className="py-4 text-[#7a9abd]">{user.referral_code || "-"}</td>

      <td className="py-4 text-[#7a9abd]">
        {new Date(user.created_at).toLocaleDateString()}
      </td>

      <td className="py-4">
        <button
          onClick={() => onSave(user.id, role, status, kycStatus)}
          disabled={saving || !hasChanges}
          className="rounded-lg bg-[#00b86b] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}