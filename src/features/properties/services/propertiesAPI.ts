import { once, realEstateApi } from "../../../shared/lib/realEstateApi";
import type {
  Contact,
  Paged,
  PropertyFilters,
  PropertyLocations,
  PropertyType,
  PublicForms,
  PublicListing,
  PublicListingDetail,
  PurchaseResult,
  Sent,
} from "../../../types/realEstate";

/** Search options for `GET /properties`, e.g. `{ city: "Ile-Ife", sharing: "shared_room" }`. */
export type PropertyQuery = Record<string, string | number | boolean | undefined>;

const path = (idOrSlug: string) => `/properties/${encodeURIComponent(idOrSlug)}`;

export const propertiesAPI = {
  list: async (query: PropertyQuery): Promise<Paged<PublicListing>> =>
    (await realEstateApi.get<Paged<PublicListing>>("/properties", { params: query })).data,

  /** By id or slug. */
  get: async (idOrSlug: string): Promise<PublicListingDetail> =>
    (await realEstateApi.get<PublicListingDetail>(path(idOrSlug))).data,

  /** Similar listings nearby, or with `sameAgent` the agent's other listings. */
  related: async (idOrSlug: string, sameAgent: boolean, limit = 50): Promise<PublicListing[]> =>
    (await realEstateApi.get<{ data: PublicListing[] }>(`${path(idOrSlug)}/related`, { params: { sameAgent, limit } })).data.data,

  /** What can be searched by right now, each with how many listings it finds. */
  filters: async (): Promise<PropertyFilters> =>
    (await realEstateApi.get<PropertyFilters>("/properties/filters")).data,

  /** Where there are listings, from state down to area. */
  locations: async (): Promise<PropertyLocations["data"]> =>
    (await realEstateApi.get<PropertyLocations>("/locations")).data.data,

  types: async (): Promise<PropertyType[]> =>
    (await realEstateApi.get<PropertyType[]>("/property-types")).data,

  /** Form fields, visit and payment rules, and which features are on. */
  forms: async (): Promise<PublicForms> =>
    (await realEstateApi.get<PublicForms>("/forms")).data,

  saved: async (): Promise<PublicListing[]> =>
    (await realEstateApi.get<{ data: PublicListing[] }>("/me/saved-properties")).data.data,

  save: async (id: string): Promise<PublicListing[]> =>
    (await realEstateApi.put<Sent<PublicListing[]>>(`/me/saved-properties/${id}`)).data.data,

  unsave: async (id: string): Promise<PublicListing[]> =>
    (await realEstateApi.delete<Sent<PublicListing[]>>(`/me/saved-properties/${id}`)).data.data,

  /** Holds a place while the customer pays. SabiFlow works out the amount. */
  purchase: async (idOrSlug: string, body: Contact & { plan?: "full" | "deposit" }, key: string): Promise<PurchaseResult> =>
    (await realEstateApi.post<PurchaseResult>(`${path(idOrSlug)}/purchase`, body, once(key))).data,
};
