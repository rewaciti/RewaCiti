import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "../../../types";
import { FiMapPin, FiArrowRight } from "react-icons/fi";

interface PropertyMapProps {
  properties: Property[];
  heightClassName?: string;
  hoveredPropertyId?: string | null;
  onHoverProperty?: (id: string | null) => void;
  onSelectProperty?: (id: string) => void;
}

function getCoords(p: Property): [number, number] | null {
  const lat = p.geo_location?.lat;
  const lng = p.geo_location?.lng;

  if (typeof lat === "number" && typeof lng === "number" && !(lat === 0 && lng === 0)) {
    return [lat, lng];
  }

  return null;
}

function formatPrice(price?: number): string {
  if (!price) return "₦—";
  if (price >= 1_000_000_000) return `₦${(price / 1_000_000_000).toFixed(1)}B`;
  if (price >= 1_000_000) return `₦${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `₦${(price / 1_000).toFixed(0)}K`;
  return `₦${price}`;
}

function makePriceIcon(label: string, active: boolean) {
  return L.divIcon({
    className: "property-price-marker",
    html: `
      <div style="background:${active ? "#5c2fe0" : "#e11d48"};
        color:#fff;
        font-weight:600;
        font-size:12px;
        padding:4px 8px;
        border-radius:999px;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        border:2px solid #fff;
        transform:${active ? "scale(1.12)" : "scale(1)"};
        transition:transform .15s ease;
      ">
        ${label}
      </div>
    `,
    iconSize: undefined,
    iconAnchor: [20, 14],
  });
}

/**
 * FitBounds only auto-fits the map ONCE per distinct set of points
 * (tracked via a stable key). This prevents the map from snapping
 * back to the fitted view every time the parent re-renders for
 * unrelated reasons (e.g. hover state changes), which previously
 * made it impossible to click a marker/popup after zooming in.
 */
function FitBounds({ points, pointsKey }: { points: [number, number][]; pointsKey: string }) {
  const map = useMap();
  const lastFitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (points.length === 0) return;
    if (lastFitKeyRef.current === pointsKey) return; // already fit for this exact set of points

    lastFitKeyRef.current = pointsKey;

    if (points.length === 1) {
      map.setView(points[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, map]);

  return null;
}

function PropertyPreview({ property }: { property: Property }) {
  const image = Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : property.img;

  const location = [property.location?.area, property.location?.city_town || property.location?.city, property.location?.state].filter(Boolean).join(", ");

  const goToProperty = () => {
    window.location.href = `/properties/${property.slug}`;
  };

  return (
    <div className="w-[270px] bg-white dark:bg-[#1A1A1A] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer group" onClick={goToProperty}>
      <div className="relative h-[115px] overflow-hidden">
        <img src={image} alt={property.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-md">{property.category}</span>
      </div>

      <div className="px-3 py-2.5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1" title={property.name}>
          {property.name}
        </h3>

        {location && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
            <FiMapPin size={11} className="shrink-0 text-[#703BF7]" />
            <span className="truncate">{location}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {property.duration && <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-none mb-0.5">{property.duration}</p>}
            <p className="text-sm font-bold text-[#703BF7] truncate">{formatPrice(property.pricing?.TotalCost)}</p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToProperty();
            }}
            className="shrink-0 flex items-center gap-1 bg-[#703BF7] hover:bg-[#5c2fe0] text-white text-[10px] font-medium px-2.5 py-1.5 rounded-md transition"
          >
            View
            <FiArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PropertyMap({ properties, heightClassName = "h-[500px]", hoveredPropertyId, onHoverProperty, onSelectProperty }: PropertyMapProps) {
  const markersRef = useRef<Record<string, L.Marker | null>>({});

  const pinned = useMemo(
    () =>
      properties
        .map((p) => ({ property: p, coords: getCoords(p) }))
        .filter((x): x is { property: Property; coords: [number, number] } => x.coords !== null),
    [properties],
  );

  // Stable string key derived from the actual coordinate content.
  // This only changes when the real set of pinned points changes,
  // NOT when `properties`/`pinned` gets a new array reference on
  // every re-render (e.g. from hover state changes in the parent).
  const pointsKey = useMemo(
    () => pinned.map(({ property, coords }) => `${property.id}:${coords[0]},${coords[1]}`).join("|"),
    [pinned],
  );

  const points = useMemo(() => pinned.map((x) => x.coords), [pointsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultCenter: [number, number] = points[0] ?? [6.5244, 3.3792];

  return (
    <div className={`${heightClassName} w-full rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700`}>
      <style>{`
        .property-map-popup {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .property-map-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .property-map-popup .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
          width: 270px !important;
        }
        .property-map-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .property-map-popup .leaflet-popup-tip {
          display: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .property-map-popup .leaflet-popup-close-button {
          z-index: 20 !important;
          top: 5px !important;
          right: 5px !important;
          width: 22px !important;
          height: 22px !important;
          border-radius: 999px !important;
          background: rgba(0,0,0,0.45) !important;
          color: white !important;
          font-size: 17px !important;
          line-height: 20px !important;
          padding: 0 !important;
          text-align: center !important;
        }
        .property-map-popup .leaflet-popup-close-button:hover {
          background: rgba(0,0,0,0.7) !important;
          color: white !important;
        }
        .leaflet-popup.property-map-popup {
          margin-bottom: 0 !important;
        }
        .leaflet-popup.property-map-popup .leaflet-popup-content-wrapper {
          border-radius: 0 !important;
        }
      `}</style>

      <MapContainer center={defaultCenter} zoom={10} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <FitBounds points={points} pointsKey={pointsKey} />

        {pinned.map(({ property, coords }) => (
          <Marker
            key={property.id}
            position={coords}
            icon={makePriceIcon(formatPrice(property.pricing?.TotalCost), hoveredPropertyId === property.id)}
            ref={(ref) => {
              markersRef.current[property.id] = ref;
            }}
            eventHandlers={{
              mouseover: () => onHoverProperty?.(property.id),
              mouseout: () => onHoverProperty?.(null),
              click: () => onSelectProperty?.(property.id),
            }}
          >
            <Popup className="property-map-popup" minWidth={270} maxWidth={270} closeButton={true} autoPan={true}>
              <PropertyPreview property={property} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}