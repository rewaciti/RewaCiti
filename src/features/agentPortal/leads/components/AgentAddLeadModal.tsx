import { useEffect, useState } from "react";
import * as React from "react";
import { UserPlus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentInquiry, type AgentProperty } from "@/features/agentPortal/common/services/agentAPI";

interface AgentAddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (inquiry: AgentInquiry) => void;
  initialPropertyId?: string;
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#b79bff] focus:ring-2 focus:ring-[#b79bff]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#b79bff] dark:focus:ring-[#b79bff]/15";

const AgentAddLeadModal = ({ open, onOpenChange, onCreated, initialPropertyId = "" }: AgentAddLeadModalProps) => {
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPropertyId(initialPropertyId);
    let active = true;
    setLoadingProperties(true);
    void agentAPI.getProperties({ page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        setProperties(response.data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(agentErrorMessage(error, "We couldn't load your properties."));
        console.error("Agent properties failed to load for add lead modal:", error);
      })
      .finally(() => {
        if (active) setLoadingProperties(false);
      });
    return () => {
      active = false;
    };
  }, [initialPropertyId, open]);

  const resetForm = () => {
    setPropertyId(initialPropertyId);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setConsent(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!propertyId) {
      toast.error("Please select a property.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await agentAPI.createInquiry({
        propertyId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        consent,
      });
      toast.success(response.message);
      resetForm();
      onCreated(response.data);
      onOpenChange(false);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't save this lead. Please try again."));
      console.error("Agent create inquiry failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const propertyOptions = properties.map((property) => ({
    label: `${property.title}${property.sku ? ` (${property.sku})` : ""}`,
    value: property.id,
  }));

  const canSubmit = !submitting && Boolean(propertyId && name.trim() && email.trim() && phone.trim() && message.trim() && consent);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) {
          if (!nextOpen) resetForm();
          onOpenChange(nextOpen);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/55 backdrop-blur-[3px]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-71 flex max-h-[min(90dvh,760px)] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-h-[92dvh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:border-b-0"
          aria-describedby="agent-add-lead-description"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-6 py-5 dark:border-white/10 max-sm:px-5 max-sm:py-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#b79bff]/10 text-[#b79bff] dark:bg-[#b79bff]/15 dark:text-[#b79bff]" aria-hidden="true">
                <UserPlus size={19} />
              </span>
              <div>
                <Dialog.Title className="m-0 font-serif text-xl font-semibold text-gray-900 dark:text-white max-sm:text-lg">
                  Add a lead
                </Dialog.Title>
                <Dialog.Description id="agent-add-lead-description" className="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  Record a prospect inquiry from a call, walk-in, or referral.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close modal"
                disabled={submitting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-0 bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 dark:bg-[#232323] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5 max-sm:px-5 max-sm:py-4">
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-gray-900 dark:text-white">
                  Property <span className="text-red-600 dark:text-red-400">*</span>
                </span>
                <CustomDropdown
                  className="w-full"
                  buttonClassName="h-11 w-full rounded-xl border border-gray-300 bg-white! px-3.5 text-left text-sm text-gray-900! hover:border-[#b79bff] dark:border-white/15 dark:bg-[#101010]! dark:text-white!"
                  menuClassName="overflow-hidden rounded-xl border-gray-300! bg-white! text-gray-900! shadow-lg! dark:border-white/15! dark:bg-[#1A1A1A]! dark:text-white! [&>div]:max-h-60 [&>div]:overflow-y-auto"
                  menuItemClassName="block w-full bg-white! px-4 py-2.5 text-left text-sm whitespace-normal text-gray-900! transition hover:bg-gray-100! dark:bg-[#1A1A1A]! dark:text-white! dark:hover:bg-neutral-800!"
                  placeholder={loadingProperties ? "Loading properties..." : "Select a property"}
                  value={propertyId}
                  disabled={loadingProperties}
                  options={propertyOptions}
                  onChange={setPropertyId}
                />
              </div>

              <label className="grid gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                <span>Full name <span className="text-red-600 dark:text-red-400">*</span></span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Bolaji Ogunleye"
                  autoComplete="name"
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <label className="grid gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                  <span>Email <span className="text-red-600 dark:text-red-400">*</span></span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                  <span>Phone <span className="text-red-600 dark:text-red-400">*</span></span>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0802..."
                    autoComplete="tel"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                <span>Inquiry notes <span className="text-red-600 dark:text-red-400">*</span></span>
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="What did the prospect ask about?"
                  className="min-h-[96px] w-full resize-y rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#b79bff] focus:ring-2 focus:ring-[#b79bff]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#b79bff] dark:focus:ring-[#b79bff]/15"
                />
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#b79bff]"
                />
                <span>The prospect agreed to be contacted regarding this property inquiry.</span>
              </label>
            </div>

            <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-200 px-6 py-4 dark:border-white/10 max-sm:grid max-sm:grid-cols-2 max-sm:px-5 max-sm:pb-[calc(16px+env(safe-area-inset-bottom))]">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={submitting}
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:bg-[#232323] dark:text-white dark:hover:bg-white/10"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!canSubmit}
                className="min-h-11 rounded-lg border-0 bg-[#b79bff] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b79bff] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting ? "Saving..." : "Save lead"}
              </button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AgentAddLeadModal;
