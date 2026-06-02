"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PaymentMethod = {
  id: string;
  name: string;
  slug: string;
  method_type: "mobile_money" | "crypto" | "bank" | "other";
  receiving_number_or_address: string;
  instructions: string | null;
  is_active: boolean;
  minimum_deposit: number;
  sort_order: number;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [methodType, setMethodType] = useState<
    "mobile_money" | "crypto" | "bank" | "other"
  >("mobile_money");
  const [receivingNumber, setReceivingNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [minimumDeposit, setMinimumDeposit] = useState("0");
  const [isActive, setIsActive] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkSuperAdminAndLoadData();
  }, []);

  async function checkSuperAdminAndLoadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    await loadPaymentMethods();
    setLoading(false);
  }

  async function loadPaymentMethods() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setPaymentMethods(data || []);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setMethodType("mobile_money");
    setReceivingNumber("");
    setInstructions("");
    setMinimumDeposit("0");
    setIsActive(false);
    setMessage("");
    setErrorMessage("");
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function startEdit(method: PaymentMethod) {
    setEditingId(method.id);
    setName(method.name);
    setSlug(method.slug);
    setMethodType(method.method_type);
    setReceivingNumber(method.receiving_number_or_address);
    setInstructions(method.instructions || "");
    setMinimumDeposit(String(method.minimum_deposit || 0));
    setIsActive(method.is_active);
    setMessage("");
    setErrorMessage("");
  }

  async function savePaymentMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!name || !receivingNumber) {
      setErrorMessage("Please enter method name and receiving number/wallet.");
      return;
    }

    setSaving(true);

    const finalSlug = slug || createSlug(name);

    const payload = {
      name,
      slug: finalSlug,
      method_type: methodType,
      receiving_number_or_address: receivingNumber,
      instructions,
      minimum_deposit: Number(minimumDeposit || 0),
      is_active: isActive,
      sort_order: paymentMethods.length + 1,
    };

    if (editingId) {
      const { error } = await supabase
        .from("payment_methods")
        .update(payload)
        .eq("id", editingId);

      setSaving(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setMessage("Payment method updated successfully.");
    } else {
      const { error } = await supabase.from("payment_methods").insert(payload);

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

  async function toggleActive(method: PaymentMethod) {
    const { error } = await supabase
      .from("payment_methods")
      .update({ is_active: !method.is_active })
      .eq("id", method.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadPaymentMethods();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
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
            <p className="mt-2 text-sm text-[#7a9abd]">Full system control</p>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]">
              System Payment Methods
            </a>
            <a href="/superadmin/settings" className="block rounded-xl px-4 py-3">
  System Settings
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
            Super Admin Dashboard
          </h1>
          <p className="mt-3 text-lg text-[#7a9abd]">
            Manage system-wide payment methods, wallet details, and deposit
            instructions.
          </p>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">System Payment Methods</h2>
            <p className="mt-2 text-[#7a9abd]">
              These methods will appear dynamically on the member deposit page.
            </p>

            {errorMessage && (
              <p className="mt-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            {message && (
              <p className="mt-5 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
                {message}
              </p>
            )}

            <form onSubmit={savePaymentMethod} className="mt-6 grid gap-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Method Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingId) {
                        setSlug(createSlug(e.target.value));
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
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="airtel-money"
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                    Method Type
                  </label>
                  <select
                    value={methodType}
                    onChange={(e) =>
                      setMethodType(
                        e.target.value as
                          | "mobile_money"
                          | "crypto"
                          | "bank"
                          | "other"
                      )
                    }
                    className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="crypto">Crypto</option>
                    <option value="bank">Bank</option>
                    <option value="other">Other</option>
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

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                  Receiving Number or Wallet Address
                </label>
                <input
                  value={receivingNumber}
                  onChange={(e) => setReceivingNumber(e.target.value)}
                  placeholder="Example: 0991234567 or USDT TRC20 wallet address"
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                  Payment Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Tell members how to send payment and upload proof."
                  rows={4}
                  className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
                />
              </div>

              <label className="flex items-center gap-3 text-[#7a9abd]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active method
              </label>

              <div className="flex flex-wrap gap-3">
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
                    className="rounded-xl bg-[#172036] px-6 py-3 font-semibold text-[#7a9abd]"
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
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">Name</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Receiving Number / Wallet</th>
                    <th className="py-3">Minimum</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paymentMethods.map((method) => (
                    <tr key={method.id} className="border-b border-[#172036]">
                      <td className="py-4 font-semibold">{method.name}</td>
                      <td className="py-4 text-[#7a9abd]">
                        {method.method_type}
                      </td>
                      <td className="max-w-[300px] truncate py-4 text-[#7a9abd]">
                        {method.receiving_number_or_address}
                      </td>
                      <td className="py-4">{method.minimum_deposit}</td>
                      <td className="py-4">
                        {method.is_active ? (
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="space-x-2 py-4">
                        <button
                          onClick={() => startEdit(method)}
                          className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(method)}
                          className="rounded-lg bg-[#00b86b] px-3 py-2 text-sm font-semibold text-white"
                        >
                          {method.is_active ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paymentMethods.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#7a9abd]">
                        No payment methods found.
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