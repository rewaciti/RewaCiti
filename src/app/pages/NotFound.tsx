import { Link } from "react-router";
import Navbar from "../../shared/components/Layout/Navbar";
import Footer from "../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  return (
    <div className="bg-gray-100 dark:bg-black/30 min-h-screen flex flex-col">
      <Helmet>
        <title>404 Page Not Found | RewaCiti</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to the RewaCiti homepage to explore properties, student housing, and services." />
        <meta property="og:title" content="404 Page Not Found | RewaCiti" />
        <meta property="og:description" content="This link is broken or the page has moved. Visit RewaCiti to find property listings, student housing, and real estate services." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="404 Page Not Found | RewaCiti" />
        <meta name="twitter:description" content="The requested page was not found. Return to RewaCiti to continue exploring our real estate listings." />
        <link rel="canonical" href="https://rewaciti.com/404" />
      </Helmet>
      <Navbar />
      <div className="flex flex-col items-center justify-center flex-1 text-center px-4 py-20">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl text-gray-800 dark:text-gray-200 mb-6">
          Page Not Found
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-md">
          The page you are looking for does not exist. It might have been removed
          or the URL may be incorrect.
        </p>
        <Link
          to="/"
          className="bg-[#703BF7] hover:bg-[#9677df] text-white px-6 py-3 rounded-lg transition"
        >
          Go to Home
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;