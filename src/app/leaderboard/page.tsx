"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LeaderboardUser = {
  rank_number: number;
  user_id: string;
  full_name: string | null;
  referral_code: string | null;
  balance: number;
  bonus_balance: number;
  total_amount: number;
  referral_count: number;
  kyc_status: string;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase.rpc("get_leaderboard", {});

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setLeaderboard((data || []) as LeaderboardUser[]);
    setLoading(false);
  }

  function getRankLabel(rank: number) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  }

  function statusBadge(status: string) {
    if (status === "approved") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "rejected") {
      return "bg-red-500/10 text-red-400";
    }

    if (status === "pending") {
      return "bg-yellow-500/10 text-yellow-400";
    }

    return "bg-[#172036] text-[#7a9abd]";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading leaderboard...
      </main>
    );
  }

  const topThree = leaderboard.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-6xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="mb-2 text-3xl font-extrabold">Leaderboard</h1>
          <p className="text-[#7a9abd]">
            Ranking is based on user balance, bonus balance, and referral
            activity.
          </p>

          {errorMessage && (
            <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {topThree.map((user) => (
              <div
                key={user.user_id}
                className="rounded-2xl border border-[#00b86b33] bg-[#00b86b0a] p-6 text-center"
              >
                <p className="text-5xl">{getRankLabel(user.rank_number)}</p>
                <h2 className="mt-4 text-xl font-bold">
                  {user.full_name || "Member"}
                </h2>
                <p className="mt-1 text-sm text-[#7a9abd]">
                  {user.referral_code || "-"}
                </p>

                <p className="mt-5 text-sm text-[#7a9abd]">Total Amount</p>
                <p className="text-3xl font-extrabold text-[#00b86b]">
                  {Number(user.total_amount || 0).toFixed(2)}
                </p>

                <p className="mt-3 text-sm text-[#7a9abd]">
                  Referrals:{" "}
                  <span className="font-bold text-[#dde2ef]">
                    {user.referral_count}
                  </span>
                </p>
              </div>
            ))}

            {topThree.length === 0 && (
              <div className="col-span-3 rounded-xl border border-[#172036] bg-[#0b0f1c] p-6 text-center text-[#7a9abd]">
                No leaderboard data yet.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">All Rankings</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Rank</th>
                  <th className="py-3">Member</th>
                  <th className="py-3">Referral Code</th>
                  <th className="py-3">Balance</th>
                  <th className="py-3">Bonus</th>
                  <th className="py-3">Total</th>
                  <th className="py-3">Referrals</th>
                  <th className="py-3">KYC</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.map((user) => (
                  <tr key={user.user_id} className="border-b border-[#172036]">
                    <td className="py-4 text-xl font-bold">
                      {getRankLabel(user.rank_number)}
                    </td>

                    <td className="py-4 font-semibold">
                      {user.full_name || "Member"}
                    </td>

                    <td className="py-4 text-[#7a9abd]">
                      {user.referral_code || "-"}
                    </td>

                    <td className="py-4">
                      {Number(user.balance || 0).toFixed(2)}
                    </td>

                    <td className="py-4">
                      {Number(user.bonus_balance || 0).toFixed(2)}
                    </td>

                    <td className="py-4 font-bold text-[#00b86b]">
                      {Number(user.total_amount || 0).toFixed(2)}
                    </td>

                    <td className="py-4">{user.referral_count}</td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          user.kyc_status
                        )}`}
                      >
                        {user.kyc_status}
                      </span>
                    </td>
                  </tr>
                ))}

                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#7a9abd]">
                      No leaderboard records yet.
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