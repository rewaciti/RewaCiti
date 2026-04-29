import { useState } from "react";
import type { Property } from "../../../types";
import { NavLink } from "react-router";
import { FaBed, FaBath, FaHome } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import { formatCurrency } from "../../../shared/lib/utils";

interface PropertyCardProps {
  property: Property;
}

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-");

function PropertyCard({ property }: PropertyCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Word limiter
  function truncateWords(text: string, limit: number): string {
    const words = text.split(" ");
    return words.length <= limit ? text : words.slice(0, limit).join(" ");
  }

  const price = property?.pricing.TotalCost ?? 0;
  
  const hasBedrooms = property.bedrooms !== undefined && property.bedrooms !== 0;
  const hasBathrooms = !!property.bathrooms && property.bathrooms !== 0 && property.bathrooms !== "0";

  return (
    <div
  className="
  bg-white/90 dark:bg-[#1A1A1A]
  border border-purple-100 dark:border-gray-600/30
  text-gray-900 dark:text-white
  shadow-sm hover:shadow-lg
  transition-all duration-300
  rounded-xl p-2
"
>
  {/* Image */}
  <img
    src={property.img}
    alt={property.name}
    className="w-full h-70 object-cover rounded-lg mb-4"
  />


  {/* Title */}
  <h3 className="text-lg font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
    {property.name}
  </h3>

  {/* Location */}
  <a
    href={
      property.geo_location?.lat !== 0 && property.geo_location?.lat !== null &&
      property.geo_location?.lng !== 0 && property.geo_location?.lng !== null
        ? `https://www.google.com/maps/search/?api=1&query=${property.geo_location.lat},${property.geo_location.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            [property.location.area, property.location.city, property.location.state].join(", ")
          )}`
    }
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2 hover:text-[#703BF7]  dark:hover:text-[#703BF7] transition-colors"
  >
    <FiMapPin size={12} />
    {[property.location.area, property.location.city].join(", ")}
  </a>

  {/* Description */}
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
    {expanded
      ? property.description
      : truncateWords(property.description, 7)}

    {property.description.split(" ").length > 8 && (
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[#703BF7] ml-2 font-medium hover:underline"
      >
        {expanded ? "Show less" : "... Read more"}
      </button>
    )}
  </p>

  {/* Property Info */}
  <div className={`grid gap-2 mb-4 ${
    (hasBedrooms && hasBathrooms) ? 'grid-cols-2 lg:grid-cols-3' : 
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
      className={`border border-purple-100 dark:border-gray-600/30 bg-purple-50 dark:bg-transparent text-gray-700 dark:text-gray-300 rounded-2xl px-2 py-1 flex items-center justify-center gap-2 text-xs sm:text-sm transition ${
        (hasBedrooms && hasBathrooms) ? 'col-span-2 lg:col-span-1' : ''
      }`}
    >
      <FaHome />
      {property.category}
    </p>
  </div>

  {/* Price + Button */}
  <div className="flex justify-between items-end">
    <div>
      {property.duration && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Price ({property.duration})
        </p>
      )}
      <span className="text-lg font-bold text-[#703BF7]">
        ₦{formatCurrency(price)}
      </span>
    </div>

    <NavLink
      to={`/properties/${slugify(property.name)}`}
      className="bg-[#703BF7] text-white px-4 py-1.5 rounded-lg text-sm shadow hover:bg-[#5d2fe0] hover:shadow-md transition"
    >
      View Property
    </NavLink>
  </div>
</div>
  );
}

export default PropertyCard;