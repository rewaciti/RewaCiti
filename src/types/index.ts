export interface Property {
  id: string;
  name: string;
  img: string;
  images: string[];
  description: string;
  bedrooms: number ;
  bathrooms: number | string;
  type: string;
  price: number;
  createdBy: number | string; 
  location: {
    area: string;
    city: string;
    state: string;
  };
  yearBuilt: number; 
  keyFeatures: string[]; 
  videoUrl?: string; 
}


export interface PropertyStore {
  properties: Property[];
  filteredProperties: Property[];
  loading: boolean;
  error: string | null;
  fees: PropertyPaymentFees | null;

  ITEMS_PER_PAGE: number;
  page: number;
  apiPage: number;
  totalProperties: number;

  fetchProperties: (apiPage?: number) => Promise<void>;
  fetchPropertyFees: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterProperties: (filters: {
    location?: string;
    propertyType?: string;
    priceRange?: string;
    rooms?: number;
    buildYear?: number;
  }) => void;
}

export interface PropertyPaymentFees {
  agent_fee_ranges: { min: number; max: number | null; percentage: number }[];
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
}

export interface AchievementItem {
  id: number;
  title: string;
  description: string;
}

export interface User {
  uid: string;
  email: string;
  isAdmin: boolean;
}

export interface SabiFlowProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  thumbnail: string;
  videoUrl?: string;
  productType?: string;
  categoryId?: {
    name: string;
  };
  createdBy?: string;
  customData?: {
    bedrooms?: number;
    bathrooms?: number|string;
    yearBuilt?: number;
    key_features_and_amenities?: string[];
    location?: {
      area?: string;
      city?: string;
      state?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Inspection {
  id: string;
  propertyId: string;
  propertyName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  amount: number;
  reference: string;
  location: string;
}

export type Fees = {
  [state: string]: {
    [area: string]: number;
  };
} & {
  default: number;
};

export interface InspectionStore {
  inspections: Inspection[];
  loading: boolean;
  fees: Fees | null;
  addInspection: (inspection: Omit<Inspection, "id" | "status" | "paymentStatus">) => void;
  updatePaymentStatus: (reference: string, status: "paid" | "failed") => void;
  fetchFees: () => Promise<void>;
}

