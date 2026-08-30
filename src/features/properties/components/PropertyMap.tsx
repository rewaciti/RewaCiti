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

interface Property {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
  latitude?: number;
  longitude?: number;
  customData?: { label: string; value: string }[];
}

interface PropertyMapProps {
  properties: Property[];
  heightClassName?: string;
  hoveredPropertyId?: string | null;
  onHoverProperty?: (id: string | null) => void;
  onSelectProperty?: (id: string) => void;
}

// Your API's coordinate shape may differ from all of these — adjust this
// one function if none of the fallbacks match what's actually coming back.
function getCoords(p: Property): [number, number] | null {
  const lat = p.location?.latitude ?? p.location?.lat ?? p.latitude;
  const lng = p.location?.longitude ?? p.location?.lng ?? p.longitude;
  if (typeof lat === "number" && typeof lng === "number") return [lat, lng];
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

  // Open the popup for whichever card is hovered in the list, so hovering a
  // card and hovering a pin feel like the same action.
  useEffect(() => {
    if (!hoveredPropertyId) return;
    markersRef.current[hoveredPropertyId]?.openPopup();
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
              formatPrice(property.price),
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
              <div className="text-sm font-medium">
                {property.title ?? property.name}
              </div>
              <div className="text-[#703BF7] font-semibold">
                {formatPrice(property.price)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}