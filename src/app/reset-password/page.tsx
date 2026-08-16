"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  /*
   * Prevents React development mode from trying to verify
   * the same one-time recovery token more than once.
   */
  const verificationStartedRef = useRef(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [checkingLink, setCheckingLink] = useState(true);
  const [recoveryReady, setRecoveryReady] =
    useState(false);
  const [updating, setUpdating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    if (verificationStartedRef.current) {
      return;
    }

    verificationStartedRef.current = true;

    async function prepareRecoverySession() {
      setCheckingLink(true);
      setRecoveryReady(false);
      setErrorMessage("");
      setSuccessMessage("");

      const searchParams = new URLSearchParams(
        window.location.search
      );

      const tokenHash = searchParams.get("token_hash");
      const recoveryType = searchParams.get("type");

      if (!tokenHash || recoveryType !== "recovery") {
        setErrorMessage(
          "The password reset link is invalid, incomplete, or has expired. Please request a new reset email."
        );

        setCheckingLink(false);
        return;
      }

      /*
       * Verify the token hash from the custom Resend email.
       * This creates the temporary authenticated recovery session.
       */
      const { data, error } =
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

      if (error) {
        setErrorMessage(
          `The reset link could not be verified: ${error.message}. Please request a new reset email.`
        );

        setCheckingLink(false);
        return;
      }

      if (!data.session || !data.user) {
        setErrorMessage(
          "The recovery session could not be created. Please request a new reset email."
        );

        setCheckingLink(false);
        return;
      }

      /*
       * Remove the one-time token from the browser URL
       * after it has been verified successfully.
       */
      window.history.replaceState(
        {},
        document.title,
        "/reset-password"
      );

      setRecoveryReady(true);
      setCheckingLink(false);
    }

    void prepareRecoverySession();
  }, [supabase]);

  async function handlePasswordUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!recoveryReady) {
      setErrorMessage(
        "The password recovery session is not ready. Please request and open a new reset link."
      );
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "The two passwords do not match."
      );
      return;
    }

    setUpdating(true);

    try {
      /*
       * Confirm that the recovery session still exists
       * before attempting the password update.
       */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setErrorMessage(
          "Your recovery session has expired. Please request a new password reset email."
        );

        setRecoveryReady(false);
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        setErrorMessage(updateError.message);
        return;
      }

      setSuccessMessage(
        "Password updated successfully. You can now sign in using your new password."
      );

      setNewPassword("");
      setConfirmPassword("");
      setRecoveryReady(false);

      /*
       * End the temporary recovery session after the
       * password has been changed.
       */
      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch {
      setErrorMessage(
        "The password could not be updated. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/login"
          className="mb-10 inline-block rounded-lg bg-[#172036] px-5 py-3 text-[#7a9abd] transition hover:bg-[#1d2942]"
        >
          ← Back to Login
        </Link>

        <section className="rounded-2xl border border-[#1d2942] bg-[#10182b] p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500 text-2xl font-bold">
              K
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Reset Password
            </h1>
          </div>

          <p className="mb-8 text-lg text-[#7da3d6] sm:text-xl">
            Enter your new password below.
          </p>

          {checkingLink && (
            <div
              role="status"
              className="mb-6 rounded-lg bg-blue-950/60 p-4 text-blue-300"
            >
              Verifying your password reset link...
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 rounded-lg bg-red-950/60 p-4 text-red-400"
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-6 rounded-lg bg-emerald-950/60 p-4 text-emerald-400"
            >
              {successMessage}
            </div>
          )}

          <form
            onSubmit={handlePasswordUpdate}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="newPassword"
                className="mb-3 block font-semibold text-[#607fa9]"
              >
                New Password
              </label>

              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                minLength={8}
                required
                disabled={
                  checkingLink ||
                  !recoveryReady ||
                  updating
                }
                className="w-full rounded-xl border border-[#1d2942] bg-[#090f1e] px-5 py-5 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-3 block font-semibold text-[#607fa9]"
              >
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={8}
                required
                disabled={
                  checkingLink ||
                  !recoveryReady ||
                  updating
                }
                className="w-full rounded-xl border border-[#1d2942] bg-[#090f1e] px-5 py-5 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={
                checkingLink ||
                !recoveryReady ||
                updating
              }
              className="w-full rounded-xl bg-emerald-500 px-6 py-5 text-xl font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingLink
                ? "Verifying Reset Link..."
                : updating
                  ? "Updating Password..."
                  : "Update Password →"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}