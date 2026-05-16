import { create } from "zustand";
import type { Inspection, InspectionStore } from "../../../types";

export const useInspectionStore = create<InspectionStore>((set) => ({
  inspections: [],
  loading: false,

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
