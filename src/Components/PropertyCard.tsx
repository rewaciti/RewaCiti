import { useState } from "react";
import type { Property } from "../types";
import { NavLink } from "react-router";
import { FaBed, FaBath, FaHome } from "react-icons/fa";

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

  const getProfitMultiplier = (price:number) => {
    if (price < 50000) {
    return 1.12;
    }
    else if (price < 200000) {
    return 1.2;
    }
    else {
    return 1.05;
    }
   };
 
   const price = property?.price ?? 0;
   const finalPrice = price * getProfitMultiplier(price);

  return (
    <div
  className="
  bg-white/90 dark:bg-[#1A1A1A]
  border border-purple-100 dark:border-gray-600/30
  text-gray-900 dark:text-white
  shadow-sm hover:shadow-lg
  transition-all duration-300
  rounded-xl p-5
"
>
  {/* Image */}
  <img
    src={property.img}
    alt={property.name}
    className="w-full h-40 object-cover rounded-lg mb-4"
  />

  {/* Title */}
  <h3 className="text-lg font-semibold mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
    {property.name}
  </h3>

  {/* Description */}
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
    {expanded
      ? property.description
      : truncateWords(property.description, 8)}

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
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
    <p
      className="
      border border-purple-100 dark:border-gray-600/30
      bg-purple-50 dark:bg-transparent
      text-gray-700 dark:text-gray-300
      rounded-2xl px-3 py-1
      flex items-center justify-center gap-2
      text-xs sm:text-sm
      transition
    "
    >
      <FaBed />
      {property.bedrooms}
    </p>

    <p
      className="
      border border-purple-100 dark:border-gray-600/30
      bg-purple-50 dark:bg-transparent
      text-gray-700 dark:text-gray-300
      rounded-2xl px-3 py-1
      flex items-center justify-center gap-2
      text-xs sm:text-sm
      transition
    "
    >
      <FaBath />
      {property.bathrooms}
    </p>

    <p
      className="
      border border-purple-100 dark:border-gray-600/30
      bg-purple-50 dark:bg-transparent
      text-gray-700 dark:text-gray-300
      rounded-2xl px-3 py-1
      flex items-center justify-center gap-2
      col-span-2 lg:col-span-1
      text-xs sm:text-sm
      transition
    "
    >
      <FaHome />
      {property.type}
    </p>
  </div>

  {/* Price + Button */}
  <div className="flex justify-between items-center">
    <span className="text-lg font-bold text-[#703BF7]">
      ₦{finalPrice.toFixed(0)}
    </span>

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
