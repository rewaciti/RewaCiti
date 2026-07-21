import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authAPI } from "../services/authAPI";
import { useAuthStore } from "../store/useAuthStore";
import Navbar from "../../../shared/components/Layout/Navbar";
// import Footer from "../../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";
import { FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const errorWithMessage = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return (
      errorWithMessage.response?.data?.message ||
      errorWithMessage.message ||
      fallback
    );
  }

  return fallback;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { companyId } = useAuthStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const resetEmail = sessionStorage.getItem("resetEmail");
    if (!resetEmail) {
      navigate("/auth/forgot-password");
      return;
    }
    setEmail(resetEmail);
  }, [navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const isFormValid =
    otp.join("").length === 6 &&
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    newPassword.length >= 8;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || !email) return;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword({
        companyId,
        email,
        otp: otp.join(""),
        newPassword,
      });

      toast.success("Password reset successfully!");
      sessionStorage.removeItem("resetEmail");
      navigate("/auth/login");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to reset password. Please try again."
      );
      toast.error(errorMessage);
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-300 dark:bg-black/30 min-h-screen flex flex-col">
      <Helmet>
        <title>Reset Password | RewaCiti</title>
        <meta
          name="description"
          content="Reset your RewaCiti account password."
        />
      </Helmet>

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] rounded-xl p-10 shadow-lg border border-gray-600/30">
          {/* Back Button */}
          <button
            onClick={() => navigate("/auth/forgot-password")}
            className="flex items-center gap-2 text-[#703BF7] hover:underline text-sm font-medium mb-6"
          >
            <FiArrowLeft size={16} />
            Back
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Your Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the reset code sent to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {email}
              </span>{" "}
              and your new password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Enter 6-digit reset code
              </label>

              <div className="flex gap-1 justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`reset-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-10 text-center text-2xl font-bold border-2 border-gray-600/30 dark:border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#703BF7]"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#703BF7] placeholder:text-[12px] dark:placeholder:text-gray-400 placeholder:text-gray-600"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {newPassword && newPassword.length < 8 && (
                <p className="text-red-500 text-xs mt-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#703BF7] placeholder:text-[12px] dark:placeholder:text-gray-400 placeholder:text-gray-600"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                !isFormValid || isLoading
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : "bg-[#703BF7] text-white hover:bg-[#5c2fe0]"
              }`}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default ResetPassword;
