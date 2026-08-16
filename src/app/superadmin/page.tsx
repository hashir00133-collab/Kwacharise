"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PaymentMethod = {
  id: string;
  method_name: string | null;
  slug: string | null;
  method_type: string | null;
  receiving_number_or_wallet: string | null;
  payment_instructions: string | null;
  minimum_deposit: number | null;
  is_active: boolean | null;
  created_at: string;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [methodName, setMethodName] = useState("");
  const [slug, setSlug] = useState("");
  const [methodType, setMethodType] = useState("Mobile Money");
  const [minimumDeposit, setMinimumDeposit] = useState("250");
  const [receivingNumberOrWallet, setReceivingNumberOrWallet] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkSuperAdminAndLoadMethods();
  }, []);

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function checkSuperAdminAndLoadMethods() {
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

    await loadPaymentMethods();
    setLoading(false);
  }

  async function loadPaymentMethods() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select(
        "id, method_name, slug, method_type, receiving_number_or_wallet, payment_instructions, minimum_deposit, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setPaymentMethods((data || []) as PaymentMethod[]);
  }

  function resetForm() {
    setEditingId(null);
    setMethodName("");
    setSlug("");
    setMethodType("Mobile Money");
    setMinimumDeposit("250");
    setReceivingNumberOrWallet("");
    setPaymentInstructions("");
    setIsActive(true);
  }

  function startEdit(method: PaymentMethod) {
    setEditingId(method.id);
    setMethodName(method.method_name || "");
    setSlug(method.slug || "");
    setMethodType(method.method_type || "Mobile Money");
    setMinimumDeposit(String(method.minimum_deposit ?? 250));
    setReceivingNumberOrWallet(method.receiving_number_or_wallet || "");
    setPaymentInstructions(method.payment_instructions || "");
    setIsActive(Boolean(method.is_active));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSavePaymentMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanName = methodName.trim();
    const cleanSlug = slug.trim() ? makeSlug(slug) : makeSlug(cleanName);
    const minDeposit = Number(minimumDeposit || 0);

    if (!cleanName) {
      setErrorMessage("Payment method name is required.");
      return;
    }

    if (!cleanSlug) {
      setErrorMessage("Slug is required.");
      return;
    }

    if (minDeposit < 0) {
      setErrorMessage("Minimum deposit cannot be negative.");
      return;
    }

    if (!receivingNumberOrWallet.trim()) {
      setErrorMessage("Receiving number or wallet address is required.");
      return;
    }

    if (!paymentInstructions.trim()) {
      setErrorMessage("Payment instructions are required.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("payment_methods")
        .update({
          method_name: cleanName,
          slug: cleanSlug,
          method_type: methodType,
          receiving_number_or_wallet: receivingNumberOrWallet.trim(),
          payment_instructions: paymentInstructions.trim(),
          minimum_deposit: minDeposit,
          is_active: isActive,
        })
        .eq("id", editingId);

      setSaving(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setMessage("Payment method updated successfully.");
    } else {
      const { error } = await supabase.from("payment_methods").insert({
        method_name: cleanName,
        slug: cleanSlug,
        method_type: methodType,
        receiving_number_or_wallet: receivingNumberOrWallet.trim(),
        payment_instructions: paymentInstructions.trim(),
        minimum_deposit: minDeposit,
        is_active: isActive,
      });

      setSaving(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setMessage("Payment method added successfully.");
    }

    resetForm();
    await loadPaymentMethods();
  }

  async function togglePaymentMethod(method: PaymentMethod) {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("payment_methods")
      .update({
        is_active: !method.is_active,
      })
      .eq("id", method.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      method.is_active
        ? "Payment method disabled successfully."
        : "Payment method enabled successfully."
    );

    await loadPaymentMethods();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function statusBadge(active: boolean | null) {
    if (active) {
      return "bg-green-500/10 text-green-400";
    }

    return "bg-red-500/10 text-red-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading Super Admin dashboard...
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
            <h2 className="font-bold text-[#ffd700]">⭐ Super Admin Panel</h2>
            <p className="mt-2 text-sm text-[#7a9abd]">
              Full system control
            </p>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a
              href="/superadmin"
              className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]"
            >
              Payment Methods
            </a>

            <a
              href="/superadmin/settings"
              className="block rounded-xl px-4 py-3 hover:bg-[#172036] hover:text-[#00b86b]"
            >
              System Settings
            </a>

            <a
              href="/superadmin/users"
              className="block rounded-xl px-4 py-3 hover:bg-[#172036] hover:text-[#00b86b]"
            >
              User Management
            </a>

            <a
              href="/superadmin/admins"
              className="block rounded-xl px-4 py-3 hover:bg-[#172036] hover:text-[#00b86b]"
            >
              Manage Admins
            </a>

            <a
              href="/superadmin/broadcast"
              className="block rounded-xl px-4 py-3 hover:bg-[#172036] hover:text-[#00b86b]"
            >
              Broadcast Message
            </a>

            <a
              href="/admin"
              className="block rounded-xl px-4 py-3 hover:bg-[#172036] hover:text-[#00b86b]"
            >
              Admin Dashboard
            </a>

            <a
              href="/dashboard"
              className="block rounded-xl px-4 py-3 hover:bg-[#172036] hover:text-[#00b86b]"
            >
              Member Dashboard
            </a>
          </nav>

          <button
            onClick={handleSignOut}
            className="mt-10 w-full rounded-xl bg-[#172036] px-4 py-3 text-[#7a9abd] hover:text-[#00b86b]"
          >
            Sign Out
          </button>
        </aside>

        <section className="p-6 lg:p-10">
          <h1 className="text-4xl font-extrabold lg:text-5xl">
            Super Admin Dashboard
          </h1>

          <p className="mt-3 text-lg text-[#7a9abd]">
            Manage payment methods, system wallets, deposit instructions, and
            platform rules.
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

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Super Admin Quick Actions</h2>

            <p className="mt-2 text-[#7a9abd]">
              Open the main Super Admin tools from here.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <a
                href="/superadmin/settings"
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd] hover:border-[#00b86b] hover:text-[#00b86b]"
              >
                System Settings
              </a>

              <a
                href="/superadmin/users"
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd] hover:border-[#00b86b] hover:text-[#00b86b]"
              >
                User Management
              </a>

              <a
                href="/superadmin/admins"
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-4 text-center font-semibold text-[#7a9abd] hover:border-[#00b86b] hover:text-[#00b86b]"
              >
                Manage Admins
              </a>

              <a
                href="/superadmin/broadcast"
                className="rounded-xl border border-[#00b86b55] bg-[#00b86b12] px-5 py-4 text-center font-semibold text-[#00b86b] hover:border-[#00b86b] hover:bg-[#00b86b20]"
              >
                Broadcast Message
              </a>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">System Payment Methods</h2>

            <p className="mt-2 text-[#7a9abd]">
              These methods appear dynamically on the member deposit page.
            </p>

            <form onSubmit={handleSavePaymentMethod} className="mt-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Method Name
                  </label>
                  <input
                    type="text"
                    value={methodName}
                    onChange={(e) => {
                      setMethodName(e.target.value);
                      if (!editingId) {
                        setSlug(makeSlug(e.target.value));
                      }
                    }}
                    placeholder="Airtel Money"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(makeSlug(e.target.value))}
                    placeholder="airtel-money"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Method Type
                  </label>
                  <select
                    value={methodType}
                    onChange={(e) => setMethodType(e.target.value)}
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  >
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Minimum Deposit
                  </label>
                  <input
                    type="number"
                    value={minimumDeposit}
                    onChange={(e) => setMinimumDeposit(e.target.value)}
                    placeholder="250"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                  Receiving Number or Wallet Address
                </label>
                <input
                  type="text"
                  value={receivingNumberOrWallet}
                  onChange={(e) => setReceivingNumberOrWallet(e.target.value)}
                  placeholder="0991234567 or USDT TRC20 wallet address"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                  Payment Instructions
                </label>
                <textarea
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="Tell members how to send payment and upload proof."
                  rows={4}
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <label className="mt-5 flex items-center gap-3 rounded-xl border border-[#172036] bg-[#0b0f1c] p-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>
                  <span className="block font-semibold">Active Method</span>
                  <span className="text-sm text-[#7a9abd]">
                    Active methods are visible on the member deposit page.
                  </span>
                </span>
              </label>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#00b86b] px-6 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Payment Method"
                    : "Add Payment Method"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-6 py-3 font-semibold text-[#7a9abd]"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Existing Payment Methods</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">Name</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Receiving Details</th>
                    <th className="py-3">Minimum</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Instructions</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paymentMethods.map((method) => (
                    <tr key={method.id} className="border-b border-[#172036]">
                      <td className="py-4">
                        <p className="font-bold">
                          {method.method_name || "Unnamed Method"}
                        </p>
                        <p className="text-sm text-[#7a9abd]">
                          {method.slug || "-"}
                        </p>
                      </td>

                      <td className="py-4 text-[#7a9abd]">
                        {method.method_type || "-"}
                      </td>

                      <td className="max-w-[250px] truncate py-4 text-[#7a9abd]">
                        {method.receiving_number_or_wallet || "-"}
                      </td>

                      <td className="py-4">
                        {Number(method.minimum_deposit || 0).toFixed(2)}
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                            method.is_active
                          )}`}
                        >
                          {method.is_active ? "active" : "inactive"}
                        </span>
                      </td>

                      <td className="max-w-[280px] truncate py-4 text-[#7a9abd]">
                        {method.payment_instructions || "-"}
                      </td>

                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(method)}
                            className="rounded-lg bg-[#172036] px-3 py-2 text-sm font-semibold text-[#7a9abd]"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => togglePaymentMethod(method)}
                            className={
                              method.is_active
                                ? "rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400"
                                : "rounded-lg bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-400"
                            }
                          >
                            {method.is_active ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paymentMethods.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-[#7a9abd]"
                      >
                        No payment methods added yet.
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