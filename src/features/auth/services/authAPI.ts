import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/useAuthStore";

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
  success?: boolean;
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
  success?: boolean;
  message: string;
  email: string;
  companyId?: string;
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
  success?: boolean;
  message: string;
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

export interface CustomerAddress {
  label?: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
  _id?: string;
}

export interface ProfileResponse {
  _id: string;
  companyId: string;
  type: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isIdentityVerified: boolean;
  enabledModules: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  addresses?: CustomerAddress[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  id: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profilePicture?: string;
  dateOfBirth?: string;
}

export interface UpdateProfileResponse {
  message: string;
  customer: ProfileResponse;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

export interface ChangePasswordResponse {
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
    const response = await axios.post(`${API_URL}/customers/register`, payload);
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

  // Get Customer Profile
  getProfile: async (): Promise<ProfileResponse> => {
    const token = useAuthStore.getState().token;
    const response = await axios.get(`${API_URL}/customers/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Update Customer Profile
  updateProfile: async (payload: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
    const token = useAuthStore.getState().token;
    const response = await axios.put(`${API_URL}/customers/profile`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Change Password
  changePassword: async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
    const token = useAuthStore.getState().token;
    const response = await axios.put(
      `${API_URL}/customers/change-password`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
