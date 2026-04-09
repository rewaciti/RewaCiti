import { create } from "zustand";
import axios from "axios";
import type { Inspection, InspectionStore, Fees } from "../../../types";

export const useInspectionStore = create<InspectionStore>((set) => ({
  inspections: [],
  fees: null,
  loading: false,

  fetchFees: async () => {
    set({ loading: true });
    try {
      const res = await axios.get<Fees>("/data/InspectionFees.json");
      set({ fees: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch inspection fees", err);
      set({ loading: false });
    }
  },

  addInspection: (inspectionData) => {
    const newInspection: Inspection = {
      ...inspectionData,
      id: Math.random().toString(36).substring(7),
      status: "pending",
      paymentStatus: "pending",
    };
    set((state) => ({ inspections: [...state.inspections, newInspection] }));
  },

  updatePaymentStatus: (reference, status) => {
    set((state) => ({
      inspections: state.inspections.map((inspection) =>
        inspection.reference === reference
          ? { ...inspection, paymentStatus: status, status: status === "paid" ? "confirmed" : "pending" }
          : inspection
      ),
    }));
  },
}));
