import { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");

  const isEmailValid = email && email.includes("@");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailValid) return;

    setIsLoading(true);
    try {
      await authAPI.forgotPassword({
        companyId,
        email,
      });

      toast.success("Reset code sent to your email!");
      // Store email for next step
      sessionStorage.setItem("resetEmail", email);
      setStep("otp");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to send reset code. Please try again."
      );
      toast.error(errorMessage);
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] rounded-xl p-10 shadow-lg border border-gray-600/30">
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-white dark:text-white focus:outline-none focus:border-[#703BF7] placeholder:text-[12px] placeholder:text-gray-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isEmailValid || isLoading}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                    !isEmailValid || isLoading
                      ? "bg-gray-400 cursor-not-allowed text-gray-200"
                      : "bg-[#703BF7] text-white hover:bg-[#5c2fe0]"
                  }`}
                >
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Check Your Email
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We've sent a reset code to your email. Navigate to the next
                  page to enter the code and reset your password.
                </p>
              </div>

              <Link
                to="/auth/reset-password"
                className="w-full block px-4 py-3 rounded-lg font-medium text-center bg-[#703BF7] text-white hover:bg-[#5c2fe0] transition"
              >
                Continue to Reset Password
              </Link>
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
