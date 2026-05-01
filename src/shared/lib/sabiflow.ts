import axios from "axios";

const SABIFLOW_BASE_URL = import.meta.env.VITE_SABIFLOW_BASE_URL || "https://api.sabiflow.com/api";
const SABIFLOW_API_KEY = import.meta.env.VITE_SABIFLOW_API_KEY || "sk_live_a3dd9f88b7981065154a172f23eb4dbb826e40c21cf8d20c8da6cf74d1444597";
export const DEFAULT_GATEWAY_ID = import.meta.env.VITE_PAYSTACK_GATEWAY_ID || "69ed740cc09e9388ba096d02";

const sabiflowApi = axios.create({
  baseURL: SABIFLOW_BASE_URL,
  headers: {
    "x-api-key": SABIFLOW_API_KEY,
    "Content-Type": "application/json",
  },
});

export interface CustomerDetails {
  name: string;
  email: string;
  address: string;
  phone: string;
}

export interface SaleItem {
  description: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId?: string;
}

export interface CreateSalePayload {
  initiateInvoice: boolean;
  gatewayId: string;
  items: SaleItem[];
  taxRate: number;
  notes: string;
  paymentMethod: "cash" | "transfer" | "credit_card";
  customerDetails: CustomerDetails;
}

export const createSale = async (payload: CreateSalePayload) => {
  console.log("Creating Sale with payload:", payload);
  try {
    const res = await sabiflowApi.post("/sales", payload);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Sabiflow API Error (Create Sale):", error.response.data);
    }
    throw error;
  }
};

export const initiatePayment = async (saleId: string, gatewayId: string) => {
  console.log("Initiating Payment for Sale:", saleId, "Gateway:", gatewayId);
  try {
    const res = await sabiflowApi.post(`/sales/${saleId}/payment/initiate`, {
      gatewayId,
    });
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Sabiflow API Error (Initiate Payment):", error.response.data);
    }
    throw error;
  }
};

export const verifyPayment = async (saleId: string) => {
  const res = await sabiflowApi.post(`/sales/${saleId}/payment/verify`, {});
  return res.data;
};

export const getReceiptUrl = (saleId: string, format: "pdf" | "image" = "pdf") => {
  return `${SABIFLOW_BASE_URL}/sales/${saleId}/invoice/download?format=${format}`;
};

export const downloadReceipt = async (saleId: string, format: "pdf" | "image" = "pdf") => {
    const response = await sabiflowApi.get(`/sales/${saleId}/invoice/download`, {
        params: { format },
        responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `receipt_${saleId}.${format === 'pdf' ? 'pdf' : 'png'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
