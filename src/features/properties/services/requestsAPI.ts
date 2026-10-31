import { once, realEstateApi } from "../../../shared/lib/realEstateApi";
import type { Contact, Sent } from "../../../types/realEstate";

// Everything people send RewaCiti. Each lands with the team in SabiFlow, on the
// customer's own record when they're signed in.

export interface PropertyRequest extends Contact {
  purpose?: string;
  typeId?: string;
  state?: string;
  city?: string;
  area?: string;
  nearby?: string;
  sharing?: "whole" | "shared_room" | "shared_apartment";
  bedrooms?: number;
  bathrooms?: number;
  maxBudget?: number;
  moveIn?: string;
  message?: string;
}

export interface CoRentRequest extends Contact {
  location: string;
  nearby?: string;
  gender?: "male" | "female";
  partnerGender?: "any" | "male" | "female";
  sharing?: "shared_room" | "shared_apartment";
  budgetPerPerson?: number;
  moveIn?: string;
  message?: string;
}

const send = async <T,>(url: string, body: object, key: string) =>
  (await realEstateApi.post<Sent<T>>(url, body, once(key))).data;

export const requestsAPI = {
  /** A question about one property. */
  inquiry: (body: Contact & { propertyId: string; message?: string }, key: string) => send("/inquiries", body, key),

  /** A general message. */
  contact: (body: Contact & { message: string; topic?: string; heardFrom?: string }, key: string) => send("/contact", body, key),

  /** What they're looking for. They're emailed when a listing fits. */
  propertyRequest: (body: PropertyRequest, key: string) => send("/property-requests", body, key),

  /** Someone to share a place with. */
  coRent: (body: CoRentRequest, key: string) => send("/co-rent-requests", body, key),

  /** Applying to list properties. */
  agentApplication: (body: Contact & { role: string; location: string; message?: string }, key: string) =>
    send("/agent-applications", body, key),

  /** A problem with the agent on a listing. */
  agentReport: (body: Contact & { propertyId: string; reason: string; message: string }, key: string) =>
    send("/agent-reports", body, key),

  /** Stars for a finished visit, or for a deal they've paid towards. Guests prove it's theirs with their email. */
  rating: async (body: { type: "visit" | "deal"; reference: string; email?: string; stars: number; comment?: string }) =>
    (await realEstateApi.post<Sent<{ id: string }>>("/ratings", body)).data,
};
