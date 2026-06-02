"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!fullName || !email || !phone || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Please accept the Terms & Conditions.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          referral_code: referralCode.trim() || null,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data.session) {
      setMessage("Account created. Please check your email to confirm your account.");
      return;
    }

    setMessage("Account created successfully. Redirecting...");
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-lg">
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
            <h1 className="text-2xl font-extrabold">Create Account</h1>
          </div>

          <form onSubmit={handleRegister}>
            <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. John Banda"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
              Mobile Number
            </label>
            <input
              type="text"
              placeholder="0991-234-567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
              Referral Code Optional
            </label>
            <input
              type="text"
              placeholder="e.g. KR12345678"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            {referralCode && (
              <p className="mb-4 rounded-lg bg-[#00b86b0a] px-4 py-3 text-sm text-[#00b86b]">
                Referral code detected: {referralCode}
              </p>
            )}

            <label className="mb-2 block text-sm font-semibold text-[#4e6880]">
              Password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            />

            <label className="mb-6 flex items-start gap-3 text-sm text-[#7a9abd]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm I am 18 years or older and agree to the Terms &
                Conditions.
              </span>
            </label>

            {errorMessage && (
              <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            {message && (
              <p className="mb-4 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#7a9abd]">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-[#00b86b]">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}