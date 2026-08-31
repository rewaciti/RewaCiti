import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "../../../types";
import PropertyCard from "./PropertyCard";

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
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !(lat === 0 && lng === 0)
  ) {
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

// Red price-pill marker — shows the price right on the map. Clicking opens
// the real PropertyCard component as the popup (same card used in the list
// view), so the image, name, price, and its own link to the property page
// all come from that single component instead of being rebuilt here.
function makePriceIcon(label: string, active: boolean) {
  return L.divIcon({
    className: "property-price-marker",
    html: `<div style="
      background:${active ? "#5c2fe0" : "#e11d48"};
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
    ">${label}</div>`,
    iconSize: undefined,
    iconAnchor: [20, 14],
  });
}

// Refits the map whenever the visible property set changes (e.g. after
// filtering), so the pins stay in frame without the user re-panning.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

export default function PropertyMap({
  properties,
  heightClassName = "h-[500px]",
  hoveredPropertyId,
  onHoverProperty,
  onSelectProperty,
}: PropertyMapProps) {
  const markersRef = useRef<Record<string, L.Marker | null>>({});

  const pinned = useMemo(
    () =>
      properties
        .map((p) => ({ property: p, coords: getCoords(p) }))
        .filter(
          (x): x is { property: Property; coords: [number, number] } =>
            x.coords !== null,
        ),
    [properties],
  );

  const points = pinned.map((x) => x.coords);
  const defaultCenter: [number, number] = points[0] ?? [6.5244, 3.3792]; // Lagos fallback

  return (
    <div
      className={`${heightClassName} w-full rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700`}
    >
      {/* Strips Leaflet's default popup chrome (padding, rounded box, tip
          shadow) so PropertyCard's own styling shows through untouched.
          Width is generous (320px, no overflow clipping) so the card
          renders at something close to its natural size instead of being
          squeezed/compacted the way a small fixed box would force it. */}
      <style>{`
        .property-card-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          background: transparent;
        }
        .property-card-popup .leaflet-popup-content {
          margin: 0;
          width: 320px !important;
        }
        .property-card-popup .leaflet-popup-tip {
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={10}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {pinned.map(({ property, coords }) => (
          <Marker
            key={property.id}
            position={coords}
            icon={makePriceIcon(
              formatPrice(property.pricing?.TotalCost),
              hoveredPropertyId === property.id,
            )}
            ref={(ref) => {
              markersRef.current[property.id] = ref;
            }}
            eventHandlers={{
              // Hover just highlights the pin (bigger + purple) and syncs
              // with the card list ring — it doesn't open the popup.
              mouseover: () => onHoverProperty?.(property.id),
              mouseout: () => onHoverProperty?.(null),
              // Clicking opens the popup (Leaflet's default behavior for a
              // Marker with a nested Popup — also auto-closes any other
              // open popup, and closes on outside click) and keeps the
              // list in sync/scrolled to match.
              click: () => onSelectProperty?.(property.id),
            }}
          >
            <Popup className="property-card-popup" minWidth={400}>
              <PropertyCard property={property} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}