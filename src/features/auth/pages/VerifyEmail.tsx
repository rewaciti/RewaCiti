import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authAPI } from "../services/authAPI";
import { useAuthStore } from "../store/useAuthStore";
import Navbar from "../../../shared/components/Layout/Navbar";
// import Footer from "../../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";

interface PendingVerification {
  email: string;
  firstName: string;
  lastName: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const errorWithMessage = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
        status?: number;
      };
      message?: string;
      code?: string;
    };

    const serverMessage =
      errorWithMessage.response?.data?.message ||
      errorWithMessage.response?.data?.error;

    if (serverMessage) {
      return serverMessage;
    }

    if (errorWithMessage.response?.status) {
      return `${fallback} (Status ${errorWithMessage.response.status})`;
    }

    return errorWithMessage.message || fallback;
  }

  return fallback;
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { setToken, setCustomer, setCompanyId, companyId } = useAuthStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  const [pendingData, setPendingData] = useState<PendingVerification | null>(
    null
  );

  useEffect(() => {
    // Get pending verification data
    const data = sessionStorage.getItem("pendingVerification");
    if (!data) {
      navigate("/auth/login");
      return;
    }
    setPendingData(JSON.parse(data));
  }, [navigate]);

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus to next input
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

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingData) return;

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    if (!pendingData?.email) {
      toast.error("We could not find the email for verification.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.verifyEmail({
        companyId,
        email: pendingData.email,
        otp: otpCode,
      });

      if (response.token && response.customer) {
        setToken(response.token);
        setCustomer(response.customer);
        setCompanyId(response.customer.companyId);
        toast.success("Email verified successfully!");
        sessionStorage.removeItem("pendingVerification");
        navigate("/");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Verification failed. Please try again."
      );
      toast.error(errorMessage);
      console.error("Verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingData) return;

    setIsLoading(true);
    try {
      const response = await authAPI.resendOTP({
        companyId,
        email: pendingData.email,
      });

      if (response.success) {
        toast.success(response.message || "OTP resent to your email!");
        setOtp(["", "", "", "", "", ""]);
        setTimeLeft(300);
        setCanResend(false);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to resend OTP. Please try again."
      );
      toast.error(errorMessage);
      console.error("Resend OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!pendingData) {
    return null;
  }

  return (
    <div className="bg-gray-300 dark:bg-black/30 min-h-screen flex flex-col">
      <Helmet>
        <title>Verify Email | RewaCiti</title>
        <meta
          name="description"
          content="Verify your email to complete your RewaCiti account setup."
        />
      </Helmet>

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] rounded-xl p-10 shadow-lg border border-gray-600/30">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Your Email
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We've sent a verification code to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {pendingData.email}
              </span>
            </p>
          </div>

          <form onSubmit={handleVerifyEmail} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Enter 6-digit code
              </label>

              <div className="flex gap-2 justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-600/30 dark:border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#703BF7]"
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Code expires in{" "}
                <span
                  className={`font-semibold ${
                    timeLeft < 60
                      ? "text-red-500"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={otp.join("").length !== 6 || isLoading}
              className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                otp.join("").length !== 6 || isLoading
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : "bg-[#703BF7] text-white hover:bg-[#5c2fe0]"
              }`}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Didn't receive a code?
            </p>
            <button
              onClick={handleResendOtp}
              disabled={isLoading}
              className={`text-[#703BF7] font-semibold hover:underline ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Sending..." : "Resend Code"}
            </button>
            {!canResend && timeLeft > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                (available in {formatTime(timeLeft)})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default VerifyEmail;
