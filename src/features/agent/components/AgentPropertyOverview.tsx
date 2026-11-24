import { useState } from "react";
import * as React from "react";
import { AlertTriangle, CalendarPlus, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Eye, ExternalLink, FileText, History as HistoryIcon, ImagePlus, Info, LayoutDashboard, MapPin, MessageSquare, Pencil, Star, X } from "lucide-react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import CustomDropdown from "../../properties/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentProperty, type AgentPropertyStatus } from "../services/agentAPI";
import { money, statusLabel, periodLabel, periodShortLabel, purposeLabel, sanitizeDescriptionHtml } from "../utils/agentListingUtils";
import type { PropertyDetailAction } from "../utils/agentListingUtils";
import AgentAvailabilityEditor from "./AgentAvailabilityEditor";
import AgentBookVisitModal from "./AgentBookVisitModal";

const youtubeEmbedUrl = (videoUrl: string) => {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtu.be") return null;

    const id = host === "youtu.be"
      ? url.pathname.slice(1)
      : url.pathname.startsWith("/embed/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v");

    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  } catch {
    return null;
  }
};

const AgentPropertyOverview = ({
  property,
  typeName,
  initialAction,
  onClose,
  onEdit,
  onViewWebsite,
  onChanged,
}: {
  property: AgentProperty;
  typeName: string;
  initialAction: PropertyDetailAction;
  onClose: () => void;
  onEdit: () => void;
  onViewWebsite: () => void;
  onChanged: (property: AgentProperty) => void;
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "inquiries" | "visits" | "history">(
    "overview",
  );
  const [withdrawOpen, setWithdrawOpen] = useState(initialAction === "withdraw");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(initialAction === "availability");
  const [bookVisitOpen, setBookVisitOpen] = useState(initialAction === "book");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const statusOptions: { label: string; value: AgentPropertyStatus }[] = [
    { label: "Mark as Reserved", value: "reserved" },
    { label: "Mark as Let", value: "let" },
    { label: "Mark as Archived", value: "archived" },
    { label: "Mark as Draft", value: "draft" },
    ...(property.status === "let" ? [{ label: "A tenant moved out", value: "published" as const }] : []),
  ];
  const statusActions = statusOptions.filter((option) => option.value !== property.status);

  const updateStatus = async (value: string) => {
    const nextStatus = statusActions.find((option) => option.value === value)?.value;
    if (!nextStatus || nextStatus === property.status) return;
    const termUnit = property.term?.unit === "days" || property.term?.unit === "months" || property.term?.unit === "years"
      ? property.term.unit
      : null;
    setUpdatingStatus(true);
    try {
      const response = await agentAPI.updateProperty(property.id, {
        title: property.title,
        description: property.description,
        typeId: property.typeId,
        purpose: property.purpose,
        price: property.price,
        currency: property.currency,
        pricePeriod: property.pricePeriod,
        term: property.term && termUnit ? { value: property.term.value, unit: termUnit } : null,
        location: property.location,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        amenities: property.amenities,
        photos: property.photos,
        status: nextStatus,
        visitFeeOverride: property.visitFeeOverride,
        charges: property.charges,
        rules: property.rules,
        bills: property.bills,
        sharing: property.sharing,
        peoplePerRoom: property.peoplePerRoom,
        places: property.places,
        documents: property.documents,
        videoUrl: property.videoUrl,
        sizeSqm: property.sizeSqm,
        customFields: property.customFields,
      });
      toast.success(response.message);
      onChanged(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't update this listing's status."));
      console.error("Agent listing status update failed:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const submitWithdrawal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWithdrawing(true);
    try {
      const response = await agentAPI.withdrawProperty(property.id, withdrawReason.trim());
      toast.success(response.message);
      onChanged(response.data);
      setWithdrawReason("");
      setWithdrawOpen(false);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't take this listing down. Please try again."));
      console.error("Agent listing withdrawal failed:", error);
    } finally {
      setWithdrawing(false);
    }
  };

  const propertyFacts: { label: string; value: React.ReactNode }[] = [
    { label: "Type", value: typeName },
    { label: "Listed for", value: purposeLabel(property.purpose) },
    { label: "Price", value: `${money(property.price, property.currency)}${periodShortLabel(property.pricePeriod)}` },
    { label: "Sharing", value: property.sharing.replace(/[_-]/g, " ") },
    { label: "Places", value: `${property.placesLeft} of ${property.places} left` },
    { label: "Size", value: property.sizeSqm ? `${property.sizeSqm} m²` : "—" },
    { label: "Address", value: property.location.address || "—" },
    { label: "Near", value: property.location.nearby || "—" },
    {
      label: "Map",
      value: <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property.location.address, property.location.area, property.location.city, property.location.state].filter(Boolean).join(", "))}`} target="_blank" rel="noreferrer">Open map</a>,
    },
    { label: "Reference", value: property.sku || "—" },
    { label: "Visitors can see it", value: property.status === "published" ? "Yes" : "No" },
    {
      label: "Listed on",
      value: Number.isNaN(new Date(property.createdAt).getTime())
        ? "—"
        : new Date(property.createdAt).toLocaleDateString(),
    },
  ];

  const detailTabs = [
    { value: "overview", label: "Overview", icon: LayoutDashboard },
    { value: "inquiries", label: "Inquiries", icon: MessageSquare },
    { value: "visits", label: "Visits", icon: CalendarClock },
    { value: "history", label: "History", icon: HistoryIcon },
  ] as const;
  const videoEmbedUrl = property.videoUrl ? youtubeEmbedUrl(property.videoUrl) : null;

  return (
    <div className="agent-listing-detail-backdrop">
      <section className="agent-listing-detail-modal is-page" role="dialog" aria-modal="true" aria-labelledby="agent-listing-detail-title">
        <button type="button" className="agent-detail-back-button" onClick={onClose}><ChevronLeft size={17} /> Back to listings</button>
        <header className="agent-detail-hero">
          <div className="agent-detail-hero-property">
            {property.photos[0]
              ? <img src={property.photos[0]} alt="" />
              : <div className="agent-detail-hero-placeholder"><ImagePlus size={24} /></div>}
            <div className="agent-detail-hero-copy">
              <div className="agent-detail-hero-badges">
                <span className={`agent-status-pill status-${property.status}`}>{statusLabel(property.status)}</span>
                <span className="agent-detail-purpose-badge">{purposeLabel(property.purpose)}</span>
                {property.featured && <span className="agent-detail-featured-badge"><Star size={13} fill="currentColor" /> Featured</span>}
              </div>
              <h1 id="agent-listing-detail-title">{property.title}</h1>
              <p><MapPin size={15} /> {[property.location.area, property.location.city, property.location.state].filter(Boolean).join(", ")} <span>· {typeName}</span></p>
            </div>
          </div>
          <div className="agent-detail-hero-actions">
            <div className="agent-detail-hero-price">
              <strong>{money(property.price, property.currency)}{periodShortLabel(property.pricePeriod)}</strong>
              <span>{periodLabel(property.pricePeriod)}</span>
            </div>
            <div className="agent-detail-action-buttons">
              <button type="button" className="agent-secondary-button" onClick={onEdit}><Pencil size={16} /> Edit</button>
              {property.status === "published" && <button type="button" className="agent-secondary-button" onClick={onViewWebsite}><ExternalLink size={16} /> View on website</button>}
              <CustomDropdown
                className="agent-detail-status-dropdown"
                buttonClassName="agent-detail-status-trigger"
                placeholder="Status"
                value={property.status}
                triggerContent={<><span>{statusLabel(property.status)}</span><ChevronDown size={16} /></>}
                options={statusActions}
                onChange={(value) => void updateStatus(value)}
                disabled={updatingStatus}
                menuWidth={205}
                menuClassName="agent-detail-status-menu"
                menuItemClassName="agent-detail-status-menu-item"
              />
              {property.status === "published" && <button type="button" className="agent-detail-book-button" onClick={() => setBookVisitOpen(true)}><CalendarPlus size={16} /> Book a visit</button>}
            </div>
          </div>
        </header>

        <nav className="agent-detail-tabs" aria-label="Listing details">
          {detailTabs.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" className={activeTab === value ? "is-active" : ""} onClick={() => setActiveTab(value)}>
              <Icon size={16} />
              {label}
              {value === "visits" && (property.visitCount ?? 0) > 0 && <span className="agent-detail-tab-count">{property.visitCount}</span>}
              {value === "inquiries" && (property.inquiryCount ?? 0) > 0 && <span className="agent-detail-tab-count">{property.inquiryCount}</span>}
            </button>
          ))}
        </nav>

        {withdrawOpen && (
          <Dialog.Root open={withdrawOpen} onOpenChange={(open) => {
            if (!withdrawing) setWithdrawOpen(open);
          }}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-1100 bg-black/80" />
              <Dialog.Content className="fixed top-1/2 left-1/2 z-1101 w-[min(504px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 border border-[#E8DFCE] bg-white px-7 pt-[27px] pb-7 text-[#252820] shadow-[0_20px_60px_rgb(0_0_0/24%)] outline-none dark:border-[#3D3F37] dark:bg-[#1A1B18] dark:text-[#F5F5F0] max-[520px]:px-[18px] max-[520px]:pt-[22px] max-[520px]:pb-5" aria-describedby="agent-withdraw-description">
                <div className="relative flex items-center gap-2.5 pr-7">
                  <AlertTriangle className="shrink-0 text-[#D93025]" size={21} aria-hidden="true" />
                  <Dialog.Title className="m-0 text-lg font-bold max-[520px]:text-base">Take this listing off the site?</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" className="absolute -top-2.5 -right-2.5 grid h-[30px] w-[30px] place-items-center bg-transparent text-[#6B6D65] hover:text-[#24261F] disabled:cursor-not-allowed dark:text-[#B8BAB1]" aria-label="Close" disabled={withdrawing}>
                      <X size={21} />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description id="agent-withdraw-description" className="mt-[9px] mb-0 text-[15px] leading-[1.45] text-[#73756D] dark:text-[#B6B8AF] max-[520px]:text-sm">
                  Visitors will stop seeing “{property.title}”. It stays in your listings as a draft, and RewaCiti is told.
                </Dialog.Description>
                <form className="mt-6 grid gap-1.5" onSubmit={submitWithdrawal}>
                  <label htmlFor="withdraw-reason" className="text-sm font-medium">Reason <span className="text-[#D93025]">*</span></label>
                  <textarea
                    id="withdraw-reason"
                    required
                    rows={3}
                    maxLength={500}
                    placeholder="This is saved in history"
                    value={withdrawReason}
                    onChange={(event) => setWithdrawReason(event.target.value)}
                    className="box-border min-h-[90px] w-full resize-y rounded border-2 border-[#E8D8B8] bg-white px-[13px] py-[11px] text-sm text-[#252820] outline-none placeholder:text-[#7B7D75] focus:border-[#C9A76B] focus:ring-2 focus:ring-[#C9A76B]/20 dark:border-[#66583D] dark:bg-[#12130F] dark:text-[#F5F5F0]"
                  />
                  <div className="mt-3 flex justify-end gap-[9px]">
                    <Dialog.Close asChild>
                      <button type="button" className="min-h-[45px] rounded-[5px] border border-[#E8D8B8] bg-white px-[18px] text-sm text-[#252820] hover:bg-[#F8F6F1] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#5A5B53] dark:bg-[#1A1B18] dark:text-[#F5F5F0] max-[520px]:px-[13px] max-[520px]:text-[13px]" disabled={withdrawing}>Go back</button>
                    </Dialog.Close>
                    <button type="submit" className="min-h-[45px] rounded-[5px] border border-[#C8443B] bg-[#C8443B] px-[18px] text-sm font-semibold text-white hover:bg-[#B6342D] disabled:cursor-not-allowed disabled:border-[#E2A29B] disabled:bg-[#E2A29B] disabled:text-white disabled:opacity-60 max-[520px]:px-[13px] max-[520px]:text-[13px]" disabled={withdrawing || !withdrawReason.trim()}>
                      {withdrawing ? "Taking it down..." : "Take it down"}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {activeTab === "overview" && (
          <>
            <div className="agent-detail-stat-grid">
              <div><span>Views</span><strong>{property.views.toLocaleString()}</strong><Eye size={16} /></div>
              <div><span>Open inquiries</span><strong>{property.inquiryCount ?? 0}</strong><MessageSquare size={16} /></div>
              <div><span>Upcoming visits</span><strong>{property.visitCount ?? 0}</strong><CalendarClock size={16} /></div>
              <div><span>Visit fee</span><strong>{property.visitFeeOverride == null ? "Usual fee" : money(property.visitFeeOverride, property.currency)}</strong><CircleDollarSign size={16} /></div>
            </div>

            <div className="agent-detail-overview-grid">
              <div className="agent-detail-overview-main">
                <section className="agent-detail-card agent-detail-gallery-card">
                  <div className="agent-detail-gallery-grid">
                    {property.photos.length > 0 ? property.photos.slice(0, 3).map((photo, index) => (
                      <button key={`${photo}-${index}`} type="button" className={`agent-detail-gallery-image image-${index + 1}`} onClick={() => { setGalleryIndex(index); setGalleryOpen(true); }}>
                        <img src={photo} alt={`${property.title} photo ${index + 1}`} />
                      </button>
                    )) : <div className="agent-detail-empty-photo">No property photos added.</div>}
                  </div>
                  <div className="agent-detail-gallery-footer">
                    <span>{property.photos.length} {property.photos.length === 1 ? "photo" : "photos"}</span>
                    {property.photos.length > 0 && <button type="button" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}><ImagePlus size={15} /> View all</button>}
                  </div>
                </section>

                <section className="agent-detail-card">
                  <div className="agent-detail-card-title"><FileText size={17} /><h2>Description</h2></div>
                  <div className="agent-detail-description-content" dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(property.description) }} />
                </section>

                {property.videoUrl && (
                  <section className="agent-detail-card">
                    <div className="agent-detail-card-title"><ImagePlus size={17} /><h2>Video tour</h2></div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
                      {videoEmbedUrl ? (
                        <iframe
                          src={videoEmbedUrl}
                          title={`Video tour of ${property.title}`}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={property.videoUrl}
                          poster={property.photos[0] || undefined}
                          controls
                          preload="metadata"
                          className="absolute inset-0 h-full w-full object-contain"
                        >
                          Your browser does not support video playback.
                        </video>
                      )}
                    </div>
                  </section>
                )}

                {(typeof property.customFields.landTitle === "string" || typeof property.customFields.specialNotes === "string") && (
                  <section className="agent-detail-card">
                    <div className="agent-detail-card-title"><Info size={17} /><h2>More details</h2></div>
                    {typeof property.customFields.landTitle === "string" && <p className="agent-detail-custom-fact"><span>Land title</span><strong>{property.customFields.landTitle}</strong></p>}
                    {typeof property.customFields.specialNotes === "string" && <p className="agent-detail-custom-fact"><span>Special notes</span><strong>{property.customFields.specialNotes}</strong></p>}
                  </section>
                )}
              </div>

              <aside className="agent-detail-overview-side">
                <section className="agent-detail-card agent-detail-facts-card">
                  <h2>Key facts</h2>
                  {propertyFacts.map((fact) => <div className="agent-detail-fact-row" key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
                </section>
                <section className="agent-detail-card">
                  <h2>What the customer pays</h2>
                  <div className="agent-detail-fact-row"><span>Property cost</span><strong>{money(property.price, property.currency)}</strong></div>
                  {property.charges.map((charge) => <div className="agent-detail-fact-row" key={charge.name}><span>{charge.name}{charge.refundable ? " (refundable)" : ""}</span><strong>{money(charge.amount ?? 0, property.currency)}</strong></div>)}
                  <div className="agent-detail-fact-row is-total"><span>Total</span><strong>{money(property.totalPrice, property.currency)}</strong></div>
                </section>
                {[
                  { label: "Amenities", items: property.amenities },
                  { label: "House rules", items: property.rules },
                  { label: "Bills the tenant pays", items: property.bills },
                ].filter((group) => group.items.length > 0).map((group) => (
                  <section className="agent-detail-card" key={group.label}>
                    <h2>{group.label}</h2>
                    <div className="agent-detail-chips">{group.items.map((item) => <span key={item}>{item}</span>)}</div>
                  </section>
                ))}
                <section className="agent-detail-card">
                  <h2>Documents</h2>
                  <p className="agent-detail-muted">Only your team can see these.</p>
                  {property.documents.length
                    ? property.documents.map((document, index) => <a className="agent-detail-document-link" key={`${document.slice(0, 80)}-${index}`} href={document} target="_blank" rel="noreferrer"><FileText size={15} /> Document {index + 1}<ExternalLink size={13} /></a>)
                    : <p className="agent-detail-muted">No documents.</p>}
                </section>
              </aside>
            </div>
          </>
        )}

        {activeTab === "inquiries" && (
          <section className="agent-detail-tab-panel">
            <div><h2>Inquiries</h2><p>{property.inquiryCount ?? 0} inquiries recorded for this property.</p></div>
            <div className="agent-detail-tab-empty"><MessageSquare size={22} /><strong>Inquiry details aren’t available here yet.</strong><span>This listing response includes the inquiry count only.</span></div>
          </section>
        )}

        {activeTab === "visits" && (
          <section className="agent-detail-tab-panel">
            <div><h2>Visits</h2><p>{property.visitCount ?? 0} visits recorded for this property.</p></div>
            <div className="agent-detail-tab-empty"><CalendarClock size={22} /><strong>Visit details aren’t available here yet.</strong><span>This listing response includes the visit count only.</span></div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="agent-detail-card agent-detail-history-panel">
            <h2>Listing history</h2>
            {property.history.length ? (
             <div className="agent-detail-history-list">
               {property.history.map((entry) => (
                 <article key={entry.id}>
                   <div><strong>{entry.field.replace(/_/g, " ")}</strong><span>{entry.from ? `${entry.from} → ` : ""}{entry.to ?? "Updated"}</span></div>
                   <small>{entry.by} · {new Date(entry.at).toLocaleString()}{entry.remark ? ` · ${entry.remark}` : ""}</small>
                 </article>
               ))}
             </div>
            ) : <p className="agent-detail-muted">No listing history yet.</p>}
          </section>
        )}

        {availabilityOpen && <AgentAvailabilityEditor property={property} onClose={() => setAvailabilityOpen(false)} />}
        <AgentBookVisitModal property={property} open={bookVisitOpen} onOpenChange={setBookVisitOpen} />
        {galleryOpen && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-black/78 p-5" role="presentation" onClick={(event) => {
            if (event.target === event.currentTarget) setGalleryOpen(false);
          }}>
            <section className="grid h-[min(90vh,850px)] w-full max-w-[1100px] grid-rows-[auto_minmax(0,1fr)_auto] bg-(--surface) p-3.5 text-(--text) max-[700px]:h-[90vh] max-[700px]:p-2.5" role="dialog" aria-modal="true" aria-label="Property photos">
              <header className="flex items-center justify-between gap-3 pb-3"><div className="grid gap-1"><strong className="text-[13px]">{property.title}</strong><span className="text-[11px] text-muted">Photo {galleryIndex + 1} of {property.photos.length}</span></div><button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] bg-(--surface-soft)" aria-label="Close photos" onClick={() => setGalleryOpen(false)}><X size={20} /></button></header>
              <div className="flex min-h-0 items-center justify-between gap-3 bg-(--bg)">
                <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] bg-(--surface-soft) disabled:cursor-not-allowed disabled:opacity-40 max-[700px]:h-[34px] max-[700px]:w-[30px]" aria-label="Previous photo" disabled={galleryIndex === 0} onClick={() => setGalleryIndex((index) => Math.max(0, index - 1))}><ChevronLeft size={20} /></button>
                <img className="h-full w-full min-w-0 object-contain" src={property.photos[galleryIndex]} alt={`${property.title} photo ${galleryIndex + 1}`} />
                <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] bg-(--surface-soft) disabled:cursor-not-allowed disabled:opacity-40 max-[700px]:h-[34px] max-[700px]:w-[30px]" aria-label="Next photo" disabled={galleryIndex >= property.photos.length - 1} onClick={() => setGalleryIndex((index) => Math.min(property.photos.length - 1, index + 1))}><ChevronRight size={20} /></button>
              </div>
              <div className="flex gap-[7px] overflow-x-auto pt-2.5">{property.photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" className={`h-[52px] w-[68px] shrink-0 overflow-hidden border-2 bg-transparent p-0 ${galleryIndex === index ? "border-primary" : "border-transparent"}`} onClick={() => setGalleryIndex(index)}><img className="h-full w-full object-cover" src={photo} alt={`Photo ${index + 1}`} /></button>)}</div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
};


export default AgentPropertyOverview;
