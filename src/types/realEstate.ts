// Shapes of the SabiFlow Real Estate public API (`/real-estate/public/v1`).
// Field names follow the API exactly; `toProperty` turns a listing into the
// `Property` the pages use.

export type ListingPurpose = "sale" | "rent" | "short_let" | "lease" | "investment";
export type PricePeriod = "once" | "per_year" | "per_month" | "per_night";
export type SharingType = "whole" | "shared_room" | "shared_apartment";
export type VisitMode = "in_person" | "virtual";
export type RequestKind = "contact" | "property_request" | "co_rent" | "agent_application" | "report";

export interface ListingCharge {
  name: string;
  amount: number;
  refundable: boolean;
}

export interface PublicListing {
  id: string;
  slug: string;
  url: string | null;
  reference: string | null;
  title: string;
  type: string | null;
  typeId: string | null;
  purpose: ListingPurpose;
  price: number;
  totalPrice: number;
  pricing: {
    base: number;
    charges: ListingCharge[];
    serviceCharge: number;
    total: number;
  };
  currency: string;
  pricePeriod: PricePeriod;
  term: { value: number; unit: "days" | "months" | "years" } | null;
  status: "published" | "reserved";
  featured: boolean;
  location: {
    state?: string;
    city?: string;
    area?: string;
    nearby: string | null;
    lat: number | null;
    lng: number | null;
  };
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  sharing: SharingType;
  peoplePerRoom: number | null;
  places: { total: number; left: number };
  amenities: string[];
  extraAmenities: string[];
  rules: string[];
  extraRules: string[];
  bills: string[];
  extraBills: string[];
  agentId: string | null;
  photos: string[];
  videoUrl: string | null;
  customFields: Record<string, unknown>;
  updatedAt: string;
  /** Sent when a customer is signed in. */
  saved?: boolean;
}

/** One listing on its own page: the list fields plus its description, agent and visit fee. */
export interface PublicListingDetail extends PublicListing {
  description: string;
  agent: {
    id: string;
    name: string;
    photo?: string;
    verified?: boolean;
    phone?: string;
    email?: string;
    rating?: { average: number; count: number };
  } | null;
  visitFee: number;
  visitFeeBreakdown: { agentFee: number; serviceCharge: number };
}

export interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PropertyType {
  id: string;
  name: string;
  slug: string;
}

interface Counted<T = string> {
  value: T;
  count: number;
}

export interface PropertyFilters {
  types: { id: string; name: string; count: number }[];
  purposes: (Counted<ListingPurpose> & { label: string })[];
  states: Counted[];
  cities: Counted[];
  areas: Counted[];
  nearby: Counted[];
  bedrooms: Counted<number>[];
  sharing: (Counted<SharingType> & { label: string })[];
  price: { min: number; max: number };
  customFields: {
    key: string;
    label: string;
    type: string;
    section: string | null;
    filterMode: string;
    queryParam: string;
    operators: string[];
    options: Counted[] | null;
  }[];
}

export interface PropertyLocations {
  data: {
    state: string;
    count: number;
    cities: {
      city: string;
      count: number;
      areas: { area: string; count: number }[];
      nearby: { name: string; count: number }[];
    }[];
  }[];
}

export interface FormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
  options?: string[];
  section: string | null;
}

/** The company's form fields and rules, so the website only offers what will work. */
export interface PublicForms {
  consentText: string;
  inquiry: FormField[];
  booking: FormField[];
  property: FormField[];
  visit: {
    modes: VisitMode[];
    maxPropertiesPerVisit: number;
    minNoticeHours: number;
    changeNoticeHours: number;
    confirmation: "on_payment" | "team_confirms";
    serviceCharge: number;
  };
  payment: { onlineLimit: number; depositPercent: number };
  reportReasons: { value: string; label: string }[];
  features: { onlinePayments: boolean; ratings: boolean; requests: RequestKind[] };
}

export interface VisitSlot {
  start: string;
  end: string;
  available: boolean;
  placesLeft: number;
}

export interface Contact {
  name: string;
  email?: string;
  phone?: string;
  /** They agreed to be contacted. */
  consent: boolean;
}

export interface Booking {
  id: string;
  reference: string;
  status: "pending_payment" | "pending_confirmation" | "confirmed" | "completed" | "cancelled" | "no_show" | "expired";
  propertyId: string;
  propertyTitle: string;
  date: string;
  start: string;
  end: string;
  startsAt: string;
  timezone: string;
  visitors: number;
  mode: VisitMode;
  fee: number;
  serviceCharge: number;
  paid: boolean;
  invoiceId?: string;
  holdExpiresAt?: string;
  paymentLink: string | null;
  manageLink: string | null;
}

export interface Deal {
  id: string;
  number: string;
  status: "open" | "won" | "lost";
  propertyId: string;
  propertyTitle: string;
  amount: number;
  paid: number;
  lines: { label: string; amount: number; refundable: boolean }[];
  holdUntil: string | null;
  payments: {
    invoiceId: string;
    label: string;
    amount: number;
    status: "unpaid" | "paid" | "partially_paid";
    paidAt: string | null;
    paymentLink: string | null;
    receiptLink: string | null;
  }[];
}

export interface PurchaseResult {
  message: string;
  data: Deal;
  /** Set when the amount is above the company's online limit. */
  bankTransfer: { amount: number; details: string } | null;
  test?: boolean;
}

/** What the API sends back after something is sent in. */
export interface Sent<T = { reference: string }> {
  message: string;
  data: T;
  /** A test key checked the request but saved nothing. */
  test?: boolean;
}

export interface PaymentStart {
  provider: string | null;
  publicKey: string | null;
  reference: string | null;
  accessCode: string | null;
  authorizationUrl: string | null;
}
