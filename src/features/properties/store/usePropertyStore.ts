import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner";
import type { Property, PropertyStore, SabiFlowProduct, PropertyPaymentFees, Category, InventoryFilters } from "../../../types";
import { ensureHttps } from "../../../shared/lib/utils";
import { useAuthStore } from "../../auth/store/useAuthStore";

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Returns the first truthy value, or "" if none are truthy. */
const firstTruthy = (...values: (string | undefined | null)[]): string =>
  values.find((v) => !!v) ?? "";

const readJSON = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Failed to read "${key}" from localStorage:`, error);
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write "${key}" to localStorage:`, error);
  }
};

// ---------------------------------------------------------------------------
// SabiFlow API client
// ---------------------------------------------------------------------------

const sabiFlowApi = axios.create({
  baseURL: "https://api.sabiflow.com/api/inventory/portal/rewacity",
});

// ---------------------------------------------------------------------------
// Property defaults
// ---------------------------------------------------------------------------

const emptyPricing = {
  LegalFee: 0,
  ServiceFee: 0,
  CautionFee: 0,
  PropertyCost: 0,
  AgentFee: 0,
  TotalCost: 0,
};

// Location fields are handled inline where needed; no global emptyLocation constant required.

const emptyGeoLocation = { lat: 0, lng: 0 };

// ---------------------------------------------------------------------------
// Wishlist metadata persistence (localStorage cache of name/slug/img/location
// so wishlist items still display nicely even if the API drops fields)
// ---------------------------------------------------------------------------

interface WishlistProductResponse {
  _id: string;
  name?: string;
  slug?: string;
  thumbnail?: string;
  images?: string[];
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  category?: string;
  categoryId?: { name?: string };
  customData?: {
    location?: {
      area?: string;
      city?: string;
      city_town?: string;
      state?: string;
      nearest_university?: string;
    };
    bedrooms?: number | null;
    bathrooms?: number | null;
  };
  pricing?: { TotalCost?: number };
}

interface WishlistResponse {
  products?: WishlistProductResponse[];
}

const WISHLIST_METADATA_STORAGE_KEY = "rewaciti_wishlist_metadata";

type WishlistMetadata = Partial<Pick<Property, "name" | "slug" | "img" | "location">>;
type WishlistMetadataMap = Record<string, WishlistMetadata>;

const readStoredWishlistMetadata = (): WishlistMetadataMap =>
  readJSON<WishlistMetadataMap>(WISHLIST_METADATA_STORAGE_KEY, {});

const writeStoredWishlistMetadata = (metadata: WishlistMetadataMap) =>
  writeJSON(WISHLIST_METADATA_STORAGE_KEY, metadata);

/** Fills in any missing name/slug/img/location fields on a property from cached metadata. */
const mergeWishlistMetadata = (property: Property, storedMetadata: WishlistMetadataMap): Property => {
  const saved = storedMetadata[property.id];
  if (!saved) return property;

  return {
    ...property,
    name: firstTruthy(property.name, saved.name),
    slug: firstTruthy(property.slug, saved.slug),
    img: firstTruthy(property.img, saved.img),
    location: {
      area: firstTruthy(property.location.area, saved.location?.area),
      city: firstTruthy(property.location.city, saved.location?.city),
      city_town: firstTruthy(property.location.city_town, saved.location?.city_town),
      state: firstTruthy(property.location.state, saved.location?.state),
      nearest_university: firstTruthy(property.location.nearest_university, saved.location?.nearest_university),
    },
  };
};

/** Builds the cached-metadata entry for a single property, preserving any existing fields. */
const buildWishlistMetadataEntry = (property: Property, existing: WishlistMetadata = {}): WishlistMetadata => ({
  name: firstTruthy(property.name, existing.name),
  slug: firstTruthy(property.slug, existing.slug),
  img: firstTruthy(property.img, existing.img),
  location: {
    area: firstTruthy(property.location?.area, existing.location?.area),
    city: firstTruthy(property.location?.city, existing.location?.city),
    city_town: firstTruthy(property.location?.city_town, existing.location?.city_town),
    state: firstTruthy(property.location?.state, existing.location?.state),
    nearest_university: firstTruthy(property.location?.nearest_university, existing.location?.nearest_university),
  },
});

const syncWishlistMetadata = (properties: Property[]) => {
  const storedMetadata = readStoredWishlistMetadata();
  const nextMetadata = properties.reduce<WishlistMetadataMap>((acc, property) => {
    acc[property.id] = buildWishlistMetadataEntry(property, storedMetadata[property.id]);
    return acc;
  }, {});

  writeStoredWishlistMetadata(nextMetadata);
};

/** Checks which wishlist product IDs still exist in the live inventory feed. */
const fetchAvailableWishlistIds = async (
  wishlistIds: string[],
  maxPages = 5,
  pageSize = 100
): Promise<Set<string>> => {
  const idsToFind = new Set(wishlistIds);
  const foundIds = new Set<string>();
  let page = 1;

  while (page <= maxPages && foundIds.size < idsToFind.size) {
    const res = await sabiFlowApi.get<{ data: SabiFlowProduct[]; total?: number }>("/products", {
      params: { page, limit: pageSize },
    });

    const data = res.data.data ?? [];
    data.forEach((item) => {
      if (idsToFind.has(item._id)) foundIds.add(item._id);
    });

    if (data.length < pageSize) break;
    page += 1;
  }

  return foundIds;
};

// ---------------------------------------------------------------------------
// Mappers: raw API shapes -> Property
// ---------------------------------------------------------------------------

const mapWishlistProductToProperty = (item: WishlistProductResponse): Property => ({
  ...item,
  id: item._id,
  img: item.thumbnail || item.images?.[0] || "",
  slug: item.slug || "",
  // Prefer the real product name; fall back to slug/id only if name is genuinely missing.
  name: item.name || item.slug || item._id,
  description: "",
  bedrooms: item.bedrooms ?? item.customData?.bedrooms ?? 0,
  bathrooms: item.bathrooms ?? item.customData?.bathrooms ?? 0,
  category: item.category || item.categoryId?.name || "",
  pricing: {
    ...emptyPricing,
    PropertyCost: item.price || 0,
    TotalCost: item.price || 0,
  },
 
  location: {
    area: item.customData?.location?.area || "",
    city: item.customData?.location?.city || "",
    city_town: item.customData?.location?.city_town || "",
    state: item.customData?.location?.state || "",
    nearest_university: item.customData?.location?.nearest_university || "",
  },
  geo_location: { ...emptyGeoLocation },
  yearBuilt: 0,
  keyFeatures: [],
  images: item.images ?? [],
  visitationfee: 0,
});

const mapSabiFlowProductsToProperties = (items: SabiFlowProduct[]): Property[] =>
  items.map((item) => {
    const customData = item.customData;
    const apiPricing = customData?.pricing;
    const itemSku = (item as SabiFlowProduct & { sku?: string }).sku;

    const propertyCost = apiPricing?.property_cost || 0;
    const agentFee = apiPricing?.agent_fee || 0;
    const legalFee = apiPricing?.legal_fee || 0;
    const cautionFee = apiPricing?.caution_fee || 0;

    const creatorClassification = firstTruthy(
      item.creatorClassification,
      typeof item.createdBy === "object" && item.createdBy !== null ? item.createdBy.classification ?? undefined : undefined,
      item.customData?.creatorClassification
    );

    // Agents get an extra 5% service fee on top of whatever the API returned.
    const isAgent = creatorClassification.toLowerCase() === "agent";
    const serviceFee = (apiPricing?.service_fee || 0) + (isAgent ? propertyCost * 0.05 : 0);

    const totalPrice = propertyCost + agentFee + legalFee + serviceFee + cautionFee;

    const normalizedCreatedBy =
      item.createdBy && typeof item.createdBy === "object"
        ? {
            _id: item.createdBy._id ?? "",
            id: item.createdBy.id ?? item.createdBy._id ?? "",
            firstName: item.createdBy.firstName ?? "",
            lastName: item.createdBy.lastName ?? "",
            classification: item.createdBy.classification ?? null,
          }
        : null;

    return {
      id: item._id,
      sku: itemSku,
      slug: item.slug,
      name: item.name,
      img: ensureHttps(item.thumbnail || item.images[0] || ""),
      images: (item.images || []).map(ensureHttps),
      description: item.description || "",
      bedrooms: customData?.bedrooms || 0,
      bathrooms: customData?.bathrooms || 0,
      category: item.categoryId?.name || "Property",
      duration: customData?.duration || "",
      rules: customData?.rules || [],
      pricing: {
        PropertyCost: propertyCost,
        AgentFee: agentFee,
        LegalFee: legalFee,
        ServiceFee: serviceFee,
        CautionFee: cautionFee,
        TotalCost: totalPrice || item.price || 0,
      },
      createdBy: normalizedCreatedBy,
      creatorClassification: creatorClassification || null,
      location: {
        area: customData?.location?.area || "",
        city: customData?.location?.city || "",
        city_town: customData?.location?.city_town || "",
        state: customData?.location?.state || "",
        nearest_university: customData?.location?.nearest_university || "",
      },
      geo_location: {
        lat: customData?.geo_location?.lat || 0,
        lng: customData?.geo_location?.lng || 0,
        address: customData?.geo_location?.address || "",
      },
      yearBuilt: customData?.yearBuilt || 0,
      keyFeatures: customData?.key_features_and_amenities || [],
      specialNotes: customData?.special_notes || [],
      specifications: [
        ...(item.specifications ? Object.entries(item.specifications).map(([label, value]) => ({ label, value })) : []),
        ...(customData?.specifications || []),
      ],
      videoUrl: ensureHttps(item.videoUrl || ""),
      caretakerContact: customData?.care_taker_contact_optional
        ? {
            whatsapp: customData.care_taker_contact_optional.wattsapp_contact,
            phone: customData.care_taker_contact_optional.call_contact,
          }
        : undefined,
      visitationfee: customData?.visitation_fee || 0,
    };
  });

/** Case-insensitive substring match across a property's searchable text fields. */
const propertyMatchesQuery = (property: Property, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    property.name.toLowerCase().includes(q) ||
    property.description.toLowerCase().includes(q) ||
    property.location.area.toLowerCase().includes(q) ||
    !!property.location.city_town?.toLowerCase().includes(q) ||
    property.location.state.toLowerCase().includes(q)
  );
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  filteredProperties: [],
  categories: [],
  categoriesLoading: false,
  filtersData: null as InventoryFilters | null,
  filtersLoading: false,
  relatedProperties: [],
  relatedPropertiesLoading: false,
  totalRelatedProperties: 0,
  loading: false,
  error: null,
  fees: null,

  ITEMS_PER_PAGE: 30,
  page: 0,
  apiPage: 1,
  totalProperties: 0,
  filters: {},

  fetchProperties: async (apiPage = 1, filters?: Record<string, string | number | undefined>) => {
    set({ loading: true, error: null });

    try {
      const resolvedFilters = filters ?? get().filters;
      const params = Object.entries(resolvedFilters).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = String(value);
        }
        return acc;
      }, {});

      const res = await sabiFlowApi.get<{ data: SabiFlowProduct[]; total?: number }>("/products", {
        params: { page: apiPage, limit: 30, ...params },
      });

      const properties = mapSabiFlowProductsToProperties(res.data.data);

      set({
        properties,
        filteredProperties: properties,
        loading: false,
        apiPage,
        page: apiPage - 1,
        totalProperties: res.data.total || properties.length,
        filters: resolvedFilters,
      });
    } catch (err) {
      console.error(err);
      set({ error: "Failed to load property data", loading: false });
    }
  },

  fetchPropertyFees: async () => {
    try {
      const res = await axios.get<PropertyPaymentFees>("/data/PropertyPaymentFees.json");
      set({ fees: res.data });
    } catch (err) {
      console.error("Failed to fetch property payment fees", err);
    }
  },

  fetchCategories: async () => {
    set({ categoriesLoading: true });
    try {
      const res = await sabiFlowApi.get<Category[]>("/categories");
      set({ categories: res.data, categoriesLoading: false });
    } catch (error) {
      console.error(error);
      set({ categoriesLoading: false });
    }
  },

  fetchFilters: async () => {
    set({ filtersLoading: true });
    try {
      const res = await sabiFlowApi.get("/filters");
      set({ filtersData: res.data, filtersLoading: false });
    } catch (err) {
      console.error(err);
      set({ filtersLoading: false });
    }
  },

  fetchRelatedProperties: async (property: Property, sameAgentOnly = false, page = 1, limit = 30) => {
    set({ relatedPropertiesLoading: true });

    try {
      let { categories } = get();
      if (!categories.length) {
        await get().fetchCategories();
        categories = get().categories;
      }

      const categoryId = categories.find(
        (c) => c.name.trim().toLowerCase() === property.category.trim().toLowerCase()
      )?.id;

      const agentId = property.createdBy?._id || property.createdBy?.id;

      const params: Record<string, string | number> = { page, limit };
      if (categoryId) params.categoryId = categoryId;
      if (property.location.state) params["customData.location.state"] = property.location.state;
      if (property.location.city_town) params["customData.location.city_town"] = property.location.city_town;
      if (sameAgentOnly && agentId) params.createdBy = agentId;

      const res = await sabiFlowApi.get<{ data: SabiFlowProduct[]; total?: number }>("/products", { params });

      const mappedProperties = mapSabiFlowProductsToProperties(res.data.data);
      const relatedProperties = mappedProperties.filter((p) => p.id !== property.id);
      const total = res.data.total ?? mappedProperties.length;

      set({ relatedProperties, totalRelatedProperties: total, relatedPropertiesLoading: false });
    } catch (err) {
      console.error("Failed to fetch related properties:", err);
      set({ relatedProperties: [], totalRelatedProperties: 0, relatedPropertiesLoading: false });
    }
  },

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

  searchQuery: "",
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    const { properties } = get();
    if (!query) {
      set({ filteredProperties: properties });
    } else {
      const filtered = properties.filter((p) => propertyMatchesQuery(p, query));
      set({ filteredProperties: filtered, page: 0 });
    }
  },

  shortlistedProperties: [],

  fetchWishlist: async () => {
    const { token, customer, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !customer || !token) {
      set({ shortlistedProperties: [] });
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "{{url}}";

    try {
      const response = await axios.get<WishlistResponse>(`${apiUrl}/customers/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const products = response.data?.products ?? [];
      const storedMetadata = readStoredWishlistMetadata();
      const mappedWishlist = products
        .map(mapWishlistProductToProperty)
        .map((property) => mergeWishlistMetadata(property, storedMetadata));

      const wishlistIds = mappedWishlist.map((property) => property.id);
      let availableInventoryIds = new Set<string>(wishlistIds);
      let shouldPreserveAll = false;

      try {
        availableInventoryIds = await fetchAvailableWishlistIds(wishlistIds);
      } catch (inventoryError) {
        console.warn("Wishlist availability lookup failed, keeping saved items for now:", inventoryError);
        shouldPreserveAll = true;
      }

      const nextShortlisted = shouldPreserveAll
        ? mappedWishlist
        : mappedWishlist.filter((property) => availableInventoryIds.has(property.id));

      if (!shouldPreserveAll && nextShortlisted.length < mappedWishlist.length) {
        const unavailableItems = mappedWishlist.filter((property) => !availableInventoryIds.has(property.id));
        await Promise.allSettled(
          unavailableItems.map((item) =>
            axios.delete(`${apiUrl}/customers/wishlist/${item.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      }

      syncWishlistMetadata(nextShortlisted);
      set({ shortlistedProperties: nextShortlisted });
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    }
  },

  toggleShortlist: async (property: Property) => {
    const { token, customer, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !customer || !token) return;

    const apiUrl = import.meta.env.VITE_API_URL || "{{url}}";
    const previousShortlisted = get().shortlistedProperties;
    const isShortlisted = previousShortlisted.some((p) => p.id === property.id);

    // Persist metadata immediately so location/name survive between sessions.
    const storedMetadata = readStoredWishlistMetadata();
    const nextStoredMetadata = {
      ...storedMetadata,
      [property.id]: buildWishlistMetadataEntry(property, storedMetadata[property.id]),
    };
    writeStoredWishlistMetadata(nextStoredMetadata);

    const enrichedProperty = mergeWishlistMetadata(property, nextStoredMetadata);
    const optimisticProperties = isShortlisted
      ? previousShortlisted.filter((p) => p.id !== property.id)
      : [...previousShortlisted, enrichedProperty];

    syncWishlistMetadata(optimisticProperties);
    set({ shortlistedProperties: optimisticProperties });

    try {
      if (isShortlisted) {
        await axios.delete(`${apiUrl}/customers/wishlist/${property.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${apiUrl}/customers/wishlist`,
          { productId: property.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Wishlist update failed:", error);
      set({ shortlistedProperties: previousShortlisted });
      toast.error("Couldn't update wishlist. Please try again.");
    }
  },

  filterProperties: (filters: {
    location?: string;
    category?: string;
    priceRange?: string;
    rooms?: number;
  }) => {
    const { properties, searchQuery } = get();

    const filtered = properties.filter((p) => {
      const [minPrice, maxPrice] = filters.priceRange ? filters.priceRange.split("-").map(Number) : [0, Infinity];
      const price = p.pricing.TotalCost;

      const locationMatch =
        !filters.location ||
        [p.location.area, p.location.city_town, p.location.state].some((v) => v === filters.location);

      return (
        locationMatch &&
        propertyMatchesQuery(p, searchQuery) &&
        (!filters.category || p.category === filters.category) &&
        (!filters.rooms || p.bedrooms === filters.rooms) &&
        (!filters.priceRange || (maxPrice ? price >= minPrice && price <= maxPrice : price >= minPrice))
      );
    });

    set({ filteredProperties: filtered, page: 0 });
  },
}));