import type { AgentProperty, AgentPropertyCharge, AgentPropertyStatus } from "@/features/agentPortal/common/services/agentAPI";
import type { RentalTermUnit } from "@/features/agentPortal/common/utils/agentListingUtils";

export interface ListingDraft {
  title: string;
  description: string;
  typeId: string;
  purpose: string;
  price: string;
  currency: string;
  pricePeriod: string;
  rentalTermValue: string;
  rentalTermUnit: RentalTermUnit;
  state: string;
  city: string;
  area: string;
  address: string;
  nearby: string;
  lat: string;
  lng: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  sharing: string;
  peoplePerRoom: string;
  units: string;
  amenities: string;
  rules: string;
  bills: string;
  photos: string;
  documents: string;
  videoUrl: string;
  landTitle: string;
  specialNotes: string;
  charges: AgentPropertyCharge[];
  status: AgentPropertyStatus;
  visitFeeMode: "default" | "free" | "custom";
  visitFeeOverride: string;
}

export const blankDraft = (): ListingDraft => ({
  title: "",
  description: "",
  typeId: "",
  purpose: "rent",
  price: "",
  currency: "NGN",
  pricePeriod: "per_year",
  rentalTermValue: "",
  rentalTermUnit: "years",
  state: "",
  city: "",
  area: "",
  address: "",
  nearby: "",
  lat: "",
  lng: "",
  bedrooms: "",
  bathrooms: "",
  sizeSqm: "",
  sharing: "whole",
  peoplePerRoom: "",
  units: "1",
  amenities: "",
  rules: "",
  bills: "",
  photos: "",
  documents: "",
  videoUrl: "",
  landTitle: "",
  specialNotes: "",
  charges: [],
  status: "published",
  visitFeeMode: "default",
  visitFeeOverride: "",
});

export const draftFromProperty = (property: AgentProperty): ListingDraft => {
  const rawSharing = property.sharing.toLowerCase().replace(/[\s-]+/g, "_");
  return {
    title: property.title,
    description: property.description,
    typeId: property.typeId,
    purpose: property.purpose,
    price: String(property.price),
    currency: property.currency || "NGN",
    pricePeriod: property.pricePeriod,
    rentalTermValue: property.term ? String(property.term.value) : "",
    rentalTermUnit: property.term?.unit === "days" || property.term?.unit === "months" || property.term?.unit === "years"
      ? property.term.unit
      : "years",
    state: property.location.state,
    city: property.location.city,
    area: property.location.area,
    address: property.location.address,
    nearby: property.location.nearby ?? "",
    lat: property.location.lat == null ? "" : String(property.location.lat),
    lng: property.location.lng == null ? "" : String(property.location.lng),
    bedrooms: property.bedrooms === null ? "" : String(property.bedrooms),
    bathrooms: property.bathrooms === null ? "" : String(property.bathrooms),
    sizeSqm: property.sizeSqm == null ? "" : String(property.sizeSqm),
    sharing: rawSharing === "room" ? "shared_room" : rawSharing === "shared" ? "shared_apartment" : rawSharing || "whole",
    peoplePerRoom: property.peoplePerRoom == null ? "" : String(property.peoplePerRoom),
    units: String(property.places || 1),
    amenities: property.amenities.join("\n"),
    rules: property.rules.join("\n"),
    bills: property.bills.join("\n"),
    photos: property.photos.join("\n"),
    documents: property.documents.join("\n"),
    videoUrl: property.videoUrl ?? "",
    landTitle: typeof property.customFields?.landTitle === "string" ? property.customFields.landTitle : "",
    specialNotes: typeof property.customFields?.specialNotes === "string" ? property.customFields.specialNotes : "",
    charges: property.charges ?? [],
    status: property.status,
    visitFeeMode: property.visitFeeOverride === null ? "default" : property.visitFeeOverride === 0 ? "free" : "custom",
    visitFeeOverride: property.visitFeeOverride === null ? "" : String(property.visitFeeOverride),
  };
};

