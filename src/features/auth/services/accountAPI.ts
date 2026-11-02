import { realEstateApi } from "../../../shared/lib/realEstateApi";
import type { Booking, Deal, Paged, Sent } from "../../../types/realEstate";

interface CustomerContact {
  name: string;
  email?: string;
  phone?: string;
}

export interface AccountVisit extends Booking {
  alsoSee?: string[];
  meetingLink?: string | null;
  customer?: CustomerContact;
  customFields?: Record<string, unknown>;
  createdAt?: string;
  canCancel?: boolean;
  canReschedule?: boolean;
  cancelBlockedReason?: string | null;
  rescheduleBlockedReason?: string | null;
}

interface RescheduleVisitRequest {
  date: string;
  start: string;
}

interface CancelVisitRequest {
  reason: string;
}

export interface AccountInquiry {
  id: string;
  reference: string;
  status: string;
  propertyId: string;
  propertyTitle: string;
  customer: CustomerContact;
  message: string;
  createdAt: string;
}

export interface AccountRequest {
  id: string;
  reference: string;
  type: string;
  status: string;
  outcome: string | null;
  contact: CustomerContact;
  message: string;
  details: Record<string, unknown>;
  propertyId: string | null;
  createdAt: string;
}

export interface AccountDeal extends Deal {
  customer?: CustomerContact;
  closedAt?: string | null;
  held?: { label: string; amount: number }[];
  createdAt?: string;
}

const list = async <T,>(path: string) =>
  (await realEstateApi.get<Paged<T>>(path, { params: { limit: 50 } })).data.data;

export const accountAPI = {
  visits: () => list<AccountVisit>("/me/bookings"),
  rescheduleVisit: async (id: string, body: RescheduleVisitRequest) =>
    (await realEstateApi.post<Sent<AccountVisit>>(`/me/bookings/${encodeURIComponent(id)}/reschedule`, body)).data,
  cancelVisit: async (id: string, body: CancelVisitRequest) =>
    (await realEstateApi.post<Sent<AccountVisit>>(`/me/bookings/${encodeURIComponent(id)}/cancel`, body)).data,
  inquiries: () => list<AccountInquiry>("/me/inquiries"),
  requests: () => list<AccountRequest>("/me/requests"),
  deals: () => list<AccountDeal>("/me/deals"),
};
