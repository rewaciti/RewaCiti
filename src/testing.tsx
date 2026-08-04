import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner";
import type { Property, PropertyStore, SabiFlowProduct, PropertyPaymentFees, Category, InventoryFilters } from "../../../types";
import { ensureHttps } from "../../../shared/lib/utils";
import { useAuthStore } from "../../auth/store/useAuthStore";

interface WishlistProductResponse {
  _id: string;
  slug?: string;
  thumbnail?: string;
  images?: string[];
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  category?: string;
  categoryId?: { name?: string };
  location?: { area?: string; city?: string; city_town?: string; state?: string };
  pricing?: { TotalCost?: number };
}

interface WishlistResponse {
  products?: WishlistProductResponse[];
}

const WISHLIST_METADATA_STORAGE_KEY = "rewaciti_wishlist_metadata";

type WishlistMetadata = Partial<Pick<Property, "name" | "slug" | "img" | "location">>;

const readStoredWishlistMetadata = (): Record<string, WishlistMetadata> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(WISHLIST_METADATA_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch (error) {
    console.error("Failed to read wishlist metadata:", error);
    return {};
  }
};

const writeStoredWishlistMetadata = (metadata: Record<string, WishlistMetadata>) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WISHLIST_METADATA_STORAGE_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error("Failed to save wishlist metadata:", error);
  }
};

const mergeWishlistMetadata = (property: Property, storedMetadata: Record<string, WishlistMetadata>): Property => {
  const savedMetadata = storedMetadata[property.id];

  if (!savedMetadata) {
    return property;
  }

  const mergedArea =
    property.location.area ||
    savedMetadata.location?.area ||
    savedMetadata.location?.city_town ||
    savedMetadata.location?.city ||
    "";

  const mergedCity =
    property.location.city ||
    property.location.city_town ||
    savedMetadata.location?.city ||
    savedMetadata.location?.city_town ||
    savedMetadata.location?.area ||
    "";

  const mergedCityTown =
    property.location.city_town ||
    property.location.city ||
    savedMetadata.location?.city_town ||
    savedMetadata.location?.city ||
    savedMetadata.location?.area ||
    "";

  return {
    ...property,
    name: property.name || savedMetadata.name || "",
    slug: property.slug || savedMetadata.slug || "",
    img: property.img || savedMetadata.img || "",
    location: {
      area: mergedArea,
      city: mergedCity,
      city_town: mergedCityTown,
      state: property.location.state || savedMetadata.location?.state || "",
      nearest_university: property.location.nearest_university || savedMetadata.location?.nearest_university || "",
    },
  };
};

const syncWishlistMetadata = (properties: Property[]) => {
  const storedMetadata = readStoredWishlistMetadata();
  const nextMetadata = properties.reduce<Record<string, WishlistMetadata>>((acc, property) => {
    const mergedProperty = mergeWishlistMetadata(property, storedMetadata);

    acc[property.id] = {
      ...storedMetadata[property.id],
      name: mergedProperty.name,
      slug: mergedProperty.slug,
      img: mergedProperty.img,
      location: { ...mergedProperty.location },
    };
    return acc;
  }, {});

  writeStoredWishlistMetadata(nextMetadata);
};

const fetchAvailableWishlistIds = async (
  wishlistIds: string[],
  maxPages = 5,
  pageSize = 100
): Promise<Set<string>> => {
  const inventoryUrl = "https://api.sabiflow.com/api/inventory/portal/rewacity/products";
  const idsToFind = new Set(wishlistIds);
  const foundIds = new Set<string>();
  let page = 1;

  while (page <= maxPages && foundIds.size < idsToFind.size) {
    const res = await axios.get<{ data: SabiFlowProduct[]; total?: number }>(inventoryUrl, {
      params: { page, limit: pageSize },
    });

    const data = res.data.data ?? [];
    data.forEach((item) => {
      if (idsToFind.has(item._id)) {
        foundIds.add(item._id);
      }
    });

    if (data.length < pageSize) {
      break;
    }

    page += 1;
  }

  return foundIds;
};

const mapWishlistProductToProperty = (item: WishlistProductResponse): Property => ({
  ...item,
  id: item._id,
  img: item.thumbnail || item.images?.[0] || "",
  slug: item.slug || "",
  name: item.slug || item._id,
  description: "",
  bedrooms: item.bedrooms ?? 0,
  bathrooms: item.bathrooms ?? 0,
  category: item.category || item.categoryId?.name || "",
  pricing: {
    LegalFee: 0,
    ServiceFee: 0,
    CautionFee: 0,
    PropertyCost: item.price || 0,
    AgentFee: 0,
    TotalCost: item.price || 0,
  },
  location: {
    area: item.location?.area || "",
    city:
      item.location?.city_town ||
      item.location?.city ||
      item.location?.area ||
      "",
    city_town:
      item.location?.city_town ||
      item.location?.city ||
      item.location?.area ||
      "",
    state: item.location?.state || "",
  },
  geo_location: { lat: 0, lng: 0 },
  yearBuilt: 0,
  keyFeatures: [],
  images: item.images ?? [],
  visitationfee: 0,
});

const mapSabiFlowProductsToProperties = (items: SabiFlowProduct[]): Property[] =>
  items.map((item: SabiFlowProduct) => {
    const customData = item.customData;
    const apiPricing = customData?.pricing;
    const itemSku = (item as SabiFlowProduct & { sku?: string }).sku;

    const propertyCost = apiPricing?.property_cost || 0;
    const agentFee = apiPricing?.agent_fee || 0;
    const legalFee = apiPricing?.legal_fee || 0;
    let serviceFee = apiPricing?.service_fee || 0;
    const cautionFee = apiPricing?.caution_fee || 0;

    const creatorClassification =
      item.creatorClassification ||
      (typeof item.createdBy === "object" && item.createdBy !== null
        ? item.createdBy.classification
        : undefined) ||
      item.customData?.creatorClassification;

    if (creatorClassification?.toLowerCase() === "agent") {
      serviceFee += propertyCost * 0.05;
    }

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
    console.log("Fetching properties with filters:", filters, "and apiPage:", apiPage);

    try {
      const resolvedFilters = filters ?? get().filters;
      const params = Object.entries(resolvedFilters).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value === undefined || value === null || value === "") {
          return acc;
        }

        acc[key] = String(value);
        return acc;
      }, {});


      const res = await axios.get<{ data: SabiFlowProduct[]; total?: number }>(
        "https://api.sabiflow.com/api/inventory/portal/rewacity/products",
        {
          params: { page: apiPage, limit: 30, ...params },
        }
      );

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
    try {
      set({ categoriesLoading: true });

      const res = await axios.get<Category[]>(
        "https://api.sabiflow.com/api/inventory/portal/rewacity/categories"
      );

      set({
        categories: res.data,
        categoriesLoading: false,
      });
    } catch (error) {
      console.error(error);

      set({
        categoriesLoading: false,
      });
    }
  },

  fetchFilters: async () => {
    try {
      set({ filtersLoading: true });

      const res = await axios.get(
        "https://api.sabiflow.com/api/inventory/portal/rewacity/filters"
      );
      console.log("Fetched filters data:", res.data);
      set({
        filtersData: res.data,
        filtersLoading: false,
      });

    } catch (err) {
      console.error(err);
      set({ filtersLoading: false });
    }
  },

  fetchRelatedProperties: async (
    property: Property,
    sameAgentOnly = false,
    page = 1,
    limit = 30
  ) => {
    set({ relatedPropertiesLoading: true });

    try {
      let { categories } = get();

      // Load categories if needed
      if (!categories.length) {
        await get().fetchCategories();
        categories = get().categories;
      }

      // Find the category id
      const categoryId = categories.find(
        (c) =>
          c.name.trim().toLowerCase() ===
          property.category.trim().toLowerCase()
      )?.id;

      const agentId =
        property.createdBy?._id || property.createdBy?.id;

      const params: Record<string, string | number> = {
        page,
        limit
      };

      if (categoryId) {
        params.categoryId = categoryId;
      }

      if (property.location.state) {
        params["customData.location.state"] =
          property.location.state;
      }

      if (property.location.city_town) {
        params["customData.location.city_town"] =
          property.location.city_town;
      }

      if (sameAgentOnly && agentId) {
        params.createdBy = agentId;
      }

      console.log("Related Properties Params:", params);

      const res = await axios.get<{
        data: SabiFlowProduct[];
        total?: number;
      }>(
        "https://api.sabiflow.com/api/inventory/portal/rewacity/products",
        {
          params,
        }
      );

      console.log("Related Properties Response:", res.data);

      const mappedProperties = mapSabiFlowProductsToProperties(res.data.data);
      const relatedProperties = mappedProperties.filter((p) => p.id !== property.id);
      const total = res.data.total !== undefined ? res.data.total : mappedProperties.length;

      set({
        relatedProperties,
        totalRelatedProperties: total,
        relatedPropertiesLoading: false,
      });
    } catch (err) {
      console.error("Failed to fetch related properties:", err);

      set({
        relatedProperties: [],
        totalRelatedProperties: 0,
        relatedPropertiesLoading: false,
      });
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
      const filtered = properties.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.location.area.toLowerCase().includes(query.toLowerCase()) ||
        p.location.city_town?.toLowerCase().includes(query.toLowerCase()) ||
        p.location.state.toLowerCase().includes(query.toLowerCase())
      );
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
        availableInventoryIds = await fetchAvailableWishlistIds(wishlistIds, 5, 100);
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

    if (!isAuthenticated || !customer || !token) {
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "{{url}}";
    const isShortlisted = get().shortlistedProperties.some((p) => p.id === property.id);
    const previousShortlisted = get().shortlistedProperties;
    const storedMetadata = readStoredWishlistMetadata();

    // Ensure we persist location and basic metadata for this property
    const existingMeta = storedMetadata[property.id] || {};
    const nextMetaForProperty = {
      ...existingMeta,
      name: property.name || existingMeta.name || "",
      slug: property.slug || existingMeta.slug || "",
      img: property.img || existingMeta.img || "",
      location: {
        area: property.location?.area || existingMeta.location?.area || "",
        city: property.location?.city || existingMeta.location?.city || existingMeta.location?.city_town || "",
        city_town: property.location?.city_town || existingMeta.location?.city_town || existingMeta.location?.city || "",
        state: property.location?.state || existingMeta.location?.state || "",
        nearest_university: property.location?.nearest_university || existingMeta.location?.nearest_university || "",
      },
    };

    const nextStoredMetadata = {
      ...storedMetadata,
      [property.id]: nextMetaForProperty,
    };

    // Write immediate metadata so location is preserved between sessions
    writeStoredWishlistMetadata(nextStoredMetadata);

    const enrichedProperty = mergeWishlistMetadata(property, nextStoredMetadata);

    const optimisticProperties = isShortlisted
      ? previousShortlisted.filter((p) => p.id !== property.id)
      : [...previousShortlisted, enrichedProperty];

    // Sync metadata for the whole wishlist and update state optimistically
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
      const priceNum = Number(String(p.pricing.TotalCost).replace(/[^0-9]/g, ""));
      const [minPrice, maxPrice] = filters.priceRange
        ? filters.priceRange.split("-").map(Number)
        : [0, Infinity];

      const locationMatch =
        !filters.location ||
        (p.location &&
          ([p.location.area, p.location.city_town, p.location.state] as (string | undefined)[]).some(
            (v) => v === filters.location
          ));

      const searchMatch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.city_town?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.state.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        locationMatch &&
        searchMatch &&
        (!filters.category || p.category === filters.category) &&
        (!filters.rooms || p.bedrooms === filters.rooms) &&
        (!filters.priceRange ||
          (maxPrice
            ? priceNum >= minPrice && priceNum <= maxPrice
            : priceNum >= minPrice))
      );
    });

    set({ filteredProperties: filtered, page: 0 });
  },

}));
