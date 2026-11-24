import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Property } from "../../../types";
import { errorMessage } from "../../../shared/lib/realEstateApi";
import { propertiesAPI } from "../../properties/services/propertiesAPI";
import { toProperty } from "../../properties/services/toProperty";
import { usePropertyStore } from "../../properties/store/usePropertyStore";
import type { AgentProperty } from "../services/agentAPI";
import AgentBookInspectionModal from "./AgentBookInspectionModal";
import { toast } from "sonner";

interface AgentBookVisitModalProps {
  property: AgentProperty;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AgentBookVisitModal = ({ property, open, onOpenChange }: AgentBookVisitModalProps) => {
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
        />
      )}
      <Dialog.Root open={open && !bookingProperty} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/55" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-61 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white" aria-describedby="agent-book-visit-loading-description">
            <Dialog.Title className="m-0 mb-2 font-serif text-[22px]">Book a visit</Dialog.Title>
            <Dialog.Description id="agent-book-visit-loading-description" className="m-0 text-sm text-gray-600 dark:text-gray-400">
              Preparing booking details for {property.title}…
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default AgentBookVisitModal;
