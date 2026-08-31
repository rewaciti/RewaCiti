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

// Matches the shape produced by mapSabiFlowProductsToProperties() in
// usePropertyStore.ts — coordinates come from customData.geo_location,
// price from pricing.TotalCost (property + agent + legal + service +
// caution fees combined).
interface Property {
  id: string;
  name: string;
  pricing: {
    TotalCost: number;
  };
  geo_location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

interface PropertyMapProps {
  properties: Property[];
  heightClassName?: string;
  hoveredPropertyId?: string | null;
  onHoverProperty?: (id: string | null) => void;
  onSelectProperty?: (id: string) => void;
}

// The store defaults geo_location to { lat: 0, lng: 0 } for properties
// that were never given coordinates, so treat (0, 0) as "no location"
// rather than plotting it — otherwise every uncoordinated listing would
// stack up on Null Island off the coast of West Africa.
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

// Red price-pill marker, matching the bubble style in the reference screenshot.
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
  heightClassName = "h-[600px]",
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

  // Open the popup for whichever card is hovered in the list (so hovering a
  // card and hovering a pin feel like the same action), and close every
  // other popup — including the previously-hovered one once hoveredPropertyId
  // goes back to null on mouse-leave. Without the explicit close, a popup
  // opened by hover would stay open until something else happened to open
  // a different one.
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!marker) return;
      if (id === hoveredPropertyId) {
        marker.openPopup();
      } else {
        marker.closePopup();
      }
    });
  }, [hoveredPropertyId]);

  const points = pinned.map((x) => x.coords);
  const defaultCenter: [number, number] = points[0] ?? [6.5244, 3.3792]; // Lagos fallback

  return (
    <div
      className={`${heightClassName} w-full rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700`}
    >
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
              mouseover: () => onHoverProperty?.(property.id),
              mouseout: () => onHoverProperty?.(null),
              click: () => onSelectProperty?.(property.id),
            }}
          >
            <Popup>
              <div className="text-sm font-medium">{property.name}</div>
              <div className="text-[#703BF7] font-semibold">
                {formatPrice(property.pricing?.TotalCost)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}