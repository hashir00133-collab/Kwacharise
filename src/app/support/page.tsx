"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SupportTicket = {
  id: string;
  subject: string;
  category: string | null;
  message: string;
  admin_reply: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function SupportPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [messageText, setMessageText] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSupportPage();
  }, []);

  async function loadSupportPage() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, subject, category, message, admin_reply, status, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setTickets((data || []) as SupportTicket[]);
    setLoading(false);
  }

  async function handleSubmitTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanSubject = subject.trim();
    const cleanMessage = messageText.trim();

    if (!cleanSubject) {
      setErrorMessage("Please enter a subject.");
      return;
    }

    if (!cleanMessage) {
      setErrorMessage("Please enter your support message.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: cleanSubject,
      category,
      message: cleanMessage,
      status: "open",
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Support ticket submitted successfully.");
    setSubject("");
    setCategory("General");
    setMessageText("");

    await loadSupportPage();
  }

  function statusBadge(status: string) {
    if (status === "replied") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "closed") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading support page...
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
          <h1 className="text-3xl font-extrabold">Support Center</h1>

          <p className="mt-2 text-[#7a9abd]">
            Submit a support request and admin will reply from the dashboard.
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

          <form onSubmit={handleSubmitTicket} className="mt-8">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            >
              <option value="General">General</option>
              <option value="Deposit">Deposit</option>
              <option value="Withdrawal">Withdrawal</option>
              <option value="KYC">KYC</option>
              <option value="Referral">Referral</option>
              <option value="Account">Account</option>
              <option value="Other">Other</option>
            </select>

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Subject
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Example: My deposit is still pending"
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            />

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Message
            </label>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={5}
              placeholder="Write your support message here..."
              className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Support Ticket →"}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">My Support Tickets</h2>

          <div className="mt-6 space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-[#4e6880]">{ticket.category}</p>
                    <h3 className="mt-1 text-xl font-bold">{ticket.subject}</h3>
                    <p className="mt-2 text-[#7a9abd]">{ticket.message}</p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-sm ${statusBadge(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </div>

                {ticket.admin_reply && (
                  <div className="mt-5 rounded-xl border border-[#00b86b33] bg-[#00b86b0a] p-4">
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
                      Admin Reply
                    </p>
                    <p className="mt-2 text-[#dde2ef]">{ticket.admin_reply}</p>
                  </div>
                )}

                <p className="mt-4 text-xs text-[#4e6880]">
                  Created: {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
            ))}

            {tickets.length === 0 && (
              <p className="text-[#7a9abd]">No support tickets yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}