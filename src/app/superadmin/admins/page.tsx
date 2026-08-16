"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  kyc_status: string | null;
  created_at: string | null;
};

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkSuperAdminAndLoadAdmins();
  }, []);

  async function checkSuperAdminAndLoadAdmins() {
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

    if (
      profileError ||
      !profile ||
      profile.role !== "super_admin" ||
      profile.status === "blocked" ||
      profile.status === "suspended"
    ) {
      router.push("/dashboard");
      return;
    }

    await loadAdmins();
    setLoading(false);
  }

  async function loadAdmins() {
    const { data, error } = await supabase.rpc(
      "get_admins_for_super_admin",
      {}
    );

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setAdmins((data || []) as AdminUser[]);
  }

  async function handleCreateAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = temporaryPassword.trim();

    if (!cleanFullName || !cleanEmail || !cleanPassword) {
      setErrorMessage("Full name, email, and temporary password are required.");
      return;
    }

    if (cleanPassword.length < 8) {
      setErrorMessage("Temporary password must be at least 8 characters.");
      return;
    }

    setCreating(true);

    const response = await fetch("/api/superadmin/create-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        temporaryPassword: cleanPassword,
      }),
    });

    const result = await response.json();
    setCreating(false);

    if (!response.ok) {
      setErrorMessage(result.error || "Failed to create admin account.");
      return;
    }

    setMessage("Admin account created successfully.");
    setFullName("");
    setEmail("");
    setPhone("");
    setTemporaryPassword("");

    await loadAdmins();
  }

  async function revokeAdminAccess(adminId: string) {
    setMessage("");
    setErrorMessage("");
    setRevokingId(adminId);

    const { error } = await supabase.rpc("revoke_admin_access_by_super_admin", {
      p_user_id: adminId,
    });

    setRevokingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Admin access revoked successfully.");
    await loadAdmins();
  }

  function statusBadge(status: string) {
    if (status === "active") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "blocked" || status === "suspended") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  function roleBadge(role: string) {
    if (role === "super_admin") {
      return "bg-yellow-500/10 text-yellow-400";
    }

    if (role === "admin") {
      return "bg-green-500/10 text-green-400";
    }

    return "bg-[#172036] text-[#7a9abd]";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading admin management...
      </main>
    );
  }

  const adminCount = admins.filter((admin) => admin.role === "admin").length;
  const superAdminCount = admins.filter(
    (admin) => admin.role === "super_admin"
  ).length;

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-7xl">
        <a
          href="/superadmin"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Super Admin
        </a>

        <section className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="text-3xl font-extrabold">Manage Admins</h1>

          <p className="mt-2 text-[#7a9abd]">
            View admins, create new admin accounts, revoke admin access, and
            access password reset tools.
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
            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Total Admin Users</p>
              <p className="mt-2 text-3xl font-extrabold">{admins.length}</p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Admins</p>
              <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
                {adminCount}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Super Admins</p>
              <p className="mt-2 text-3xl font-extrabold text-yellow-400">
                {superAdminCount}
              </p>
            </div>

            <a
              href="/admin/password-reset"
              className="rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-5"
            >
              <p className="text-sm text-[#7a9abd]">Password Tool</p>
              <p className="mt-2 text-xl font-extrabold text-[#00b86b]">
                Reset Members
              </p>
            </a>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">Create New Admin Account</h2>

          <p className="mt-2 text-[#7a9abd]">
            Create an admin login using name, email, and temporary password.
          </p>

          <form onSubmit={handleCreateAdmin} className="mt-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Full Name
                </label>

                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Example: Admin User"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Phone Optional
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0991234567"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                  Temporary Password
                </label>

                <input
                  type="text"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-6 w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Creating Admin..." : "Create Admin Account →"}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">All Admins</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Name</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Phone</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Created</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-[#172036]">
                    <td className="py-4 font-bold">
                      {admin.full_name || "Unknown"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {admin.email || "-"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {admin.phone || "-"}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${roleBadge(
                          admin.role
                        )}`}
                      >
                        {admin.role}
                      </span>
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          admin.status
                        )}`}
                      >
                        {admin.status}
                      </span>
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {admin.created_at
                        ? new Date(admin.created_at).toLocaleString()
                        : "-"}
                    </td>

                    <td className="py-4">
                      {admin.role === "admin" ? (
                        <button
                          onClick={() => revokeAdminAccess(admin.id)}
                          disabled={revokingId === admin.id}
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
                        >
                          {revokingId === admin.id
                            ? "Revoking..."
                            : "Revoke Admin"}
                        </button>
                      ) : (
                        <span className="text-sm text-[#4e6880]">
                          Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {admins.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7a9abd]">
                      No admin users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}