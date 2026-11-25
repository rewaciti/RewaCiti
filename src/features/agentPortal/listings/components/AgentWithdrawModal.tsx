import { useState } from "react";
import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { agentAPI, agentErrorMessage, type AgentProperty } from "@/features/agentPortal/common/services/agentAPI";

interface AgentWithdrawModalProps {
  property: AgentProperty;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdrawn: (updatedProperty: AgentProperty) => void;
}

/** Confirmation modal for taking a published listing off the site with a required reason. */
const AgentWithdrawModal = ({ property, open, onOpenChange, onWithdrawn }: AgentWithdrawModalProps) => {
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const submitWithdrawal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWithdrawing(true);
    try {
      const response = await agentAPI.withdrawProperty(property.id, withdrawReason.trim());
      toast.success(response.message);
      setWithdrawReason("");
      onWithdrawn(response.data);
      onOpenChange(false);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't take this listing down. Please try again."));
      console.error("Agent listing withdrawal failed:", error);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!withdrawing) {
          if (!nextOpen) setWithdrawReason("");
          onOpenChange(nextOpen);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-1100 bg-black/55 backdrop-blur-[3px]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-1101 w-[min(504px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gray-200 bg-white p-7 text-gray-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:border-b-0 max-sm:px-5 max-sm:pt-5 max-sm:pb-[calc(20px+env(safe-area-inset-bottom))]"
          aria-describedby="agent-withdraw-description"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400" aria-hidden="true">
                <AlertTriangle size={20} />
              </span>
              <div>
                <Dialog.Title className="m-0 font-serif text-xl font-semibold leading-snug text-gray-900 dark:text-white max-sm:text-lg">
                  Take this listing off the site?
                </Dialog.Title>
                <Dialog.Description id="agent-withdraw-description" className="mt-1.5 mb-0 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  Visitors will stop seeing “{property.title}”. It stays in your listings as a draft, and RewaCiti is told.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-0 bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#232323] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
                disabled={withdrawing}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <form className="mt-5 grid gap-2" onSubmit={submitWithdrawal}>
            <label htmlFor="withdraw-reason" className="text-xs font-semibold text-gray-900 dark:text-white">
              Reason <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <textarea
              id="withdraw-reason"
              required
              rows={3}
              maxLength={500}
              placeholder="This is saved in history"
              value={withdrawReason}
              onChange={(event) => setWithdrawReason(event.target.value)}
              className="box-border min-h-[96px] w-full resize-y rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#703BF7] focus:ring-2 focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#B79BFF] dark:focus:ring-[#B79BFF]/15"
            />
            <div className="mt-3 flex items-center justify-end gap-2.5 max-sm:grid max-sm:grid-cols-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#232323] dark:text-white dark:hover:bg-white/10"
                  disabled={withdrawing}
                >
                  Go back
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="min-h-11 rounded-lg border-0 bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={withdrawing || !withdrawReason.trim()}
              >
                {withdrawing ? "Taking it down..." : "Take it down"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AgentWithdrawModal;
