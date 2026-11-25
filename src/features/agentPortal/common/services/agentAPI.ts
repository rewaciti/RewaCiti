import axios from "axios";
import { useAgentAuthStore } from "../store/useAgentAuthStore";

const API_URL = import.meta.env.VITE_API_URL || "https://api.sabiflow.com/api";

const agentApi = axios.create({
  baseURL: `${API_URL}/real-estate/public/v1`,
  timeout: 20_000,
});

agentApi.interceptors.request.use((config) => {
  config.headers["x-api-key"] = import.meta.env.VITE_SABIFLOW_PUBLIC_KEY;
  const token = useAgentAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface AgentProfile {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  photo?: string;
  kind: string;
  status: string;
  commissionPercent: number;
  invitedAt: string;
  joinedAt: string;
  verification: {
    status: string;
    documents: unknown[];
  };
}

export interface AgentDashboard {
  activeListings: number;
  pendingApproval: number;
  newInquiries: number;
  upcomingVisits: number;
  feesCollectedThisMonth: number;
  feesCollectedLastMonth: number;
  listingsByStatus: {
    draft: number;
    pending_approval: number;
    published: number;
    reserved: number;
    sold: number;
    let: number;
    archived: number;
  };
  funnel: {
    inquiries: number;
    visits: number;
    deals: number;
  };
  bookings: {
    total: number;
    completed: number;
    noShow: number;
  };
}

export interface AgentStats {
  agentId: string;
  listings: number;
  published: number;
  openLeads: number;
  upcomingVisits: number;
  feesCollected: number;
  dealsWonValue: number;
  estimatedCommission: number;
}

export interface AgentAttention {
  properties: number;
  inquiries: number;
  bookings: number;
  deals: number;
  requests: number;
  payouts: number;
  total: number;
}

export type AgentPropertyStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "reserved"
  | "sold"
  | "let"
  | "archived";

export interface AgentPropertyLocation {
  state: string;
  city: string;
  area: string;
  address: string;
  nearby: string;
  lat?: number | null;
  lng?: number | null;
}

export interface AgentPropertyCharge {
  name: string;
  amount?: number;
  refundable?: boolean;
  keptBy?: string;
}

export interface AgentProperty {
  id: string;
  productId: string;
  sku: string;
  slug: string;
  title: string;
  description: string;
  typeId: string;
  purpose: string;
  price: number;
  currency: string;
  pricePeriod: string;
  totalPrice: number;
  serviceCharge: number;
  charges: AgentPropertyCharge[];
  term: { value: number; unit: string } | null;
  amenities: string[];
  extraAmenities: string[];
  rules: string[];
  extraRules: string[];
  bills: string[];
  extraBills: string[];
  sharing: string;
  peoplePerRoom: number | null;
  places: number;
  placesTaken: number;
  placesHeld: number;
  placesLeft: number;
  location: AgentPropertyLocation;
  bedrooms: number | null;
  bathrooms: number | null;
  photos: string[];
  documents: string[];
  videoUrl?: string | null;
  sizeSqm?: number | null;
  status: AgentPropertyStatus;
  agentId: string;
  featured: boolean;
  sample: boolean;
  visitFeeOverride: number | null;
  customFields: Record<string, unknown>;
  createdVia: string;
  hasPendingChanges: boolean;
  views: number;
  rating: { average: number; count: number };
  history: {
    id: string;
    field: string;
    from?: string | null;
    to?: string | null;
    by: string;
    at: string;
    remark?: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
  inquiryCount?: number;
  visitCount?: number;
}

export interface AgentPropertyPayload {
  title: string;
  description: string;
  typeId: string;
  purpose: string;
  price: number;
  currency?: string;
  pricePeriod: string;
  term?: { value: number; unit: "days" | "months" | "years" } | null;
  location: AgentPropertyLocation;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  photos: string[];
  status: AgentPropertyStatus;
  visitFeeOverride?: number | null;
  charges?: AgentPropertyCharge[];
  rules?: string[];
  bills?: string[];
  sharing?: string;
  peoplePerRoom?: number | null;
  places?: number;
  documents?: string[];
  videoUrl?: string | null;
  sizeSqm?: number | null;
  customFields?: Record<string, unknown>;
}

export interface AgentPropertyCounts {
  all: number;
  draft: number;
  pending_approval: number;
  published: number;
  reserved: number;
  sold: number;
  let: number;
  archived: number;
}

export interface AgentPropertyAvailability {
  propertyId: string;
  useDefault: boolean;
  week: { day: number; enabled: boolean; start: string; end: string }[];
  slotMinutes: number;
  maxVisitorsPerSlot: number;
  blackoutDates: string[];
}

export interface AgentPropertySlot {
  date: string;
  start: string;
  end: string;
  capacity: number;
  booked: number;
  available: boolean;
}

export interface AgentPropertyType {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  propertyCount: number;
}

export type AgentInquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "closed_won"
  | "closed_lost";

export interface AgentInquiryActivity {
  id: string;
  type: "note" | "task" | "status" | "email" | string;
  body: string;
  by: string;
  at: string;
  remark?: string | null;
  dueAt?: string | null;
  done?: boolean;
}

export interface AgentInquiryPropertySummary {
  id: string;
  title: string;
  sku: string;
  photo?: string | null;
  typeId: string;
  purpose: string;
  price: number;
  totalPrice: number;
  pricePeriod: string;
  status: string;
  location: AgentPropertyLocation;
  agentId: string;
  places: number;
  placesLeft: number;
}

export interface AgentInquiryContact {
  id?: string;
  name: string;
  email: string;
  phone: string;
}

export interface AgentInquiry {
  id: string;
  reference: string;
  crmLeadId: string;
  propertyId: string;
  property: AgentInquiryPropertySummary;
  customerId?: string | null;
  customer?: AgentInquiryContact | null;
  contact: AgentInquiryContact;
  agentId: string;
  agent?: AgentInquiryContact | null;
  message: string;
  status: AgentInquiryStatus;
  source: string;
  customFields: Record<string, unknown>;
  activities: AgentInquiryActivity[];
  consentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInquiryCounts {
  all: number;
  new: number;
  contacted: number;
  qualified: number;
  closed_won: number;
  closed_lost: number;
}

export interface AgentCreateInquiryPayload {
  propertyId: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  message: string;
}

export interface AgentCreateInquiryActivityPayload {
  type: "note" | "task";
  body: string;
  dueAt?: string;
}

export type AgentBookingStatus =
  | "pending_payment"
  | "pending_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | string;

export interface AgentBookingInvoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  label: string;
  paymentLink?: string;
  paidAt?: string;
  method?: string;
}

export interface AgentBookingTimelineEntry {
  id: string;
  label: string;
  remark?: string | null;
  by: string;
  at: string;
}

export interface AgentBooking {
  id: string;
  reference: string;
  propertyId: string;
  property: AgentInquiryPropertySummary;
  address: string;
  customerId?: string | null;
  customer?: AgentInquiryContact | null;
  contact: AgentInquiryContact;
  agentId: string;
  agent?: AgentInquiryContact | null;
  hostName?: string | null;
  inquiryId?: string | null;
  date: string;
  start: string;
  end: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  visitors: number;
  status: AgentBookingStatus;
  mode: string;
  meetingLink?: string | null;
  alsoSee?: unknown[];
  serviceCharge: number;
  fee: number;
  paymentStatus: string;
  invoice?: AgentBookingInvoice | null;
  holdExpiresAt?: string | null;
  customFields: Record<string, unknown>;
  source: string;
  notes?: string | null;
  cancelReason?: string | null;
  manageLink?: string | null;
  timeline: AgentBookingTimelineEntry[];
  createdAt: string;
}

export interface AgentCreateBookingPayload {
  propertyId: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  date: string;
  start: string;
  visitors: number;
  notes?: string;
  mode?: "in_person" | "virtual";
}

export interface AgentRecordBookingPaymentPayload {
  method: string;
  reference?: string;
}

export interface AgentRescheduleBookingPayload {
  date: string;
  start: string;
  reason?: string;
}

export interface AgentBookingOutcomePayload {
  status: "completed" | "no_show";
  remark?: string;
}

export type AgentDealStatus = "open" | "won" | "lost" | string;

export interface AgentDealLine {
  label: string;
  amount: number;
  refundable: boolean;
  keptBy: string;
}

export interface AgentDeal {
  id: string;
  orderNumber: string;
  propertyId: string;
  property: AgentInquiryPropertySummary;
  customerId: string;
  customer?: AgentInquiryContact | null;
  agentId: string;
  agent?: AgentInquiryContact | null;
  inquiryId?: string | null;
  amount: number;
  depositPercent: number;
  status: AgentDealStatus;
  lines: AgentDealLine[];
  held: unknown[];
  source: string;
  offlinePayment: boolean;
  invoices: AgentBookingInvoice[];
  notes?: string | null;
  timeline: AgentBookingTimelineEntry[];
  createdAt: string;
}

export interface AgentDealCounts {
  all: number;
  open: number;
  won: number;
  lost: number;
}

export interface AgentCreateDealPayload {
  propertyId: string;
  customerId: string;
  inquiryId?: string;
  amount: number;
  depositPercent: number;
  notes?: string;
}

interface AgentLoginResponse {
  token: string;
}

export interface AgentPayoutSummaryBucket {
  count: number;
  amount: number;
}

export interface AgentPayoutSummary {
  pending: AgentPayoutSummaryBucket;
  paid: AgentPayoutSummaryBucket;
  void: AgentPayoutSummaryBucket;
}

export interface AgentPayout {
  id: string;
  reference?: string | null;
  status: "pending" | "paid" | "void" | string;
  amount: number;
  currency?: string;
  description?: string | null;
  propertyId?: string | null;
  property?: Partial<AgentInquiryPropertySummary> | null;
  propertyTitle?: string | null;
  propertySku?: string | null;
  dealId?: string | null;
  bookingId?: string | null;
  inquiryId?: string | null;
  method?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentPayoutFilterOption {
  label: string;
  value: string;
}

export interface AgentPayoutFilter {
  key?: string;
  field?: string;
  name?: string;
  label?: string;
  options?: unknown[];
  values?: unknown[];
}

export interface AgentRatingSummary {
  average: number;
  count: number;
}

export interface AgentVerificationDocument {
  name: string;
  url: string;
  size: number;
}

interface AgentMessageResponse {
  message: string;
}

interface AgentProfileUpdateResponse extends AgentMessageResponse {
  data: AgentProfile;
}

export const agentAPI = {
  login: async (email: string, password: string) => {
    const response = await agentApi.post<AgentLoginResponse>("/agent/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await agentApi.post<AgentMessageResponse>(
      "/agent/auth/forgot-password",
      { email }
    );
    return response.data;
  },

  getMe: async () => {
    const response = await agentApi.get<AgentProfile>("/agent/me");
    return response.data;
  },

  updateMe: async (bio: string, photo?: string, phone?: string) => {
    const response = await agentApi.patch<AgentProfileUpdateResponse>("/agent/me", {
      bio,
      ...(photo ? { photo } : {}),
      ...(phone ? { phone } : {}),
    });
    return response.data;
  },

  getDashboard: async () => {
    const response = await agentApi.get<AgentDashboard>("/agent/dashboard");
    return response.data;
  },

  getStats: async () => {
    const response = await agentApi.get<AgentStats>("/agent/stats");
    return response.data;
  },

  getAttention: async () => {
    const response = await agentApi.get<AgentAttention>("/agent/attention");
    return response.data;
  },

  getSettings: async () => {
    const response = await agentApi.get<Record<string, unknown>>("/agent/settings");
    return response.data;
  },

  getPropertyTypes: async () => {
    const response = await agentApi.get<AgentPropertyType[]>("/agent/property-types");
    return response.data;
  },

  getCustomFields: async (entity: string) => {
    const response = await agentApi.get<unknown[]>("/agent/custom-fields", {
      params: { entity },
    });
    return response.data;
  },

  getProperties: async (params: { page: number; limit: number; status?: string }) => {
    const response = await agentApi.get<{ data: AgentProperty[]; total: number }>("/agent/properties", {
      params,
    });
    return response.data;
  },

  getPropertyFilters: async () => {
    const response = await agentApi.get<{ filters: unknown[] }>("/agent/properties/filters");
    return response.data;
  },

  getPropertyCounts: async () => {
    const response = await agentApi.get<AgentPropertyCounts>("/agent/properties/counts");
    return response.data;
  },

  getProperty: async (id: string) => {
    const response = await agentApi.get<AgentProperty>(`/agent/properties/${encodeURIComponent(id)}`);
    return response.data;
  },

  createProperty: async (payload: AgentPropertyPayload) => {
    const response = await agentApi.post<{ message: string; data: AgentProperty }>("/agent/properties", payload);
    return response.data;
  },

  updateProperty: async (id: string, payload: AgentPropertyPayload) => {
    const response = await agentApi.patch<{ message: string; data: AgentProperty }>(
      `/agent/properties/${encodeURIComponent(id)}`,
      payload
    );
    return response.data;
  },

  withdrawProperty: async (id: string, reason: string) => {
    const response = await agentApi.post<{ message: string; data: AgentProperty }>(
      `/agent/properties/${encodeURIComponent(id)}/withdraw`,
      { reason }
    );
    return response.data;
  },

  getPropertyAvailability: async (id: string) => {
    const response = await agentApi.get<AgentPropertyAvailability>(
      `/agent/properties/${encodeURIComponent(id)}/availability`
    );
    return response.data;
  },

  updatePropertyAvailability: async (id: string, payload: Omit<AgentPropertyAvailability, "propertyId">) => {
    const response = await agentApi.put<{ message: string; data: AgentPropertyAvailability }>(
      `/agent/properties/${encodeURIComponent(id)}/availability`,
      payload
    );
    return response.data;
  },

  getPropertySlots: async (id: string, date: string) => {
    const response = await agentApi.get<AgentPropertySlot[]>(
      `/agent/properties/${encodeURIComponent(id)}/slots`,
      { params: { date } }
    );
    return response.data;
  },

  getInquiries: async (params: { page: number; limit: number; status?: string; propertyId?: string }) => {
    const response = await agentApi.get<{ data: AgentInquiry[]; total: number }>("/agent/inquiries", {
      params,
    });
    return response.data;
  },

  getInquiryFilters: async () => {
    const response = await agentApi.get<{ filters: unknown[] }>("/agent/inquiries/filters");
    return response.data;
  },

  getInquiryCounts: async () => {
    const response = await agentApi.get<AgentInquiryCounts>("/agent/inquiries/counts");
    return response.data;
  },

  getInquiry: async (id: string) => {
    const response = await agentApi.get<AgentInquiry>(`/agent/inquiries/${encodeURIComponent(id)}`);
    return response.data;
  },

  createInquiry: async (payload: AgentCreateInquiryPayload) => {
    const response = await agentApi.post<{ message: string; data: AgentInquiry }>("/agent/inquiries", payload);
    return response.data;
  },

  updateInquiryStatus: async (id: string, payload: { status: AgentInquiryStatus; remark?: string }) => {
    const response = await agentApi.post<{ message: string; data: AgentInquiry }>(
      `/agent/inquiries/${encodeURIComponent(id)}/status`,
      payload
    );
    return response.data;
  },

  addInquiryActivity: async (id: string, payload: AgentCreateInquiryActivityPayload) => {
    const response = await agentApi.post<{ message: string; data: AgentInquiry }>(
      `/agent/inquiries/${encodeURIComponent(id)}/activities`,
      payload
    );
    return response.data;
  },

  toggleInquiryActivity: async (id: string, activityId: string) => {
    const response = await agentApi.post<{ message: string; data: AgentInquiry }>(
      `/agent/inquiries/${encodeURIComponent(id)}/activities/${encodeURIComponent(activityId)}/toggle`
    );
    return response.data;
  },

  getBookings: async (params: { status?: string; page: number; limit: number; propertyId?: string }) => {
    const response = await agentApi.get<{ data: AgentBooking[]; total: number }>("/agent/bookings", {
      params,
    });
    return response.data;
  },

  getBookingFilters: async () => {
    const response = await agentApi.get<{ filters: unknown[] }>("/agent/bookings/filters");
    return response.data;
  },

  getBooking: async (id: string) => {
    const response = await agentApi.get<AgentBooking>(`/agent/bookings/${encodeURIComponent(id)}`);
    return response.data;
  },

  createBooking: async (payload: AgentCreateBookingPayload) => {
    const response = await agentApi.post<{ message: string; data: AgentBooking }>("/agent/bookings", payload);
    return response.data;
  },

  recordBookingPayment: async (id: string, payload: AgentRecordBookingPaymentPayload) => {
    const response = await agentApi.post<{ message: string; data: AgentBooking }>(
      `/agent/bookings/${encodeURIComponent(id)}/payment`,
      payload
    );
    return response.data;
  },

  confirmBooking: async (id: string) => {
    const response = await agentApi.post<{ message: string; data: AgentBooking }>(
      `/agent/bookings/${encodeURIComponent(id)}/confirm`
    );
    return response.data;
  },

  rescheduleBooking: async (id: string, payload: AgentRescheduleBookingPayload) => {
    const response = await agentApi.post<{ message: string; data: AgentBooking }>(
      `/agent/bookings/${encodeURIComponent(id)}/reschedule`,
      payload
    );
    return response.data;
  },

  updateBookingDetails: async (id: string, payload: { meetingLink?: string }) => {
    const response = await agentApi.post<{ message: string; data: AgentBooking }>(
      `/agent/bookings/${encodeURIComponent(id)}/details`,
      payload
    );
    return response.data;
  },

  cancelBooking: async (id: string, reason: string) => {
    const response = await agentApi.post<{ message: string; data: AgentBooking }>(
      `/agent/bookings/${encodeURIComponent(id)}/cancel`,
      { reason }
    );
    return response.data;
  },

  recordBookingOutcome: async (id: string, payload: AgentBookingOutcomePayload) => {
    const response = await agentApi.post<{ message: string; data: AgentBooking }>(
      `/agent/bookings/${encodeURIComponent(id)}/outcome`,
      payload
    );
    return response.data;
  },

  getDeals: async (params: {
    page: number;
    limit: number;
    status?: string;
    [key: string]: string | number | undefined;
  }) => {
    const response = await agentApi.get<{
      data: AgentDeal[];
      total: number;
      counts: AgentDealCounts;
    }>("/agent/deals", { params });
    return response.data;
  },

  getDealFilters: async () => {
    const response = await agentApi.get<{ filters: AgentPayoutFilter[] }>("/agent/deals/filters");
    return response.data;
  },

  getDeal: async (id: string) => {
    const response = await agentApi.get<AgentDeal>(`/agent/deals/${encodeURIComponent(id)}`);
    return response.data;
  },

  startDeal: async (payload: AgentCreateDealPayload) => {
    const response = await agentApi.post<{ message: string; data: AgentDeal }>("/agent/deals", payload);
    return response.data;
  },

  getPayouts: async (params: {
    page: number;
    limit: number;
    status?: string;
    [key: string]: string | number | undefined;
  }) => {
    const response = await agentApi.get<{
      data: AgentPayout[];
      total: number;
      summary: AgentPayoutSummary;
    }>("/agent/payouts", { params });
    return response.data;
  },

  getPayoutFilters: async () => {
    const response = await agentApi.get<{ filters: AgentPayoutFilter[] }>("/agent/payouts/filters");
    return response.data;
  },

  getRatingSummary: async () => {
    const response = await agentApi.get<AgentRatingSummary>("/agent/ratings/summary");
    return response.data;
  },

  submitVerification: async (documents: AgentVerificationDocument[]) => {
    const response = await agentApi.post<AgentMessageResponse>("/agent/me/verification", { documents });
    return response.data;
  },
};

export const agentErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "We couldn't reach the server. Check your connection and try again.";

  const data = error.response.data as { message?: unknown; error?: unknown } | undefined;
  const message = typeof data?.message === "string" ? data.message : data?.error;
  if (typeof message === "string" && error.response.status < 500) return message;
  return fallback;
};
