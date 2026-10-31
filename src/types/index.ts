import type { ListingCharge, ListingPurpose, PropertyLocations, PublicForms, PublicListingDetail, SharingType } from "./realEstate";

/** A listing as the pages show it, made from the Real Estate API by `toProperty`. */
export interface Property {
  id: string;
  slug: string;
  /** RewaCiti's own reference, e.g. RE-IFE-0012. */
  reference?: string;
  name: string;
  img: string;
  images: string[];
  description: string;
  bedrooms: number;
  bathrooms: number;
  /** The property type, e.g. "Self-contain". */
  category: string;
  purpose: ListingPurpose;
  /** The purpose in words, e.g. "For rent". */
  listingType: string;
  /** How long the price covers, e.g. "1 year" or "per month". Empty for a one-off price. */
  duration: string;
  sharing: SharingType;
  places: { total: number; left: number };
  /** Someone is paying for it right now. */
  reserved: boolean;
  /** Worked out by SabiFlow: the property cost, its charges and the service charge. */
  pricing: {
    base: number;
    charges: ListingCharge[];
    serviceCharge: number;
    total: number;
  };
  agentId: string | null;
  /** Only on the property page. Null when RewaCiti lists it itself. */
  agent?: PublicListingDetail["agent"];
  location: {
    state: string;
    city: string;
    area: string;
    /** The nearest university or landmark. */
    nearby: string;
  };
  /** 0 when there's no map pin. */
  geo_location: {
    lat: number;
    lng: number;
  };
  keyFeatures: string[];
  additionalFeatures: string[];
  billsAndCharges: string[];
  additionalBillsAndCharges: string[];
  rules: string[];
  additionalRules: string[];
  specialNotes: string[];
  specifications: { label: string; value: string }[];
  videoUrl?: string;
  /** The visit fee, service charge included. Null until the property page has loaded it. */
  visitationfee: number | null;
}

export interface PropertyStore {
  properties: Property[];
  loading: boolean;
  error: string | null;

  ITEMS_PER_PAGE: number;
  page: number;
  apiPage: number;
  totalProperties: number;
  filters: Record<string, string | number | boolean | undefined>;

  featuredProperties: Property[];
  featuredLoading: boolean;
  featuredError: string | null;
  fetchFeaturedProperties: () => Promise<void>;

  fetchProperties: (apiPage?: number, filters?: Record<string, string | number | boolean | undefined>) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  shortlistedProperties: Property[];
  fetchWishlist: () => Promise<void>;
  toggleShortlist: (property: Property) => Promise<void>;

  categories: Category[];
  categoriesLoading: boolean;
  fetchCategories: () => Promise<void>;

  /** Form fields, visit and payment rules, and which features RewaCiti has on. */
  forms: PublicForms | null;
  fetchForms: () => Promise<PublicForms | null>;

  /** Where there are listings, from state down to area. */
  locations: PropertyLocations["data"];
  fetchLocations: () => Promise<PropertyLocations["data"]>;

  relatedProperties: Property[];
  relatedPropertiesLoading: boolean;
  totalRelatedProperties: number;
  fetchRelatedProperties: (
    property: Property,
    sameAgentOnly?: boolean,
    page?: number,
    limit?: number
  ) => Promise<void>;

  currentProperty: Property | null;
  detailsLoading: boolean;
  fetchPropertyBySlug: (slug: string) => Promise<void>;
  clearCurrentProperty: () => void;

}

export interface Comment {
  id: number;
  rating: number;     
  summary: string;      
  description: string;  
  img: string;         
  name: string;         
  location: string;      
}

export interface CommentStore {
  comments: Comment[];
  loading: boolean;
  page: number;
  ITEMS_PER_PAGE: number;
  fetchComments: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

export interface FAQStore {
  faq: FAQ[];      
  loading: boolean;
  page: number;
  ITEMS_PER_PAGE: number;
  fetchFAQs: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface AreaMap {
  id: string;
  name: string;
  city: string;
  city_town?: string;
  state: string;
  areas: string[];
}

export interface ValueItem {
  id: number;
  title: string;
  description: string;
  icon: IconType; 
}
type IconType = "star" | "graduation" | "users" | "shield";

export interface Step {
  id: number;
  step: string;
  title: string;
  description: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  email?: string;
  linkedin?: string;
}

export interface AchievementItem {
  id: number;
  title: string;
  description: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  author: string;
  date: string;
  image: string;
  category: string;
  tags: string[];
}

export interface BlogStore {
  posts: BlogPost[];
  loading: boolean;
  page: number;
  ITEMS_PER_PAGE: number;
  fetchPosts: () => Promise<void>;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

export interface Category {
  _id: string;
  id: string;
  name: string;
  slug: string;
}
