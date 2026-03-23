// import { create } from "zustand";
// import axios from "axios";
// import type { Property, PropertyStore, SabiFlowProduct } from "../types";

// export const usePropertyStore = create<PropertyStore>((set) => ({
//   properties: [],
//   filteredProperties: [],
//   loading: false,
//   error: null,

//   ITEMS_PER_PAGE: 3,
//   page: 0,

//   fetchProperties: async () => {
//     set({ loading: true });

//     try {
//       const res = await axios.get<SabiFlowProduct[]>(
//         "https://api.sabiflow.com/api/inventory/portal/RewaCity/products"
//       );

//       const properties: Property[] = res.data.map((item) => ({
//         id: item._id,
//         title: item.name,
//         description: item.description,
//         price: item.price,
//         images: item.images,
//         thumbnail: item.thumbnail,
//         type: item.categoryId?.name || "",
//         location: item.specifications?.Location || "",
//         landSize: item.specifications?.["Land Size"] || "",
//         bedrooms: item.specifications?.Bedrooms || 0,
//         yearBuilt: item.createdAt
//           ? new Date(item.createdAt).getFullYear()
//           : null,
//       }));

//       set({
//         properties,
//         filteredProperties: properties,
//         loading: false,
//       });
//     } catch (error) {
//       console.error(error);
//       set({
//         error: "Failed to load property data",
//         loading: false,
//       });
//     }
//   },

//   nextPage: () =>
//     set((state) => {
//       const maxPage =
//         Math.ceil(state.filteredProperties.length / state.ITEMS_PER_PAGE) - 1;

//       return { page: Math.min(state.page + 1, maxPage) };
//     }),

//   prevPage: () =>
//     set((state) => ({
//       page: Math.max(state.page - 1, 0),
//     })),

//   setPage: (page: number) => set({ page }),

//   filterProperties: (filters) => {
//     set((state) => {
//       const filtered = state.properties.filter((p) => {
//         const priceNum = Number(p.price);

//         const [minPrice, maxPrice] = filters.priceRange
//           ? filters.priceRange.split("-").map(Number)
//           : [0, Infinity];

//         const locationMatch =
//           !filters.location ||
//           (p.location &&
//             p.location.toLowerCase().includes(filters.location.toLowerCase()));

//         return (
//           locationMatch &&
//           (!filters.propertyType || p.type === filters.propertyType) &&
//           (!filters.rooms || p.bedrooms === filters.rooms) &&
//           (!filters.buildYear || p.yearBuilt === filters.buildYear) &&
//           (!filters.priceRange ||
//             (maxPrice
//               ? priceNum >= minPrice && priceNum <= maxPrice
//               : priceNum >= minPrice))
//         );
//       });

//       return {
//         filteredProperties: filtered,
//         page: 0,
//       };
//     });
//   },
// }));



import { create } from "zustand";
import axios from "axios";
import type { Property, PropertyStore, SabiFlowProduct } from "../../../types";

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  filteredProperties: [], // new: filtered list
  loading: false,
  error: null,

  ITEMS_PER_PAGE: 3,
  page: 0,

  fetchProperties: async () => {
    set({ loading: true });

    try {
      const res = await axios.get<{ data: SabiFlowProduct[] }>(
        "https://api.sabiflow.com/api/inventory/portal/rewacity/products"
      );

      const properties: Property[] = res.data.data.map((item: SabiFlowProduct) => ({
        id: item._id,
        name: item.name,
        img: item.thumbnail || item.images[0] || "",
        images: item.images || [],
        description: item.description || "",
        bedrooms: item.customData?.bedrooms || 0,
        bathrooms: item.customData?.bathrooms || 0,
        type: item.productType || "Property",
        price: item.price || 0,
        createdBy: item.createdBy || "",
        location: {
          area: item.customData?.location?.area || "",
          city: item.customData?.location?.city || "",
          state: item.customData?.location?.state || "",
        },
        yearBuilt: item.customData?.yearBuilt || 0,
        keyFeatures: item.customData?.key_features_and_amenities || [],
        videoUrl: item.videoUrl || "",
      }));

      set({
        properties: properties,
        filteredProperties: properties,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      set({ error: "Failed to load property data", loading: false });
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

  // --- New: Filter properties ---
  filterProperties: (filters: {
    location?: string;
    propertyType?: string;
    priceRange?: string;
    rooms?: number;
    buildYear?: number;
  }) => {
    const { properties } = get();
    const filtered = properties.filter((p) => {
      const priceNum = Number(String(p.price).replace(/[^0-9]/g, ""));
      const [minPrice, maxPrice] = filters.priceRange
        ? filters.priceRange.split("-").map(Number)
        : [0, Infinity];

      const locationMatch =
        !filters.location ||
        (p.location &&
          ([p.location.area, p.location.city, p.location.state] as string[]).some(
            (v) => v === filters.location
          ));

      return (
        locationMatch &&
        (!filters.propertyType || p.type === filters.propertyType) &&
        (!filters.rooms || p.bedrooms === filters.rooms) &&
        // (!filters.buildYear || p.yearBuilt === filters.buildYear) &&
        (!filters.priceRange ||
          (maxPrice
            ? priceNum >= minPrice && priceNum <= maxPrice
            : priceNum >= minPrice))
      );
    });

    set({ filteredProperties: filtered, page: 0 }); // reset page to 0
  },
}));
