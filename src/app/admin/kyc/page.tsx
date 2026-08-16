"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type KycDocument = {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  identity_file_path: string | null;
  selfie_file_path: string | null;
  selfie_photo_url: string | null;
  status: "not_submitted" | "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

export default function AdminKycPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [adminNote, setAdminNote] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkAdminAndLoadKyc();
  }, []);

  async function checkAdminAndLoadKyc() {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      (profile.role !== "admin" && profile.role !== "super_admin")
    ) {
      router.push("/dashboard");
      return;
    }

    await loadKycDocuments();
    setLoading(false);
  }

  async function loadKycDocuments() {
    const { data, error } = await supabase
      .from("kyc_documents")
      .select(
        "id, user_id, document_type, file_url, identity_file_path, selfie_file_path, selfie_photo_url, status, admin_note, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setKycDocuments((data || []) as KycDocument[]);
  }

  async function openIdentityFile(document: KycDocument) {
    setErrorMessage("");

    const filePath = document.identity_file_path || document.file_url;

    if (!filePath) {
      setErrorMessage("No identity document found for this KYC submission.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(filePath, 300);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function openSelfieFile(document: KycDocument) {
    setErrorMessage("");

    const filePath = document.selfie_file_path || document.selfie_photo_url;

    if (!filePath) {
      setErrorMessage("No selfie photo found for this KYC submission.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("kyc-selfies")
      .createSignedUrl(filePath, 300);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function approveKyc(kycId: string) {
    setMessage("");
    setErrorMessage("");
    setActionLoadingId(kycId);

    const { error } = await supabase.rpc("approve_kyc_document", {
      p_kyc_id: kycId,
      p_admin_note: adminNote || "KYC approved by admin.",
    });

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setAdminNote("");
    setMessage("KYC approved successfully.");
    await loadKycDocuments();
  }

  async function rejectKyc(kycId: string) {
    setMessage("");
    setErrorMessage("");
    setActionLoadingId(kycId);

    const { error } = await supabase.rpc("reject_kyc_document", {
      p_kyc_id: kycId,
      p_admin_note: adminNote || "KYC rejected by admin.",
    });

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setAdminNote("");
    setMessage("KYC rejected successfully.");
    await loadKycDocuments();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
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
      <main className="min-h-screen bg-[#07090f] p-8 text-[#dde2ef]">
        Loading Admin KYC page...
      </main>
    );
  }

  const pendingKyc = kycDocuments.filter((doc) => doc.status === "pending");
  const reviewedKyc = kycDocuments.filter((doc) => doc.status !== "pending");

  return (
    <main className="min-h-screen bg-[#07090f] text-[#dde2ef]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#172036] bg-[#0b0f1c] p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00b86b] text-xl font-bold text-white">
              K
            </div>
            <h1 className="text-2xl font-extrabold">KwachaRise</h1>
          </div>

          <div className="mb-8 rounded-2xl border border-[#00b86b33] bg-[#00b86b18] p-5">
            <h2 className="font-bold text-[#00b86b]">Admin KYC Panel</h2>
            <p className="mt-2 text-sm text-[#7a9abd]">
              Review member identity documents and selfie photos.
            </p>
          </div>

          <nav className="space-y-3 text-[#7a9abd]">
            <a href="/admin" className="block rounded-xl px-4 py-3">
              Deposit / Withdrawal Admin
            </a>

            <a className="block rounded-xl bg-[#172036] px-4 py-3 text-[#00b86b]">
              KYC Approvals
            </a>

            <a href="/admin/support" className="block rounded-xl px-4 py-3">
              Support Tickets
            </a>

            <a href="/admin/pairing" className="block rounded-xl px-4 py-3">
              Pairing System
            </a>

            <a href="/admin/password-reset" className="block rounded-xl px-4 py-3">
              Password Reset
            </a>

            <a href="/dashboard" className="block rounded-xl px-4 py-3">
              Member Dashboard
            </a>

            <a href="/superadmin" className="block rounded-xl px-4 py-3">
              Super Admin Dashboard
            </a>
          </nav>

          <button
            onClick={handleSignOut}
            className="mt-10 w-full rounded-xl bg-[#172036] px-4 py-3 text-[#7a9abd]"
          >
            Sign Out
          </button>
        </aside>

        <section className="p-6 lg:p-10">
          <h1 className="text-4xl font-extrabold lg:text-5xl">
            KYC Approvals
          </h1>

          <p className="mt-3 text-lg text-[#7a9abd]">
            Approve or reject member KYC submissions after checking both
            identity document and selfie photo.
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

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Pending KYC</p>
              <p className="mt-2 text-3xl font-extrabold text-yellow-400">
                {pendingKyc.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-5">
              <p className="text-sm text-[#7a9abd]">Reviewed KYC</p>
              <p className="mt-2 text-3xl font-extrabold">
                {reviewedKyc.length}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Pending KYC Submissions</h2>

            <p className="mt-2 text-[#7a9abd]">
              Open identity file and selfie photo first, then approve or reject.
            </p>

            <label className="mt-6 mb-2 block text-sm font-semibold text-[#4e6880]">
              Admin Note Optional
            </label>

            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Example: Identity document and selfie verified successfully."
              rows={3}
              className="w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 outline-none"
            />

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">User ID</th>
                    <th className="py-3">Document Type</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Identity File</th>
                    <th className="py-3">Selfie Photo</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingKyc.map((document) => (
                    <tr key={document.id} className="border-b border-[#172036]">
                      <td className="max-w-[220px] truncate py-4 text-[#7a9abd]">
                        {document.user_id}
                      </td>

                      <td className="py-4 font-semibold">
                        {document.document_type}
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                            document.status
                          )}`}
                        >
                          {document.status}
                        </span>
                      </td>

                      <td className="py-4 text-[#7a9abd]">
                        {new Date(document.created_at).toLocaleString()}
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => openIdentityFile(document)}
                          className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd]"
                        >
                          View Identity
                        </button>
                      </td>

                      <td className="py-4">
                        {document.selfie_file_path ||
                        document.selfie_photo_url ? (
                          <button
                            onClick={() => openSelfieFile(document)}
                            className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd]"
                          >
                            View Selfie
                          </button>
                        ) : (
                          <span className="text-sm text-[#4e6880]">
                            No selfie
                          </span>
                        )}
                      </td>

                      <td className="space-x-2 py-4">
                        <button
                          onClick={() => approveKyc(document.id)}
                          disabled={actionLoadingId === document.id}
                          className="rounded-lg bg-[#00b86b] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {actionLoadingId === document.id
                            ? "Working..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() => rejectKyc(document.id)}
                          disabled={actionLoadingId === document.id}
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}

                  {pendingKyc.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-[#7a9abd]"
                      >
                        No pending KYC submissions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 lg:p-8">
            <h2 className="text-2xl font-bold">Reviewed KYC Submissions</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                    <th className="py-3">User ID</th>
                    <th className="py-3">Document Type</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Admin Note</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Identity File</th>
                    <th className="py-3">Selfie Photo</th>
                  </tr>
                </thead>

                <tbody>
                  {reviewedKyc.map((document) => (
                    <tr key={document.id} className="border-b border-[#172036]">
                      <td className="max-w-[220px] truncate py-4 text-[#7a9abd]">
                        {document.user_id}
                      </td>

                      <td className="py-4 font-semibold">
                        {document.document_type}
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                            document.status
                          )}`}
                        >
                          {document.status}
                        </span>
                      </td>

                      <td className="py-4 text-[#7a9abd]">
                        {document.admin_note || "-"}
                      </td>

                      <td className="py-4 text-[#7a9abd]">
                        {new Date(document.created_at).toLocaleString()}
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => openIdentityFile(document)}
                          className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd]"
                        >
                          View Identity
                        </button>
                      </td>

                      <td className="py-4">
                        {document.selfie_file_path ||
                        document.selfie_photo_url ? (
                          <button
                            onClick={() => openSelfieFile(document)}
                            className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd]"
                          >
                            View Selfie
                          </button>
                        ) : (
                          <span className="text-sm text-[#4e6880]">
                            No selfie
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {reviewedKyc.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-[#7a9abd]"
                      >
                        No reviewed KYC submissions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}