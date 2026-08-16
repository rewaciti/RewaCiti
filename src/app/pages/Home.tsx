import Navbar from "../../shared/components/Layout/Navbar"
import hero from "/logo/Image.png"
import centerLogo from "/logo/Sub Container.png"
import PropertySection from "../../features/properties/components/PropertySection";
import CommentSection from "../../features/comments/components/CommentSection";
import FAQSection from "../../features/faq/components/FAQSection";
import Footer from "../../shared/components/Layout/Footer";
import { Link } from "react-router";
import useScrollToHash from "../../shared/hooks/useScrollToHash";
import { Helmet } from "react-helmet-async";


function Home() {
  useScrollToHash();


  const services = [
    {
      img: "/logo/servicecontainer/Icon Container (3).png",
      text: "Find Your Dream Home",
    },
    {
      img: "/logo/servicecontainer/Icon Container (4).png",
      text: "Unlock Property Value",
    },
    {
      img: "/logo/servicecontainer/Icon Container (5).png",
      text: "Effortless Property Management",
    },
    {
      img: "/logo/servicecontainer/Icon Container (6).png",
      text: "Smart Investment. Informed Decision",
    },
  ];

  return (
    <div className="">
      <Helmet>
        <title> RewaCiti | Best Real Estate platform in Ile-Ife </title>
        <meta name="description" content="RewaCiti is your number one platform for finding the best properties, student housing, and tourism guides in Ile-Ife and across Osun State, Nigeria." />
        <meta property="og:title" content="RewaCiti - Discover Your Dream Property in Nigeria" />
        <meta property="og:description" content="Find the best real estate listings, student accommodation, and cultural insights in Ile-Ife and Osun State." />
        <meta property="og:image" content="https://rewaciti.com/logo/Image.png" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/" />
      </Helmet>
      <Navbar />

      <section
        className="relative flex flex-col sm:flex-row h-[calc(95vh-6.5rem)] sm:h-auto sm:min-h-0 overflow-hidden"
        id="hero"
      >

        {/* CENTER FLOATING IMAGE — desktop only, floats between left/right panels */}
        <div className="hidden sm:block absolute lg:left-[52%] top-1/3 md:left-[54%] left-[54%] -translate-x-1/2 -translate-y-1/2 z-20">
          <img src={centerLogo} alt="Center Logo" className="w-23 h-auto" />
        </div>

        {/* RIGHT SECTION (IMAGE) — full background on mobile, side panel on desktop */}
        <div
          className="absolute inset-0 sm:relative flex-1 flex justify-center items-center overflow-hidden bg-purple-400/30 dark:bg-purple-800/5 sm:order-last"
          style={{
            backgroundImage: "url('/logo/Abstract Design.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <img
            src={hero}
            alt="Hero"
            className="w-full h-full sm:h-[70vh] sm:min-h-[500px] shadow-lg object-cover transition-all duration-300 ease-in-out"
          />
        </div>

        {/* LEFT SECTION (TEXT) — overlays the image on mobile, normal panel on desktop */}
        <div className="relative z-10 flex-1 flex flex-col justify-center p-4 pb-8 py-6 sm:px-8 sm:py-10 space-y-6 sm:order-first bg-linear-to-t from-black/80 via-black/70 to-transparent sm:bg-none sm:bg-gray-300 sm:dark:bg-black/30">
          <h1 className="text-white sm:text-gray-900 sm:dark:text-white md:text-4xl text-3xl">
            Discover Your Dream Property with RewaCiti
          </h1>

          <p className="text-gray-200 sm:text-gray-600 sm:dark:text-gray-400 text-[15px] max-w-[95%]">
            Your journey to finding the perfect property begins here. Explore our listings to find the home that matches your dreams.
          </p>

          <div className="flex space-x-4">
            <Link to="/Studentarea">
              <button className="bg-[#703BF7] hover:bg-[#9677df] text-white px-4 py-2 rounded text-sm cursor-pointer">
                Campus Areas
              </button>
            </Link>
            <Link to="/Properties">
              <button className="bg-[#703BF7] hover:bg-[#9677df] text-white px-4 py-2 rounded text-sm cursor-pointer">
                Browse Properties
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center text-center md:text-left w-full">
            <div className="bg-white/10 sm:bg-white backdrop-blur-sm sm:backdrop-blur-none dark:sm:bg-[#1A1A1A] border border-white/20 sm:border-gray-200 sm:dark:border-gray-600/30 text-white sm:text-gray-900 sm:dark:text-white px-4 py-3 rounded w-full">
              <p className="text-lg font-semibold">50+</p>
              <p className="text-sm text-gray-300 sm:text-gray-600 sm:dark:text-gray-400">Happy customers</p>
            </div>
            <div className="bg-white/10 sm:bg-white backdrop-blur-sm sm:backdrop-blur-none dark:sm:bg-[#1A1A1A] border border-white/20 sm:border-gray-200 sm:dark:border-gray-600/30 text-white sm:text-gray-900 sm:dark:text-white px-4 py-3 rounded w-full">
              <p className="text-lg font-semibold">60+</p>
              <p className="text-sm text-gray-300 sm:text-gray-600 sm:dark:text-gray-400">Properties for Clients</p>
            </div>
            <div className="bg-white/10 sm:bg-white backdrop-blur-sm sm:backdrop-blur-none dark:sm:bg-[#1A1A1A] border border-white/20 sm:border-gray-200 sm:dark:border-gray-600/30 text-white sm:text-gray-900 sm:dark:text-white px-4 py-3 rounded w-full col-span-2 md:col-span-1">
              <p className="text-lg font-semibold">5+</p>
              <p className="text-sm text-gray-300 sm:text-gray-600 sm:dark:text-gray-400">Years of Experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* CENTER LOGO — mobile only, straddles the seam between hero and features */}
      <div className="relative z-30 sm:hidden">
        <div className="absolute left-10 -translate-x-1/2 -translate-y-1/2">
          <img
            src={centerLogo}
            alt="Center Logo"
            className="w-20 h-auto rounded-md"
          />
        </div>
      </div>

      <section className="px-4 py-2 bg-gray-300 dark:bg-black/30" id="features">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

          {/* BOX ITEM */}
          {services.map((item, index) => (
            <div
              key={index}
              className="relative bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-600/30 rounded-xl p-6 flex flex-col items-center hover:scale-[1.02] transition"
            >
              {/* Arrow at top-right */}
              <div className="absolute top-3 right-3">
                <img
                  src="/logo/Vector 431.png"
                  alt="top arrow"
                  className="w-3 h-3 object-contain mb-3"
                />
              </div>

              {/* Center Image */}
              <img
                src={item.img}
                alt="Icon"
                className="w-13 h-13 object-contain mb-3"
              />

              {/* Text */}
              <p className="text-gray-900 dark:text-white text-center text-sm">
                {item.text}
              </p>
            </div>
          ))}

        </div>
      </section>

      <section className="bg-gray-300 dark:bg-black/30" id="properties">
        <PropertySection />
      </section>
      <section className="bg-gray-300 dark:bg-black/30" id="testimonials">
        <CommentSection />
      </section>
      <section className="bg-gray-300 dark:bg-black/30 pb-10" id="faq">
        <FAQSection />
      </section>
      <section className="bg-gray-300 dark:bg-black/30">
        <Footer />
      </section>
    </div>
  )
}

export default Home