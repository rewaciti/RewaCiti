import PaystackPop from "@paystack/inline-js";
import { realEstateApi } from "./realEstateApi";
import type { PaymentStart, Sent } from "../../types/realEstate";

/**
 * - `paid`: confirmed straight away
 * - `pending`: they paid, and it shows once the gateway tells SabiFlow
 * - `redirected`: sent to the invoice's own payment page
 */
export type PaymentOutcome = "paid" | "pending" | "cancelled" | "failed" | "redirected";

interface PayInvoiceOptions {
  invoiceId: string;
  /** Where the gateway sends their receipt. */
  email: string;
  /** The invoice's payment page, for when a popup isn't possible. */
  paymentLink?: string | null;
}

const goTo = (link: string): PaymentOutcome => {
  window.location.assign(link);
  return "redirected";
};

/**
 * Pays an invoice from a booking or purchase. Paystack opens in a popup on this
 * page; anything else goes to the invoice's payment page. The amount comes
 * from SabiFlow, never from the browser.
 */
export const payInvoice = async ({ invoiceId, email, paymentLink }: PayInvoiceOptions): Promise<PaymentOutcome> => {
  let start: PaymentStart;
  try {
    const { data } = await realEstateApi.post<Sent<PaymentStart>>("/payments/start", { invoiceId, customerEmail: email });
    start = data.data;
  } catch (error) {
    if (paymentLink) return goTo(paymentLink);
    throw error;
  }

  const accessCode = start.accessCode;
  if (start.provider !== "paystack" || !accessCode) {
    const link = start.authorizationUrl ?? paymentLink;
    if (link) return goTo(link);
    throw new Error("Online payment isn't available right now.");
  }

  return new Promise<PaymentOutcome>((resolve) => {
    new PaystackPop().resumeTransaction(accessCode, {
      onSuccess: async (transaction: { reference: string }) => {
        try {
          const { data } = await realEstateApi.post<Sent<{ paid: boolean }>>("/payments/verify", {
            invoiceId,
            reference: transaction.reference,
          });
          resolve(data.data.paid ? "paid" : "pending");
        } catch {
          // Paystack tells SabiFlow as well, so the payment still lands
          resolve("pending");
        }
      },
      onCancel: () => resolve("cancelled"),
      onError: () => resolve("failed"),
    });
  });
};
