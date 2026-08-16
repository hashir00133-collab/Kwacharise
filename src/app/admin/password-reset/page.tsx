"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminPasswordResetPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let pageActive = true;

    async function checkAdminAccess() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!pageActive) {
          return;
        }

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role, status")
            .eq("id", user.id)
            .single();

        if (!pageActive) {
          return;
        }

        if (profileError || !profile) {
          router.replace("/dashboard");
          return;
        }

        const hasAdminAccess =
          profile.role === "admin" ||
          profile.role === "super_admin";

        if (!hasAdminAccess) {
          router.replace("/dashboard");
          return;
        }

        if (
          profile.status === "blocked" ||
          profile.status === "suspended"
        ) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        setLoading(false);
      } catch {
        if (pageActive) {
          setErrorMessage(
            "Unable to verify admin access. Please refresh the page and try again."
          );
          setLoading(false);
        }
      }
    }

    void checkAdminAccess();

    return () => {
      pageActive = false;
    };
  }, [router, supabase]);

  async function handleSendResetEmail(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanEmail = memberEmail.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setErrorMessage(
        "Please enter the member email address."
      );
      return;
    }

    if (!emailPattern.test(cleanEmail)) {
      setErrorMessage(
        "Please enter a valid email address."
      );
      return;
    }

    setSending(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setErrorMessage(
          "Your admin session has expired. Please log in again."
        );

        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const response = await fetch(
        "/api/admin/password-reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          result?.error ||
            result?.message ||
            "The password reset email could not be sent."
        );
        return;
      }

      setMessage(
        result?.message ||
          `Password reset email sent to ${cleanEmail}. Ask the member to check their inbox.`
      );

      setMemberEmail("");
    } catch {
      setErrorMessage(
        "Unable to send the password reset email. Please check your connection and try again."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading password reset page...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd] transition hover:bg-[#1d2942]"
        >
          ← Back to Admin Dashboard
        </Link>

        <section className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold">
            Password Reset
          </h1>

          <p className="mt-2 text-[#7a9abd]">
            Admins and Super Admins can send a secure
            password reset link to a member using their
            registered email address.
          </p>

          {errorMessage && (
            <p
              role="alert"
              className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {errorMessage}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400"
            >
              {message}
            </p>
          )}

          <form
            onSubmit={handleSendResetEmail}
            className="mt-8"
          >
            <label
              htmlFor="memberEmail"
              className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]"
            >
              Member Email Address
            </label>

            <input
              id="memberEmail"
              name="memberEmail"
              type="email"
              autoComplete="email"
              value={memberEmail}
              onChange={(event) =>
                setMemberEmail(event.target.value)
              }
              placeholder="member@email.com"
              disabled={sending}
              required
              className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none transition focus:border-[#00b86b] disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white transition hover:bg-[#00a860] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending
                ? "Sending Reset Email..."
                : "Send Password Reset Email →"}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
          <h2 className="text-xl font-bold">
            How it works
          </h2>

          <div className="mt-4 space-y-3 text-[#7a9abd]">
            <p>
              1. Admin enters the member&apos;s registered
              email address.
            </p>

            <p>
              2. The system verifies that the email belongs
              to a registered member.
            </p>

            <p>
              3. The member receives a secure password reset
              link by email.
            </p>

            <p>
              4. The member opens the link and creates a new
              password.
            </p>

            <p>
              5. The admin never sees the member&apos;s
              password.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}