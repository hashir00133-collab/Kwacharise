"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BroadcastMessage = {
  id: string;
  title: string;
  message: string;
  target_role: string;
  send_email: boolean;
  created_at: string;
};

export default function SuperAdminBroadcastPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);

  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkSuperAdminAndLoadBroadcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkSuperAdminAndLoadBroadcasts() {
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

    if (
      profileError ||
      !profile ||
      profile.role !== "super_admin" ||
      profile.status === "blocked" ||
      profile.status === "suspended"
    ) {
      router.push("/dashboard");
      return;
    }

    await loadBroadcasts();
    setLoading(false);
  }

  async function loadBroadcasts() {
    const { data, error } = await supabase
      .from("broadcast_messages")
      .select("id, title, message, target_role, send_email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setBroadcasts((data || []) as BroadcastMessage[]);
  }

  async function handleSendBroadcast(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const cleanTitle = title.trim();
    const cleanMessage = messageText.trim();

    if (!cleanTitle) {
      setErrorMessage("Please enter a broadcast title.");
      return;
    }

    if (!cleanMessage) {
      setErrorMessage("Please enter a broadcast message.");
      return;
    }

    setSending(true);

    const { error } = await supabase.rpc("send_broadcast_message", {
      p_title: cleanTitle,
      p_message: cleanMessage,
      p_send_email: sendEmail,
    });

    if (error) {
      setSending(false);
      setErrorMessage(error.message);
      return;
    }

    let whatsappStatus = "";

    if (sendWhatsApp) {
      try {
        const whatsappResponse = await fetch(
          "/api/notifications/broadcast-whatsapp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: cleanTitle,
              message: cleanMessage,
            }),
          }
        );

        const whatsappData = await whatsappResponse.json().catch(() => null);

        if (!whatsappResponse.ok || whatsappData?.success === false) {
          whatsappStatus = ` WhatsApp broadcast had issues: ${
            whatsappData?.error ||
            whatsappData?.message ||
            "Unknown WhatsApp error."
          }`;
        } else {
          whatsappStatus = ` WhatsApp sent: ${
            whatsappData?.sent ?? 0
          }, failed: ${whatsappData?.failed ?? 0}.`;
        }
      } catch (whatsappError) {
        whatsappStatus = ` WhatsApp broadcast failed: ${
          whatsappError instanceof Error
            ? whatsappError.message
            : "Unknown WhatsApp error."
        }`;
      }
    } else {
      whatsappStatus = " WhatsApp sending was not selected.";
    }

    setSending(false);

    setSuccessMessage(
      `Broadcast sent successfully. Members will see it in their notifications.${whatsappStatus}`
    );

    setTitle("");
    setMessageText("");
    setSendEmail(true);
    setSendWhatsApp(true);

    await loadBroadcasts();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading broadcast page...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-6xl">
        <a
          href="/superadmin"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Super Admin
        </a>

        <section className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="text-3xl font-extrabold">Broadcast Message</h1>

          <p className="mt-2 text-[#7a9abd]">
            Send announcements, maintenance notices, or important updates to all
            active members.
          </p>

          {errorMessage && (
            <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="mt-6 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {successMessage}
            </p>
          )}

          <form onSubmit={handleSendBroadcast} className="mt-8">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Broadcast Title
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: System Maintenance Notice"
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            />

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Broadcast Message
            </label>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write your message to all members here..."
              rows={6}
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            />

            <div className="mb-6 space-y-4">
              <label className="flex items-start gap-3 rounded-xl border border-[#172036] bg-[#0b0f1c] p-4 text-sm text-[#7a9abd]">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Also add this message to the email notification queue. Email
                  delivery uses the configured Resend setup.
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-[#172036] bg-[#0b0f1c] p-4 text-sm text-[#7a9abd]">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Also send this message by WhatsApp to members who enabled
                  WhatsApp notifications.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {sending ? "Sending Broadcast..." : "Send Broadcast to Members →"}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">Previous Broadcasts</h2>

          <div className="mt-6 space-y-4">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{broadcast.title}</h3>

                    <p className="mt-2 whitespace-pre-wrap text-[#7a9abd]">
                      {broadcast.message}
                    </p>

                    <p className="mt-3 text-sm text-[#4e6880]">
                      Target: {broadcast.target_role} | Email Queue:{" "}
                      {broadcast.send_email ? "Yes" : "No"}
                    </p>
                  </div>

                  <p className="text-sm text-[#7a9abd]">
                    {new Date(broadcast.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {broadcasts.length === 0 && (
              <p className="rounded-xl border border-[#172036] bg-[#0b0f1c] p-6 text-center text-[#7a9abd]">
                No broadcasts sent yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}