import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { authAPI } from "../services/authAPI";
import { useAuthStore } from "../store/useAuthStore";
import Navbar from "../../../shared/components/Layout/Navbar";
import { Helmet } from "react-helmet-async";

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

const Login = () => {
  const navigate = useNavigate();
  const { setToken, setCustomer, setCompanyId, companyId } = useAuthStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Form states for signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const inputStyle =
    "w-full px-4 py-2 border border-gray-600/30 rounded-lg bg-gray-600/30 dark:bg-gray-600/30 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#703BF7] placeholder:text-[12px] dark:placeholder:text-gray-400 placeholder:text-gray-600";

  // Validation
  const isSignInValid = email && password;

  const isSignUpValid =
    firstName &&
    lastName &&
    phoneNumber &&
    email &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    agree;

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignInValid) return;

    setIsLoading(true);
    try {
      const response = await authAPI.login({
        companyId,
        email,
        password,
      });

      if (response.success && response.token) {
        setToken(response.token);
        setCustomer(response.customer);
        setCompanyId(response.customer.companyId);
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Login failed. Please try again."
      );
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignUpValid) return;

    setIsLoading(true);
    try {
      const response = await authAPI.signUp({
        companyId,
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
      });

      if (response.success) {
        if (response.companyId) {
          setCompanyId(response.companyId);
        }
        toast.success("OTP sent to your email!");
        // Store signup data for verification
        sessionStorage.setItem(
          "pendingVerification",
          JSON.stringify({
            email,
            firstName,
            lastName,
          })
        );
        navigate("/auth/verify-email");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Sign up failed. Please try again."
      );
      toast.error(errorMessage);
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-300 dark:bg-black/30 min-h-screen flex flex-col">
      <Helmet>
        <title>
          {isSignUp ? "Sign Up | RewaCiti" : "Login | RewaCiti"}
        </title>
        <meta
          name="description"
          content={
            isSignUp
              ? "Create your RewaCiti account to explore properties."
              : "Login to your RewaCiti account."
          }
        />
      </Helmet>

      <Navbar/>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] rounded-xl p-10 shadow-lg border border-gray-600/30">
          <form className="space-y-4" onSubmit={isSignUp ? handleSignUp : handleLogin}>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isSignUp ? "Get Started Now" : "Welcome Back"}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSignUp
                ? "Create your account to explore properties"
                : "Login to access your account"}
            </p>

            {/* First Name */}
            {isSignUp && (
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputStyle}
                  required={isSignUp}
                />
              </div>
            )}

            {/* Last Name */}
            {isSignUp && (
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputStyle}
                  required={isSignUp}
                />
              </div>
            )}

            {/* Phone Number */}
            {isSignUp && (
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={inputStyle}
                  required={isSignUp}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                  Password
                </label>
                {!isSignUp && (
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-[#703BF7] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputStyle}
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
            </div>

            {/* Confirm Password */}
            {isSignUp && (
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputStyle}
                    required={isSignUp}
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

                {/* Password error */}
                {password &&
                  confirmPassword &&
                  password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>
            )}

            {/* Agreement */}
            {isSignUp && (
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  className="mt-1"
                  required
                />

                <p>
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-[#703BF7] cursor-pointer hover:underline"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    className="text-[#703BF7] cursor-pointer hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  (isSignUp ? !isSignUpValid : !isSignInValid) || isLoading
                }
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${
                  (isSignUp ? !isSignUpValid : !isSignInValid) || isLoading
                    ? "bg-gray-400 cursor-not-allowed text-gray-200"
                    : "bg-[#703BF7] text-white hover:bg-[#5c2fe0]"
                }`}
              >
                {isLoading
                  ? "Loading..."
                  : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
              </button>
            </div>
          </form>

          {/* Switch Mode */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center pt-6">
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <span
              onClick={() => {
                setIsSignUp(!isSignUp);
                // Clear form on toggle
                setEmail("");
                setPassword("");
                setFirstName("");
                setLastName("");
                setPhoneNumber("");
                setConfirmPassword("");
                setAgree(false);
              }}
              className="text-[#703BF7] cursor-pointer font-semibold hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </span>
          </p>
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default Login;
