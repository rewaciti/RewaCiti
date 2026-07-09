import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "{{url}}";

interface ErrorResponse {
  message?: string;
  error?: string;
}

export type AuthError = AxiosError<ErrorResponse> | Error;

interface LoginPayload {
  companyId: string;
  email: string;
  password: string;
}

interface SignUpPayload {
  companyId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

interface VerifyEmailPayload {
  companyId: string;
  email: string;
  otp: string;
}

interface ResendOTPPayload {
  companyId: string;
  email: string;
}

interface ForgotPasswordPayload {
  companyId: string;
  email: string;
}

interface ResetPasswordPayload {
  companyId: string;
  email: string;
  otp: string;
  newPassword: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    enabledModules: string[];
    emailVerified: boolean;
    status: string;
  };
}

interface SignUpResponse {
  success: boolean;
  message: string;
  email: string;
}

interface VerifyEmailResponse {
  message: string;
  token: string;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    enabledModules: string[];
    emailVerified: boolean;
    status: string;
  };
}

interface ResendOTPResponse {
  success: boolean;
  message: string;
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

export const authAPI = {
  // Login
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await axios.post(`${API_URL}/customers/login`, payload);
    return response.data;
  },

  // Sign Up
  signUp: async (payload: SignUpPayload): Promise<SignUpResponse> => {
    const response = await axios.post(`${API_URL}/customers/sign-up`, payload);
    return response.data;
  },

  // Verify Email with OTP
  verifyEmail: async (payload: VerifyEmailPayload): Promise<VerifyEmailResponse> => {
    const response = await axios.post(
      `${API_URL}/customers/verify-email`,
      payload
    );
    return response.data;
  },

  // Resend OTP
  resendOTP: async (payload: ResendOTPPayload): Promise<ResendOTPResponse> => {
    const response = await axios.post(
      `${API_URL}/customers/resend-verification-otp`,
      payload
    );
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (
    payload: ForgotPasswordPayload
  ): Promise<ForgotPasswordResponse> => {
    const response = await axios.post(
      `${API_URL}/customers/forgot-password`,
      payload
    );
    return response.data;
  },

  // Reset Password
  resetPassword: async (
    payload: ResetPasswordPayload
  ): Promise<ResetPasswordResponse> => {
    const response = await axios.post(
      `${API_URL}/customers/reset-password`,
      payload
    );
    return response.data;
  },
};
