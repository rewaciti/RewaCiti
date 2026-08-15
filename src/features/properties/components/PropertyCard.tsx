import type { Property } from "../../../types";
import { NavLink } from "react-router";
import { FaBed, FaBath, FaHome } from "react-icons/fa";
import { FiMapPin, FiHeart, FiShare2 } from "react-icons/fi";
import { formatCurrency } from "../../../shared/lib/utils";
import { usePropertyStore } from "../store/usePropertyStore";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/useAuthStore";

interface PropertyCardProps {
  property: Property;
}

function PropertyCard({ property }: PropertyCardProps) {
  const { toggleShortlist, shortlistedProperties } = usePropertyStore();
  const propertySlug = property.slug;

  const isShortlisted = shortlistedProperties.some((p) => p.id === property.id);
  const navigate = useNavigate();

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
      onClick={() => navigate(`/properties/${propertySlug}`)}>
      {/* Image Container */}
      <div className="relative group">
        <img
          src={property.img}
          alt={property.name}
          className="w-full h-44 object-cover rounded-md mb-3"
        />

        {/* Floating Action Buttons */}
        <div className="absolute bottom-4 right-1 flex flex-col gap-2 transition-opacity duration-300">
          <button
            onClick={handleShortlist}
            title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            className={`p-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 cursor-pointer ${isShortlisted
              ? "bg-[#703BF7] text-white"
              : "bg-black/40 text-white hover:bg-[#703BF7]"
              }`}
          >
            <FiHeart size={18} className={isShortlisted ? "fill-current" : ""} />
          </button>
          <button
            onClick={handleShare}
            title="Share property"
            className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all hover:scale-110 hover:bg-[#703BF7] cursor-pointer"
          >
            <FiShare2 size={18} />
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