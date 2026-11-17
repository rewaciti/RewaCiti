import { useRef, useState } from "react";
import type { Property } from "../../../types";
import { useNavigate } from "react-router";
import { FaStar, FaHome } from "react-icons/fa";
import {
  FiHeart,
  FiShare2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { LuBedDouble, LuBath, LuUsers, LuMapPin } from "react-icons/lu";
import { formatCurrency } from "../../../shared/lib/utils";
import { usePropertyStore } from "../store/usePropertyStore";
import { addressOf, pricePeriodLabel } from "../services/toProperty";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/useAuthStore";

interface PropertyCardProps {
  property: Property;
  /** Force the "Featured" pill on or off. If left out, it shows when the property is in the store's featured list. */
  featured?: boolean;
}

const DOTS_PER_GROUP = 4;
const DOT_SIZE = 6;
const DOT_GAP = 6;
const SWIPE_THRESHOLD = 40;

/** Colour of the purpose pill ("For rent", "For sale"...), same mapping as your old card. */
function listingPillClass(type: string): string {
  if (/sale/i.test(type)) return "bg-emerald-500";
  if (/short-?let/i.test(type)) return "bg-rose-500";
  if (/rent/i.test(type)) return "bg-[#703BF7]";
  if (/lease/i.test(type)) return "bg-amber-500";
  if (/invest/i.test(type)) return "bg-sky-500";
  return "bg-black/60";
}

/**
 * Turns `property.sharing` into text like "Shared room".
 * Check the values of SharingType in ./realEstate and adjust if they read oddly.
 */
function sharingLabel(sharing?: string): string {
  const t = (sharing ?? "").replace(/[_-]+/g, " ").trim().toLowerCase();
  if (t === "shared room") return "Shared room";
  if (t === "shared apartment") return "Shared apartment";
  return "";
}

// Strip HTML tags, then word-limit, so raw <p>…</p> from the API never shows
function truncateWords(text: string, limit: number): string {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = plain.split(" ");
  return words.length <= limit ? plain : `${words.slice(0, limit).join(" ")}...`;
}

function PropertyCard({ property, featured }: PropertyCardProps) {
  const { toggleShortlist, shortlistedProperties, featuredProperties } =
    usePropertyStore();
  const navigate = useNavigate();
  const propertySlug = property.slug;

  const isShortlisted = shortlistedProperties.some((p) => p.id === property.id);
  const isFeatured =
    featured ?? featuredProperties.some((p) => p.id === property.id);

  // Support either a property.images[] array or fall back to the single property.img
  const images: string[] =
    property.images?.length > 0 ? property.images : [property.img];

  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  const windowSize = Math.min(DOTS_PER_GROUP, images.length);
  const windowStart = Math.max(
    0,
    Math.min(
      currentIndex - Math.floor(windowSize / 2),
      images.length - windowSize,
    ),
  );

  const isFirstImage = currentIndex === 0;
  const isLastImage = currentIndex === images.length - 1;

  const goToIndex = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)));
  };

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    stop(e);
    goToIndex(currentIndex - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    stop(e);
    goToIndex(currentIndex + 1);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    stop(e);
    goToIndex(index);
  };

  // --- Touch / swipe support for mobile ---
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isSwipingRef = useRef(false);
  const justSwipedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;

    if (isSwipingRef.current && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
      justSwipedRef.current = true;
      goToIndex(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
    }
    isSwipingRef.current = false;
  };

  const handleCardClick = () => {
    if (justSwipedRef.current) {
      justSwipedRef.current = false;
      return;
    }
    navigate(`/properties/${propertySlug}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    stop(e);
    const url = `${window.location.origin}/properties/${propertySlug}`;
    const address = addressOf(property);
    const coverImageUrl = property.img || images?.[0] || "";
    const shareText = [
      property.name,
      address,
      `Price: ₦${formatCurrency(property.pricing.total)}${pricePeriodLabel(property.pricePeriod) ? ` ${pricePeriodLabel(property.pricePeriod)}` : ""}`,
      `Category: ${property.category}\nURL: ${url}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (navigator.share) {
      try {
        const shareData = { title: property.name, text: shareText };

        // Attach the cover image so the native share sheet shows a preview.
        if (coverImageUrl && typeof File !== "undefined") {
          try {
            const response = await fetch(coverImageUrl);
            const blob = await response.blob();
            if (blob.size) {
              const shareFile = new File(
                [blob],
                `${propertySlug || property.name}.jpg`,
                { type: blob.type || "image/jpeg" },
              );
              if (
                !navigator.canShare ||
                navigator.canShare({ files: [shareFile] })
              ) {
                await navigator.share({ ...shareData, files: [shareFile] });
                return;
              }
            }
          } catch (imageError) {
            console.error("Error preparing share image:", imageError);
          }
        }

        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleShortlist = async (e: React.MouseEvent) => {
    stop(e);

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast("Sign in to save properties", {
        duration: 5000,
        closeButton: false,
        action: { label: "Log in", onClick: () => navigate("/auth/login") },
      });
      return;
    }

    toast.success(
      isShortlisted ? "Removed from shortlist" : "Added to shortlist",
    );
    void toggleShortlist(property);
  };

  const periodLabel = pricePeriodLabel(property.pricePeriod);
  const { bedrooms, bathrooms } = property;
  const roomType = sharingLabel(property.sharing);
  const { total: placesTotal, left: placesLeft } = property.places;

  // Lists come without a description, so the nearest university or landmark stands in
  const blurb = property.description
    ? truncateWords(property.description, 7)
    : property.location.nearby
      ? `Near ${property.location.nearby}`
      : "";

  const { lat, lng } = property.geo_location;
  const mapsHref =
    lat !== 0 && lng !== 0
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOf(property))}`;

  const circleBase =
    "w-9 h-9 flex items-center justify-center rounded-full shadow-md transition hover:scale-105 cursor-pointer";
  const circleIdle =
    "bg-white text-gray-800 hover:bg-[#703BF7] hover:text-white";
  const arrowBtn =
    "absolute z-10 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md opacity-0 transition hover:bg-[#703BF7] hover:text-white hover:scale-105 cursor-pointer max-sm:!opacity-0";
  const pill =
    "text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full shadow";

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`View ${property.name}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) handleCardClick();
      }}
      className="bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30 text-gray-900 dark:text-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer animate-fade-in-up focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#703BF7]"
    >
      {/* Image carousel, edge to edge */}
      <div
        className="relative group overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out touch-pan-y"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${property.name} ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full aspect-4/3 object-cover shrink-0 bg-gray-200 dark:bg-neutral-800"
              draggable={false}
            />
          ))}
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 bg-black/5" />
        {/* Top-left pills */}
        <div className="absolute z-10 top-3 left-3 right-24 flex flex-wrap items-center gap-2 pointer-events-none">
          {property.listingType && (
            <span className={`${pill} text-white ${listingPillClass(property.listingType)}`}>
              {property.listingType}
            </span>
          )}
          {isFeatured && (
            <span className={`${pill} flex items-center gap-1.5 bg-white text-gray-900`}>
              <FaStar className="text-amber-500" size={13} />
              Featured
            </span>
          )}
          {property.reserved && (
            <span className={`${pill} bg-amber-500 text-white`}>Reserved</span>
          )}
        </div>

        {/* Top-right actions */}
        <div className="absolute z-10 top-3 right-3 flex gap-2">
          <button
            onClick={handleShare}
            title="Share property"
            aria-label="Share property"
            className={`${circleBase} ${circleIdle}`}
          >
            <FiShare2 size={16} />
          </button>
          <button
            onClick={handleShortlist}
            title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            aria-pressed={isShortlisted}
            className={`${circleBase} ${isShortlisted ? "bg-[#703BF7] text-white" : circleIdle}`}
          >
            <FiHeart size={18} className={isShortlisted ? "fill-current" : ""} />
          </button>
        </div>

        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              title="Previous image"
              aria-label="Previous image"
              aria-disabled={isFirstImage}
              className={`${arrowBtn} left-2 ${!isFirstImage ? "group-hover:opacity-100" : ""}`}
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextImage}
              title="Next image"
              aria-label="Next image"
              aria-disabled={isLastImage}
              className={`${arrowBtn} right-2 ${!isLastImage ? "group-hover:opacity-100" : ""}`}
            >
              <FiChevronRight size={16} />
            </button>

            <div
              className="absolute z-10 bottom-3 left-1/2 -translate-x-1/2 overflow-hidden"
              style={{
                width: `${windowSize * DOT_SIZE + (windowSize - 1) * DOT_GAP}px`,
              }}
            >
              <div
                className="flex items-center transition-transform duration-300 ease-out"
                style={{
                  gap: `${DOT_GAP}px`,
                  transform: `translateX(-${windowStart * (DOT_SIZE + DOT_GAP)}px)`,
                }}
              >
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleDotClick(idx, e)}
                    title={`Image ${idx + 1}`}
                    aria-label={`Image ${idx + 1}`}
                    className={`rounded-full shrink-0 transition-colors duration-300 cursor-pointer w-1.5 h-1.5 ${
                      idx === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="text-lg font-semibold leading-snug line-clamp-2">
          {property.name}
        </h3>

        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-center gap-2 w-fit text-sm text-gray-500 dark:text-gray-400 hover:text-[#703BF7] dark:hover:text-[#703BF7] transition-colors"
        >
          <LuMapPin size={18} className="shrink-0" />
          <span>{addressOf(property)}</span>
        </a>

        {blurb && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{blurb}</p>
        )}

        <div className="mt-auto pt-4">
          <div className="border-t border-purple-100 dark:border-gray-600/30 pt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
            {bedrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <LuBedDouble size={18} />
                {bedrooms} {bedrooms === 1 ? "bed" : "beds"}
              </span>
            )}
            {bathrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <LuBath size={18} />
                {bathrooms} {bathrooms === 1 ? "bath" : "baths"}
              </span>
            )}
            {roomType && (
              <span className="inline-flex items-center gap-1.5">
                <LuUsers size={18} />
                {roomType}
              </span>
            )}
            {placesTotal > 1 &&
              (placesLeft > 0 ? (
                <span className="font-semibold text-[#703BF7]">{placesLeft} left</span>
              ) : (
                <span className="font-semibold text-rose-500">Fully booked</span>
              ))}
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <p className="min-w-0 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              ₦{formatCurrency(property.pricing.total)}
              {periodLabel && (
                <span className="ml-1 text-sm font-semibold">{periodLabel}</span>
              )}
            </p>
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-[#d6c6ff] bg-[#eee8ff] px-3 py-1.5 text-sm font-semibold text-[#5423c5] dark:border-[#703BF7]/40 dark:bg-[#703BF7]/15 dark:text-[#d4c2ff]">
              <FaHome />
              {property.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;