import Navbar from "../../shared/components/Layout/Navbar"
import Footer from "../../shared/components/Layout/Footer";
import useScrollToHash from "../../shared/hooks/useScrollToHash";

function Service() {
  useScrollToHash();
       const services1 = [
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

  const services2 = [
  {
    title: "Valuation Mastery",
    description:
      "Discover the true worth of your property with our expert valuation services.",
    image: "/logo/servicecontainer/Icon Container (12).png",
  },
  {
    title: "Strategic Marketing",
    description:
      "Selling a property requires more than just a listing; it demands a strategic marketing approach.",
    image: "/logo/servicecontainer/Icon Container.png",
  },
  {
    title: "Negotiation Wizardry",
    description:
      "Negotiating the best deal is an art, and our negotiation experts are masters of it.",
    image: "/logo/servicecontainer/Icon Container (1).png",
  },
  {
    title: "Closing Success",
    description:
      "A successful sale is not complete until the closing. We guide you through the intricate closing process.",
    image: "/logo/servicecontainer/Icon Container (2).png",
  },
];

const services3 = [
  {
    title: "Tenant Harmony",
    description:
      "Our Tenant Management services ensure that your tenants have a smooth and reducing vacancies.",
    image: "/logo/servicecontainer/Icon Container (11).png",
  },
  {
    title: "Maintenance Ease",
    description:
      "Say goodbye to property maintenance headaches. We handle all aspects of property upkeep.",
    image: "/logo/servicecontainer/Icon Container (13).png",
  },
  {
    title: "Financial Peace of Mind",
    description:
      "Managing property finances can be complex. Our financial experts take care of rent collection",
    image: "/logo/servicecontainer/Icon Container (10).png",
  },
  {
    title: "Legal Guardian",
    description:
      "Stay compliant with property laws and regulations effortlessly.",
    image: "/logo/servicecontainer/Icon Container (6).png",
  },
];

const services4 = [
  {
    title: "Market Insight",
    description:
      "Stay ahead of market trends with our expert Market Analysis. We provide in-depth insights into real estate market conditions",
    image: "/logo/servicecontainer/Icon Container (12).png",
  },
  {
    title: "ROI Assessment",
    description:
      "Make investment decisions with confidence. Our ROI Assessment services evaluate the potential returns on your investments",
    image: "/logo/servicecontainer/Icon Container (9).png",
  },
  {
    title: "Customized Strategies",
    description:
      "Every investor is unique, and so are their goals. We develop Customized Investment Strategies tailored to your specific needs",
    image: "/logo/servicecontainer/Icon Container (8).png",
  },
  {
    title: "Diversification Mastery",
    description:
      "Diversify your real estate portfolio effectively. Our experts guide you in spreading your investments across various property types and locations",
    image: "/logo/servicecontainer/Icon Container (6).png",
  },
];
  return (
    <div>
        <Navbar />
         <div className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 p-5 px-10 space-y-6">
                <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
               Elevate Your Real Estate Experience
            </h1>

            <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
                Welcome to RewaCitty, where your real estate aspirations meet expert guidance. Explore our comprehensive range of services, each designed to cater to your unique needs and dreams.
            </p> 
        </div>
        <section className="p-4 bg-gray-300 dark:bg-black/30 border-t-5 border-b-5 border-gray-600/30" id="whatweoffer">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            
            {/* BOX ITEM */}
            {services1.map((item, index) => (
              <div
                key={index}
                className="relative bg-white/90 dark:bg-[#1A1A1A] border border-gray-600/30 rounded-xl p-6 flex flex-col items-center hover:scale-[1.02] transition"
              >
                {/* Arrow at top-right */}
                <div className="absolute top-3 right-3">
                  <img
                  src="/logo/Vector 431.png"
                  alt="top arrow"
                  className="w-3 h-3 object-contain"
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

        <section className="bg-gray-300 dark:bg-black/30 p-4 space-y-6" id="valuation">
           <div className="space-y-4">
                <img
                  src="/logo/Abstract Design (1).png"
                  alt="Icon"
                  className="w-13 object-contain"
                />
              <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl ">
                Unlock Property Value
              </h1>
    
              <p className="text-gray-600 dark:text-gray-400 text-[14px] max-w-[95%]">
                Selling your property should be a rewarding experience, and at RewaCitty, we make sure it is. Our Property Selling Service is designed to maximize the value of your property, ensuring you get the best deal possible. Explore the categories below to see how we can help you at every step of your selling journey
              </p>
           </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-2"> 
            {/* BOX ITEM */}
            {services2.map((service, index) => (
              <div
                key={index}
                className="relative bg-white/90 dark:bg-[#1A1A1A] border border-gray-600/30 rounded-xl p-6 flex flex-col hover:scale-[1.02] transition"
              >
                {/* Center Image */}
                <div className=" flex items-center gap-5 ">
                <img
                  src={service.image}
                  alt="Icon"
                  className="w-13 h-13 object-contain"
                />
      
                    <h3 className=" text-gray-900 dark:text-white text-lg font-semibold mb-2">
                      {service.title}
                    </h3>
                </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                {service.description}
              </p>
              </div>
            ))}

            <div
              className="md:col-span-2 relative items-start md:items-center justify-between gap-6 p-6 border border-gray-600/30 rounded-xl overflow-hidden"
              style={{
                backgroundImage: "url('/logo/Abstract Design.png')",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-neutral-900/50"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold mb-2">
                    Unlock the Value of Your Property Today
                  </h3>

                  <button className="px-6 py-3 bg-[#703BF7] hover:bg-[#9677df] rounded-lg font-medium transition hidden md:block">
                    Learn More
                  </button>
                </div>

                <p className="text-gray-100 max-w-2xl">
                 Ready to unlock the true value of your property? Explore our Property Selling Service categories and let us help you achieve the best deal possible for your valuable asset.
                </p>

                <button className="px-6 py-3 bg-[#703BF7] hover:bg-[#9677df] rounded-lg font-medium transition w-full mt-2 md:hidden">
                    Learn More
                </button>
              </div>
            </div>
             </div>
        </section>

        <section className="bg-gray-300 dark:bg-black/30 p-4 space-y-6" id="Management">
           <div className="space-y-4">
                <img
                  src="/logo/Abstract Design (1).png"
                  alt="Icon"
                  className="w-13 object-contain"
                />
              <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
                Effortless Property Management
              </h1>
    
              <p className="text-gray-600 dark:text-gray-400 text-[14px] max-w-[95%]">
                Owning a property should be a pleasure, not a hassle. RewaCitty's Property Management Service takes the stress out of property ownership, offering comprehensive solutions tailored to your needs. Explore the categories below to see how we can make property management effortless for you
              </p>
           </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-2"> 
            {/* BOX ITEM */}
            {services3.map((service, index) => (
              <div
                key={index}
                className="relative bg-white/90 dark:bg-[#1A1A1A] border border-gray-600/30 rounded-xl p-6 flex flex-col hover:scale-[1.02] transition"
              >
                {/* Center Image */}
                <div className=" flex items-center gap-5 ">
                     <img
                      src={service.image}
                      alt="Icon"
                      className="w-13 h-13 object-contain mb-3"
                    />
      
                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                      {service.title}
                    </h3>
                </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                {service.description}
              </p>
              </div>
            ))}

            <div
              className="md:col-span-2 relative items-start md:items-center justify-between gap-6 p-6 border border-gray-600/30 rounded-xl overflow-hidden"
              style={{
                backgroundImage: "url('/logo/Abstract Design.png')",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-neutral-900/50"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold mb-2">
                    Experience Effortless Property Management
                  </h3>

                  <button className="px-6 py-3 bg-[#703BF7] hover:bg-[#9677df] rounded-lg font-medium transition hidden md:block">
                    Learn More
                  </button>
                </div>

                <p className="text-gray-100 max-w-2xl">
                  Ready to experience hassle-free property management? Explore our Property
                  Management Service categories and let us handle the complexities while you
                  enjoy the benefits of property ownership.
                </p>

                 <button className="px-6 py-3 bg-[#703BF7] hover:bg-[#9677df] rounded-lg font-medium transition w-full mt-2 md:hidden">
                      Learn More
                </button>
              </div>
            </div>

          </div>
        </section>

        <section className="bg-gray-300 dark:bg-black/30 p-4 space-y-6" id="marketing">
           <img
                  src="/logo/Abstract Design (1).png"
                  alt="Icon"
                  className="w-13 object-contain"
                />

           <div className="flex flex-col md:flex-row gap-7">
              {/* LEFT SIDE (smaller) */}
              <div className="md:w-5/12 space-y-6">
                <div>
                  <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
                    Smart Investments, Informed Decisions
                  </h1>

                  <p className="dark:text-gray-400 text-gray-600 text-sm max-w-[95%] mt-3">
                   Building a real estate portfolio requires a strategic approach. RewaCitty's Investment Advisory Service empowers you to make smart investments and informed decisions.
                  </p>
                </div>

                {/* CTA CARD */}
                <div
                  className="relative p-6 border border-gray-600/30 rounded-xl overflow-hidden"
                  style={{
                    backgroundImage: "url('/logo/Abstract Design.png')",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                >
                  <div className="absolute inset-0 bg-neutral-900/50 z-0"></div>

                  <div className="relative z-10 flex flex-col gap-4">
                    <h3 className="text-xl font-semibold">
                      Unlock Your Investment Potential
                    </h3>

                    <p className="text-white/90">
                      Explore our Property Management Service categories and let us handle
                      the complexities while you enjoy the benefits of property ownership.
                    </p>

                    <button className="px-6 py-3 bg-[#703BF7] hover:bg-[#9677df] rounded-lg font-medium transition w-full">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE (larger) */}
              <div className="md:w-7/12 grid grid-cols-1 md:grid-cols-2 gap-2 bg-neutral-800/50 p-2 rounded-xl ">
                {services4.map((service, index) => (
                  <div
                    key={index}
                    className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-600/30 rounded-xl p-6 flex flex-col"
                  >
                    <div className="flex items-center gap-4 mb-3">
                     <img
                      src={service.image}
                      alt="Icon"
                      className="w-13 h-13 object-contain"
                    />

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white ">
                        {service.title}
                      </h3>
                    </div>

                    <p className="text-sm dark:text-gray-400 text-gray-600">
                      {service.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>     
        </section>
        <section className="bg-gray-300 dark:bg-black/30">
        <Footer/>
      </section> 
    </div>
  )
}

export default Service