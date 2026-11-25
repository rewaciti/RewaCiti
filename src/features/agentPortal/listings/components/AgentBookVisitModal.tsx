import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Property } from "@/types";
import { errorMessage } from "@/shared/lib/realEstateApi";
import { propertiesAPI } from "@/features/properties/services/propertiesAPI";
import { toProperty } from "@/features/properties/services/toProperty";
import { usePropertyStore } from "@/features/properties/store/usePropertyStore";
import type { AgentProperty } from "@/features/agent/common/services/agentAPI";
import AgentBookInspectionModal from "./AgentBookInspectionModal";
import { toast } from "sonner";

interface AgentBookVisitModalProps {
  property: AgentProperty;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked?: () => void;
}

const AgentBookVisitModal = ({ property, open, onOpenChange, onBooked }: AgentBookVisitModalProps) => {
  const fetchForms = usePropertyStore((state) => state.fetchForms);
  const [bookingProperty, setBookingProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (!open) {
      setBookingProperty(null);
      return;
    }

    let active = true;
    setBookingProperty(null);
    void Promise.all([propertiesAPI.get(property.slug), fetchForms()])
      .then(([listing, forms]) => {
        if (active) setBookingProperty(toProperty(listing, forms?.property));
      })
      .catch((error: unknown) => {
        console.error("Agent book-visit property failed to load:", error);
        toast.error(errorMessage(error, "We couldn't prepare this property's booking details."));
        if (active) onOpenChange(false);
      });

    return () => {
      active = false;
    };
  }, [fetchForms, onOpenChange, open, property.slug]);

  return (
    <>
      {bookingProperty && (
        <AgentBookInspectionModal
          property={bookingProperty}
          open={open}
          onOpenChange={onOpenChange}
          onBooked={onBooked}
        />
      )}
      <Dialog.Root open={open && !bookingProperty} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/55" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-61 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white max-[700px]:top-auto max-[700px]:bottom-0 max-[700px]:left-0 max-[700px]:w-full max-[700px]:translate-x-0 max-[700px]:translate-y-0 max-[700px]:rounded-t-3xl max-[700px]:rounded-b-none max-[700px]:border-b-0 max-[700px]:pb-[calc(24px+env(safe-area-inset-bottom))]" aria-describedby="agent-book-visit-loading-description">
            <Dialog.Title className="m-0 mb-4 font-serif text-[22px]">Book a visit</Dialog.Title>
            <div className="flex items-center gap-3.5" role="status" aria-live="polite">
              <span
                className="h-7 w-7 shrink-0 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#703BF7] dark:border-white/10 dark:border-t-[#B79BFF]"
                aria-hidden="true"
              />
              <Dialog.Description id="agent-book-visit-loading-description" className="m-0 text-sm text-gray-600 dark:text-gray-400">
                Preparing booking details for {property.title}…
              </Dialog.Description>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default AgentBookVisitModal;
