"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    if (profileError || !profile) {
      setErrorMessage("Login worked, but profile could not be loaded.");
      return;
    }

    if (profile.status === "blocked" || profile.status === "suspended") {
      await supabase.auth.signOut();
      setErrorMessage("Your account is not active. Please contact support.");
      return;
    }

    if (profile.role === "super_admin") {
      router.push("/superadmin");
    } else if (profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-md">
        <a
          href="/"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00b86b] font-bold text-white">
              K
            </div>

            <h1 className="text-2xl font-extrabold">Sign In</h1>
          </div>

          <form onSubmit={handleLogin}>
            <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
              Email Address
            </label>

            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#4e6880]">
                Password
              </label>

              <a
                href="/forgot-password"
                className="text-sm font-semibold text-[#00b86b] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            {errorMessage && (
              <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="block w-full rounded-xl bg-[#00b86b] px-5 py-3 text-center font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In →"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#7a9abd]">
            Don&apos;t have an account?{" "}
            <a href="/register" className="font-semibold text-[#00b86b]">
              Create account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}