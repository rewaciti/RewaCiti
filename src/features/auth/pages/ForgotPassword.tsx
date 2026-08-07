import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { authAPI } from "../services/authAPI";
import { useAuthStore } from "../store/useAuthStore";
import Navbar from "../../../shared/components/Layout/Navbar";
// import Footer from "../../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";
import { FiArrowLeft } from "react-icons/fi";

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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { companyId } = useAuthStore();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [hasSentCode, setHasSentCode] = useState(false);

  const isEmailValid = email && email.includes("@");
  const isOtpComplete = otp.join("").length === 6;

  const sendResetCode = useCallback(async () => {
    if (!isEmailValid || hasSentCode || isLoading) return;

    setFormError("");
    setIsLoading(true);

    try {
      await authAPI.forgotPassword({
        companyId,
        email,
      });

      toast.success("Reset code sent to your email!");
      sessionStorage.setItem("resetEmail", email);
      setHasSentCode(true);
      setStep("otp");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to send reset code. Please try again."
      );
      setFormError(errorMessage);
      toast.error(errorMessage);
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, email, hasSentCode, isEmailValid, isLoading]);

  const handleResendCode = async () => {
    if (!isEmailValid || isLoading) return;

    setFormError("");
    setIsResending(true);

    try {
      await authAPI.forgotPassword({
        companyId,
        email,
      });

      toast.success("Reset code resent to your email!");
      setHasSentCode(true);
      setOtp(["", "", "", "", "", ""]);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to resend reset code. Please try again."
      );
      setFormError(errorMessage);
      toast.error(errorMessage);
      console.error("Resend reset code error:", error);
    } finally {
      setIsResending(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetCode();
  };

  const handleVerifyOtp = () => {
    if (!isOtpComplete) {
      setFormError("Please enter all 6 digits of the code.");
      return;
    }

    setFormError("");
    sessionStorage.setItem("resetEmail", email);
    sessionStorage.setItem("resetOtp", otp.join(""));
    navigate("/auth/reset-password");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  useEffect(() => {
    if (step === "otp") {
      const firstInput = document.getElementById("otp-0");
      firstInput?.focus();
    }
  }, [step]);

  return (
    <div className="bg-gray-300 dark:bg-black/30 min-h-screen flex flex-col">
      <Helmet>
        <title>Forgot Password | RewaCiti</title>
        <meta
          name="description"
          content="Reset your RewaCiti account password."
        />
      </Helmet>

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-xl p-10 shadow-lg border border-gray-600/30">
          {/* Back Button */}
          <button
            onClick={() => navigate("/auth/login")}
            className="flex items-center gap-2 text-[#703BF7] hover:underline text-sm font-medium mb-6"
          >
            <FiArrowLeft size={16} />
            Back to Login
          </button>

          {step === "email" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Forgot Password?
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your email address and we'll send you a code to reset
                  your password.
                </p>
              </div>

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFormError("");
                      setHasSentCode(false);
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="w-full px-4 py-2 border border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#703BF7] placeholder:text-[12px] dark:placeholder:text-gray-400 placeholder:text-gray-600"
                    required
                  />
                </div>

                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={!isEmailValid || isLoading}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                    !isEmailValid || isLoading
                      ? "bg-gray-400 cursor-not-allowed text-gray-700"
                      : "bg-[#703BF7] text-white hover:bg-[#5c2fe0]"
                  }`}
                >
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </button>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isLoading
                    ? "Sending reset code..."
                    : hasSentCode
                    ? "Reset code sent. Enter it below to continue."
                    : "Enter your email and click the button to receive a code."}
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Verify Your Reset Code
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A 6-digit code was sent to your email. Enter it below to
                  continue to password reset.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Reset Code
                  </label>

                  <div className="flex gap-0.5 justify-between">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-10 text-center text-2xl font-bold border-2 border-gray-600/30 dark:border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#703BF7]"
                      />
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!isOtpComplete || isLoading}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                    !isOtpComplete || isLoading
                      ? "bg-gray-400 cursor-not-allowed text-gray-700"
                      : "bg-[#703BF7] text-white hover:bg-[#5c2fe0]"
                  }`}
                >
                  {isLoading ? "Processing..." : "Verify Code"}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={!isEmailValid || isResending || isLoading}
                    className={`font-semibold transition ${
                      !isEmailValid || isResending || isLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-[#703BF7] hover:underline"
                    }`}
                  >
                    {isResending ? "Resending..." : "Resend code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp(["", "", "", "", "", ""]);
                      setHasSentCode(false);
                    }}
                    className="font-semibold text-[#703BF7] hover:underline"
                  >
                    Back to Email
                  </button>
                </div>
              </div>
            </>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center pt-6">
            Remember your password?{" "}
            <Link
              to="/auth/login"
              className="text-[#703BF7] cursor-pointer font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
{/* 
      <Footer /> */}
    </div>
  );
};

export default ForgotPassword;
