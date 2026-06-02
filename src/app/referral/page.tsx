"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ReferralSummary = {
  referral_code: string | null;
  total_referrals: number;
  pending_referrals: number;
  approved_referrals: number;
  paid_referrals: number;
  total_bonus: number;
};

type ReferralItem = {
  id: string;
  referred_user_id: string;
  referred_name: string | null;
  referred_phone: string | null;
  bonus_amount: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  created_at: string;
};

export default function ReferralPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadReferralPage();
  }, []);

  async function loadReferralPage() {
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: summaryData, error: summaryError } = await supabase
      .rpc("get_my_referral_summary", {})
      .single();

    if (summaryError) {
      setErrorMessage(summaryError.message);
      setLoading(false);
      return;
    }

    const { data: referralData, error: referralError } = await supabase.rpc(
      "get_my_referrals",
      {}
    );

    if (referralError) {
      setErrorMessage(referralError.message);
      setLoading(false);
      return;
    }

    setSummary(summaryData as ReferralSummary);
    setReferrals((referralData || []) as ReferralItem[]);
    setLoading(false);
  }

  async function copyReferralCode() {
    if (!summary?.referral_code) {
      setErrorMessage("Referral code is not available yet.");
      return;
    }

    await navigator.clipboard.writeText(summary.referral_code);
    setMessage("Referral code copied.");
  }

  async function copyReferralLink() {
    if (!summary?.referral_code) {
      setErrorMessage("Referral link is not available yet.");
      return;
    }

    const link = `${window.location.origin}/register?ref=${summary.referral_code}`;
    await navigator.clipboard.writeText(link);
    setMessage("Referral link copied.");
  }

  function statusBadge(status: string) {
    if (status === "approved" || status === "paid") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "cancelled") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading referral page...
      </main>
    );
  }

  const referralLink =
    typeof window !== "undefined" && summary?.referral_code
      ? `${window.location.origin}/register?ref=${summary.referral_code}`
      : "";

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
          <h1 className="mb-2 text-3xl font-extrabold">Referral Program</h1>

          <p className="mb-8 text-[#7a9abd]">
            Share your referral code with new members and track your referral
            activity.
          </p>

          {errorMessage && (
            <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          {message && (
            <p className="mb-5 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {message}
            </p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#00b86b33] bg-[#00b86b0a] p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Your Referral Code
              </p>

              <p className="mt-3 break-all text-4xl font-extrabold text-[#00b86b]">
                {summary?.referral_code || "Not available"}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={copyReferralCode}
                  className="rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white"
                >
                  Copy Code
                </button>

                <button
                  onClick={copyReferralLink}
                  className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-5 py-3 font-semibold text-[#7a9abd]"
                >
                  Copy Invite Link
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0b0f1c] p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                Referral Link
              </p>

              <p className="mt-3 break-all text-sm text-[#7a9abd]">
                {referralLink || "Not available"}
              </p>

              <p className="mt-5 text-sm text-[#7a9abd]">
                New users can register using this link. Their account will be
                connected to your referral code.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-5">
          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
            <p className="text-sm text-[#7a9abd]">Total Referrals</p>
            <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
              {summary?.total_referrals || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
            <p className="text-sm text-[#7a9abd]">Pending</p>
            <p className="mt-2 text-3xl font-extrabold text-yellow-400">
              {summary?.pending_referrals || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
            <p className="text-sm text-[#7a9abd]">Approved</p>
            <p className="mt-2 text-3xl font-extrabold">
              {summary?.approved_referrals || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
            <p className="text-sm text-[#7a9abd]">Paid</p>
            <p className="mt-2 text-3xl font-extrabold">
              {summary?.paid_referrals || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
            <p className="text-sm text-[#7a9abd]">Total Bonus</p>
            <p className="mt-2 text-3xl font-extrabold text-[#00b86b]">
              {Number(summary?.total_bonus || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">Referral History</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Referred Member</th>
                  <th className="py-3">Phone</th>
                  <th className="py-3">Bonus</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-[#172036]">
                    <td className="py-4 font-semibold">
                      {referral.referred_name || "Unknown"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {referral.referred_phone || "-"}
                    </td>

                    <td className="py-4 font-bold">
                      {Number(referral.bonus_amount || 0).toFixed(2)}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          referral.status
                        )}`}
                      >
                        {referral.status}
                      </span>
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {new Date(referral.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {referrals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7a9abd]">
                      No referrals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}