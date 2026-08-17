"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleResetRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      console.error("Password reset error:", error);
      setErrorMessage(
        "We could not send the reset email right now. Please try again shortly."
      );
      return;
    }

    setSuccessMessage(
      "If an account exists with this email address, a password reset link has been sent. Please check your inbox."
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-md">
        <a
          href="/login"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Sign In
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00b86b] font-bold text-white">
              K
            </div>

            <div>
              <h1 className="text-2xl font-extrabold">Forgot Password</h1>
              <p className="mt-1 text-sm text-[#7a9abd]">
                Enter your email to receive a reset link.
              </p>
            </div>
          </div>

          <form onSubmit={handleResetRequest}>
            <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
              Email Address
            </label>

            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none disabled:opacity-60"
            />

            {errorMessage && (
              <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="mb-4 rounded-lg bg-[#00b86b]/10 px-4 py-3 text-sm text-[#00b86b]">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="block w-full rounded-xl bg-[#00b86b] px-5 py-3 text-center font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link →"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#7a9abd]">
            Remember your password?{" "}
            <a href="/login" className="font-semibold text-[#00b86b]">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}