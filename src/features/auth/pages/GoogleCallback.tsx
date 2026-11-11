import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { FiLoader } from "react-icons/fi";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { authAPI } from "../services/authAPI";
import { takeGoogleResult, takePendingGoogleSignIn } from "../services/googleSignIn";
import { useAuthStore } from "../store/useAuthStore";
import { usePropertyStore } from "../../properties/store/usePropertyStore";
import Navbar from "../../../shared/components/Layout/Navbar";

const getErrorMessage = (error: unknown, fallback: string) => {
  const withMessage = error as { response?: { data?: { message?: string } } } | null;
  return withMessage?.response?.data?.message || fallback;
};

/**
 * Where Google sends customers back to (/auth/google). Finishes signing in
 * with the verifier this browser kept, then goes where they were heading.
 */
const GoogleCallback = () => {
  const navigate = useNavigate();
  const { setToken, setCustomer, setCompanyId, companyId } = useAuthStore();
  // StrictMode runs effects twice in development; the result can only be used once
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const result = takeGoogleResult();
    const pending = takePendingGoogleSignIn();
    const backToSignIn = (message?: string) => {
      if (message) toast.error(message);
      navigate("/auth/login", { replace: true });
    };

    // They chose Cancel on Google's page: nothing to tell them
    if (result.cancelled) return backToSignIn();
    if (result.error) return backToSignIn(result.error);
    // No verifier: this browser didn't start this sign-in (a link someone sent, say)
    if (!result.handoff || !pending) return backToSignIn("That Google sign-in didn’t work. Please try again.");

    const handoff = result.handoff;
    void (async () => {
      try {
        const response = await authAPI.googleSignIn({ companyId, handoff, codeVerifier: pending.codeVerifier });
        setToken(response.token);
        setCustomer(response.customer);
        setCompanyId(response.customer.companyId);
        await usePropertyStore.getState().fetchWishlist();
        toast.success(response.created ? "Welcome to RewaCiti!" : "Login successful!");
        navigate(pending.next, { replace: true });
      } catch (error) {
        console.error("Google sign-in error:", error);
        backToSignIn(getErrorMessage(error, "Google sign-in failed. Please try again."));
      }
    })();
  }, [companyId, navigate, setCompanyId, setCustomer, setToken]);

  return (
    <div className="bg-gray-300 dark:bg-black/30 min-h-screen flex flex-col">
      <Helmet>
        <title>Signing in | RewaCiti</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <Navbar />

      <main className="grid flex-1 grid-cols-1 md:min-h-[calc(100vh-112px)] md:grid-cols-2">
        <div className="relative hidden min-h-[420px] overflow-hidden md:block">
          <img src="/images/home-hero.jpg" alt="Modern home at sunset" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div role="status" className="flex flex-col items-center gap-4 text-center">
            <FiLoader aria-hidden="true" size={28} className="animate-spin text-[#703BF7]" />
            <p className="text-sm text-gray-700 dark:text-gray-300">Signing you in with Google…</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GoogleCallback;
