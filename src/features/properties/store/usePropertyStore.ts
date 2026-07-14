import { create } from "zustand";
import axios from "axios";
import type { Property, PropertyStore, SabiFlowProduct, PropertyPaymentFees, Category, InventoryFilters } from "../../../types";
import { ensureHttps } from "../../../shared/lib/utils";

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  filteredProperties: [],
  categories: [],
  categoriesLoading: false,
  filtersData: null as InventoryFilters | null,
  filtersLoading: false,
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

      const properties: Property[] = res.data.data.map((item: SabiFlowProduct) => {
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
  toggleShortlist: (property: Property) => {
    set((state) => {
      const isShortlisted = state.shortlistedProperties.some((p) => p.id === property.id);
      if (isShortlisted) {
        return {
          shortlistedProperties: state.shortlistedProperties.filter((p) => p.id !== property.id),
        };
      }

      return {
        shortlistedProperties: [...state.shortlistedProperties, property],
      };
    });
  },

  filterProperties: (filters: {
    location?: string;
    category?: string;
    priceRange?: string;
    rooms?: number;
    buildYear?: number;
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
