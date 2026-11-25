import { useEffect, useState, type FormEvent } from "react";
import { FileText, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import {
  agentAPI,
  agentErrorMessage,
  type AgentProfile,
  type AgentVerificationDocument,
} from "@/features/agentPortal/common/services/agentAPI";
import { readFileAsDataUrl } from "@/features/agentPortal/common/utils/agentListingUtils";

interface AgentVerificationModalProps {
  open: boolean;
  agent: AgentProfile | null;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const readableSize = (size: number) =>
  `${(size / 1024 / 1024).toFixed(2)} MB`;

const AgentVerificationModal = ({ open, agent, onOpenChange, onVerified }: AgentVerificationModalProps) => {
  const [documents, setDocuments] = useState<AgentVerificationDocument[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange, open, saving]);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const invalid = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (invalid) {
      toast.error(`${invalid.name} is larger than 5MB.`);
      return;
    }

    try {
      const next = await Promise.all(selected.map(async (file) => ({
        name: file.name,
        size: file.size,
        url: await readFileAsDataUrl(file),
      })));
      setDocuments((current) => [...current, ...next]);
    } catch (error) {
      toast.error("We couldn't read one of those files. Please try again.");
      console.error("Agent verification file read failed:", error);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!documents.length) {
      toast.error("Choose at least one document.");
      return;
    }

    setSaving(true);
    try {
      const response = await agentAPI.submitVerification(documents);
      toast.success(response.message || "Documents submitted for verification.");
      setDocuments([]);
      onVerified();
      onOpenChange(false);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't submit your documents. Please try again."));
      console.error("Agent verification submission failed:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-5 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onOpenChange(false);
      }}
    >
      <section
        className="w-full max-w-[520px] rounded-3xl border border-gray-200 bg-white p-7 text-gray-900 shadow-2xl dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-verification-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-[0.16em] text-gray-600 dark:text-gray-400">YOUR ACCOUNT</p>
            <h2 id="agent-verification-title" className="m-0 font-serif text-2xl font-semibold">Verify your identity</h2>
            <p className="m-0 mt-1 text-sm text-gray-600 dark:text-gray-400">
              Current status: {agent?.verification?.status || "Not submitted"}
            </p>
          </div>
          <button
            type="button"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-gray-100 text-2xl leading-none text-gray-600 hover:bg-highlight hover:text-white dark:bg-[#232323] dark:text-gray-400"
            aria-label="Close verification"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X size={17} />
          </button>
        </div>

        <form className="grid gap-3 text-sm" onSubmit={(event) => void submit(event)}>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition hover:border-highlight dark:border-white/15 dark:bg-neutral-900">
            <UploadCloud size={22} className="text-highlight dark:text-highlight" aria-hidden="true" />
            <span className="font-semibold">Choose ID documents</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">PDF or image, up to 5MB each</span>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              className="sr-only"
              disabled={saving}
              onChange={(event) => void addFiles(event.target.files)}
            />
          </label>

          {documents.length > 0 && (
            <ul className="m-0 grid list-none gap-2 p-0">
              {documents.map((document, index) => (
                <li key={`${document.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-white/10">
                  <FileText size={17} className="shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-medium">{document.name}</p>
                    <p className="m-0 text-xs text-gray-600 dark:text-gray-400">{readableSize(document.size)}</p>
                  </div>
                  <button
                    type="button"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label={`Remove ${document.name}`}
                    disabled={saving}
                    onClick={() => setDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-highlight px-5 text-sm font-semibold text-white hover:bg-highlight/90 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={saving || !documents.length}
          >
            {saving ? "Submitting..." : "Submit for verification"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AgentVerificationModal;
