import Navbar from "../../../shared/components/Layout/Navbar";
import { useParams, Link } from "react-router";
import { Helmet } from "react-helmet-async";
import {
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiShare2,
  FiArrowLeft,
  FiArrowRight,
  FiX,
  FiMail,
  FiCalendar,
  FiCreditCard,
  FiFlag,
  FiPlay,
  FiGrid,
} from "react-icons/fi";
import * as Dialog from "@radix-ui/react-dialog";
import { usePropertyStore } from "../store/usePropertyStore";
import { useState, useEffect, useRef } from "react";
import { Bath, BedDouble, Zap } from "lucide-react";
import Footer from "../../../shared/components/Layout/Footer";
import BookInspectionModal from "../../inspections/components/BookInspectionModal";
import PropertyPaymentModal from "../components/PropertyPaymentModal";
import ServiceRatingModal from "../components/ServiceRatingModal";
import ReportAgentModal from "../components/ReportAgentModal";
import InquiryModal from "../components/InquiryModal";
import PropertyCard from "../components/PropertyCard";
import PropertyMap from "../components/PropertyMap";
import {
  PropertyDetailsSkeleton,
  PropertyCardSkeleton,
} from "../../../shared/components/ui/Skeletons";
import { toast } from "sonner";
import { formatCurrency, stripHtmlTags } from "../../../shared/lib/utils";
import FeatureSection from "../components/FeatureSection";
import PropertyFeatureItem from "../components/PropertyFeatureItem";

import { useAuthStore } from "../../auth/store/useAuthStore";
import { addressOf } from "../services/toProperty";

// Use the SAME classes inside your Navbar so the logo lines up with the content.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Airbnb-style building blocks
const SECTION = "border-b border-gray-600/50 py-8 dark:border-gray-600/50";
const H2 = "text-[22px] font-semibold text-gray-900 dark:text-white";
const OUTLINE_BTN =
  "rounded-lg border border-gray-900 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-white/10";
const GHOST_BTN =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 underline underline-offset-2 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10";

type GalleryItem =
  | { kind: "image"; src: string; label: string }
  | { kind: "video"; src: string; label: string; poster?: string };

const youtubeEmbedUrl = (videoUrl: string) => {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtu.be") {
      return null;
    }

    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : url.pathname.startsWith("/embed/")
          ? url.pathname.split("/")[2]
          : url.searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
  } catch {
    return null;
  }
};

const locationText = (address: string, landmark?: string) =>
  landmark ? `${address} · Near ${landmark}` : address;

// Airbnb mosaic: one big tile on the left, four small tiles on the right.
// With fewer photos it falls back to a simpler layout so there are no holes.
const tileClass = (index: number, total: number) => {
  if (total === 1) return "col-span-4 row-span-2";
  if (total === 4) {
    if (index === 0) return "col-span-2 row-span-2";
    if (index === 3) return "col-span-2 row-span-1";
    return "col-span-1 row-span-1";
  }
  if (total === 3) return index === 0 ? "col-span-2 row-span-2" : "col-span-2 row-span-1";
  if (total === 2) return "col-span-2 row-span-2";
  return index === 0 ? "col-span-2 row-span-2" : "";
};

function PropertyDetails() {
  const [showAllSpecifications, setShowAllSpecifications] = useState(false);
  const [showAllSpecialNotes, setShowAllSpecialNotes] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [activeFeatureModal, setActiveFeatureModal] = useState<
    "amenities" | "rules" | "bills" | null
  >(null);
  const { slug } = useParams<{ slug: string }>();

  const {
    properties,
    featuredProperties,
    loading,
    toggleShortlist,
    shortlistedProperties,
    relatedProperties,
    relatedPropertiesLoading,
    totalRelatedProperties,
    fetchRelatedProperties,
    forms,
    currentProperty,
    detailsLoading,
    fetchPropertyBySlug,
  } = usePropertyStore();

  const cachedProperty =
    properties.find((p) => p.slug === slug) ??
    relatedProperties.find((p) => p.slug === slug) ??
    featuredProperties.find((p) => p.slug === slug) ??
    null;
  const property =
    currentProperty && currentProperty.slug === slug
      ? currentProperty
      : cachedProperty ?? currentProperty;
  const descriptionText = (property?.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const showDetailsSkeleton = detailsLoading || (!property && loading);

  const isShortlisted = property
    ? shortlistedProperties.some((p) => p.id === property.id)
    : false;

  const handleShortlist = async () => {
    if (!property) return;

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast.error("Please log in to access your wishlist.");
      return;
    }

    toast.success(
      isShortlisted ? "Removed from shortlist" : "Added to shortlist",
    );
    void toggleShortlist(property);
  };

  const handleShare = async () => {
    if (!property) return;
    const description = stripHtmlTags(property.description);
    const url = window.location.href;
    const address = locationText(addressOf(property), property.location.nearby);
    const coverImageUrl = property.img || property.images?.[0] || "";
    const shareText = [
      property.name,
      address,
      description,
      `Category: ${property.category}\nURL: ${url}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!navigator.share) {
      navigator.clipboard.writeText(shareText);
      toast.success("Link copied to clipboard!");
      return;
    }

    const shareData = { title: property.name, text: shareText };

    // Returns true when the share sheet was handled (shared or dismissed).
    const shareWithFile = async (
      fileUrl: string,
      ext: string,
      fallbackType: string,
    ) => {
      if (typeof File === "undefined") return false;
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        if (!blob.size) return false;
        const file = new File(
          [blob],
          `${property.slug || property.name}.${ext}`,
          { type: blob.type || fallbackType },
        );
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
          return false;
        }
        await navigator.share({ ...shareData, files: [file] });
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return true;
        }
        console.error("Error preparing share file:", error);
        return false;
      }
    };

    try {
      // Prefer the video, then the cover image, then plain text.
      if (property.videoUrl && (await shareWithFile(property.videoUrl, "mp4", "video/mp4"))) return;
      if (coverImageUrl && (await shareWithFile(coverImageUrl, "jpg", "image/jpeg"))) return;
      await navigator.share(shareData);
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const price = property?.pricing.total ?? 0;
  const images =
    property?.images?.length
      ? property.images
      : property?.img
        ? [property.img]
        : [];
  const galleryItems: GalleryItem[] = [
    ...images.map((src, index) => ({
      kind: "image" as const,
      src,
      label: `Property photo ${index + 1}`,
    })),
    ...(property?.videoUrl
      ? [
          {
            kind: "video" as const,
            src: property.videoUrl,
            label: "Property video tour",
            poster: images[0] || property.img,
          },
        ]
      : []),
  ];
  const tiles = images.slice(0, 4);

  const hasBedrooms = !!property && property.bedrooms !== 0;
  const hasBathrooms = !!property && property.bathrooms > 0;

  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [galleryView, setGalleryView] = useState<"grid" | "viewer">("grid");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [paymentUserData, setPaymentUserData] = useState<
    { name: string; email: string; dealNumber: string } | undefined
  >(undefined);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const [relatedPage, setRelatedPage] = useState(1);
  const [showAllRelated, setShowAllRelated] = useState(false);
  const [sameAgentOnly, setSameAgentOnly] = useState(false);
  const relatedPropertiesRef = useRef<HTMLElement | null>(null);
  const [relatedPropertiesReached, setRelatedPropertiesReached] = useState(false);
  const RELATED_ITEMS_PER_PAGE = 4;

  // Reset page-level UI whenever the listing changes
  useEffect(() => {
    setShowAllSpecifications(false);
    setShowAllSpecialNotes(false);
    setDescriptionExpanded(false);
    setActiveFeatureModal(null);
    setSelectedMediaIndex(null);
    setGalleryView("grid");
    setIsGalleryOpen(false);
  }, [slug, property?.id]);

  useEffect(() => {
    if (slug) void fetchPropertyBySlug(slug);
  }, [slug, fetchPropertyBySlug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Arrow-key navigation in the full-screen viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen || galleryView !== "viewer" || selectedMediaIndex === null) return;
      if (e.key === "ArrowRight") {
        setSelectedMediaIndex((index) =>
          index === null ? null : Math.min(index + 1, galleryItems.length - 1),
        );
      } else if (e.key === "ArrowLeft") {
        setSelectedMediaIndex((index) =>
          index === null ? null : Math.max(index - 1, 0),
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryItems.length, galleryView, isGalleryOpen, selectedMediaIndex]);

  useEffect(() => {
    document.body.style.overflow =
      isInspectionModalOpen || isPaymentModalOpen || isInquiryModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isInspectionModalOpen, isPaymentModalOpen, isInquiryModalOpen]);

  const totalRelatedPages = Math.ceil(totalRelatedProperties / RELATED_ITEMS_PER_PAGE);

  useEffect(() => {
    if (property) {
      const limit = showAllRelated ? 100 : RELATED_ITEMS_PER_PAGE;
      const page = showAllRelated ? 1 : relatedPage;
      fetchRelatedProperties(property, sameAgentOnly, page, limit);
    }
  }, [property, sameAgentOnly, relatedPage, showAllRelated, fetchRelatedProperties]);

  useEffect(() => {
    setRelatedPage(1);
    setShowAllRelated(false);
  }, [sameAgentOnly, property?.id]);

  useEffect(() => {
    const updateRelatedPropertiesPosition = () => {
      const relatedSection = relatedPropertiesRef.current;
      if (relatedSection) {
        setRelatedPropertiesReached(
          relatedSection.getBoundingClientRect().top <= window.innerHeight,
        );
      }
    };

    updateRelatedPropertiesPosition();
    window.addEventListener("scroll", updateRelatedPropertiesPosition, { passive: true });
    window.addEventListener("resize", updateRelatedPropertiesPosition);
    return () => {
      window.removeEventListener("scroll", updateRelatedPropertiesPosition);
      window.removeEventListener("resize", updateRelatedPropertiesPosition);
    };
  }, [property, showDetailsSkeleton]);

  const coverImage = property?.img || property?.images?.[0] || "";
  const cleanDescription = property
    ? stripHtmlTags(property.description).slice(0, 160)
    : "View property details on RewaCiti.";

  const canPay = !!forms?.features.onlinePayments;
  const placeAvailable = !!property && property.places.left > 0;
  // RewaCiti's own listings have no agent to report
  const canReport = !!property?.agentId && !!forms?.features.requests.includes("report");
  const renderMobileBookingBar = () => {
    if (!property) return null;

    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
            ₦{formatCurrency(price)}
            {property.duration && (
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {" "}
                / {property.duration}
              </span>
            )}
          </p>
          {property.visitationfee ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visit fee ₦{formatCurrency(property.visitationfee)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInquiryModalOpen(true)}
            aria-label="Ask a question"
            className="shrink-0 cursor-pointer rounded-lg border border-gray-300 p-3 text-gray-900 dark:border-white/20 dark:text-white"
          >
            <FiMail size={18} />
          </button>
          <button
            type="button"
            onClick={openInspection}
            className="min-w-0 flex-1 cursor-pointer rounded-lg bg-[#703BF7] px-3 py-3 text-sm font-semibold text-white hover:bg-[#5c2fe0] sm:flex-none sm:px-5"
          >
            Book a visit
          </button>
          {canPay && (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={!placeAvailable}
              className="min-w-0 flex-1 cursor-pointer rounded-lg border border-gray-900 px-3 py-3 text-sm font-semibold text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:text-white sm:flex-none sm:px-4"
            >
              {placeAvailable ? "Pay" : "Reserved"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const hasAmenities =
    (property?.keyFeatures?.length ?? 0) > 0 ||
    (property?.additionalFeatures?.length ?? 0) > 0;
  const hasBills =
    (property?.billsAndCharges?.length ?? 0) > 0 ||
    (property?.additionalBillsAndCharges?.length ?? 0) > 0;
  const hasRules =
    (property?.rules?.length ?? 0) > 0 || (property?.additionalRules?.length ?? 0) > 0;

  const openViewer = (index: number) => {
    setSelectedMediaIndex(index);
    setGalleryView("viewer");
    setIsGalleryOpen(true);
  };

  const openInspection = () => setIsInspectionModalOpen(true);

  return (
    <div className="bg-gray-300 dark:bg-black/30">
      <Helmet>
        <title>
          {property ? `${property.name} | RewaCiti` : "Property Details | RewaCiti"}
        </title>
        <meta
          name="description"
          content={
            property
              ? `Explore ${property.name} with details on location, pricing, amenities, and contact support from RewaCiti.`
              : "View property details on RewaCiti."
          }
        />
        <meta
          property="og:title"
          content={property ? `${property.name} | RewaCiti` : "Property Details | RewaCiti"}
        />
        <meta property="og:description" content={cleanDescription} />
        <meta property="og:type" content="website" />
        {coverImage && <meta property="og:image" content={coverImage} />}
        {coverImage && <meta name="twitter:card" content="summary_large_image" />}
        {coverImage && <meta name="twitter:image" content={coverImage} />}
        {coverImage && <meta name="twitter:title" content={property?.name} />}
        {coverImage && <meta name="twitter:description" content={cleanDescription} />}
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      <Navbar />

      {showDetailsSkeleton ? (
        <PropertyDetailsSkeleton />
      ) : !property ? (
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Property Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              The property you're looking for is no longer available, or your
              connection is poor. Explore other properties or check your
              internet connection.
            </p>
            <Link to="/Properties">
              <button className="cursor-pointer rounded-lg bg-[#703BF7] px-4 py-2 text-sm text-white hover:bg-[#5c2fe0]">
                Browse Properties
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Modals */}
          <BookInspectionModal
            property={property}
            open={isInspectionModalOpen}
            onOpenChange={setIsInspectionModalOpen}
          />
          <PropertyPaymentModal
            property={property}
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            onPaymentSuccess={(userData) => {
              // A deal can be rated once a payment on it is confirmed
              if (!forms?.features.ratings) return;
              setPaymentUserData(userData);
              setIsRatingModalOpen(true);
            }}
          />
          <ServiceRatingModal
            property={property}
            open={isRatingModalOpen}
            onOpenChange={setIsRatingModalOpen}
            userData={paymentUserData}
          />
          <ReportAgentModal
            property={property}
            open={isReportModalOpen}
            onOpenChange={setIsReportModalOpen}
          />
          <InquiryModal
            property={property}
            open={isInquiryModalOpen}
            onOpenChange={setIsInquiryModalOpen}
          />

          <div className="bg-gray-200 dark:bg-black/50">
          {/* Title, location, and actions */}
          <div className={PAGE_CONTAINER}>
            <Link
              to="/Properties"
              className="mt-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <FiChevronLeft /> All properties
            </Link>
            <div className="flex items-start justify-between gap-4 pb-5 pt-3 sm:pt-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                    {property.category}
                  </span>
                  {property.listingType && (
                    <span className="inline-flex rounded-full bg-[#703BF7]/10 px-3 py-1 text-xs font-semibold text-[#703BF7] dark:bg-[#703BF7]/20 dark:text-[#b69bff]">
                      {property.listingType}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                  {property.name}
                </h1>
                <a
                  href={
                    property.geo_location.lat !== 0 && property.geo_location.lng !== 0
                      ? `https://www.google.com/maps/search/?api=1&query=${property.geo_location.lat},${property.geo_location.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText(addressOf(property), property.location.nearby))}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-start gap-2 text-sm text-gray-700 underline-offset-2 hover:underline dark:text-gray-300"
                >
                  <FiMapPin className="mt-0.5 shrink-0" />
                  <span>{locationText(addressOf(property), property.location.nearby)}</span>
                </a>
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={handleShare} className={GHOST_BTN}>
                  <FiShare2 size={16} />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button type="button" onClick={handleShortlist} className={GHOST_BTN}>
                  <FiHeart
                    size={16}
                    className={isShortlisted ? "fill-current text-[#703BF7]" : ""}
                  />
                  <span className="hidden sm:inline">{isShortlisted ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Photo mosaic */}
          <section className={PAGE_CONTAINER}>
            <div className="relative overflow-hidden rounded-3xl sm:rounded-[28px]">
              {/* Mobile: one hero photo */}
              <button
                type="button"
                onClick={() => openViewer(0)}
                aria-label="View property photos"
                className="block aspect-4/3 w-full bg-gray-200 dark:bg-[#1A1A1A] sm:hidden"
              >
                {images[0] && (
                  <img
                    src={images[0]}
                    alt="Property photo 1"
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </button>

              {/* Desktop: mosaic */}
              <div className="hidden h-[360px] grid-cols-4 grid-rows-2 gap-2 sm:grid lg:h-[440px]">
                {tiles.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => openViewer(index)}
                    aria-label={`View property photo ${index + 1}`}
                    className={`group relative min-h-0 overflow-hidden bg-gray-200 dark:bg-[#1A1A1A] ${tileClass(index, tiles.length)}`}
                  >
                    <img
                      src={image}
                      alt={`Property photo ${index + 1}`}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 group-hover:brightness-90"
                    />
                  </button>
                ))}
                {images.length === 0 && (
                  <div className="col-span-4 row-span-2 flex items-center justify-center bg-gray-200 text-sm text-gray-500 dark:bg-[#1A1A1A] dark:text-gray-400">
                    Photos are not available for this property.
                  </div>
                )}
              </div>

              {galleryItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setGalleryView("grid");
                    setSelectedMediaIndex(null);
                    setIsGalleryOpen(true);
                  }}
                  className="absolute bottom-4 right-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100 dark:border-gray-600/30 dark:bg-[#1A1A1A] dark:text-white dark:hover:bg-[#262626]"
                >
                  <FiGrid size={14} />
                  Show all photos{property.videoUrl ? " & video" : ""}
                </button>
              )}
            </div>
          </section>
          </div>

          {/* Full-screen gallery */}
          <Dialog.Root
            open={isGalleryOpen}
            onOpenChange={(open) => {
              setIsGalleryOpen(open);
              if (!open) {
                setSelectedMediaIndex(null);
                setGalleryView("grid");
              }
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-white dark:bg-[#101010]" />
              <Dialog.Content className="fixed inset-0 z-50 overflow-y-auto bg-white text-gray-900 outline-none dark:bg-[#101010] dark:text-white">
                <Dialog.Title className="sr-only">
                  Photos and video of {property.name}
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Browse all property photos and play the property video. Use
                  the arrow keys to navigate in full-screen view.
                </Dialog.Description>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-600/30 dark:bg-[#101010]/95 sm:px-8">
                  {galleryView === "viewer" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryView("grid");
                        setSelectedMediaIndex(null);
                      }}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <FiChevronLeft size={18} />
                      {property.videoUrl ? "All photos & video" : "All photos"}
                    </button>
                  ) : (
                    <p className="text-sm font-semibold">
                      {galleryItems.length} {property.videoUrl ? "photos and video" : "photos"}
                    </p>
                  )}
                  {galleryView === "viewer" && selectedMediaIndex !== null && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedMediaIndex + 1} / {galleryItems.length}
                    </span>
                  )}
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close gallery"
                      className="cursor-pointer rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <FiX size={22} />
                    </button>
                  </Dialog.Close>
                </div>

                {galleryView === "grid" ? (
                  <div className="mx-auto grid max-w-6xl grid-cols-1 gap-2 px-4 py-6 sm:grid-cols-2 sm:px-8 md:grid-cols-3">
                    {galleryItems.map((item, index) => (
                      <button
                        type="button"
                        key={`${item.kind}-${item.src}`}
                        onClick={() => {
                          setSelectedMediaIndex(index);
                          setGalleryView("viewer");
                        }}
                        className="group relative aspect-4/3 cursor-pointer overflow-hidden rounded-lg bg-gray-100 text-left dark:bg-white/5"
                      >
                        {item.kind === "image" ? (
                          <img
                            src={item.src}
                            alt={item.label}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition duration-300 group-hover:brightness-90"
                          />
                        ) : (
                          <>
                            <img
                              src={item.poster}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white">
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-gray-900">
                                <FiPlay size={20} fill="currentColor" />
                              </span>
                              <span className="text-sm font-semibold">Property video</span>
                            </span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                ) : selectedMediaIndex !== null ? (
                  <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8 sm:px-16">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMediaIndex((index) =>
                          index === null ? null : Math.max(index - 1, 0),
                        )
                      }
                      disabled={selectedMediaIndex === 0}
                      aria-label="Previous gallery item"
                      className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 cursor-pointer rounded-full border border-gray-300 bg-white p-2 shadow-md hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#1A1A1A] dark:hover:bg-white/10 sm:p-3"
                    >
                      <FiChevronLeft size={22} />
                    </button>
                    <div className="flex max-h-[calc(100vh-110px)] w-full max-w-5xl items-center justify-center">
                      {galleryItems[selectedMediaIndex].kind === "image" ? (
                        <img
                          src={galleryItems[selectedMediaIndex].src}
                          alt={galleryItems[selectedMediaIndex].label}
                          className="max-h-[calc(100vh-120px)] max-w-full rounded-lg object-contain"
                        />
                      ) : youtubeEmbedUrl(galleryItems[selectedMediaIndex].src) ? (
                        <iframe
                          src={youtubeEmbedUrl(galleryItems[selectedMediaIndex].src)!}
                          title={galleryItems[selectedMediaIndex].label}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                          allowFullScreen
                          className="aspect-video w-full rounded-lg"
                        />
                      ) : (
                        <video
                          key={galleryItems[selectedMediaIndex].src}
                          src={galleryItems[selectedMediaIndex].src}
                          poster={galleryItems[selectedMediaIndex].poster}
                          controls
                          autoPlay
                          playsInline
                          className="max-h-[calc(100vh-120px)] max-w-full rounded-lg"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMediaIndex((index) =>
                          index === null ? null : Math.min(index + 1, galleryItems.length - 1),
                        )
                      }
                      disabled={selectedMediaIndex === galleryItems.length - 1}
                      aria-label="Next gallery item"
                      className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 cursor-pointer rounded-full border border-gray-300 bg-white p-2 shadow-md hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#1A1A1A] dark:hover:bg-white/10 sm:p-3"
                    >
                      <FiChevronRight size={22} />
                    </button>
                  </div>
                ) : null}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Main two-column layout */}
          <section
            className={`${PAGE_CONTAINER} grid grid-cols-1 gap-x-16 pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-10 xl:gap-x-24`}
          >
            {/* LEFT COLUMN */}
            <div className="min-w-0">
              {/* Overview */}
              <div className={SECTION}>
                <h2 className={`${H2} font-serif`}>
                  {property.category} in {property.location.city}
                </h2>
                {(hasBedrooms || hasBathrooms) && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-700 dark:text-gray-400">
                    {hasBedrooms && (
                      <span className="inline-flex items-center gap-2">
                        <BedDouble size={18} aria-hidden="true" />
                        {property.bedrooms} bedroom{property.bedrooms === 1 ? "" : "s"}
                      </span>
                    )}
                    {hasBathrooms && (
                      <span className="inline-flex items-center gap-2">
                        <Bath size={18} aria-hidden="true" />
                        {property.bathrooms} bathroom{property.bathrooms === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* About */}
              {descriptionText && (
                <div className={SECTION}>
                  <h2 className={`${H2} mb-4 font-serif`}>About this place</h2>
                  <p
                    className={`text-base leading-7 text-gray-800 dark:text-gray-300 ${
                      descriptionExpanded ? "" : "line-clamp-4"
                    }`}
                  >
                    {descriptionText}
                  </p>
                  {descriptionText.length > 280 && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded((v) => !v)}
                      className="mt-3 cursor-pointer text-base font-semibold text-gray-900 underline underline-offset-2 dark:text-white"
                    >
                      {descriptionExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}

              {/* Specifications */}
              {property.specifications && property.specifications.length > 0 && (
                <div className={SECTION}>
                  <h2 className={`${H2} mb-5`}>Details</h2>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    {property.specifications
                      .slice(0, showAllSpecifications ? undefined : 6)
                      .map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-baseline justify-between gap-4 border-b border-gray-600/50 pb-3 dark:border-gray-600/50"
                        >
                          <dt className="text-sm text-gray-600 dark:text-gray-400">{spec.label}</dt>
                          <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                  {property.specifications.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSpecifications((v) => !v)}
                      className={`${OUTLINE_BTN} mt-6 cursor-pointer`}
                    >
                      {showAllSpecifications
                        ? "Show less"
                        : `Show all ${property.specifications.length} details`}
                    </button>
                  )}
                </div>
              )}

              {/* Things to know */}
              {property.specialNotes && property.specialNotes.length > 0 && (
                <div className={SECTION}>
                  <h2 className={`${H2} mb-4`}>Things to know</h2>
                  <ul className="space-y-2">
                    {property.specialNotes
                      .slice(0, showAllSpecialNotes ? undefined : 3)
                      .map((note, index) => (
                        <PropertyFeatureItem
                          key={`${note}-${index}`}
                          label={note}
                          icon={Zap}
                          highlighted
                        />
                      ))}
                  </ul>
                  {property.specialNotes.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSpecialNotes((v) => !v)}
                      className="mt-4 cursor-pointer text-base font-semibold text-gray-900 underline underline-offset-2 dark:text-white"
                    >
                      {showAllSpecialNotes
                        ? "Show less"
                        : `Show all ${property.specialNotes.length}`}
                    </button>
                  )}
                </div>
              )}

              {/* Amenities */}
              {hasAmenities && (
                <div className={SECTION}>
                  <FeatureSection
                    title="What this place offers"
                    items={property.keyFeatures}
                    extraItems={property.additionalFeatures}
                    limit={6}
                    noun="amenities"
                    onShowAll={() => setActiveFeatureModal("amenities")}
                  />
                </div>
              )}

              {/* Rules first, followed by bills and fees. Each list opens its full modal after four items. */}
              {(hasBills || hasRules) && (
                <div className={SECTION}>
                  <h2 className={`${H2} mb-6`}>Before you book</h2>
                  <div className="flex flex-col">
                    {hasRules && (
                      <FeatureSection
                        title="House rules"
                        items={property.rules}
                        extraItems={property.additionalRules}
                        limit={4}
                        noun="rules"
                        variant="rule"
                        onShowAll={() => setActiveFeatureModal("rules")}
                      />
                    )}
                    {hasBills && (
                      <FeatureSection
                        title="Bills & fees"
                        items={property.billsAndCharges}
                        extraItems={property.additionalBillsAndCharges}
                        limit={4}
                        noun="bills & fees"
                        variant="bill"
                        onShowAll={() => setActiveFeatureModal("bills")}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Keep Leaflet's high-z-index panes below dialogs and modals. */}
              {property.geo_location.lat !== 0 && property.geo_location.lng !== 0 && (
                <div className={`${SECTION} -mb-6 pb-0 sm:mb-0 sm:pb-8`}>
                  <h2 className={`${H2} mb-2`}>Where it is</h2>
                  <p className="mb-5 text-sm text-gray-700 dark:text-gray-400">
                    {locationText(addressOf(property), property.location.nearby)}
                  </p>
                  <div className="relative z-0 isolate overflow-hidden rounded-xl">
                    <PropertyMap
                      properties={[property]}
                      heightClassName="h-[280px] sm:h-[400px]"
                    />
                  </div>
                </div>
              )}

              {canReport && (
                <div className="py-6">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-red-600 dark:text-white"
                  >
                    <FiFlag size={14} /> Report this listing
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: sticky booking card (desktop only) */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 pt-8">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] dark:border-gray-600/30 dark:bg-[#1A1A1A]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[26px] font-semibold text-gray-900 dark:text-white">
                      ₦{formatCurrency(price)}
                    </span>
                    {property.duration && (
                      <span className="text-base text-gray-600 dark:text-gray-400">
                        / {property.duration}
                      </span>
                    )}
                  </div>

                  {property.visitationfee ? (
                    <div className="mt-5 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600/30">
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Visit fee</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₦{formatCurrency(property.visitationfee)}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={openInspection}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#703BF7] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#5c2fe0]"
                    >
                      <FiCalendar size={18} /> Book a visit
                    </button>
                    {canPay && (
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={!placeAvailable}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-900 px-4 py-3.5 text-base font-semibold text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:text-white dark:hover:bg-white/10"
                      >
                        <FiCreditCard size={18} />
                        {placeAvailable ? "Pay for this property" : "Reserved"}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(true)}
                    className="mx-auto mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-900 underline underline-offset-2 dark:text-white"
                  >
                    <FiMail size={14} /> Ask a question
                  </button>
                </div>
              </div>
            </aside>
          </section>

          {/* Amenities / rules / bills modal */}
          <Dialog.Root
            open={activeFeatureModal !== null}
            onOpenChange={(open) => {
              if (!open) setActiveFeatureModal(null);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay-animate fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content className="property-dialog-content responsive-sheet-animate fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-600/30 dark:bg-[#1A1A1A] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
                <div className="property-dialog-header flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-600/30">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close"
                      className="cursor-pointer rounded-full p-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                      <FiX size={18} />
                    </button>
                  </Dialog.Close>
                  <Dialog.Title className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-900 dark:text-white">
                    {activeFeatureModal === "amenities"
                      ? "What this place offers"
                      : activeFeatureModal === "rules"
                        ? "House rules"
                        : "Bills & fees"}
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Full list of details for {property.name}.
                  </Dialog.Description>
                  <span className="w-9" />
                </div>

                <div className="overflow-y-auto px-6 py-6">
                  {activeFeatureModal === "amenities" && (
                    <div className="space-y-8">
                      {(property.keyFeatures?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                            Main amenities
                          </h3>
                          <ul>
                            {property.keyFeatures.map((f, i) => (
                              <PropertyFeatureItem key={`${f}-${i}`} label={f} showIcon divided />
                            ))}
                          </ul>
                        </div>
                      )}
                      {(property.additionalFeatures?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                            Additional features
                          </h3>
                          <ul>
                            {property.additionalFeatures!.map((f, i) => (
                              <PropertyFeatureItem key={`${f}-${i}`} label={f} divided />
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {activeFeatureModal === "rules" && (
                    <div className="space-y-8">
                      {(property.rules?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                            During your stay
                          </h3>
                          <ul>
                            {property.rules!.map((r, i) => (
                              <PropertyFeatureItem
                                key={`${r}-${i}`}
                                label={r}
                                variant="rule"
                                showIcon
                                divided
                              />
                            ))}
                          </ul>
                        </div>
                      )}
                      {(property.additionalRules?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                            Additional rules
                          </h3>
                          <ul>
                            {property.additionalRules!.map((r, i) => (
                              <PropertyFeatureItem
                                key={`${r}-${i}`}
                                label={r}
                                variant="rule"
                                divided
                              />
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {activeFeatureModal === "bills" && (
                    <div className="space-y-8">
                      {(property.billsAndCharges?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                            Bills &amp; fees
                          </h3>
                          <ul>
                            {property.billsAndCharges!.map((c, i) => (
                              <PropertyFeatureItem
                                key={`${c}-${i}`}
                                label={c}
                                variant="bill"
                                showIcon
                                divided
                              />
                            ))}
                          </ul>
                        </div>
                      )}
                      {(property.additionalBillsAndCharges?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                            Additional bills &amp; fees
                          </h3>
                          <ul>
                            {property.additionalBillsAndCharges!.map((c, i) => (
                              <PropertyFeatureItem
                                key={`${c}-${i}`}
                                label={c}
                                variant="bill"
                                divided
                              />
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Related properties */}
          {property && !showDetailsSkeleton && (
            <>
              <div
                className={`border-t border-gray-200 bg-white dark:border-gray-600/30 dark:bg-[#1A1A1A] lg:hidden ${
                  relatedPropertiesReached ? "" : "invisible"
                }`}
              >
                {renderMobileBookingBar()}
              </div>
              {!relatedPropertiesReached && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white dark:border-gray-600/30 dark:bg-[#1A1A1A] lg:hidden">
                  {renderMobileBookingBar()}
                </div>
              )}
            </>
          )}

          <section
            ref={relatedPropertiesRef}
            className="bg-gray-200 dark:bg-black/50"
          >
            <div className={`${PAGE_CONTAINER} border-t border-gray-600/50 py-10 dark:border-gray-600/50`}>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-semibold text-gray-900 dark:text-white">
                  Related properties
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {sameAgentOnly
                    ? `Other listings posted by the same agent as ${property.name}.`
                    : `Similar ${property.category}s in ${property.location.city}.`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {/* RewaCiti's own listings have no agent */}
                {property.agentId && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-300">
                    Same agent
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sameAgentOnly}
                      onClick={() => setSameAgentOnly((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${sameAgentOnly ? "bg-[#703BF7]" : "bg-gray-300 dark:bg-gray-600"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${sameAgentOnly ? "translate-x-5" : "translate-x-0.5"}`}
                      />
                    </button>
                  </label>
                )}
                {(totalRelatedProperties > RELATED_ITEMS_PER_PAGE || showAllRelated) && (
                  <button
                    onClick={() => setShowAllRelated(!showAllRelated)}
                    className={`${OUTLINE_BTN} hidden cursor-pointer md:block`}
                  >
                    {showAllRelated ? "Show less" : "Show all"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {relatedPropertiesLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <PropertyCardSkeleton key={index} />
                  ))
                : relatedProperties.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>

            {!relatedPropertiesLoading &&
              (totalRelatedProperties > RELATED_ITEMS_PER_PAGE || showAllRelated) && (
                <div className="mt-8 flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {showAllRelated
                      ? "All properties"
                      : `${relatedPage} of ${totalRelatedPages || 1}`}
                  </p>

                  <button
                    onClick={() => setShowAllRelated(!showAllRelated)}
                    className={`${OUTLINE_BTN} cursor-pointer md:hidden`}
                  >
                    {showAllRelated ? "Show less" : "Show all"}
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => relatedPage > 1 && setRelatedPage((p) => p - 1)}
                      disabled={showAllRelated || relatedPage === 1}
                      aria-label="Previous page"
                      className="cursor-pointer rounded-full border border-gray-300 p-2.5 text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:text-white dark:hover:border-white"
                    >
                      <FiArrowLeft size={18} />
                    </button>
                    <button
                      onClick={() =>
                        relatedPage < totalRelatedPages && setRelatedPage((p) => p + 1)
                      }
                      disabled={showAllRelated || relatedPage >= totalRelatedPages}
                      aria-label="Next page"
                      className="cursor-pointer rounded-full border border-gray-300 p-2.5 text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:text-white dark:hover:border-white"
                    >
                      <FiArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

            {!relatedPropertiesLoading && relatedProperties.length === 0 && (
              <p className="text-gray-500">
                {sameAgentOnly
                  ? "No properties from this agent were found."
                  : "No related properties found at the moment."}
              </p>
            )}
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}

export default PropertyDetails;