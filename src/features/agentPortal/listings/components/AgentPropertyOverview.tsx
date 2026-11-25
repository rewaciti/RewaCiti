import { useCallback, useEffect, useState } from "react";
import * as React from "react";
import { CalendarPlus, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Eye, ExternalLink, FileText, History as HistoryIcon, ImagePlus, Info, LayoutDashboard, Mail, MapPin, MessageSquare, Pencil, Phone, Star, Users, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentBooking, type AgentInquiry, type AgentProperty, type AgentPropertyStatus } from "@/features/agentPortal/common/services/agentAPI";
import { money, serviceChargeFor, statusLabel, periodLabel, periodShortLabel, purposeLabel, sanitizeDescriptionHtml } from "@/features/agentPortal/common/utils/agentListingUtils";
import { formatLeadDateTime, leadStatusLabel, leadStatusPillClass } from "@/features/agentPortal/leads/utils/agentLeadUtils";
import { formatVisitDate, formatVisitTime, visitStatusLabel, visitStatusPillClass } from "@/features/agentPortal/common/utils/agentVisitUtils";
import type { PropertyDetailAction } from "@/features/agentPortal/common/utils/agentListingUtils";
import AgentAvailabilityEditor from "./AgentAvailabilityEditor";
import AgentBookVisitModal from "./AgentBookVisitModal";
import AgentWithdrawModal from "./AgentWithdrawModal";

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

const statusPillClasses: Record<AgentPropertyStatus, string> = {
  published: "bg-[#dcfce7] text-[#166534]",
  pending_approval: "bg-[#fef3c7] text-[#92400e]",
  draft: "bg-[#f3f4f6] text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]",
  reserved: "bg-[#ede9fe] text-[#5b21b6]",
  sold: "bg-[#dbeafe] text-[#1e40af]",
  let: "bg-[#dbeafe] text-[#1e40af]",
  archived: "bg-[#f3f4f6] text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]",
};

const ActivityPlaceholder = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="grid min-h-28 content-center justify-items-center gap-2 rounded-lg border border-dashed border-[#e5e7eb] p-4 text-center text-[#4b5563] dark:border-white/10 dark:text-[#9ca3af]">
    {icon}
    <span className="text-xs">{children}</span>
  </div>
);

const ActivityError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="grid min-h-28 content-center justify-items-center gap-2 rounded-lg border border-dashed border-[#e5e7eb] p-4 text-center dark:border-white/10">
    <span className="text-xs text-[#4b5563] dark:text-[#9ca3af]">We couldn’t load this activity.</span>
    <button type="button" className="cursor-pointer rounded-full border-0 bg-transparent px-0 text-xs font-semibold text-highlight dark:text-highlight" onClick={onRetry}>Try again</button>
  </div>
);

const InquiryCard = ({ inquiry, compact = false }: { inquiry: AgentInquiry; compact?: boolean }) => (
  <article className="min-w-0 rounded-lg border border-[#e5e7eb] p-3.5 dark:border-white/10">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <strong className="text-sm text-[#111827] dark:text-white">{inquiry.contact.name || "Unnamed client"}</strong>
        <span className="ml-2 text-xs text-[#6b7280] dark:text-[#9ca3af]">{inquiry.reference}</span>
      </div>
      <span className={leadStatusPillClass(inquiry.status)}>{leadStatusLabel(inquiry.status)}</span>
    </div>
    {!compact && inquiry.message && <p className="m-0 mt-2 text-xs leading-relaxed text-[#4b5563] wrap-anywhere dark:text-[#9ca3af]">{inquiry.message}</p>}
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">
      {inquiry.contact.email && <span className="inline-flex min-w-0 items-center gap-1"><Mail size={13} className="shrink-0" />{inquiry.contact.email}</span>}
      {inquiry.contact.phone && <span className="inline-flex items-center gap-1"><Phone size={13} />{inquiry.contact.phone}</span>}
    </div>
    <p className="mb-0 mt-2 text-[11px] text-[#9ca3af]">{formatLeadDateTime(inquiry.createdAt)}</p>
  </article>
);

const VisitCard = ({ booking, compact = false }: { booking: AgentBooking; compact?: boolean }) => (
  <article className="min-w-0 rounded-lg border border-[#e5e7eb] p-3.5 dark:border-white/10">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <strong className="text-sm text-[#111827] dark:text-white">{booking.contact.name || "Unnamed client"}</strong>
        <span className="ml-2 text-xs text-[#6b7280] dark:text-[#9ca3af]">{booking.reference}</span>
      </div>
      <span className={visitStatusPillClass(booking.status)}>{visitStatusLabel(booking.status)}</span>
    </div>
    <div className="mt-2 grid gap-1 text-xs text-[#4b5563] dark:text-[#9ca3af]">
      <span className="inline-flex flex-wrap items-center gap-1.5"><CalendarClock size={13} />{formatVisitDate(booking.date)} · {formatVisitTime(booking.start)}–{formatVisitTime(booking.end)}</span>
      <span className="inline-flex flex-wrap items-center gap-1.5"><Users size={13} />{booking.visitors} {booking.visitors === 1 ? "visitor" : "visitors"} · {String(booking.mode ?? "").replaceAll("_", " ")}</span>
      {!compact && (
        <>
          {booking.contact.email && <span className="inline-flex min-w-0 items-center gap-1"><Mail size={13} className="shrink-0" />{booking.contact.email}</span>}
          {booking.contact.phone && <span className="inline-flex items-center gap-1"><Phone size={13} />{booking.contact.phone}</span>}
        </>
      )}
    </div>
    <p className="mb-0 mt-2 text-[11px] text-[#9ca3af]">Booked {formatLeadDateTime(booking.createdAt)}</p>
  </article>
);

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
  const [availabilityOpen, setAvailabilityOpen] = useState(initialAction === "availability");
  const [bookVisitOpen, setBookVisitOpen] = useState(initialAction === "book");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryTouchStartX = React.useRef<number | null>(null);
  const [inquiries, setInquiries] = useState<AgentInquiry[]>([]);
  const [visits, setVisits] = useState<AgentBooking[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);

  const loadPropertyActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(false);
    setInquiries([]);
    setVisits([]);
    try {
      const [inquiryResponse, bookingResponse] = await Promise.all([
        agentAPI.getInquiries({ page: 1, limit: 100, propertyId: property.id }),
        agentAPI.getBookings({ page: 1, limit: 100, propertyId: property.id }),
      ]);
      setInquiries(inquiryResponse.data.filter((entry) => entry.propertyId === property.id));
      setVisits(bookingResponse.data.filter((entry) => entry.propertyId === property.id));
    } catch (error) {
      setActivityError(true);
      toast.error(agentErrorMessage(error, "We couldn't load this property's inquiries and visits."));
      console.error("Agent property activity failed to load:", error);
    } finally {
      setActivityLoading(false);
    }
  }, [property.id]);

  useEffect(() => {
    void loadPropertyActivity();
  }, [loadPropertyActivity]);

  useEffect(() => {
    if (!galleryOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setGalleryIndex((index) => Math.max(0, index - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setGalleryIndex((index) => Math.min(property.photos.length - 1, index + 1));
      } else if (event.key === "Escape") {
        setGalleryOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen, property.photos.length]);

  const renderInquiries = (limit?: number) => {
    if (activityLoading) return <ActivityPlaceholder icon={<MessageSquare size={20} />}>Loading inquiries...</ActivityPlaceholder>;
    if (activityError) return <ActivityError onRetry={() => void loadPropertyActivity()} />;
    if (!inquiries.length) return <ActivityPlaceholder icon={<MessageSquare size={20} />}>No inquiries for this property yet.</ActivityPlaceholder>;
    return <div className="grid gap-2">{(limit ? inquiries.slice(0, limit) : inquiries).map((inquiry) => <InquiryCard key={inquiry.id} inquiry={inquiry} compact={Boolean(limit)} />)}</div>;
  };

  const renderVisits = (limit?: number) => {
    if (activityLoading) return <ActivityPlaceholder icon={<CalendarClock size={20} />}>Loading visits...</ActivityPlaceholder>;
    if (activityError) return <ActivityError onRetry={() => void loadPropertyActivity()} />;
    if (!visits.length) return <ActivityPlaceholder icon={<CalendarClock size={20} />}>No visits for this property yet.</ActivityPlaceholder>;
    return <div className="grid gap-2">{(limit ? visits.slice(0, limit) : visits).map((booking) => <VisitCard key={booking.id} booking={booking} compact={Boolean(limit)} />)}</div>;
  };

  const statusOptions: { label: string; value: AgentPropertyStatus }[] = [
    { label: "Mark as Reserved", value: "reserved" },
    { label: "Mark as Let", value: "let" },
    { label: "Mark as Archived", value: "archived" },
    { label: "Mark as Draft", value: "draft" },
    ...(property.status === "let" ? [{ label: "A tenant moved out", value: "published" as const }] : []),
  ];
  const statusActions = statusOptions.filter((option) => option.value !== property.status);
  const serviceCharge = property.serviceCharge || serviceChargeFor(property.price);

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
      value: <a className="text-[#111827] no-underline dark:text-white" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property.location.address, property.location.area, property.location.city, property.location.state].filter(Boolean).join(", "))}`} target="_blank" rel="noreferrer">Open map</a>,
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
    <div className="fixed inset-0 z-25 overflow-y-auto bg-gray-300 dark:bg-neutral-950">
      <section className="mx-auto w-full max-w-[1440px] border-0 bg-transparent px-4 pt-5 pb-12 text-[#111827] shadow-none sm:px-6 lg:px-10 dark:text-white" role="dialog" aria-modal="true" aria-labelledby="agent-listing-detail-title">
        <button type="button" className="mb-3 mt-0 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent px-0 py-1 font-[inherit] text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" onClick={onClose}><ChevronLeft size={18} /> Back to listings</button>
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-[#1a1a1a] max-[1000px]:grid-cols-1 max-[700px]:gap-4">
          <div className="flex min-w-0 items-center gap-4 max-[700px]:items-start max-[700px]:gap-3">
            {property.photos[0]
              ? <img src={property.photos[0]} alt="" className="h-[88px] w-[120px] shrink-0 rounded-lg object-cover max-[700px]:h-20 max-[700px]:w-20" />
              : <div className="grid h-[88px] w-[120px] shrink-0 place-items-center rounded-lg bg-[#f3f4f6] text-[#6b7280] dark:bg-[#232323] dark:text-[#9ca3af] max-[700px]:h-20 max-[700px]:w-20"><ImagePlus size={24} /></div>}
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${statusPillClasses[property.status]}`}>{statusLabel(property.status)}</span>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[#e5e7eb] px-2.5 text-xs text-[#111827] dark:border-white/10 dark:text-white">{purposeLabel(property.purpose)}</span>
                {property.featured && <span className="inline-flex h-6 items-center gap-1 rounded-full border border-[#e5e7eb] px-2.5 text-xs text-[#b86a31] dark:border-white/10"><Star size={13} fill="currentColor" /> Featured</span>}
              </div>
              <h1 id="agent-listing-detail-title" className="m-0 overflow-hidden text-lg font-bold text-ellipsis text-[#111827] dark:text-white sm:text-2xl">{property.title}</h1>
              <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-xs text-[#4b5563] dark:text-[#9ca3af] sm:text-sm max-[700px]:items-start"><MapPin size={15} className="mt-0.5 shrink-0 text-[#6b7280] dark:text-[#9ca3af]" /> {[property.location.area, property.location.city, property.location.state].filter(Boolean).join(", ")} <span>· {typeName}</span></p>
            </div>
          </div>
          <div className="grid justify-items-end gap-3 max-[1000px]:justify-items-start max-[700px]:w-full">
            <div className="grid justify-items-end max-[1000px]:justify-items-start">
              <strong className="font-serif text-xl font-bold text-[#111827] dark:text-white sm:text-2xl">{money(property.price, property.currency)}{periodShortLabel(property.pricePeriod)}</strong>
              <span className="text-xs text-[#4b5563] dark:text-[#9ca3af]">{periodLabel(property.pricePeriod)}</span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 max-[1000px]:justify-start max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-2">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3.5 font-[inherit] text-xs font-semibold text-[#111827] hover:border-highlight hover:bg-[#f3f4f6] hover:text-highlight dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:border-highlight dark:hover:bg-[#232323] dark:hover:text-highlight sm:text-sm max-[700px]:w-full"
                onClick={onEdit}
              >
                <Pencil size={16} /> Edit
              </button>

              {property.status === "published" && (
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3.5 font-[inherit] text-xs font-semibold text-[#111827] hover:border-highlight hover:bg-[#f3f4f6] hover:text-highlight dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:border-highlight dark:hover:bg-[#232323] dark:hover:text-highlight sm:text-sm max-[700px]:w-full"
                  onClick={onViewWebsite}
                >
                  <ExternalLink size={16} /> View on website
                </button>
              )}

              <CustomDropdown
                className="w-[205px] min-w-[205px] max-[700px]:w-full max-[700px]:min-w-0"
                buttonClassName="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 font-[inherit] text-xs font-medium text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white sm:text-sm"
                placeholder="Status"
                value={property.status}
                triggerContent={<><span>{statusLabel(property.status)}</span><ChevronDown size={16} /></>}
                options={statusActions}
                onChange={(value) => void updateStatus(value)}
                disabled={updatingStatus}
                menuWidth={205}
                menuClassName="..." /* unchanged */
                menuItemClassName="..." /* unchanged */
              />

              {property.status === "published" && (
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-highlight bg-highlight px-3.5 font-[inherit] text-xs font-semibold text-white hover:brightness-[0.94] sm:text-sm max-[700px]:w-full"
                  onClick={() => setBookVisitOpen(true)}
                >
                  <CalendarPlus size={16} /> Book a visit
                </button>
              )}
            </div>
          </div>
        </header>

        <nav className="my-4 flex gap-1.5 overflow-x-auto border-b border-gray-400/60 dark:border-white/15" aria-label="Listing details">
          {detailTabs.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-3.5 font-[inherit] text-xs sm:px-4 sm:text-sm ${activeTab === value ? "border-[#e5e7eb] bg-white font-semibold text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white" : "border-transparent bg-transparent text-gray-700 hover:text-gray-900 dark:text-[#9ca3af] dark:hover:text-white"}`} onClick={() => setActiveTab(value)}>
              <Icon size={16} />
              {label}
              {value === "visits" && (property.visitCount ?? 0) > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#f3f4f6] px-1.5 text-xs font-semibold text-[#111827] dark:bg-[#232323] dark:text-white">{property.visitCount}</span>}
              {value === "inquiries" && (property.inquiryCount ?? 0) > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#f3f4f6] px-1.5 text-xs font-semibold text-[#111827] dark:bg-[#232323] dark:text-white">{property.inquiryCount}</span>}
            </button>
          ))}
        </nav>

        <AgentWithdrawModal
          property={property}
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          onWithdrawn={onChanged}
        />

        {activeTab === "overview" && (
          <>
            <div className="mb-4 grid grid-cols-4 gap-3 max-[700px]:grid-cols-2">
              <div className="relative grid min-h-[88px] content-center gap-1 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1a]"><span className="text-xs text-[#4b5563] dark:text-[#9ca3af]">Views</span><strong className="text-xl font-bold text-[#111827] dark:text-white sm:text-2xl">{property.views.toLocaleString()}</strong><Eye size={16} className="absolute top-4 right-4 text-[#6b7280] dark:text-[#9ca3af]" /></div>
              <div className="relative grid min-h-[88px] content-center gap-1 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1a]"><span className="text-xs text-[#4b5563] dark:text-[#9ca3af]">Open inquiries</span><strong className="text-xl font-bold text-[#111827] dark:text-white sm:text-2xl">{property.inquiryCount ?? 0}</strong><MessageSquare size={16} className="absolute top-4 right-4 text-[#6b7280] dark:text-[#9ca3af]" /></div>
              <div className="relative grid min-h-[88px] content-center gap-1 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1a]"><span className="text-xs text-[#4b5563] dark:text-[#9ca3af]">Upcoming visits</span><strong className="text-xl font-bold text-[#111827] dark:text-white sm:text-2xl">{property.visitCount ?? 0}</strong><CalendarClock size={16} className="absolute top-4 right-4 text-[#6b7280] dark:text-[#9ca3af]" /></div>
              <div className="relative grid min-h-[88px] content-center gap-1 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1a]"><span className="text-xs text-[#4b5563] dark:text-[#9ca3af]">Visit fee</span><strong className="text-xl font-bold text-[#111827] dark:text-white sm:text-2xl">{property.visitFeeOverride == null ? "Usual fee" : money(property.visitFeeOverride, property.currency)}</strong><CircleDollarSign size={16} className="absolute top-4 right-4 text-[#6b7280] dark:text-[#9ca3af]" /></div>
            </div>

            <div className="grid grid-cols-[minmax(0,2fr)_minmax(290px,1fr)] items-start gap-4 max-[700px]:grid-cols-1">
              <div className="grid min-w-0 content-start gap-4">
                <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-5 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
                  <div className="grid grid-cols-2 grid-rows-[repeat(2,minmax(130px,1fr))] gap-2 max-[700px]:grid-rows-[repeat(2,minmax(100px,1fr))]">
                    {property.photos.length > 0 ? property.photos.slice(0, 3).map((photo, index) => (
                      <button key={`${photo}-${index}`} type="button" className={`group min-h-[130px] min-w-0 overflow-hidden rounded-lg border-0 bg-[#f3f4f6] p-0 dark:bg-[#232323] max-[700px]:min-h-[100px] ${index === 0 ? "row-span-2" : ""}`} onClick={() => { setGalleryIndex(index); setGalleryOpen(true); }}>
                        <img src={photo} alt={`${property.title} photo ${index + 1}`} className="block h-full w-full min-h-[inherit] object-cover transition-transform duration-160 ease-in group-hover:scale-[1.02]" />
                      </button>
                    )) : <div className="col-span-2 grid min-h-60 place-items-center rounded-lg bg-[#f3f4f6] text-sm text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]">No property photos added.</div>}
                  </div>
                  <div className="flex min-h-9 items-center justify-between px-1 pt-2 pb-0 text-xs text-[#4b5563] sm:text-sm dark:text-[#9ca3af]">
                    <span>{property.photos.length} {property.photos.length === 1 ? "photo" : "photos"}</span>
                    {property.photos.length > 0 && <button type="button" className="inline-flex items-center gap-1.5 border-0 bg-transparent font-[inherit] font-medium text-[#111827] dark:text-white" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}><ImagePlus size={16} /> View all</button>}
                  </div>
                </section>

                <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
                  <div className="mb-4 flex items-center gap-2.5 text-highlight dark:text-highlight"><FileText size={18} /><h2 className="m-0 text-base font-bold text-[#111827] dark:text-white">Description</h2></div>
                  <div className="wrap-anywhere text-sm leading-relaxed text-[#4b5563] dark:text-[#9ca3af] [&>p]:m-0 [&>p]:mb-2.5 [&>p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(property.description) }} />
                </section>

                {property.videoUrl && (
                  <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
                    <div className="mb-4 flex items-center gap-2.5 text-highlight dark:text-highlight"><ImagePlus size={18} /><h2 className="m-0 text-base font-bold text-[#111827] dark:text-white">Video tour</h2></div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-[#e5e7eb] bg-black dark:border-white/10">
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
                  <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
                    <div className="mb-4 flex items-center gap-2.5 text-highlight dark:text-highlight"><Info size={18} /><h2 className="m-0 text-base font-bold text-[#111827] dark:text-white">More details</h2></div>
                    {typeof property.customFields.landTitle === "string" && <p className="m-0 grid grid-cols-[minmax(90px,0.3fr)_1fr] gap-3 border-b border-[#e5e7eb] py-2.5 text-sm last:border-b-0 dark:border-white/10"><span className="text-[#4b5563] dark:text-[#9ca3af]">Land title</span><strong className="font-medium whitespace-pre-wrap text-[#111827] dark:text-white">{property.customFields.landTitle}</strong></p>}
                    {typeof property.customFields.specialNotes === "string" && <p className="m-0 grid grid-cols-[minmax(90px,0.3fr)_1fr] gap-3 border-b border-[#e5e7eb] py-2.5 text-sm last:border-b-0 dark:border-white/10"><span className="text-[#4b5563] dark:text-[#9ca3af]">Special notes</span><strong className="font-medium whitespace-pre-wrap text-[#111827] dark:text-white">{property.customFields.specialNotes}</strong></p>}
                  </section>
                )}
              </div>

              <aside className="grid min-w-0 content-start gap-4">
                <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
                  <h2 className="m-0 mb-2 text-base font-bold text-[#111827] dark:text-white">Key facts</h2>
                  {propertyFacts.map((fact) => <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[#e5e7eb] text-xs last:border-b-0 sm:text-sm dark:border-white/10" key={fact.label}><span className="text-[#4b5563] dark:text-[#9ca3af]">{fact.label}</span><strong className="text-right font-medium capitalize text-[#111827] dark:text-white">{fact.value}</strong></div>)}
                </section>
                <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
                  <h2 className="m-0 mb-2 text-base font-bold text-[#111827] dark:text-white">What the customer pays</h2>
                  <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[#e5e7eb] text-xs last:border-b-0 sm:text-sm dark:border-white/10"><span className="text-[#4b5563] dark:text-[#9ca3af]">Property cost</span><strong className="text-right font-medium capitalize text-[#111827] dark:text-white">{money(property.price, property.currency)}</strong></div>
                  {property.charges.map((charge) => <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[#e5e7eb] text-xs last:border-b-0 sm:text-sm dark:border-white/10" key={charge.name}><span className="text-[#4b5563] dark:text-[#9ca3af]">{charge.name}{charge.refundable ? " (refundable)" : ""}</span><strong className="text-right font-medium capitalize text-[#111827] dark:text-white">{money(charge.amount ?? 0, property.currency)}</strong></div>)}
                  <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[#e5e7eb] text-xs last:border-b-0 sm:text-sm dark:border-white/10"><span className="text-[#4b5563] dark:text-[#9ca3af]">Service charge (5%)</span><strong className="text-right font-medium capitalize text-[#111827] dark:text-white">{money(serviceCharge, property.currency)}</strong></div>
                  <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[#e5e7eb] text-xs font-bold [&>span]:font-bold [&>span]:text-[#111827] [&>strong]:font-bold sm:text-sm dark:border-white/10 dark:[&>span]:text-white"><span className="text-[#4b5563] dark:text-[#9ca3af]">Total</span><strong className="text-right font-medium capitalize text-[#111827] dark:text-white">{money(property.totalPrice, property.currency)}</strong></div>
                </section>
                {[
                  { label: "Amenities", items: property.amenities },
                  { label: "House rules", items: property.rules },
                  { label: "Bills the tenant pays", items: property.bills },
                ].filter((group) => group.items.length > 0).map((group) => (
                  <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white" key={group.label}>
                    <h2 className="m-0 mb-3 text-base font-bold text-[#111827] dark:text-white">{group.label}</h2>
                    <div className="flex flex-wrap gap-2">{group.items.map((item) => <span key={item} className="rounded-full bg-highlight/10 px-3 py-1.5 text-xs text-[#4b5563] dark:bg-highlight/15 dark:text-[#9ca3af]">{item}</span>)}</div>
                  </section>
                ))}
                <section className="m-0 min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
                  <h2 className="m-0 mb-1 text-base font-bold text-[#111827] dark:text-white">Documents</h2>
                  <p className="mb-2.5 mt-0 text-xs text-[#4b5563] no-underline wrap-anywhere dark:text-[#9ca3af]">Only your team can see these.</p>
                  {property.documents.length
                    ? property.documents.map((document, index) => <a className="flex min-h-10 items-center gap-2 border-t border-[#e5e7eb] text-xs text-[#111827] no-underline sm:text-sm dark:border-white/10 dark:text-white" key={`${document.slice(0, 80)}-${index}`} href={document} target="_blank" rel="noreferrer"><FileText size={16} /> Document {index + 1}<ExternalLink size={14} className="ml-auto text-[#6b7280] dark:text-[#9ca3af]" /></a>)
                    : <p className="mb-1 mt-0 text-xs text-[#4b5563] no-underline wrap-anywhere sm:text-sm dark:text-[#9ca3af]">No documents.</p>}
                </section>
              </aside>
            </div>
          </>
        )}

        {activeTab === "inquiries" && (
          <section className="grid min-h-[300px] content-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
            <div><h2 className="m-0 text-base font-bold text-[#111827] sm:text-lg dark:text-white">Inquiries</h2><p className="mb-0 mt-1 text-sm text-[#4b5563] dark:text-[#9ca3af]">{activityLoading ? `${property.inquiryCount ?? 0} inquiries recorded for this property.` : `${inquiries.length} inquiries recorded for this property.`}</p></div>
            {renderInquiries()}
          </section>
        )}

        {activeTab === "visits" && (
          <section className="grid min-h-[300px] content-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
            <div><h2 className="m-0 text-base font-bold text-[#111827] sm:text-lg dark:text-white">Visits</h2><p className="mb-0 mt-1 text-sm text-[#4b5563] dark:text-[#9ca3af]">{activityLoading ? `${property.visitCount ?? 0} visits recorded for this property.` : `${visits.length} visits recorded for this property.`}</p></div>
            {renderVisits()}
          </section>
        )}

        {activeTab === "history" && (
          <section className="m-0 grid min-w-0 gap-3 rounded-xl border border-gray-200 bg-white p-4 text-[#111827] sm:p-6 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
            <h2 className="m-0 text-base font-bold text-[#111827] sm:text-lg dark:text-white">Listing history</h2>
            {property.history.length ? (
             <div className="grid">
                {property.history.map((entry) => (
                  <article key={entry.id} className="grid gap-1 border-t border-[#e5e7eb] py-3 dark:border-white/10">
                    <div className="flex justify-between gap-3 text-sm"><strong className="capitalize text-[#111827] dark:text-white">{entry.field.replace(/_/g, " ")}</strong><span className="text-xs text-[#4b5563] dark:text-[#9ca3af]">{entry.from ? `${entry.from} → ` : ""}{entry.to ?? "Updated"}</span></div>
                    <small className="text-xs text-[#4b5563] dark:text-[#9ca3af]">{entry.by} · {new Date(entry.at).toLocaleString()}{entry.remark ? ` · ${entry.remark}` : ""}</small>
                  </article>
                ))}
              </div>
            ) : <p className="mb-1 mt-0 text-sm text-[#4b5563] no-underline wrap-anywhere dark:text-[#9ca3af]">No listing history yet.</p>}
          </section>
        )}

        {availabilityOpen && <AgentAvailabilityEditor property={property} onClose={() => setAvailabilityOpen(false)} />}
        <AgentBookVisitModal property={property} open={bookVisitOpen} onOpenChange={setBookVisitOpen} />
        {galleryOpen && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-black/78 p-5 max-[700px]:p-3" role="presentation" onClick={(event) => {
            if (event.target === event.currentTarget) setGalleryOpen(false);
          }}>
            <section className="grid h-[min(90vh,850px)] w-full max-w-[1100px] grid-rows-[auto_minmax(0,1fr)_auto] bg-white p-3.5 text-[#111827] dark:bg-[#1a1a1a] dark:text-white max-[700px]:h-[90vh] max-[700px]:p-3" role="dialog" aria-modal="true" aria-label="Property photos">
              <header className="flex items-center justify-between gap-3 pb-3"><div className="grid min-w-0 gap-1"><strong className="truncate text-[13px]">{property.title}</strong><span className="text-[11px] text-[#4b5563] dark:text-[#9ca3af]">Photo {galleryIndex + 1} of {property.photos.length}</span></div><button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] border-0 bg-[#f3f4f6] text-[#111827] dark:bg-[#232323] dark:text-white" aria-label="Close photos" onClick={() => setGalleryOpen(false)}><X size={20} /></button></header>
              <div
                className="flex min-h-0 items-center justify-center gap-3 bg-[#f3f4f6] dark:bg-[#232323] max-[700px]:gap-0"
                style={{ touchAction: "pan-y" }}
                onTouchStart={(event) => { galleryTouchStartX.current = event.touches[0]?.clientX ?? null; }}
                onTouchEnd={(event) => {
                  if (galleryTouchStartX.current === null) return;
                  const distance = (event.changedTouches[0]?.clientX ?? 0) - galleryTouchStartX.current;
                  galleryTouchStartX.current = null;
                  if (distance > 40) setGalleryIndex((index) => Math.max(0, index - 1));
                  else if (distance < -40) setGalleryIndex((index) => Math.min(property.photos.length - 1, index + 1));
                }}
              >
                <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] border-0 bg-[#f3f4f6] text-[#111827] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#232323] dark:text-white max-[700px]:hidden" aria-label="Previous photo" disabled={galleryIndex === 0} onClick={() => setGalleryIndex((index) => Math.max(0, index - 1))}><ChevronLeft size={20} /></button>
                <img className="h-full w-full min-w-0 select-none object-contain" src={property.photos[galleryIndex]} alt={`${property.title} photo ${galleryIndex + 1}`} draggable={false} />
                <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-[5px] border-0 bg-[#f3f4f6] text-[#111827] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#232323] dark:text-white max-[700px]:hidden" aria-label="Next photo" disabled={galleryIndex >= property.photos.length - 1} onClick={() => setGalleryIndex((index) => Math.min(property.photos.length - 1, index + 1))}><ChevronRight size={20} /></button>
              </div>
              <div className="flex gap-[7px] overflow-x-auto px-3.5 pt-2.5">{property.photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" className={`h-[52px] w-[68px] shrink-0 overflow-hidden border-2 bg-transparent p-0 ${galleryIndex === index ? "border-highlight" : "border-transparent"}`} onClick={() => setGalleryIndex(index)}><img className="h-full w-full object-cover" src={photo} alt={`Photo ${index + 1}`} /></button>)}</div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
};


export default AgentPropertyOverview;
