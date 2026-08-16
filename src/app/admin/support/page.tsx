"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AdminSupportTicket = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  subject: string;
  category: string | null;
  message: string;
  admin_reply: string | null;
  status: string;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminSupportPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [filter, setFilter] = useState("all");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkAdminAndLoadTickets();
  }, []);

  async function checkAdminAndLoadTickets() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      router.push("/dashboard");
      return;
    }

    if (profile.role !== "admin" && profile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    if (profile.status === "blocked" || profile.status === "suspended") {
      router.push("/login");
      return;
    }

    await loadTickets();
    setLoading(false);
  }

  async function loadTickets() {
    const { data, error } = await supabase.rpc("get_support_tickets_for_admin", {});

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setTickets((data || []) as AdminSupportTicket[]);
  }

  async function replyToTicket(ticketId: string, reply: string, status: string) {
    setMessage("");
    setErrorMessage("");

    if (!reply.trim() && status !== "closed") {
      setErrorMessage("Please write a reply before saving.");
      return;
    }

    const { error } = await supabase.rpc("reply_support_ticket", {
      p_ticket_id: ticketId,
      p_admin_reply: reply.trim(),
      p_status: status,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Support ticket updated successfully.");
    await loadTickets();
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

  const filteredTickets =
    filter === "all"
      ? tickets
      : tickets.filter((ticket) => ticket.status === filter);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading support tickets...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-6xl">
        <a
          href="/admin"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Admin Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Support Tickets</h1>
              <p className="mt-2 text-[#7a9abd]">
                View member support requests and send replies.
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            >
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>

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
            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Total</p>
              <p className="mt-2 text-3xl font-extrabold">{tickets.length}</p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Open</p>
              <p className="mt-2 text-3xl font-extrabold text-yellow-400">
                {tickets.filter((ticket) => ticket.status === "open").length}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Replied</p>
              <p className="mt-2 text-3xl font-extrabold text-green-400">
                {tickets.filter((ticket) => ticket.status === "replied").length}
              </p>
            </div>

            <div className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
              <p className="text-sm text-[#7a9abd]">Closed</p>
              <p className="mt-2 text-3xl font-extrabold text-red-400">
                {tickets.filter((ticket) => ticket.status === "closed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {filteredTickets.map((ticket) => (
            <SupportTicketCard
              key={ticket.id}
              ticket={ticket}
              statusBadge={statusBadge}
              onReply={replyToTicket}
            />
          ))}

          {filteredTickets.length === 0 && (
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8 text-center text-[#7a9abd]">
              No support tickets found.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function SupportTicketCard({
  ticket,
  statusBadge,
  onReply,
}: {
  ticket: AdminSupportTicket;
  statusBadge: (status: string) => string;
  onReply: (ticketId: string, reply: string, status: string) => void;
}) {
  const [reply, setReply] = useState(ticket.admin_reply || "");
  const [status, setStatus] = useState(ticket.status);

  return (
    <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-[#4e6880]">{ticket.category}</p>
          <h2 className="mt-1 text-2xl font-bold">{ticket.subject}</h2>

          <p className="mt-2 text-sm text-[#7a9abd]">
            From: {ticket.full_name || "Unknown"} | {ticket.email || "No email"}{" "}
            | {ticket.phone || "No phone"}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-sm ${statusBadge(
            ticket.status
          )}`}
        >
          {ticket.status}
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-[#172036] bg-[#0b0f1c] p-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
          Member Message
        </p>
        <p className="mt-2 text-[#dde2ef]">{ticket.message}</p>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
          Admin Reply
        </label>

        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder="Write admin reply..."
          className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
        >
          <option value="open">Open</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>

        <button
          onClick={() => onReply(ticket.id, reply, status)}
          className="rounded-xl bg-[#00b86b] px-6 py-3 font-semibold text-white"
        >
          Save Reply
        </button>
      </div>

      <p className="mt-4 text-xs text-[#4e6880]">
        Created: {new Date(ticket.created_at).toLocaleString()}
      </p>
    </div>
  );
}