import Navbar from "../../shared/components/Layout/Navbar"
import hero from "/logo/Image.png"
import centerLogo from "/logo/Sub Container.png"
import PropertySection from "../../features/properties/components/PropertySection";
import CommentSection from "../../features/comments/components/CommentSection";
import FAQSection from "../../features/faq/components/FAQSection";
import Footer from "../../shared/components/Layout/Footer";
import { Link } from "react-router";
import useScrollToHash from "../../shared/hooks/useScrollToHash";


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
      <Navbar />
      <section className="relative flex flex-col sm:flex-row" id= "hero">

        {/* CENTER FLOATING IMAGE */}
        <div className="hidden sm:block absolute left-[52%] top-1/3 -translate-x-1/2 -translate-y-1/2 z-20">
          <img src={centerLogo} alt="Center Logo" className="w-23 h-auto" />
        </div>

        {/* LEFT SECTION */}
        <div className="flex-1 bg-gray-300 dark:bg-black/30 flex flex-col justify-center p-4 py-6 sm:px-8 sm:py-10 space-y-6 z-10 order-last md:order-first">
          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
            Discover Your Dream Property with RewaCiti
          </h1>

          <p className="text-gray-600 dark:text-gray-400 text-[15px] max-w-[95%]">
            Your journey to finding the perfect property begins here. Explore our listings to find the home that matches your dreams.
          </p>

          <div className="flex space-x-4">
            <Link to="/Studentarea">
              <button className="bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-gray-600/30 text-gray-900 dark:text-white px-4 py-2 rounded text-sm hover:bg-[#9677df] hover:text-white cursor-pointer dark:hover:bg-[#9677df]">
                School Area
              </button>
            </Link>
           <Link to = "/Properties">
              <button className="bg-[#703BF7] hover:bg-[#9677df] text-white px-4 py-2 rounded text-sm cursor-pointer">
                Browse Properties
              </button>
           </Link>
          </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center text-center md:text-left w-full">
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-600/30 text-gray-900 dark:text-white px-4 py-3 rounded w-full">
                  <p className="text-lg font-semibold">50+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Happy customers</p>
                </div>
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-600/30 text-gray-900 dark:text-white px-4 py-3 rounded w-full">
                  <p className="text-lg font-semibold">60+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Properties for Clients</p>
                </div>
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-600/30 text-gray-900 dark:text-white px-4 py-3 rounded w-full col-span-2 md:col-span-1">
                  <p className="text-lg font-semibold">1+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Years of Experience</p>
                </div>
              </div>
        </div>

        {/* RIGHT SECTION */}
        <div
          className="flex-1 relative flex justify-center items-center z-10 order-first sm:order-last m-0 bg-purple-400/30 dark:bg-purple-800/5 mb-10 sm:mb-0"
          style={{
            backgroundImage: "url('/logo/Abstract Design.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
            
          }}
        >
          <img
            src={hero}
            alt="Hero"
            className="w-full shadow-lg object-cover transition-all duration-300 ease-in-out rounded-2xl sm:rounded-none max-h-[500px] h-full"
          />
          {/* CENTER LOGO for small screens: positioned at bottom-left of the image */}
          <div className="sm:hidden absolute left-0 bottom-[-10%] z-20 ">
            <img
              src={centerLogo}
              alt="Center Logo"
              className="w-18 h-auto transition-all duration-300 ease-in-out rounded-md shadow-md "
            />
          </div>
        </div>
      </section>

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

      <section className="bg-gray-300 dark:bg-black/30 pb-5" id="properties">
        <PropertySection />
      </section>
      <section className="bg-gray-300 dark:bg-black/30 pb-5" id="testimonials">
        <CommentSection/>
      </section>
      <section className="bg-gray-300 dark:bg-black/30 pb-15" id="faq">
        <FAQSection/>
      </section>
      <section className="bg-gray-300 dark:bg-black/30">
        <Footer/>
      </section> 
    </div>
  )
}

export default Home