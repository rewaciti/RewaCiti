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

interface AgentLoginResponse {
  token: string;
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

  updateMe: async (bio: string) => {
    const response = await agentApi.patch<AgentProfileUpdateResponse>("/agent/me", { bio });
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
};

export const agentErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "We couldn't reach the server. Check your connection and try again.";

  const data = error.response.data as { message?: unknown; error?: unknown } | undefined;
  const message = typeof data?.message === "string" ? data.message : data?.error;
  if (typeof message === "string" && error.response.status < 500) return message;
  return fallback;
};
