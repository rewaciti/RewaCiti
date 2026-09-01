import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "{{url}}";
const COMPANY_SLUG = "rewacity";

export interface CustomFieldsResponse {
  bedrooms?: string[];
  bathrooms?: string[];
  "location.area"?: string[];
  "location.city_town"?: string[];
  "location.state"?: string[];
  "location.nearest_institution_in_full"?: string[];
  listing_type?: string[];
}

export interface LocationHierarchyItem {
  state: string;
  city: string;
  area: string;
  university?: string;
}

export const customFieldsAPI = {
  getFilterValues: async (): Promise<CustomFieldsResponse> => {
    const keys = [
      "bedrooms",
      "bathrooms",
      "location.area",
      "location.city_town",
      "location.state",
      "location.nearest_institution_in_full",
      "listing_type",
    ].join(",");

    const response = await axios.get<CustomFieldsResponse>(
      `${API_URL}/inventory/portal/${COMPANY_SLUG}/custom-fields/values`,
      {
        params: { keys },
      }
    );

    return response.data;
  },

  getLocationHierarchy: async (): Promise<LocationHierarchyItem[]> => {
    try {
      const response = await axios.get<{
        data?: Array<{
          customData?: {
            location?: {
              state?: string;
              city?: string;
              city_town?: string;
              area?: string;
              nearest_institution_in_full?: string;
            };
          };
        }>;
      }>(`${API_URL}/inventory/portal/${COMPANY_SLUG}/products`, {
        params: { limit: 200 },
      });

      const list: LocationHierarchyItem[] = [];
      (response.data?.data || []).forEach((item) => {
        const loc = item.customData?.location;
        if (loc) {
          const state = (loc.state || "").trim();
          const city = (loc.city_town || loc.city || "").trim();
          const area = (loc.area || "").trim();
          const university = (loc.nearest_institution_in_full || "").trim();
          if (state || city || area || university) {
            list.push({ state, city, area, university });
          }
        }
      });
      return list;
    } catch (error) {
      console.error("Failed to fetch location hierarchy from products:", error);
      return [];
    }
  },
};

