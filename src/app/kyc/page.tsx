"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type KycDocument = {
  id: string;
  document_type: string;
  file_url: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

export default function KycPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [documents, setDocuments] = useState<KycDocument[]>([]);

  const [documentType, setDocumentType] = useState("National ID");
  const [file, setFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadKycPage();
  }, []);

  async function loadKycPage() {
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
      .select("kyc_status")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    setKycStatus(profile?.kyc_status || "not_submitted");

    const { data: docs, error: docsError } = await supabase
      .from("kyc_documents")
      .select("id, document_type, file_url, status, admin_note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (docsError) {
      setErrorMessage(docsError.message);
      setLoading(false);
      return;
    }

    setDocuments(docs || []);
    setLoading(false);
  }

  async function handleSubmitKyc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!documentType) {
      setErrorMessage("Please select document type.");
      return;
    }

    if (!file) {
      setErrorMessage("Please select a KYC document file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size must be 5MB or less.");
      return;
    }

    setSubmitting(true);

    const fileExtension = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setSubmitting(false);
      setErrorMessage(uploadError.message);
      return;
    }

    const { error: submitError } = await supabase.rpc("submit_kyc_document", {
      p_document_type: documentType,
      p_file_path: filePath,
    });

    setSubmitting(false);

    if (submitError) {
      setErrorMessage(submitError.message);
      return;
    }

    setMessage("KYC document uploaded successfully. Admin will review it soon.");
    setFile(null);

    await loadKycPage();
  }

  async function openKycDocument(filePath: string) {
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(filePath, 300);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank");
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
        Loading KYC page...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-3xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]"
        >
          ← Back to Dashboard
        </a>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h1 className="mb-2 text-3xl font-extrabold">KYC Verification</h1>
          <p className="mb-6 text-[#7a9abd]">
            Upload your identity document for admin verification.
          </p>

          <div className="mb-6 rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Current KYC Status
            </p>
            <p
              className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(
                kycStatus
              )}`}
            >
              {kycStatus}
            </p>
          </div>

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

          <form onSubmit={handleSubmitKyc}>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="mb-5 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none"
            >
              <option value="National ID">National ID</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Proof of Address">Proof of Address</option>
              <option value="Other">Other</option>
            </select>

            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Upload Document
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-6 w-full rounded-xl border border-dashed border-[#172036] bg-[#0b0f1c] px-4 py-5 text-sm text-[#7a9abd]"
            />

            <p className="mb-6 text-sm text-[#7a9abd]">
              Accepted files: JPG, PNG, WEBP, or PDF. Maximum size: 5MB.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Uploading..." : "Submit KYC Document →"}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-8">
          <h2 className="text-2xl font-bold">My KYC Documents</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3">Document Type</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Admin Note</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">File</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => (
                  <tr key={document.id} className="border-b border-[#172036]">
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
                        onClick={() => openKycDocument(document.file_url)}
                        className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd]"
                      >
                        View File
                      </button>
                    </td>
                  </tr>
                ))}

                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7a9abd]">
                      No KYC documents uploaded yet.
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