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
};
