import { ensureHttps } from "../../../shared/lib/utils";
import type { Property } from "../../../types";
import type { FormField, ListingPurpose, PublicListing, PublicListingDetail, SharingType } from "../../../types/realEstate";

export const PURPOSE_LABELS: Record<ListingPurpose, string> = {
  sale: "For sale",
  rent: "For rent",
  short_let: "Short-let",
  lease: "Lease",
  investment: "Investment",
};

const SHARING_LABELS: Record<SharingType, string> = {
  whole: "Whole place",
  shared_room: "Shared room",
  shared_apartment: "Shared apartment",
};

const PERIOD_TEXT: Record<string, string> = {
  per_year: "per year",
  per_month: "per month",
  per_night: "per night",
};

/** The custom field holding a listing's special notes, shown as their own list. */
const SPECIAL_NOTES_KEY = "special_notes";

const durationOf = (listing: PublicListing) => {
  if (listing.term) {
    const { value, unit } = listing.term;
    return `${value} ${value === 1 ? unit.replace(/s$/, "") : unit}`;
  }
  return PERIOD_TEXT[listing.pricePeriod] ?? "";
};

const textOf = (value: unknown, type?: string) => {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (type === "money" && typeof value === "number") return `₦${value.toLocaleString()}`;
  return String(value ?? "").trim();
};

/** Size, sharing, places and the company's own fields, labelled as on the RewaCiti dashboard. */
const specificationsOf = (listing: PublicListing, fields: FormField[]) => {
  const specs: { label: string; value: string }[] = [];
  if (listing.sizeSqm) specs.push({ label: "Size", value: `${listing.sizeSqm.toLocaleString()} m²` });
  if (listing.sharing !== "whole") {
    const perRoom = listing.peoplePerRoom ? ` · ${listing.peoplePerRoom} people per room` : "";
    specs.push({ label: "Sharing", value: `${SHARING_LABELS[listing.sharing]}${perRoom}` });
  }
  if (listing.places.total > 1) specs.push({ label: "Places left", value: `${listing.places.left} of ${listing.places.total}` });

  // Labels come from the form, so a field with no label there isn't public
  for (const field of fields) {
    if (field.key === SPECIAL_NOTES_KEY) continue;
    const value = textOf(listing.customFields[field.key], field.type);
    if (value) specs.push({ label: field.label, value });
  }
  return specs;
};

const listOf = (value: unknown) =>
  (Array.isArray(value) ? value : []).map((item) => String(item).trim()).filter(Boolean);

/**
 * Turns a Real Estate listing into what the pages show. `fields` are the
 * company's property fields from `GET /forms`, for labelling its own details.
 */
export const toProperty = (listing: PublicListing | PublicListingDetail, fields: FormField[] = []): Property => {
  const detail = "visitFee" in listing ? listing : null;
  const images = listing.photos.map(ensureHttps);

  return {
    id: listing.id,
    slug: listing.slug,
    reference: listing.reference ?? undefined,
    name: listing.title,
    img: images[0] ?? "",
    images,
    description: detail?.description ?? "",
    bedrooms: listing.bedrooms ?? 0,
    bathrooms: listing.bathrooms ?? 0,
    category: listing.type ?? "Property",
    purpose: listing.purpose,
    listingType: PURPOSE_LABELS[listing.purpose] ?? "",
    duration: durationOf(listing),
    sharing: listing.sharing,
    places: listing.places,
    reserved: listing.status === "reserved",
    pricing: listing.pricing,
    agentId: listing.agentId,
    agent: detail?.agent,
    location: {
      state: listing.location.state ?? "",
      city: listing.location.city ?? "",
      area: listing.location.area ?? "",
      nearby: listing.location.nearby ?? "",
    },
    geo_location: { lat: listing.location.lat ?? 0, lng: listing.location.lng ?? 0 },
    keyFeatures: listing.amenities,
    additionalFeatures: listing.extraAmenities,
    billsAndCharges: listing.bills,
    additionalBillsAndCharges: listing.extraBills,
    rules: listing.rules,
    additionalRules: listing.extraRules,
    specialNotes: listOf(listing.customFields[SPECIAL_NOTES_KEY]),
    specifications: specificationsOf(listing, fields),
    videoUrl: listing.videoUrl ? ensureHttps(listing.videoUrl) : undefined,
    visitationfee: detail ? detail.visitFee : null,
  };
};

/** "Akoka, Yaba, Lagos state." as the pages write an address. */
export const addressOf = (property: Pick<Property, "location">) => {
  const { area, city, state } = property.location;
  const parts = [area, city, state].filter(Boolean).join(", ");
  return parts ? `${parts}${state ? " state." : ""}` : "";
};
