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

// Deduplicate values by normalizing to a canonical form (lowercase, no hyphens/spaces)
const deduplicateValues = (values: string[]): string[] => {
  const seen = new Map<string, string>(); // normalized -> original
  
  values.forEach((value) => {
    // Normalize: lowercase, remove hyphens/spaces for comparison only
    const normalized = value.toLowerCase().replace(/[\s-]/g, "").trim();
    
    // Keep the first occurrence (original format is preserved)
    if (!seen.has(normalized)) {
      seen.set(normalized, value);
    }
  });
  
  return Array.from(seen.values());
};

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

    const data = response.data;
    
    // Deduplicate all array fields
    return {
      bedrooms: data.bedrooms ? deduplicateValues(data.bedrooms) : undefined,
      bathrooms: data.bathrooms ? deduplicateValues(data.bathrooms) : undefined,
      "location.area": data["location.area"] ? deduplicateValues(data["location.area"]) : undefined,
      "location.city_town": data["location.city_town"] ? deduplicateValues(data["location.city_town"]) : undefined,
      "location.state": data["location.state"] ? deduplicateValues(data["location.state"]) : undefined,
      "location.nearest_institution_in_full": data["location.nearest_institution_in_full"] 
        ? deduplicateValues(data["location.nearest_institution_in_full"]) 
        : undefined,
      listing_type: data.listing_type ? deduplicateValues(data.listing_type) : undefined,
    };
  },
};
