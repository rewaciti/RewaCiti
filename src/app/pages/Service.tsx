import Navbar from "../../shared/components/Layout/Navbar";
import Footer from "../../shared/components/Layout/Footer";
import useScrollToHash from "../../shared/hooks/useScrollToHash";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { FiArrowRight } from "react-icons/fi";

// Same container as the Navbar, Property Details, Account and Request pages.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar / Home hero (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const ABSTRACT_IMAGE = "/logo/Abstract Design.png";

type Item = { title: string; description: string; image: string };

type SectionConfig = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  items: Item[];
  cta: { title: string; text: string };
  // Optional: drop a real photo here (e.g. "/images/services/selling.jpg")
  // and it replaces the abstract background on that section's panel.
  photo?: string;
  reverse?: boolean;
};

const overview = [
  {
    img: "/logo/servicecontainer/Icon Container (3).png",
    text: "Find Your Dream Home",
    description: "Browse verified homes, rooms and land across Ile-Ife.",
    to: "/properties",
  },
  {
    img: "/logo/servicecontainer/Icon Container (4).png",
    text: "Unlock Property Value",
    description: "Valuation, marketing and negotiation to get the best deal.",
    to: "#valuation",
  },
  {
    img: "/logo/servicecontainer/Icon Container (5).png",
    text: "Effortless Property Management",
    description: "Tenants, upkeep, rent and compliance handled for you.",
    to: "#Management",
  },
  {
    img: "/logo/servicecontainer/Icon Container (6).png",
    text: "Smart Investment. Informed Decision",
    description: "Market insight and strategy for a stronger portfolio.",
    to: "#marketing",
  },
];

const sections: SectionConfig[] = [
  {
    id: "valuation",
    eyebrow: "Selling",
    title: "Unlock Property Value",
    intro:
      "Selling your property should be a rewarding experience, and at RewaCiti, we make sure it is. Our Property Selling Service is designed to maximize the value of your property, ensuring you get the best deal possible.",
    items: [
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
    ],
    cta: {
      title: "Unlock the value of your property today",
      text: "Ready to unlock the true value of your property? Let us help you achieve the best deal possible for your valuable asset.",
    },
    photo: "/images/property-value-management.avif",
  },
  {
    id: "Management",
    eyebrow: "Managing",
    title: "Effortless Property Management",
    intro:
      "Owning a property should be a pleasure, not a hassle. RewaCiti's Property Management Service takes the stress out of ownership, with comprehensive solutions tailored to your needs.",
    items: [
      {
        title: "Tenant Harmony",
        description:
          "Our Tenant Management services ensure that your tenants have a smooth experience while reducing vacancies.",
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
          "Managing property finances can be complex. Our financial experts take care of rent collection.",
        image: "/logo/servicecontainer/Icon Container (10).png",
      },
      {
        title: "Legal Guardian",
        description: "Stay compliant with property laws and regulations effortlessly.",
        image: "/logo/servicecontainer/Icon Container (6).png",
      },
    ],
    cta: {
      title: "Experience effortless property management",
      text: "Ready for hassle-free management? Let us handle the complexities while you enjoy the benefits of property ownership.",
    },
    photo: "/images/property-value-management.avif",
    reverse: true,
  },
  {
    id: "marketing",
    eyebrow: "Investing",
    title: "Smart Investments, Informed Decisions",
    intro:
      "Building a real estate portfolio requires a strategic approach. RewaCiti's Investment Advisory Service empowers you to make smart investments and informed decisions.",
    items: [
      {
        title: "Market Insight",
        description:
          "Stay ahead of market trends with our expert Market Analysis and in-depth insights into real estate market conditions.",
        image: "/logo/servicecontainer/Icon Container (12).png",
      },
      {
        title: "ROI Assessment",
        description:
          "Make investment decisions with confidence. We evaluate the potential returns on your investments.",
        image: "/logo/servicecontainer/Icon Container (9).png",
      },
      {
        title: "Customized Strategies",
        description:
          "Every investor is unique, and so are their goals. We develop investment strategies tailored to your needs.",
        image: "/logo/servicecontainer/Icon Container (8).png",
      },
      {
        title: "Diversified Mastery",
        description:
          "Diversify your portfolio effectively, spreading your investments across various property types and locations.",
        image: "/logo/servicecontainer/Icon Container (6).png",
      },
    ],
    cta: {
      title: "Unlock your investment potential",
      text: "Let our advisors guide your next move, from reading the market to building a portfolio that lasts.",
    },
    photo: "/logo/Image (1).png",
  },
];

const ServiceSection = ({
  id,
  eyebrow,
  title,
  intro,
  items,
  cta,
  photo,
  reverse,
  tone,
}: SectionConfig & { tone: string }) => (
  <section id={id} className={`scroll-mt-24 py-14 sm:py-20 ${tone}`}>
    <div className={PAGE_CONTAINER}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">{eyebrow}</p>
        <h2
          style={SERIF}
          className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-4 leading-7 text-gray-700 dark:text-gray-400">{intro}</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div
          className={`grid gap-4 sm:grid-cols-2 lg:col-span-2 ${reverse ? "lg:order-2" : ""}`}
        >
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-gray-200 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-[#1A1A1A]"
            >
              <img
                src={item.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-12 w-12 object-contain"
              />
              <h3
                style={SERIF}
                className="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
              >
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div
          className={`relative flex min-h-80 flex-col justify-end overflow-hidden rounded-3xl p-8 text-white ${
            reverse ? "lg:order-1" : ""
          }`}
          style={{
            backgroundImage: `url('${photo ?? ABSTRACT_IMAGE}')`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundColor: "#111827",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/30" />
          <div className="relative z-10">
            <h3 style={SERIF} className="text-2xl font-semibold leading-snug">
              {cta.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-200">{cta.text}</p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#703BF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df]"
            >
              Talk to us <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

function Service() {
  useScrollToHash();

  return (
    <div className="bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Helmet>
        <title>Services | RewaCiti Real Estate & Property Management</title>
        <meta
          name="description"
          content="Explore RewaCiti's real estate services for property sales, management, student housing, and investment guidance in Ile-Ife."
        />
        <meta property="og:title" content="Services | RewaCiti Real Estate & Property Management" />
        <meta
          property="og:description"
          content="Discover professional property services, valuations, management, and investment support from RewaCiti."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="RewaCiti Services | Property Management & Investment"
        />
        <meta
          name="twitter:description"
          content="Learn about RewaCiti's services for property sellers, landlords, investors and student accommodation seekers."
        />
        <link rel="canonical" href="https://rewaciti.com/service" />
      </Helmet>

      <Navbar />

      {/* Overview */}
      <section
        id="whatweoffer"
        className="scroll-mt-24 bg-gray-200 pb-12 pt-10 dark:bg-black/50 sm:pb-16 sm:pt-14"
      >
        <div className={PAGE_CONTAINER}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {overview.map((item) => {
              const content = (
                <>
                  <img
                    src={item.img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 object-contain"
                  />
                  <h3
                    style={SERIF}
                    className="mt-4 text-lg font-semibold leading-snug text-gray-900 dark:text-white"
                  >
                    {item.text}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#703BF7] transition group-hover:gap-2.5 dark:text-[#b79bff]">
                    Learn more <FiArrowRight size={15} />
                  </span>
                </>
              );
              const cardClass =
                "group flex flex-col rounded-3xl border border-gray-200 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-[#1A1A1A]";
              return item.to.startsWith("#") ? (
                <a key={item.text} href={item.to} className={cardClass}>
                  {content}
                </a>
              ) : (
                <Link key={item.text} to={item.to} className={cardClass}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed service sections, alternating background */}
      {sections.map((section, index) => (
        <ServiceSection
          key={section.id}
          {...section}
          tone={index % 2 === 1 ? "bg-gray-200 dark:bg-black/50" : ""}
        />
      ))}

      {/* Closing call to action */}
      <section className="bg-gray-200 py-14 dark:bg-black/50 sm:py-20">
        <div className={PAGE_CONTAINER}>
          <div className="relative overflow-hidden rounded-3xl bg-[#703BF7] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-20 mix-blend-soft-light"
              style={{
                backgroundImage: `url('${ABSTRACT_IMAGE}')`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 style={SERIF} className="text-3xl font-semibold sm:text-4xl">
                Ready to talk about your property goals?
              </h2>
              <p className="mt-4 text-white/85">
                Tell us whether you want to buy, sell, manage or invest, and our team will guide
                you from the first conversation to the final handover.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/contact"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#703BF7] transition hover:bg-gray-100"
                >
                  Contact us
                </Link>
                <Link
                  to="/properties"
                  className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Browse properties
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Service;