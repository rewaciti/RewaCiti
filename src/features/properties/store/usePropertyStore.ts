import { create } from "zustand";
import axios from "axios";
import type { Property, PropertyStore, SabiFlowProduct, PropertyPaymentFees } from "../../../types";

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  filteredProperties: [], // new: filtered list
  loading: false,
  error: null,
  fees: null,

  ITEMS_PER_PAGE: 3,
  page: 0,
  apiPage: 1,
  totalProperties: 0,

  fetchProperties: async (apiPage = 1) => {
    set({ loading: true });

    try {
      const res = await axios.get<{ data: SabiFlowProduct[]; total?: number }>(
        `https://api.sabiflow.com/api/inventory/portal/rewacity/products?page=${apiPage}&limit=30`
      );

      const properties: Property[] = res.data.data.map((item: SabiFlowProduct) => {
        const customData = item.customData;
        const apiPricing = customData?.pricing;

        const propertyCost = apiPricing?.property_cost || 0;
        const agentFee = apiPricing?.agent_fee || 0;
        const legalFee = apiPricing?.legal_fee || 0;
        const serviceFee = apiPricing?.service_fee || 0;
        const cautionFee = apiPricing?.caution_fee || 0;
        
        const totalPrice = propertyCost + agentFee + legalFee + serviceFee + cautionFee;

        return {
          id: item._id,
          name: item.name,
          img: item.thumbnail || item.images[0] || "",
          images: item.images || [],
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
            TotalCost: totalPrice || item.price || 0
          },
          createdBy: item.createdBy || "",
          location: {
            area: customData?.location?.area || "",
            city: customData?.location?.city || "",
            state: customData?.location?.state || "",
          },
          geo_location: {
            lat: customData?.geo_location?.lat || 0,
            lng: customData?.geo_location?.lng || 0,
            address: customData?.geo_location?.address || "",
          },
          yearBuilt: customData?.yearBuilt || 0,
          keyFeatures: customData?.key_features_and_amenities || [],
          attributes: [
            ...(item.specifications ? Object.entries(item.specifications).map(([label, value]) => ({ label, value })) : []),
            ...(customData?.attributes || [])
          ],
          videoUrl: item.videoUrl || "",
        };
      });

      const { searchQuery } = get();
      let filtered = properties;
      if (searchQuery) {
        filtered = properties.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.state.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      set({
        properties: properties,
        filteredProperties: filtered,
        loading: false,
        apiPage: apiPage,
        totalProperties: res.data.total || properties.length,
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

  nextPage: () =>
    set((state) => {
      const maxPage =
        Math.ceil(state.filteredProperties.length / state.ITEMS_PER_PAGE) - 1;

      return { page: Math.min(state.page + 1, maxPage) };
    }),

  prevPage: () =>
    set((state) => {
      return { page: Math.max(state.page - 1, 0) };
    }),

  setPage: (page: number) => set({ page }),

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
        p.location.city.toLowerCase().includes(query.toLowerCase()) ||
        p.location.state.toLowerCase().includes(query.toLowerCase())
      );
      set({ filteredProperties: filtered, page: 0 });
    }
  },

  // --- New: Filter properties ---
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
          ([p.location.area, p.location.city, p.location.state] as string[]).some(
            (v) => v === filters.location
          ));
      
      const searchMatch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    set({ filteredProperties: filtered, page: 0 }); // reset page to 0
  },
}));
