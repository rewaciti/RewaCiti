import { useRef, useState } from "react";
import type { Property } from "../../../types";
import { NavLink } from "react-router";
import { FaBed, FaBath, FaHome } from "react-icons/fa";
import { FiMapPin, FiHeart, FiShare2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { formatCurrency } from "../../../shared/lib/utils";
import { usePropertyStore } from "../store/usePropertyStore";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/useAuthStore";

interface PropertyCardProps {
  property: Property;
}

const DOTS_PER_GROUP = 4;
const DOT_SIZE = 6;
const DOT_GAP = 6;
const SWIPE_THRESHOLD = 40;

function PropertyCard({ property }: PropertyCardProps) {
  const { toggleShortlist, shortlistedProperties } = usePropertyStore();
  const propertySlug = property.slug;

  const isShortlisted = shortlistedProperties.some((p) => p.id === property.id);
  const navigate = useNavigate();

  // Support either a property.images[] array or fall back to the single property.img
  const images: string[] =
    Array.isArray((property as Property).images) && (property as Property).images.length > 0
      ? (property as Property).images
      : [property.img];

  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultipleImages = images.length > 1;

  // Sliding window of dots: always shows at most DOTS_PER_GROUP dots,
  // and the window shifts by one as currentIndex moves past its edges,
  // instead of jumping in fixed blocks of 4.
  const windowSize = Math.min(DOTS_PER_GROUP, images.length);
  const windowStart = Math.max(
    0,
    Math.min(
      currentIndex - Math.floor(windowSize / 2),
      images.length - windowSize
    )
  );

  const isFirstImage = currentIndex === 0;
  const isLastImage = currentIndex === images.length - 1;

  const goToIndex = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToIndex(currentIndex - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToIndex(currentIndex + 1);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    // Only treat as a swipe once horizontal movement clearly dominates,
    // so vertical page-scrolling on mobile still works normally.
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
      justSwipedRef.current = true; // stops the click that follows from navigating
      if (deltaX < 0) {
        goToIndex(currentIndex + 1); // swiped left -> next image
      } else {
        goToIndex(currentIndex - 1); // swiped right -> previous image
      }
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
    e.preventDefault();
    e.stopPropagation();
    const description = property.description
    const url = `${window.location.origin}/properties/${propertySlug}`;
    const address = `${property.location.area}, ${property.location.city_town}, ${property.location.state} state.`;
    const shareText = `${description}\n\nName: ${property.name}\nAddress: ${address}\nCategory: ${property.category}\nURL: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: shareText,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleShortlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast.error("Please log in to access your wishlist.");
      return;
    }

    toast.success(isShortlisted ? "Removed from shortlist" : "Added to shortlist");
    void toggleShortlist(property);
  };

  // Word limiter — always ends with "..." when truncated, no expand/collapse
  function truncateWords(text: string, limit: number): string {
    const words = text.split(" ");
    return words.length <= limit ? text : `${words.slice(0, limit).join(" ")}...`;
  }

  const price = property?.pricing.TotalCost ?? 0;

  const hasBedrooms = property.bedrooms !== undefined && property.bedrooms !== 0;
  const hasBathrooms = !!property.bathrooms && property.bathrooms !== 0 && property.bathrooms !== "0";

  return (
    <div className="bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30 text-gray-900 dark:text-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg p-2 relative hover:cursor-pointer flex flex-col h-full animate-fade-in-up"
      onClick={handleCardClick}>
      {/* Image Container */}
      <div
        className="relative group overflow-hidden rounded-md mb-3"
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
              className="w-full h-44 object-cover shrink-0"
              draggable={false}
            />
          ))}
        </div>

        {/* Small transparent overlays*/}
        {hasMultipleImages && (
          <>
            <div
              className="absolute z-0 left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full max-sm:pointer-events-none"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <div
              className="absolute z-0 right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full max-sm:pointer-events-none"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </>
        )}

        {/* Prev / Next Arrows — desktop only (hover-revealed), hidden on touch
            screens where swiping is the primary way to browse images */}
        {hasMultipleImages && (
          <>
            {!isFirstImage && (
              <button
                onClick={handlePrevImage}
                title="Previous image"
                className="absolute z-10 left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 hover:bg-[#703BF7] hover:scale-110 cursor-pointer max-sm:hidden"
              >
                <FiChevronLeft size={13} />
              </button>
            )}
            {!isLastImage && (
              <button
                onClick={handleNextImage}
                title="Next image"
                className="absolute z-10 right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 hover:bg-[#703BF7] hover:scale-110 cursor-pointer max-sm:hidden"
              >
                <FiChevronRight size={13} />
              </button>
            )}

            {/* Dot pagination */}— 
            <div
              className="absolute z-10 bottom-2 left-1/2 -translate-x-1/2 overflow-hidden"
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
                    className={`rounded-full shrink-0 transition-colors duration-300 ease-in-out cursor-pointer w-1.5 h-1.5 ${
                      idx === currentIndex
                        ? "bg-white"
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute z-10 bottom-1 right-1 flex gap-1 transition-opacity duration-300">
          <button
            onClick={handleShortlist}
            title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            className={`p-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 cursor-pointer ${isShortlisted
              ? "bg-[#703BF7] text-white"
              : "bg-black/40 text-white hover:bg-[#703BF7]"
              }`}
          >
            <FiHeart size={16} className={isShortlisted ? "fill-current" : ""} />
          </button>
          <button
            onClick={handleShare}
            title="Share property"
            className="p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all hover:scale-110 hover:bg-[#703BF7] cursor-pointer"
          >
            <FiShare2 size={16} />
          </button>
        </div>
      </div>


      {/* Title */}
      <h3 className="text-base font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {property.name}
      </h3>

      {/* Location */}
      <a
        href={
          property.geo_location?.lat !== 0 && property.geo_location?.lat !== null &&
            property.geo_location?.lng !== 0 && property.geo_location?.lng !== null
            ? `https://www.google.com/maps/search/?api=1&query=${property.geo_location.lat},${property.geo_location.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [
                property.location.area,
                property.location.city_town || property.location.city,
                property.location.state,
              ].filter(Boolean).join(", ") + (property.location.state ? " state." : "")
            )}`
        }
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2 hover:text-[#703BF7]  dark:hover:text-[#703BF7] transition-colors w-fit"
        onClick={(e) => e.stopPropagation()}
      >
        <FiMapPin size={12} />
        {[
          property.location.area,
          property.location.city_town || property.location.city,
          property.location.state,
        ].filter(Boolean).join(", ") + (property.location.state ? " state." : "")}
      </a>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
        {truncateWords(property.description, 7)}
      </p>

      {/* Property Info */}
      <div className={`grid gap-2 mb-3 ${(hasBedrooms && hasBathrooms) ? 'grid-cols-2 xl:grid-cols-3' :
        (hasBedrooms || hasBathrooms) ? 'grid-cols-2' : 'grid-cols-1'
        }`}>
        {hasBedrooms && (
          <p
            className="border border-purple-100 dark:border-gray-600/30 bg-purple-50 dark:bg-transparent text-gray-700 dark:text-gray-300 rounded-2xl px-2 py-1 flex items-center justify-center gap-2 text-xs sm:text-sm transition"
          >
            <FaBed />
            {property.bedrooms}
          </p>
        )}

        {hasBathrooms && (
          <p
            className="border border-purple-100 dark:border-gray-600/30 bg-purple-50 dark:bg-transparent text-gray-700 dark:text-gray-300 rounded-2xl px-2 py-1 flex items-center justify-center gap-2 text-xs sm:text-sm transition"
          >
            <FaBath />
            {property.bathrooms}
          </p>
        )}

        <p
          className={`border border-purple-100 dark:border-gray-600/30 bg-purple-50 dark:bg-transparent text-gray-700 dark:text-gray-300 rounded-xl px-2 py-1 flex items-center justify-center gap-2 text-[11px] sm:text-xs transition ${(hasBedrooms && hasBathrooms) ? 'col-span-2 xl:col-span-1' : ''
            }`}
        >
          <FaHome />
          {property.category}
        </p>
      </div>

      {/* Price + Button */}
      <div className="flex justify-between items-end mt-auto pt-2">
        <div>
          {property.duration && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Price ({property.duration})
            </p>
          )}
          <span className="text-base font-bold text-[#703BF7]">
            ₦{formatCurrency(price)}
          </span>
        </div>

        <NavLink
          to={`/properties/${propertySlug}`}
          className="bg-[#703BF7] hover:bg-[#9677df] text-white px-3 py-1.5 rounded-md text-xs shadow hover:shadow-md transition"
        >
          View Property
        </NavLink>
      </div>
    </div>
  );
}

export default PropertyCard;