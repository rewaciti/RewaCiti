import { once, realEstateApi } from "../../../shared/lib/realEstateApi";
import type { Booking, Contact, Sent, VisitMode, VisitSlot } from "../../../types/realEstate";

export interface BookingRequest extends Contact {
  propertyId: string;
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm, one of the free slots' `start`. */
  start: string;
  visitors?: number;
  mode?: VisitMode;
  /** Other listings to see in the same visit, for one fee. */
  alsoSee?: string[];
  message?: string;
}

export const visitsAPI = {
  /** Visit times on a day, in RewaCiti's time zone. Notice, hours and taken times are already applied. */
  slots: async (propertyId: string, date: string): Promise<VisitSlot[]> =>
    (await realEstateApi.get<{ slots: VisitSlot[] }>(`/properties/${propertyId}/slots`, { params: { date } })).data.slots,

  /** A visit with a fee is held until it's paid at `paymentLink` or with `invoiceId`. */
  book: async (body: BookingRequest, key: string): Promise<Sent<Booking>> =>
    (await realEstateApi.post<Sent<Booking>>("/bookings", body, once(key))).data,
};
