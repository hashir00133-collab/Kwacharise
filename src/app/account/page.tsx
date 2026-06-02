"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  phone: string | null;
  role: "member" | "admin" | "super_admin";
  status: string;
  kyc_status: string;
  referral_code: string | null;
  balance: number;
  bonus_balance: number;
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setEmail(user.email || "");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "full_name, phone, role, status, kyc_status, referral_code, balance, bonus_balance"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);
    setFullName(profileData?.full_name || "");
    setPhone(profileData?.phone || "");

    setLoading(false);
  }

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Phone number is required.");
      return;
    }

    setSavingProfile(true);

    const { error } = await supabase.rpc("update_my_profile", {
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
    });

    setSavingProfile(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Profile updated successfully.");
    await loadAccount();
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPassword(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password changed successfully.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function statusBadge(status: string) {
    if (status === "approved" || status === "active") {
      return "bg-green-500/10 text-green-400";
    }

    if (
      status === "rejected" ||
      status === "blocked" ||
      status === "suspended"
    ) {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading account settings...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-5xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="mb-2 text-3xl font-extrabold">Account Settings</h1>
          <p className="text-[#7a9abd]">
            Manage your personal details and account security.
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
            <div className="rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Role</p>
              <p className="mt-2 font-bold text-[#00b86b]">
                {profile?.role || "member"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Account Status</p>
              <p
                className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(
                  profile?.status || "active"
                )}`}
              >
                {profile?.status || "active"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">KYC Status</p>
              <p
                className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(
                  profile?.kyc_status || "not_submitted"
                )}`}
              >
                {profile?.kyc_status || "not_submitted"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Referral Code</p>
              <p className="mt-2 break-all font-bold text-[#00b86b]">
                {profile?.referral_code || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
            <h2 className="text-2xl font-bold">Profile Details</h2>
            <p className="mt-2 text-[#7a9abd]">
              Update your name and phone number.
            </p>

            <form onSubmit={handleUpdateProfile} className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="mb-4 w-full cursor-not-allowed rounded-xl border border-[#172036] bg-[#07090f] px-4 py-3 text-[#7a9abd] outline-none"
              />

              <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
            <h2 className="text-2xl font-bold">Change Password</h2>
            <p className="mt-2 text-[#7a9abd]">
              Choose a new password for your account.
            </p>

            <form onSubmit={handleChangePassword} className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
              />

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-xl bg-[#172036] px-5 py-3 font-semibold text-[#dde2ef] disabled:opacity-60"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>

            <button
              onClick={handleSignOut}
              className="mt-6 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-semibold text-red-400"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">Account Summary</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Available Balance</p>
              <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
                {Number(profile?.balance || 0).toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Bonus Balance</p>
              <p className="mt-2 text-3xl font-extrabold">
                {Number(profile?.bonus_balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}