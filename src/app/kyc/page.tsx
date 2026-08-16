"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type KycStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

type KycDocument = {
  id: string;
  document_type: string;
  file_url: string | null;
  identity_file_path: string | null;
  selfie_file_path: string | null;
  selfie_photo_url: string | null;
  status: KycStatus;
  admin_note: string | null;
  created_at: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const IDENTITY_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const SELFIE_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function KycPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const identityInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [kycStatus, setKycStatus] =
    useState<KycStatus>("not_submitted");

  const [documents, setDocuments] = useState<KycDocument[]>([]);

  const [documentType, setDocumentType] = useState("NRC");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadKycPage = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("kyc_status, status")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setErrorMessage(
          profileError?.message || "Your profile could not be loaded."
        );
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

      setKycStatus(
        (profile.kyc_status || "not_submitted") as KycStatus
      );

      const { data: docs, error: docsError } = await supabase
        .from("kyc_documents")
        .select(
          "id, document_type, file_url, identity_file_path, selfie_file_path, selfie_photo_url, status, admin_note, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (docsError) {
        setErrorMessage(docsError.message);
        return;
      }

      setDocuments((docs || []) as KycDocument[]);
    } catch {
      setErrorMessage(
        "Unable to load your KYC information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void loadKycPage();
  }, [loadKycPage]);

  function validateIdentityFile(selectedFile: File | null): string {
    if (!selectedFile) {
      return "Please select your NRC or passport.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "Identity document file size must be 5MB or less.";
    }

    if (!IDENTITY_FILE_TYPES.includes(selectedFile.type)) {
      return "Identity document must be JPG, PNG, WEBP, or PDF.";
    }

    return "";
  }

  function validateSelfieFile(selectedFile: File | null): string {
    if (!selectedFile) {
      return "Please select a clear selfie photo.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "Selfie photo size must be 5MB or less.";
    }

    if (!SELFIE_FILE_TYPES.includes(selectedFile.type)) {
      return "Selfie photo must be JPG, PNG, or WEBP.";
    }

    return "";
  }

  function getSafeFileExtension(selectedFile: File): string {
    const extensionByMimeType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
    };

    return extensionByMimeType[selectedFile.type] || "file";
  }

  function buildFilePath(
    userId: string,
    selectedFile: File,
    fileCategory: "identity" | "selfie"
  ): string {
    const extension = getSafeFileExtension(selectedFile);
    const uniqueId = crypto.randomUUID();

    return `${userId}/${fileCategory}-${Date.now()}-${uniqueId}.${extension}`;
  }

  async function removeUploadedFile(
    bucketName: string,
    filePath: string
  ) {
    try {
      await supabase.storage.from(bucketName).remove([filePath]);
    } catch {
      console.error(
        `Unable to remove incomplete upload from ${bucketName}.`
      );
    }
  }

  async function handleSubmitKyc(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (kycStatus === "pending") {
      setErrorMessage(
        "Your KYC submission is already waiting for admin review."
      );
      return;
    }

    if (kycStatus === "approved") {
      setErrorMessage("Your KYC has already been approved.");
      return;
    }

    const identityValidationError =
      validateIdentityFile(identityFile);

    if (identityValidationError) {
      setErrorMessage(identityValidationError);
      return;
    }

    const selfieValidationError = validateSelfieFile(selfieFile);

    if (selfieValidationError) {
      setErrorMessage(selfieValidationError);
      return;
    }

    if (!identityFile || !selfieFile) {
      setErrorMessage(
        "Both an identity document and selfie photo are required."
      );
      return;
    }

    setSubmitting(true);

    let identityFilePath = "";
    let selfieFilePath = "";
    let identityUploaded = false;
    let selfieUploaded = false;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      /*
       * Check again before uploading so a user cannot create
       * duplicate pending or approved submissions.
       */
      const { data: currentProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("kyc_status")
          .eq("id", user.id)
          .single();

      if (profileError || !currentProfile) {
        throw new Error(
          profileError?.message ||
            "Your current KYC status could not be verified."
        );
      }

      if (currentProfile.kyc_status === "pending") {
        throw new Error(
          "Your KYC submission is already waiting for admin review."
        );
      }

      if (currentProfile.kyc_status === "approved") {
        throw new Error("Your KYC has already been approved.");
      }

      identityFilePath = buildFilePath(
        user.id,
        identityFile,
        "identity"
      );

      selfieFilePath = buildFilePath(
        user.id,
        selfieFile,
        "selfie"
      );

      const { error: identityUploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(identityFilePath, identityFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: identityFile.type,
        });

      if (identityUploadError) {
        throw new Error(
          `Identity upload failed: ${identityUploadError.message}`
        );
      }

      identityUploaded = true;

      const { error: selfieUploadError } = await supabase.storage
        .from("kyc-selfies")
        .upload(selfieFilePath, selfieFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selfieFile.type,
        });

      if (selfieUploadError) {
        throw new Error(
          `Selfie upload failed: ${selfieUploadError.message}`
        );
      }

      selfieUploaded = true;

      const { error: submitError } = await supabase.rpc(
        "submit_kyc_document_with_selfie",
        {
          p_document_type: documentType,
          p_file_path: identityFilePath,
          p_selfie_file_path: selfieFilePath,
        }
      );

      if (submitError) {
        throw new Error(submitError.message);
      }

      setMessage(
        "Your identity document and selfie were uploaded successfully. Your KYC is now waiting for admin review."
      );

      setIdentityFile(null);
      setSelfieFile(null);

      if (identityInputRef.current) {
        identityInputRef.current.value = "";
      }

      if (selfieInputRef.current) {
        selfieInputRef.current.value = "";
      }

      await loadKycPage();
    } catch (error) {
      /*
       * Remove uploaded files when the full KYC submission was
       * not successfully saved in the database.
       */
      const cleanupTasks: Promise<void>[] = [];

      if (identityUploaded && identityFilePath) {
        cleanupTasks.push(
          removeUploadedFile("kyc-documents", identityFilePath)
        );
      }

      if (selfieUploaded && selfieFilePath) {
        cleanupTasks.push(
          removeUploadedFile("kyc-selfies", selfieFilePath)
        );
      }

      await Promise.all(cleanupTasks);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The KYC submission could not be completed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function openStoredFile(
    bucketName: string,
    storedValue: string | null,
    missingFileMessage: string
  ) {
    setErrorMessage("");

    if (!storedValue) {
      setErrorMessage(missingFileMessage);
      return;
    }

    /*
     * Older database records may contain a complete URL instead
     * of a storage path.
     */
    if (/^https?:\/\//i.test(storedValue)) {
      window.open(storedValue, "_blank", "noopener,noreferrer");
      return;
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storedValue, 300);

    if (error || !data?.signedUrl) {
      setErrorMessage(
        error?.message || "The requested file could not be opened."
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function openIdentityDocument(
    kycDocument: KycDocument
  ) {
    const filePath =
      kycDocument.identity_file_path || kycDocument.file_url;

    await openStoredFile(
      "kyc-documents",
      filePath,
      "No identity document was found for this submission."
    );
  }

  async function openSelfiePhoto(kycDocument: KycDocument) {
    const filePath =
      kycDocument.selfie_file_path ||
      kycDocument.selfie_photo_url;

    await openStoredFile(
      "kyc-selfies",
      filePath,
      "No selfie photo was found for this submission."
    );
  }

  function statusBadge(status: string): string {
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

  function formatStatus(status: string): string {
    if (status === "not_submitted") {
      return "Not Submitted";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const canSubmit =
    kycStatus === "not_submitted" || kycStatus === "rejected";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
        Loading KYC page...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-4xl">
        <a
          href="/dashboard"
          className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd] transition hover:bg-[#1d2942]"
        >
          ← Back to Dashboard
        </a>

        <section className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold">
            KYC Verification
          </h1>

          <p className="mt-2 text-[#7a9abd]">
            Upload a clear photo or PDF of your NRC or passport,
            together with a clear selfie photo.
          </p>

          <div className="mt-6 rounded-xl border border-[#172036] bg-[#0b0f1c] p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#4e6880]">
              Current KYC Status
            </p>

            <p
              className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(
                kycStatus
              )}`}
            >
              {formatStatus(kycStatus)}
            </p>
          </div>

          {kycStatus === "pending" && (
            <p className="mt-5 rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
              Your KYC documents are currently being reviewed. You
              cannot submit another KYC request until the current
              request is reviewed.
            </p>
          )}

          {kycStatus === "approved" && (
            <p className="mt-5 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              Your KYC has been approved. No further submission is
              required.
            </p>
          )}

          {kycStatus === "rejected" && (
            <p className="mt-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              Your previous KYC submission was rejected. Review the
              admin note below and upload new files.
            </p>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {errorMessage}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mt-5 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400"
            >
              {message}
            </p>
          )}

          {canSubmit && (
            <form onSubmit={handleSubmitKyc} className="mt-8">
              <label
                htmlFor="documentType"
                className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]"
              >
                Identity Document Type
              </label>

              <select
                id="documentType"
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value)
                }
                disabled={submitting}
                className="mb-6 w-full rounded-xl border border-[#172036] bg-[#0b0f1c] px-4 py-3 text-[#dde2ef] outline-none focus:border-[#00b86b] disabled:opacity-60"
              >
                <option value="NRC">
                  National Registration Card — NRC
                </option>
                <option value="Passport">Passport</option>
              </select>

              <label
                htmlFor="identityFile"
                className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]"
              >
                NRC or Passport
              </label>

              <input
                ref={identityInputRef}
                id="identityFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={submitting}
                onChange={(event) =>
                  setIdentityFile(
                    event.target.files?.[0] || null
                  )
                }
                className="mb-3 w-full rounded-xl border border-dashed border-[#172036] bg-[#0b0f1c] px-4 py-5 text-sm text-[#7a9abd] disabled:opacity-60"
              />

              {identityFile && (
                <div className="mb-6 rounded-lg bg-[#00b86b0a] px-4 py-3 text-sm text-[#00b86b]">
                  <p className="font-semibold">
                    Selected identity file
                  </p>
                  <p className="mt-1 break-all">
                    {identityFile.name}
                  </p>
                  <p className="mt-1 text-xs">
                    {(identityFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <label
                htmlFor="selfieFile"
                className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#4e6880]"
              >
                Selfie Photo
              </label>

              <input
                ref={selfieInputRef}
                id="selfieFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                disabled={submitting}
                onChange={(event) =>
                  setSelfieFile(event.target.files?.[0] || null)
                }
                className="mb-3 w-full rounded-xl border border-dashed border-[#172036] bg-[#0b0f1c] px-4 py-5 text-sm text-[#7a9abd] disabled:opacity-60"
              />

              {selfieFile && (
                <div className="mb-6 rounded-lg bg-[#00b86b0a] px-4 py-3 text-sm text-[#00b86b]">
                  <p className="font-semibold">
                    Selected selfie photo
                  </p>
                  <p className="mt-1 break-all">
                    {selfieFile.name}
                  </p>
                  <p className="mt-1 text-xs">
                    {(selfieFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div className="mb-6 rounded-xl border border-[#172036] bg-[#0b0f1c] p-4 text-sm text-[#7a9abd]">
                <p>
                  • Identity document: JPG, PNG, WEBP, or PDF.
                </p>
                <p className="mt-2">
                  • Selfie photo: JPG, PNG, or WEBP.
                </p>
                <p className="mt-2">
                  • Maximum file size: 5MB for each file.
                </p>
                <p className="mt-2">
                  • Both files are required before submission.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  submitting || !identityFile || !selfieFile
                }
                className="w-full rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white transition hover:bg-[#00a860] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Uploading KYC Files..."
                  : "Submit KYC for Review →"}
              </button>
            </form>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-[#172036] bg-[#0e1526] p-6 sm:p-8">
          <h2 className="text-2xl font-bold">
            My KYC Submissions
          </h2>

          <p className="mt-2 text-sm text-[#7a9abd]">
            View your submitted identity documents, selfie photos,
            review status, and admin notes.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#172036] text-sm text-[#4e6880]">
                  <th className="py-3 pr-4">Document Type</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Admin Note</th>
                  <th className="py-3 pr-4">Submitted</th>
                  <th className="py-3 pr-4">Identity</th>
                  <th className="py-3">Selfie</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((kycDocument) => (
                  <tr
                    key={kycDocument.id}
                    className="border-b border-[#172036]"
                  >
                    <td className="py-4 pr-4 font-semibold">
                      {kycDocument.document_type}
                    </td>

                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${statusBadge(
                          kycDocument.status
                        )}`}
                      >
                        {formatStatus(kycDocument.status)}
                      </span>
                    </td>

                    <td className="max-w-[260px] py-4 pr-4 text-[#7a9abd]">
                      {kycDocument.admin_note || "-"}
                    </td>

                    <td className="py-4 pr-4 text-[#7a9abd]">
                      {new Date(
                        kycDocument.created_at
                      ).toLocaleString()}
                    </td>

                    <td className="py-4 pr-4">
                      <button
                        type="button"
                        onClick={() =>
                          void openIdentityDocument(kycDocument)
                        }
                        className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd] transition hover:bg-[#1d2942]"
                      >
                        View Identity
                      </button>
                    </td>

                    <td className="py-4">
                      {kycDocument.selfie_file_path ||
                      kycDocument.selfie_photo_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            void openSelfiePhoto(kycDocument)
                          }
                          className="rounded-lg bg-[#172036] px-3 py-2 text-sm text-[#7a9abd] transition hover:bg-[#1d2942]"
                        >
                          View Selfie
                        </button>
                      ) : (
                        <span className="text-sm text-red-400">
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {documents.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-[#7a9abd]"
                    >
                      No KYC submissions uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}