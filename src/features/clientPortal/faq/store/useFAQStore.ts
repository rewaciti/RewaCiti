// /features/faq/store/useFAQStore.ts
import { create } from "zustand";
import axios from "axios";
import type { FAQ, FAQStore } from "../../../types";

export const useFAQStore = create<FAQStore>((set) => ({
  faq: [],  
  loading: false,
  page: 0,
  ITEMS_PER_PAGE: 3,

  fetchFAQs: async () => {
    set({ loading: true });
    try {
      const res = await axios.get<FAQ[]>("/data/FAQ.json"); // Correct JSON path
      set({ faq: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch FAQs", err);
      set({ loading: false });
    }
  },

  nextPage: () =>
    set((state) => ({
      page: Math.min(
        state.page + 1,
        Math.ceil(state.faq.length / state.ITEMS_PER_PAGE) - 1
      ),
    })),

  prevPage: () =>
    set((state) => ({
      page: Math.max(state.page - 1, 0),
    })),

  setPage: (page: number) => set({ page }),
}));
