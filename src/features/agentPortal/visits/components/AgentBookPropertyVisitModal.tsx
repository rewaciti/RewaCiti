import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, ImagePlus, MapPin, Search, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { agentAPI, agentErrorMessage, type AgentProperty } from "@/features/agentPortal/common/services/agentAPI";
import { money, periodShortLabel } from "@/features/agentPortal/common/utils/agentListingUtils";
import AgentBookVisitModal from "@/features/agentPortal/listings/components/AgentBookVisitModal";

interface AgentBookPropertyVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked: () => void;
}

/** Lets the agent pick a published property and then opens the shared AgentBookVisitModal. */
const AgentBookPropertyVisitModal = ({
  open,
  onOpenChange,
  onBooked,
}: AgentBookPropertyVisitModalProps) => {
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<AgentProperty | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedProperty(null);
      setSearch("");
      return;
    }

    let active = true;
    setLoading(true);
    void agentAPI.getProperties({ page: 1, limit: 100, status: "published" })
      .then((response) => {
        if (!active) return;
        setProperties(response.data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(agentErrorMessage(error, "We couldn't load your published properties."));
        console.error("Agent properties failed to load for visit picker:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return properties;
    return properties.filter((property) =>
      [property.title, property.sku, property.location.area, property.location.city, property.location.state]
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [properties, search]);

  if (selectedProperty) {
    return (
      <AgentBookVisitModal
        property={selectedProperty}
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedProperty(null);
            onOpenChange(false);
          }
        }}
        onBooked={onBooked}
      />
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/55 backdrop-blur-[3px]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-71 flex max-h-[min(86dvh,680px)] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-h-[90dvh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:border-b-0"
          aria-describedby="agent-pick-visit-property-description"
        >
          <header className="flex shrink-0 items-start justify-between gap-2 border-b border-gray-200 px-6 py-5 dark:border-white/10 max-sm:gap-2 max-sm:px-5 max-sm:py-4">
            <div className="flex min-w-0 flex-1 items-start gap-3 max-sm:gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#b79bff]/10 text-[#b79bff] dark:bg-[#b79bff]/15 dark:text-[#b79bff] max-sm:h-9 max-sm:w-9" aria-hidden="true">
                <CalendarPlus size={19} />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="m-0 font-serif text-xl font-semibold text-gray-900 dark:text-white max-sm:text-lg">
                  Book a visit
                </Dialog.Title>
                <Dialog.Description id="agent-pick-visit-property-description" className="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400 sm:text-sm max-sm:text-[11px]">
                  Choose a live property to open the booking calendar.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close modal"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-0 bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-[#232323] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </header>

          <div className="border-b border-gray-200 px-6 py-3 dark:border-white/10 max-sm:px-5">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-gray-500 focus-within:border-[#b79bff] dark:border-white/15 dark:bg-[#101010] dark:text-gray-400">
              <Search size={16} aria-hidden="true" className="shrink-0" />
              <input
                type="search"
                aria-label="Search published properties"
                placeholder="Search live properties..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full min-w-0 border-0 bg-transparent text-sm text-gray-900 outline-0 placeholder:text-gray-400 dark:text-white"
              />
            </label>
          </div>

          <div className="min-h-[220px] flex-1 overflow-y-auto px-6 py-4 max-sm:px-5 max-sm:pb-[calc(16px+env(safe-area-inset-bottom))]">
            {loading ? (
              <div className="flex h-44 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#b79bff] dark:border-white/10 dark:border-t-[#b79bff]" aria-hidden="true" />
                <p className="m-0 text-sm text-gray-600 dark:text-gray-400">Loading live properties…</p>
              </div>
            ) : filtered.length ? (
              <ul className="m-0 grid list-none gap-2.5 p-0">
                {filtered.map((property) => {
                  const location = [property.location.area, property.location.city, property.location.state]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <li key={property.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedProperty(property)}
                        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-[#b79bff] hover:bg-[#b79bff]/5 dark:border-white/10 dark:bg-[#101010] dark:hover:border-[#b79bff] dark:hover:bg-[#b79bff]/10"
                      >
                        <div className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-gray-500 dark:bg-[#232323] dark:text-gray-400">
                          {property.photos[0] ? (
                            <img src={property.photos[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlus size={18} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {property.title}
                          </p>
                          <p className="m-0 mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            <MapPin size={12} className="shrink-0" /> {location || property.sku}
                          </p>
                          <p className="m-0 mt-1 text-xs font-bold text-[#b79bff] dark:text-[#b79bff]">
                            {money(property.price, property.currency)}{periodShortLabel(property.pricePeriod)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center text-center">
                <p className="m-0 text-sm font-semibold text-gray-900 dark:text-white">
                  {search ? "No matching live properties" : "No published properties yet"}
                </p>
                <p className="mt-1 mb-0 text-xs text-gray-500 dark:text-gray-400">
                  {search ? "Try another search term." : "Publish a listing before booking a visit for it."}
                </p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AgentBookPropertyVisitModal;
