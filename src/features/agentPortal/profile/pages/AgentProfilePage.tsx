import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import {
  Camera,
  Clock,
  FileText,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import AgentPortalHeader from "@/features/agentPortal/common/components/AgentPortalHeader";
import { agentAPI, agentErrorMessage, type AgentAttention, type AgentProfile } from "@/features/agentPortal/common/services/agentAPI";
import { useAgentAuthStore } from "@/features/agentPortal/common/store/useAgentAuthStore";
import { readFileAsDataUrl } from "@/features/agentPortal/common/utils/agentListingUtils";

/* ---------------------------------- Config --------------------------------- */

const BIO_MAX = 300;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const DOCUMENT_ACCEPT = ".pdf,.doc,.docx," + DOCUMENT_TYPES.join(",");

const VERIFICATION = {
  not_sent: {
    label: "Not submitted",
    icon: ShieldAlert,
    badge: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
    hint: "Upload a valid government-issued ID so RewaCiti can confirm who you are.",
  },
  pending: {
    label: "Under review",
    icon: Clock,
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    hint: "Your document is being reviewed by RewaCiti.",
  },
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    badge: "bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-300",
    hint: "Your identity has been confirmed by RewaCiti.",
  },
} as const;

type VerificationKey = keyof typeof VERIFICATION;

/* --------------------------------- Helpers --------------------------------- */

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

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const phoneErrorFor = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^[+\d\s()-]+$/.test(trimmed)) return "Use digits only, with an optional + at the start.";
  const digits = trimmed.replace(/\D/g, "").length;
  return digits < 7 || digits > 15 ? "Enter a valid phone number." : "";
};

/* ---------------------------------- Styles --------------------------------- */

const ui = {
  page: "fixed inset-0 overflow-y-auto overscroll-contain bg-gray-300 font-sans text-gray-900 dark:bg-neutral-950 dark:text-white",
  main: "isolate min-h-[calc(100vh-64px)] w-full px-4 pt-6 pb-24 sm:px-6 sm:pb-16 lg:px-10",
  container: "mx-auto w-full max-w-5xl",
  grid: "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]",
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  cardBody: "p-5 sm:p-6",
  cardTitle: "m-0 text-base font-semibold",
  muted: "text-gray-600 dark:text-gray-400",
  label: "mb-1.5 block text-sm font-medium text-gray-900 dark:text-white",
  hint: "m-0 mt-1.5 text-xs text-gray-600 dark:text-gray-400",
  error: "m-0 mt-1.5 text-xs font-medium text-red-600 dark:text-red-400",
  input:
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 aria-[invalid=true]:border-red-500 dark:border-white/15 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-light dark:focus:ring-brand-light/15 dark:disabled:bg-white/5 dark:disabled:text-gray-500",
  primaryButton:
    "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-light dark:text-black",
  secondaryButton:
    "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-900 transition-colors hover:border-brand hover:text-brand focus-within:ring-2 focus-within:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-neutral-900 dark:text-white dark:hover:border-brand-light dark:hover:text-brand-light",
  ghostButton:
    "inline-flex h-10 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10",
  dropzone:
    "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center transition-colors hover:border-brand hover:bg-brand/5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/30 dark:border-white/15 dark:hover:border-brand-light dark:hover:bg-brand-light/5",
  iconCircle: "grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand dark:bg-brand-light/15 dark:text-brand-light",
};

/* ------------------------------- Small pieces ------------------------------ */

const Spinner = () => (
  <span role="status" className="inline-flex">
    <span
      className="h-9 w-9 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand dark:border-white/10 dark:border-t-brand-light"
      aria-hidden="true"
    />
    <span className="sr-only">Loading profile</span>
  </span>
);

const Avatar = ({ src, initials, className }: { src: string; initials: string; className: string }) =>
  src ? (
    <img src={src} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      className={`${className} grid shrink-0 place-items-center rounded-full bg-brand/10 font-semibold text-brand dark:bg-brand-light/15 dark:text-brand-light`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );

const CardHeader = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
  <div className="mb-5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h2 className={ui.cardTitle}>{title}</h2>
      {description && <p className={`m-0 mt-1 text-sm ${ui.muted}`}>{description}</p>}
    </div>
    {action}
  </div>
);

type DropzoneProps = {
  id: string;
  accept: string;
  onFile: (file: File) => void;
  children: ReactNode;
};

const Dropzone = ({ id, accept, onFile, children }: DropzoneProps) => {
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
      className={`${ui.dropzone} ${dragging ? "border-brand bg-brand/10 dark:border-brand-light dark:bg-brand-light/10" : ""}`}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
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

/* ---------------------------------- Page ----------------------------------- */

type SavedProfile = { bio: string; phone: string; photo: string };

const AgentProfilePage = () => {
  const token = useAgentAuthStore((state) => state.token);
  const logout = useAgentAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [attention, setAttention] = useState<AgentAttention | null>(null);
  const [loading, setLoading] = useState(true);

  const [saved, setSaved] = useState<SavedProfile>({ bio: "", phone: "", photo: "" });
  const [bioDraft, setBioDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [photoDraft, setPhotoDraft] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

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
        const snapshot = {
          bio: profile.bio ?? "",
          phone: readString(profile, "phone", "phoneNumber"),
          photo: readString(profile, "photo", "avatar", "image"),
        };
        setAgent(profile);
        setAttention(needsAttention);
        setSaved(snapshot);
        setBioDraft(snapshot.bio);
        setPhoneDraft(snapshot.phone);
        setPhotoDraft(snapshot.photo);
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
  const phoneError = phoneErrorFor(phoneDraft);
  const isDirty =
    bioDraft !== saved.bio || phoneDraft.trim() !== saved.phone.trim() || photoDraft !== saved.photo;

  // Warn before leaving the page with unsaved edits
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

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

  const discardChanges = () => {
    setBioDraft(saved.bio);
    setPhoneDraft(saved.phone);
    setPhotoDraft(saved.photo);
    setPhoneTouched(false);
  };

  const saveProfile = async () => {
    setPhoneTouched(true);
    if (phoneError) return;
    setSaving(true);
    try {
      const response = await agentAPI.updateMe(bioDraft.trim(), photoDraft || undefined, phoneDraft.trim() || undefined);
      const updated = { ...response.data, photo: photoDraft || undefined };
      const snapshot = {
        bio: updated.bio ?? bioDraft.trim(),
        phone: readString(updated, "phone", "phoneNumber") || phoneDraft.trim(),
        photo: photoDraft,
      };
      setAgent(updated);
      setSaved(snapshot);
      setBioDraft(snapshot.bio);
      setPhoneDraft(snapshot.phone);
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

  const rawStatus = readString(agent?.verification, "status") || "not_sent";
  const statusKey: VerificationKey = rawStatus in VERIFICATION ? (rawStatus as VerificationKey) : "not_sent";
  const status = VERIFICATION[statusKey];
  const StatusIcon = status.icon;
  const documents = Array.isArray(agent?.verification?.documents) ? agent.verification.documents : [];
  const documentNames = documents.map((document) => readString(document, "name", "filename", "file") || "Document");
  const showPhoneError = phoneTouched && Boolean(phoneError);

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
          <div className="mb-6">
            <h1 className="m-0 text-xl font-bold tracking-tight sm:text-2xl">My profile</h1>
            <p className={`m-0 mt-1 text-sm ${ui.muted}`}>
              Manage how visitors see you on your listings, and verify your identity.
            </p>
          </div>

          {loading ? (
            <div className="grid min-h-[300px] place-items-center"><Spinner /></div>
          ) : (
            <div className={ui.grid}>
              <div className="grid gap-4">
                {/* Profile details */}
                <section className={`${ui.card} ${ui.cardBody}`} aria-labelledby="profile-details-title">
                  <CardHeader title="Profile details" description="This information is shown on your public listings." />

                  {/* Photo */}
                  <div className="flex items-center gap-4">
                    <Avatar src={photoDraft} initials={initials} className="h-20 w-20 text-xl" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className={ui.secondaryButton}>
                          <Camera size={15} aria-hidden="true" />
                          {uploadingPhoto ? "Reading…" : photoDraft ? "Change photo" : "Upload photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={uploadingPhoto}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              if (file) handlePhotoFile(file);
                            }}
                          />
                        </label>
                        {photoDraft && (
                          <button type="button" onClick={() => setPhotoDraft("")} className={`${ui.secondaryButton} hover:border-red-500 hover:text-red-600 dark:hover:border-red-400 dark:hover:text-red-400`}>
                            <Trash2 size={15} aria-hidden="true" /> Remove
                          </button>
                        )}
                      </div>
                      <p className={ui.hint}>JPG or PNG, up to 5 MB.</p>
                    </div>
                  </div>

                  <hr className="my-6 border-0 border-t border-gray-200 dark:border-white/10" />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="agent-name" className={ui.label}>Full name</label>
                      <input id="agent-name" className={ui.input} value={name} disabled readOnly aria-describedby="agent-name-hint" />
                      <p id="agent-name-hint" className={ui.hint}>Your name is managed by RewaCiti.</p>
                    </div>
                    <div>
                      <label htmlFor="agent-email" className={ui.label}>Email</label>
                      <input id="agent-email" type="email" className={ui.input} value={email} disabled readOnly />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="agent-phone" className={ui.label}>Phone number</label>
                      <input
                        id="agent-phone"
                        type="tel"
                        inputMode="tel"
                        className={ui.input}
                        value={phoneDraft}
                        onChange={(event) => setPhoneDraft(event.target.value)}
                        onBlur={() => setPhoneTouched(true)}
                        autoComplete="tel"
                        placeholder="+234 801 234 5678"
                        aria-invalid={showPhoneError}
                        aria-describedby={showPhoneError ? "agent-phone-error" : "agent-phone-hint"}
                      />
                      {showPhoneError ? (
                        <p id="agent-phone-error" role="alert" className={ui.error}>{phoneError}</p>
                      ) : (
                        <p id="agent-phone-hint" className={ui.hint}>Visitors can use this to contact you about a listing.</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="agent-bio" className={ui.label}>Bio</label>
                      <textarea
                        id="agent-bio"
                        className={`${ui.input} min-h-28 resize-y`}
                        rows={4}
                        maxLength={BIO_MAX}
                        placeholder="Areas you cover, experience, languages spoken…"
                        value={bioDraft}
                        onChange={(event) => setBioDraft(event.target.value)}
                        aria-describedby="agent-bio-count"
                      />
                      <p id="agent-bio-count" className="m-0 mt-1.5 text-right text-xs text-gray-600 dark:text-gray-400" aria-live="polite">
                        {bioDraft.length}/{BIO_MAX}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-200 pt-5 dark:border-white/10">
                    {isDirty && !saving && (
                      <span className={`mr-auto text-xs ${ui.muted}`}>You have unsaved changes.</span>
                    )}
                    <button type="button" onClick={discardChanges} disabled={!isDirty || saving} className={ui.ghostButton}>
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveProfile()}
                      disabled={!isDirty || saving || uploadingPhoto}
                      className={ui.primaryButton}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </section>

                {/* Verification */}
                <section className={`${ui.card} ${ui.cardBody}`} aria-labelledby="verification-title">
                  <CardHeader
                    title="Identity verification"
                    description={status.hint}
                    action={(
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}>
                        <StatusIcon size={13} aria-hidden="true" /> {status.label}
                      </span>
                    )}
                  />

                  {documentNames.length > 0 && (
                    <ul className="m-0 mb-5 grid list-none gap-2 p-0" aria-label="Submitted documents">
                      {documentNames.map((documentName, index) => (
                        <li
                          key={`${documentName}-${index}`}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10"
                        >
                          <FileText size={16} className="shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{documentName}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {statusKey !== "verified" && (
                    <>
                      {documentFile ? (
                        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 dark:border-white/10">
                          <span className={ui.iconCircle}><FileText size={18} aria-hidden="true" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="m-0 truncate text-sm font-medium">{documentFile.name}</p>
                            <p className={`m-0 mt-0.5 text-xs ${ui.muted}`}>{formatBytes(documentFile.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={clearDocument}
                            aria-label="Remove selected document"
                            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <Dropzone id="agent-document-input" accept={DOCUMENT_ACCEPT} onFile={handleDocumentFile}>
                          <span className={ui.iconCircle}><UploadCloud size={18} aria-hidden="true" /></span>
                          <span className="text-sm font-medium">
                            {uploadingDocument ? "Reading…" : "Upload a document"}
                          </span>
                          <span className={`text-xs ${ui.muted}`}>Click to browse or drag and drop</span>
                          <span className={`text-xs ${ui.muted}`}>PDF, DOC or DOCX, up to 25 MB</span>
                        </Dropzone>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void submitDocument()}
                          disabled={!documentFile || submittingDocument || uploadingDocument}
                          className={ui.primaryButton}
                        >
                          {submittingDocument ? "Sending…" : "Submit for review"}
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>

              {/* Preview */}
              <aside className={`${ui.card} ${ui.cardBody} order-first lg:sticky lg:top-24 lg:order-0`} aria-label="Preview">
                <h2 className={ui.cardTitle}>Preview</h2>
                <p className={`m-0 mt-1 text-sm ${ui.muted}`}>How visitors see you on your listings.</p>

                <div className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <Avatar src={photoDraft} initials={initials} className="h-14 w-14 text-base" />
                    <div className="min-w-0">
                      <p className="m-0 flex items-center gap-1.5 text-sm font-bold">
                        <span className="truncate">{name || "Your name"}</span>
                        {statusKey === "verified" && (
                          <ShieldCheck size={15} className="shrink-0 text-green-600 dark:text-green-400" aria-label="Verified agent" />
                        )}
                      </p>
                      <p className={`m-0 mt-0.5 text-xs ${ui.muted}`}>Independent agent</p>
                    </div>
                  </div>

                  {(phoneDraft.trim() || email) && (
                    <div className="mt-4 grid gap-2 border-t border-gray-200 pt-4 dark:border-white/10">
                      {phoneDraft.trim() && (
                        <p className="m-0 flex items-center gap-2 text-xs">
                          <Phone size={13} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{phoneDraft.trim()}</span>
                        </p>
                      )}
                      {email && (
                        <p className="m-0 flex items-center gap-2 text-xs">
                          <Mail size={13} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{email}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {bioDraft.trim() && (
                    <p className={`m-0 mt-4 whitespace-pre-line text-xs leading-relaxed ${ui.muted}`}>{bioDraft.trim()}</p>
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