import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { FileText, Image as ImageIcon, Mail, Phone, ShieldCheck, Trash2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import AgentPortalHeader from "@/features/agentPortal/common/components/AgentPortalHeader";
import { agentAPI, agentErrorMessage, type AgentAttention, type AgentProfile } from "@/features/agentPortal/common/services/agentAPI";
import { useAgentAuthStore } from "@/features/agentPortal/common/store/useAgentAuthStore";
import { readFileAsDataUrl } from "@/features/agentPortal/common/utils/agentListingUtils";

const VERIFICATION_LABELS: Record<string, string> = {
  not_sent: "Not sent",
  pending: "Under review",
  verified: "Verified",
};
const BIO_MAX = 300;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const readString = (source: unknown, ...keys: string[]): string => {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    const value = (source as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  return "";
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

const ui = {
  page: "fixed inset-0 overflow-y-auto overscroll-contain bg-[#d1d5db] font-sans text-[#111827] dark:bg-[#121212] dark:text-white",
  main: "isolate min-h-[calc(100vh-64px)] w-full px-4 pt-6 pb-24 sm:px-6 sm:pb-16 lg:px-5",
  container: "mx-auto w-full max-w-[1000px]",
  heading: "mb-4",
  title: "m-0 text-xl font-bold tracking-tight",
  grid: "grid items-start gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]",
  card: "rounded-3xl border border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#1a1a1a]",
  section: "p-4 sm:p-5",
  label: "mb-1.5 block text-[13px] font-medium text-[#111827] dark:text-white",
  muted: "text-[#4b5563] dark:text-[#9ca3af]",
  input:
    "w-full rounded-xl border border-[#e5e7eb] bg-[#f3f4f6] px-3 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#6b7280] focus:border-[#b79bff] focus:ring-2 focus:ring-[#b79bff]/10 disabled:bg-white disabled:text-[#9ca3af] dark:border-white/10 dark:bg-[#232323] dark:text-white dark:placeholder:text-[#9ca3af] dark:focus:border-[#b79bff] dark:focus:ring-[#b79bff]/15 dark:disabled:bg-[#232323]/60",
  dropzone:
    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d1d5db] px-4 py-8 text-center transition-colors hover:border-[#b79bff] hover:bg-[#b79bff]/5 dark:border-white/15 dark:hover:border-[#b79bff] dark:hover:bg-[#b79bff]/5",
  iconCircle:
    "grid h-10 w-10 place-items-center rounded-full bg-[#b79bff]/10 text-[#b79bff] dark:bg-[#b79bff]/15 dark:text-[#b79bff]",
  primaryButton:
    "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full bg-[#b79bff] px-5 text-sm font-semibold text-white transition-[background-color,color,opacity] duration-150 ease-[ease] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-[#b79bff] dark:text-black",
  ghostButton:
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#111827] dark:border-white/10 dark:bg-[#232323] dark:text-white",
  submitButton:
    "mt-3 inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-full bg-[#b79bff] px-5 text-sm font-semibold text-white transition-[background-color,color,opacity] duration-150 ease-[ease] hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] disabled:opacity-100 disabled:hover:opacity-100 dark:bg-[#b79bff] dark:text-black dark:disabled:bg-white/10 dark:disabled:text-neutral-500",
  photoPanel: "flex items-center gap-4 rounded-xl border border-dashed border-[#d1d5db] p-4 dark:border-white/15",
  pill: "rounded-full border border-[#e5e7eb] bg-[#b79bff]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#b79bff] dark:border-white/10 dark:bg-[#b79bff]/15 dark:text-[#b79bff]",
  counter: "m-0 mt-2 text-right text-[11px] text-[#b79bff] dark:text-[#b79bff]",
  avatarPreview: "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#b79bff]/10 text-[11px] font-semibold text-[#b79bff] dark:bg-[#b79bff]/15 dark:text-[#b79bff]",
};

const Spinner = () => (
  <span role="status" className="inline-flex">
    <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#e5e7eb] border-t-[#b79bff] dark:border-white/10 dark:border-t-[#b79bff]" aria-hidden="true" />
    <span className="sr-only">Loading profile</span>
  </span>
);

type DropzoneProps = {
  id: string;
  accept: string;
  onFile: (file: File) => void;
  className?: string;
  children: ReactNode;
};

const Dropzone = ({ id, accept, onFile, className = "", children }: DropzoneProps) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`${ui.dropzone} ${dragging ? "bg-[#b79bff]/10 dark:bg-[#b79bff]/10" : ""} ${className}`}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      {children}
    </label>
  );
};

const AgentProfilePage = () => {
  const token = useAgentAuthStore((state) => state.token);
  const logout = useAgentAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [attention, setAttention] = useState<AgentAttention | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioDraft, setBioDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [photoDraft, setPhotoDraft] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentDataUrl, setDocumentDataUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingDocument, setSubmittingDocument] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void Promise.all([agentAPI.getMe(), agentAPI.getAttention()])
      .then(([profile, needsAttention]) => {
        if (cancelled) return;
        setAgent(profile);
        setAttention(needsAttention);
        setBioDraft(profile.bio ?? "");
        setPhoneDraft(readString(profile, "phone", "phoneNumber"));
        setPhotoDraft(readString(profile, "photo", "avatar", "image"));
      })
      .catch((error: unknown) => {
        toast.error(agentErrorMessage(error, "We couldn't load your profile."));
        console.error("Agent profile failed to load:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const name = agent?.name ?? "";
  const email = agent?.email ?? "";
  const initials = useMemo(() => initialsOf(name), [name]);

  if (!token) return <Navigate to="/agent/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/agent/login", { replace: true });
  };

  const handlePhotoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file for your photo.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error("Your photo must be 5 MB or smaller.");
      return;
    }
    setUploadingPhoto(true);
    void readFileAsDataUrl(file)
      .then((url) => setPhotoDraft(url))
      .catch(() => toast.error("We couldn't read that photo."))
      .finally(() => setUploadingPhoto(false));
  };

  const handleDocumentFile = (file: File) => {
    if (!DOCUMENT_TYPES.includes(file.type)) {
      toast.error("Choose a PDF, DOC, or DOCX file.");
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      toast.error("Your document must be 25 MB or smaller.");
      return;
    }
    setUploadingDocument(true);
    void readFileAsDataUrl(file)
      .then((url) => {
        setDocumentFile(file);
        setDocumentDataUrl(url);
      })
      .catch(() => toast.error("We couldn't read that document."))
      .finally(() => setUploadingDocument(false));
  };

  const clearDocument = () => {
    setDocumentFile(null);
    setDocumentDataUrl("");
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await agentAPI.updateMe(bioDraft.trim(), photoDraft || undefined, phoneDraft.trim() || undefined);
      const updated = { ...response.data, photo: photoDraft || undefined };
      setAgent(updated);
      setBioDraft(updated.bio ?? "");
      setPhoneDraft(readString(updated, "phone", "phoneNumber") || phoneDraft.trim());
      setPhotoDraft(readString(updated, "photo", "avatar", "image"));
      toast.success(response.message || "Profile updated.");
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't save your profile."));
      console.error("Agent profile update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const submitDocument = async () => {
    if (!documentFile || !documentDataUrl) {
      toast.error("Choose a document first.");
      return;
    }
    setSubmittingDocument(true);
    try {
      const submitted = { name: documentFile.name, url: documentDataUrl, size: documentFile.size };
      const response = await agentAPI.submitVerification([submitted]);
      setAgent((current) =>
        current
          ? {
            ...current,
            verification: {
              ...current.verification,
              status: "pending",
              documents: [...current.verification.documents, submitted],
            },
          }
          : current,
      );
      clearDocument();
      toast.success(response.message || "Document submitted.");
      void agentAPI.getMe().then((profile) => setAgent(profile)).catch(() => undefined);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't submit your document."));
      console.error("Agent verification submission failed:", error);
    } finally {
      setSubmittingDocument(false);
    }
  };

  const verificationStatus = readString(agent?.verification, "status") || "not_sent";
  const verificationLabel =
    VERIFICATION_LABELS[verificationStatus] ?? verificationStatus.replaceAll("_", " ");
  const documents = Array.isArray(agent?.verification?.documents) ? agent.verification.documents : [];
  const documentNames = documents.map((document) => readString(document, "name", "filename", "file") || "Document");

  return (
    <div data-agent-scroll className={ui.page}>
      <Helmet>
        <title>My profile | RewaCiti Agent Portal</title>
        <meta name="description" content="View and edit how visitors see you on your RewaCiti listings." />
      </Helmet>

      <AgentPortalHeader
        name={name || "Agent"}
        email={email}
        payoutCount={attention?.payouts}
        visitCount={attention?.bookings}
        activePage="profile"
        onViewProfile={() => navigate("/agent/profile")}
        onLogout={handleLogout}
      />

      <main className={ui.main}>
        <div className={ui.container}>
          <div className={ui.heading}>
            <h1 className={ui.title}>My profile</h1>
            <p className={`m-0 mt-0.5 text-sm ${ui.muted}`}>Visitors see this on your listings.</p>
          </div>

        {loading ? (
          <div className="grid min-h-[300px] place-items-center"><Spinner /></div>
        ) : (
          <div className={ui.grid}>
            <div className="grid gap-4">
              {/* Profile form */}
              <section className={`${ui.card} ${ui.section}`} aria-label="Profile details">
                <span className={ui.label}>Photo</span>
                {photoDraft ? (
                  <div className={ui.photoPanel}>
                    <img src={photoDraft} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
                    <div className="flex flex-wrap gap-2">
                      <Dropzone
                        id="agent-photo-input"
                        accept="image/*"
                        onFile={handlePhotoFile}
                        className="!flex-row !gap-1.5 !rounded-full !border-solid !border-[#e5e7eb] !px-3 !py-1.5 text-xs font-medium"
                      >
                        <ImageIcon size={14} aria-hidden="true" />
                        {uploadingPhoto ? "Reading..." : "Change photo"}
                      </Dropzone>
                      <button type="button" onClick={() => setPhotoDraft("")} className={ui.ghostButton}>
                        <Trash2 size={14} aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <Dropzone id="agent-photo-input" accept="image/*" onFile={handlePhotoFile} className="min-h-[134px]">
                    <span className={`${ui.iconCircle} !h-7 !w-7`}><ImageIcon size={14} aria-hidden="true" /></span>
                    <span className="text-xs font-medium">{uploadingPhoto ? "Reading..." : "Upload an image"}</span>
                  </Dropzone>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="agent-name" className={ui.label}>Name</label>
                    <input id="agent-name" className={ui.input} value={name} disabled readOnly />
                  </div>
                  <div>
                    <label htmlFor="agent-phone" className={ui.label}>Phone</label>
                    <input
                      id="agent-phone"
                      type="tel"
                      className={ui.input}
                      value={phoneDraft}
                      onChange={(event) => setPhoneDraft(event.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="agent-bio" className={ui.label}>Bio</label>
                  <textarea
                    id="agent-bio"
                    className={`${ui.input} min-h-[80px] resize-y`}
                    rows={3}
                    maxLength={BIO_MAX}
                    placeholder="Areas you cover, experience, languages..."
                    value={bioDraft}
                    onChange={(event) => setBioDraft(event.target.value)}
                  />
                  <p className={ui.counter}>
                    {bioDraft.length}/{BIO_MAX}
                  </p>
                </div>

                <div className="mt-2 flex justify-end">
                  <button type="button" onClick={() => void saveProfile()} disabled={saving || uploadingPhoto} className={ui.primaryButton}>
                    {saving ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </section>

              {/* Verification */}
              <section className={`${ui.card} ${ui.section}`} aria-label="Verification">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck size={16} aria-hidden="true" /> Verification
                  </h2>
                  <span className={ui.pill}>
                    {verificationLabel}
                  </span>
                </div>
                <p className={`m-0 mt-2 text-xs ${ui.muted}`}>
                  {verificationStatus === "verified"
                    ? "Your ID has been confirmed by RewaCiti."
                    : verificationStatus === "pending"
                      ? "Your document is being reviewed."
                      : "Send a valid ID so RewaCiti can confirm who you are."}
                </p>

                {documentNames.length > 0 && (
                  <ul className="m-0 mt-3 grid list-none gap-1.5 p-0">
                    {documentNames.map((documentName, index) => (
                      <li key={`${documentName}-${index}`} className={`truncate text-xs ${ui.muted}`}>{documentName}</li>
                    ))}
                  </ul>
                )}

                <Dropzone
                  id="agent-document-input"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onFile={handleDocumentFile}
                  className="mt-4 min-h-40"
                >
                  <span className={ui.iconCircle}><FileText size={18} aria-hidden="true" /></span>
                  {documentFile ? (
                    <>
                      <span className="max-w-full truncate text-sm font-medium">{documentFile.name}</span>
                      <span className={`text-[11px] ${ui.muted}`}>
                        {(documentFile.size / 1024).toFixed(0)} KB · Click to replace
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{uploadingDocument ? "Reading..." : "Add a document"}</span>
                      <span className={`text-[11px] ${ui.muted}`}>Click to upload or drag and drop</span>
                      <span className={`text-[11px] ${ui.muted}`}>PDF, DOC, DOCX up to 25MB</span>
                    </>
                  )}
                </Dropzone>

                <button
                  type="button"
                  onClick={() => void submitDocument()}
                  disabled={!documentFile || submittingDocument || uploadingDocument}
                  className={ui.submitButton}
                >
                  {submittingDocument ? "Sending..." : "Send for checking"}
                </button>
              </section>
            </div>

            {/* Preview */}
            <aside className={`${ui.card} ${ui.section}`} aria-label="Preview">
              <h2 className="m-0 text-[13px] font-semibold">Preview</h2>
              <p className={`m-0 mt-1.5 text-[11px] ${ui.muted}`}>How visitors see you on your listings.</p>

              <div className="mt-4 flex items-center gap-3">
                {photoDraft ? (
                  <img src={photoDraft} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className={ui.avatarPreview}>
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-bold">{name || "Your name"}</p>
                  <p className={`m-0 mt-0.5 text-[11px] ${ui.muted}`}>Independent agent</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {phoneDraft && (
                  <p className="m-0 flex items-center gap-2 text-[11px]">
                    <Phone size={12} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{phoneDraft}</span>
                  </p>
                )}
                {email && (
                  <p className="m-0 flex items-center gap-2 text-[11px]">
                    <Mail size={12} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{email}</span>
                  </p>
                )}
                {bioDraft.trim() && (
                  <p className={`m-0 mt-1 whitespace-pre-line text-[11px] leading-relaxed ${ui.muted}`}>{bioDraft.trim()}</p>
                )}
              </div>
            </aside>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default AgentProfilePage;