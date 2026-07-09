import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  enabledModules: string[];
  emailVerified: boolean;
  status: string;
}

interface AuthStore {
  token: string | null;
  customer: Customer | null;
  isAuthenticated: boolean;
  companyId: string;

  setToken: (token: string | null) => void;
  setCustomer: (customer: Customer | null) => void;
  setCompanyId: (companyId: string) => void;
  logout: () => void;
}

const COMPANY_ID = "69f539b994273e659bef4dc4";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      isAuthenticated: false,
      companyId: COMPANY_ID,

      setToken: (token) =>
        set({
          token,
          isAuthenticated: !!token,
        }),

      setCustomer: (customer) =>
        set({
          customer,
          isAuthenticated: !!customer,
        }),

      setCompanyId: (companyId) =>
        set({
          companyId,
        }),

      logout: () =>
        set({
          token: null,
          customer: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
