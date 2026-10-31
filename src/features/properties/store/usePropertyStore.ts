import { create } from "zustand";
import { toast } from "sonner";
import type { Property, PropertyStore } from "../../../types";
import type { PropertyLocations, PublicForms } from "../../../types/realEstate";
import { errorMessage } from "../../../shared/lib/realEstateApi";
import { useAuthStore } from "../../auth/store/useAuthStore";
import { propertiesAPI } from "../services/propertiesAPI";
import { toProperty } from "../services/toProperty";

// ---------------------------------------------------------------------------
// Caches that live for the visit
// ---------------------------------------------------------------------------

// The forms rarely change, so one request serves every page and modal
let formsRequest: Promise<PublicForms | null> | null = null;
let locationsRequest: Promise<PropertyLocations["data"]> | null = null;

// Related listings come in one go and are paged here. Holding the request lets
// several renders share one.
const relatedCache = new Map<string, Promise<Property[]>>();

// Only the newest search may fill the list: replies can arrive out of order
let listRequest = 0;

const withoutBlanks = (query: Record<string, string | number | boolean | undefined>) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ""));

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  featuredProperties: [],
  featuredLoading: false,
  featuredError: null,
  categories: [],
  categoriesLoading: false,
  forms: null,
  locations: [],
  relatedProperties: [],
  relatedPropertiesLoading: false,
  totalRelatedProperties: 0,
  currentProperty: null,
  detailsLoading: false,
  loading: false,
  error: null,

  ITEMS_PER_PAGE: 30,
  page: 0,
  apiPage: 1,
  totalProperties: 0,
  filters: {},

  fetchProperties: async (apiPage = 1, filters) => {
    const request = ++listRequest;
    set({ loading: true, error: null });

    try {
      const resolvedFilters = filters ?? get().filters;
      const { ITEMS_PER_PAGE } = get();
      const res = await propertiesAPI.list({ ...withoutBlanks(resolvedFilters), page: apiPage, limit: ITEMS_PER_PAGE });
      const properties = res.data.map((listing) => toProperty(listing));
      if (request !== listRequest) return;

      set({
        properties,
        loading: false,
        apiPage,
        page: apiPage - 1,
        totalProperties: res.total,
        filters: resolvedFilters,
      });
    } catch (err) {
      console.error(err);
      if (request !== listRequest) return;
      set({ error: "Failed to load property data", loading: false });
    }
  },

  fetchFeaturedProperties: async () => {
    // Skip if already loaded — avoid re-fetching on every home page visit
    if (get().featuredProperties.length > 0) return;
    set({ featuredLoading: true, featuredError: null });
    try {
      // Featured listings come first
      const res = await propertiesAPI.list({ page: 1, limit: 8 });
      set({
        featuredProperties: res.data.map((listing) => toProperty(listing)),
        featuredLoading: false,
        featuredError: null,
      });
    } catch (err) {
      console.error("Failed to fetch featured properties", err);
      set({
        featuredLoading: false,
        featuredError: errorMessage(err, "Failed to load featured properties."),
      });
    }
  },

  fetchCategories: async () => {
    if (get().categories.length > 0) return;
    set({ categoriesLoading: true });
    try {
      const types = await propertiesAPI.types();
      set({
        categories: types.map((type) => ({ _id: type.id, id: type.id, name: type.name, slug: type.slug })),
        categoriesLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({ categoriesLoading: false });
    }
  },

  fetchForms: () => {
    formsRequest ??= propertiesAPI
      .forms()
      .then((forms) => {
        set({ forms });
        return forms;
      })
      .catch((error) => {
        console.error("Failed to fetch forms", error);
        formsRequest = null;
        return null;
      });
    return formsRequest;
  },

  fetchLocations: () => {
    locationsRequest ??= propertiesAPI
      .locations()
      .then((locations) => {
        set({ locations });
        return locations;
      })
      .catch((error) => {
        console.error("Failed to fetch locations", error);
        locationsRequest = null;
        return [];
      });
    return locationsRequest;
  },

  fetchRelatedProperties: async (property: Property, sameAgentOnly = false, page = 1, limit = 30) => {
    const show = (all: Property[]) =>
      set({
        relatedProperties: all.slice((page - 1) * limit, page * limit),
        totalRelatedProperties: all.length,
        relatedPropertiesLoading: false,
      });

    const key = `${property.id}:${sameAgentOnly}`;
    let request = relatedCache.get(key);
    if (!request) {
      set({ relatedPropertiesLoading: true });
      request = propertiesAPI.related(property.id, sameAgentOnly).then((listings) => listings.map((listing) => toProperty(listing)));
      relatedCache.set(key, request);
    }

    try {
      show(await request);
    } catch (err) {
      console.error("Failed to fetch related properties:", err);
      relatedCache.delete(key);
      set({ relatedProperties: [], totalRelatedProperties: 0, relatedPropertiesLoading: false });
    }
  },

  fetchPropertyBySlug: async (slug: string) => {
    // Serve from cache first so back-navigation is instant,
    // but still revalidate in the background for fresh data.
    const { properties, relatedProperties, featuredProperties, currentProperty } = get();
    const cached =
      (currentProperty?.slug === slug ? currentProperty : null) ??
      properties.find((p) => p.slug === slug) ??
      relatedProperties.find((p) => p.slug === slug) ??
      featuredProperties.find((p) => p.slug === slug) ??
      null;

    if (cached) {
      set({ currentProperty: cached });
    } else {
      set({ detailsLoading: true, currentProperty: null });
    }

    try {
      const [listing, forms] = await Promise.all([propertiesAPI.get(slug), get().fetchForms()]);
      const mapped = toProperty(listing, forms?.property);
      set((state) => ({
        currentProperty: mapped,
        detailsLoading: false,
        // Upsert into the list cache so find() also works on revisit.
        properties: state.properties.some((p) => p.slug === mapped.slug)
          ? state.properties.map((p) => (p.slug === mapped.slug ? mapped : p))
          : [...state.properties, mapped],
      }));
    } catch (err) {
      console.error(`Failed to fetch property "${slug}":`, err);
      // If we had a cached copy, keep it; otherwise clear so UI shows Not Found.
      set({ detailsLoading: false, ...(cached ? {} : { currentProperty: null }) });
    }
  },

  clearCurrentProperty: () => set({ currentProperty: null, detailsLoading: false }),

  nextPage: () => {
    const { apiPage, totalProperties, ITEMS_PER_PAGE, fetchProperties, filters } = get();
    const maxPage = Math.max(1, Math.ceil(totalProperties / ITEMS_PER_PAGE));
    const nextPageNumber = Math.min(apiPage + 1, maxPage);

    if (nextPageNumber > apiPage) {
      set({ page: nextPageNumber - 1, apiPage: nextPageNumber });
      void fetchProperties(nextPageNumber, filters);
    }
  },

  prevPage: () => {
    const { apiPage, fetchProperties, filters } = get();
    const prevPageNumber = Math.max(apiPage - 1, 1);

    if (prevPageNumber < apiPage) {
      set({ page: prevPageNumber - 1, apiPage: prevPageNumber });
      void fetchProperties(prevPageNumber, filters);
    }
  },

  setPage: (page: number) => set({ page, apiPage: page + 1 }),

  shortlistedProperties: [],

  // Saved properties live on the customer's account, and only ones still on
  // the site come back.
  fetchWishlist: async () => {
    const { token, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !token) {
      set({ shortlistedProperties: [] });
      return;
    }

    try {
      const saved = await propertiesAPI.saved();
      set({ shortlistedProperties: saved.map((listing) => toProperty(listing)) });
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    }
  },

  toggleShortlist: async (property: Property) => {
    const { token, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !token) return;

    const previousShortlisted = get().shortlistedProperties;
    const isShortlisted = previousShortlisted.some((p) => p.id === property.id);
    set({
      shortlistedProperties: isShortlisted
        ? previousShortlisted.filter((p) => p.id !== property.id)
        : [property, ...previousShortlisted],
    });

    try {
      const saved = isShortlisted ? await propertiesAPI.unsave(property.id) : await propertiesAPI.save(property.id);
      set({ shortlistedProperties: saved.map((listing) => toProperty(listing)) });
    } catch (error) {
      console.error("Wishlist update failed:", error);
      set({ shortlistedProperties: previousShortlisted });
      toast.error(errorMessage(error, "Couldn't update wishlist. Please try again."));
    }
  },
}));
