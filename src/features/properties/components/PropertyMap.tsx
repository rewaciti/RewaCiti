import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { NavLink } from "react-router";
import L from "leaflet";
import type { Property } from "../../../types";
import { formatCurrency } from "../../../shared/lib/utils";
import { usePropertyStore } from "../store/usePropertyStore"; // adjust path to your store file

// Helper component to fix the rendering of the map when container size is computed asynchronously
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Helper component to pan/zoom map to fit current properties markers
function MapBoundsUpdater({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length === 0) return;
    if (coordinates.length === 1) {
      map.setView(coordinates[0], 14);
      return;
    }
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [coordinates, map]);
  return null;
}

// Abbreviate prices like 350,000 to 350k and 1,200,000 to 1.2M
function abbreviatePrice(price: number): string {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + "k";
  }
  return String(price);
}

/**
 * Reads real coordinates straight from backend-supplied geo_location data.
 * Returns null when the backend hasn't given us a usable lat/lng, rather
 * than guessing a location from a hardcoded city/area table.
 */
function getPropertyCoordinates(property: Property): [number, number] | null {
  const { geo_location } = property;

  if (
    geo_location &&
    typeof geo_location.lat === "number" &&
    geo_location.lat !== 0 &&
    typeof geo_location.lng === "number" &&
    geo_location.lng !== 0
  ) {
    return [geo_location.lat, geo_location.lng];
  }

  return null;
}

interface PropertyMapProps {
  // Now optional: when omitted, the map reads filteredProperties from
  // usePropertyStore directly instead of requiring prop-drilling.
  properties?: Property[];
  // Tailwind height class for the outer wrapper. Pass "h-full" when this
  // sits inside a flex split-view; defaults to the original fixed height.
  heightClassName?: string;
  // Id of the property whose marker should render "active" (bigger/highlighted).
  // Drive this from a hovered list card in the split view.
  hoveredPropertyId?: string | null;
  // Fired when the mouse enters/leaves a marker, so the list side can
  // highlight the matching card. Called with null on mouse-out.
  onHoverProperty?: (id: string | null) => void;
  // Fired when a marker is clicked (in addition to the popup opening),
  // so the list side can scroll the matching card into view.
  onSelectProperty?: (id: string) => void;
}

// Fallback center (Ile-Ife) used only when there isn't a single geolocated
// property to derive a center from — no per-property guessing anymore.
const FALLBACK_CENTER: [number, number] = [7.48, 4.54];

export default function PropertyMap({
  properties: propertiesProp,
  heightClassName = "h-[600px]",
  hoveredPropertyId = null,
  onHoverProperty,
  onSelectProperty,
}: PropertyMapProps) {
  // Pull live data from the backend-backed store when no explicit list is passed.
  const storeProperties = usePropertyStore((state) => state.filteredProperties);
  const properties = propertiesProp ?? storeProperties;

  // Sync map dark/light theme dynamically
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Only plot properties that have real backend coordinates.
  const propertyMarkers = useMemo(() => {
    return properties
      .map((property) => ({
        property,
        coords: getPropertyCoordinates(property),
      }))
      .filter(
        (m): m is { property: Property; coords: [number, number] } => m.coords !== null
      );
  }, [properties]);

  const allCoords = useMemo(() => {
    return propertyMarkers.map((m) => m.coords);
  }, [propertyMarkers]);

  // Center coordinates fallback
  const defaultCenterCoords = useMemo<[number, number]>(() => {
    if (allCoords.length > 0) {
      const latSum = allCoords.reduce((sum, c) => sum + c[0], 0);
      const lngSum = allCoords.reduce((sum, c) => sum + c[1], 0);
      return [latSum / allCoords.length, lngSum / allCoords.length];
    }
    return FALLBACK_CENTER;
  }, [allCoords]);

  // Premium map tiles
  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div
      className={`w-full ${heightClassName} rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700/60 relative bg-gray-100 dark:bg-neutral-900`}
    >
      <MapContainer
        center={defaultCenterCoords}
        zoom={13}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        <MapResizer />
        <MapBoundsUpdater coordinates={allCoords} />

        {propertyMarkers.map(({ property, coords }) => {
          const priceTag = abbreviatePrice(property.pricing.TotalCost);
          const isActive = hoveredPropertyId === property.id;

          const customIcon = L.divIcon({
            html: `<div class="${isActive
              ? "bg-white text-[#703BF7] scale-110 border-[#703BF7]"
              : "bg-[#703BF7] text-white border-white dark:border-neutral-800"
              } hover:bg-[#5c2fe0] active:scale-95 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-lg border whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 transition duration-200 flex items-center justify-center pointer-events-auto z-10">
                     ₦${priceTag}
                   </div>`,
            className: "custom-price-marker-container",
            iconSize: [60, 30],
            iconAnchor: [30, 15],
            popupAnchor: [0, -15],
          });

          return (
            <Marker
              key={property.id}
              position={coords}
              icon={customIcon}
              eventHandlers={{
                mouseover: () => onHoverProperty?.(property.id),
                mouseout: () => onHoverProperty?.(null),
                click: () => onSelectProperty?.(property.id),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="w-56 font-sans select-none text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A]">
                  <div className="relative overflow-hidden rounded-t-md mb-2 h-28 bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={property.img}
                      alt={property.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/logo/Abstract Design (1).png";
                      }}
                    />
                  </div>
                  <div className="px-1 text-gray-900 dark:text-white">
                    <h4 className="font-bold text-sm truncate mb-0.5">
                      {property.name}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 truncate">
                      {[
                        property.location.area,
                        property.location.city_town || property.location.city,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-extrabold text-[#703BF7]">
                        ₦{formatCurrency(property.pricing.TotalCost)}
                      </span>
                      <span className="text-[9px] bg-purple-50 dark:bg-purple-900/30 text-[#703BF7] dark:text-[#a78bfa] border border-purple-100/50 dark:border-purple-900/50 px-2 py-0.5 rounded-full font-medium">
                        {property.category}
                      </span>
                    </div>
                    <NavLink
                      to={`/properties/${property.slug}`}
                      className="block w-full py-2 text-center text-xs font-semibold text-white bg-[#703BF7] hover:bg-[#5c2fe0] rounded-md transition shadow-sm"
                    >
                      View Details
                    </NavLink>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0 !important;
          background: white !important;
          border-radius: 8px !important;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          overflow: hidden !important;
        }
        .dark .custom-leaflet-popup .leaflet-popup-content {
          background: #1A1A1A !important;
          border-color: #374151 !important;
          color: white !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button {
          color: white !important;
          background: rgba(0, 0, 0, 0.5) !important;
          border-radius: 50% !important;
          width: 20px !important;
          height: 20px !important;
          line-height: 20px !important;
          text-align: center !important;
          top: 8px !important;
          right: 8px !important;
          font-size: 14px !important;
          padding: 0 !important;
          z-index: 10 !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button:hover {
          background: #703BF7 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}