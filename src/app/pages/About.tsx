import { useState, type FormEvent } from "react";
import Navbar from "../../shared/components/Layout/Navbar";
import hero from "/logo/Image (1).png";
import {
  FaStar,
  FaUsers,
  FaShieldAlt,
  FaGraduationCap,
  FaLinkedin,
} from "react-icons/fa";
import type {
  ValueItem,
  Step,
  TeamMember,
  AchievementItem,
} from "../../types";
import Footer from "../../shared/components/Layout/Footer";
import useScrollToHash from "../../shared/hooks/useScrollToHash";
import { Helmet } from "react-helmet-async";
import { Send } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared tokens — same container as the Navbar so the edges line up   */
/* ------------------------------------------------------------------ */

const PAGE_CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10";

// scroll-mt keeps hash links (#Values, #Team...) from hiding under the sticky navbar
const SECTION = "scroll-mt-20 py-10 sm:py-14";

const CARD =
  "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1A1A1A]";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const valuesData: ValueItem[] = [
  {
    id: 1,
    title: "Trust",
    description:
      "Trust is the cornerstone of every successful real estate transaction.",
    icon: "star",
  },
  {
    id: 2,
    title: "Excellence",
    description:
      "We set the bar high for ourselves. From the properties we list to the services we provide.",
    icon: "graduation",
  },
  {
    id: 3,
    title: "Client-Centric",
    description:
      "Your dreams and needs are at the center of our universe. We listen, understand.",
    icon: "users",
  },
  {
    id: 4,
    title: "Our Commitment",
    description:
      "We are dedicated to providing you with the highest level of service, professionalism",
    icon: "shield",
  },
];

const Achievements: AchievementItem[] = [
  {
    id: 1,
    title: "5+ Years of Excellence",
    description:
      "With over 5 years in the industry, we've amassed a wealth of knowledge and experience.",
  },
  {
    id: 2,
    title: "Happy Clients",
    description:
      "Our greatest achievement is the satisfaction of our clients. Their success stories fuel our passion for what we do.",
  },
  {
    id: 3,
    title: "Industry Recognition",
    description:
      "We've earned the respect of our peers and industry leaders, with accolades and awards that reflect our commitment to excellence.",
  },
];

const stepsData: Step[] = [
  {
    id: 1,
    step: "Step 01",
    title: "Discover a World of Possibilities",
    description:
      "Your journey begins with exploring our carefully curated property listings. Use our intuitive search tools to filter properties based on your preferences.",
  },
  {
    id: 2,
    step: "Step 02",
    title: "Narrowing Down Your Choices",
    description:
      "Once you've found properties that catch your eye,make a shortlist. This allows you to compare and revisit your favorites as you make your decision.",
  },
  {
    id: 3,
    step: "Step 03",
    title: "Personalized Guidance",
    description:
      "Have questions about a property or need more information? Our dedicated team of real estate experts is just a call or message away.",
  },
  {
    id: 4,
    step: "Step 04",
    title: "See It for Yourself",
    description:
      "Arrange viewings of the properties you're interested in. We'll coordinate with the property owners and accompany you to get a firsthand look at your potential new home.",
  },
  {
    id: 5,
    step: "Step 05",
    title: "Making Informed Decisions",
    description:
      "Before making an offer, our team will assist you with due diligence, including property inspections, legal checks, and market analysis. We want you to be fully informed.",
  },
  {
    id: 6,
    step: "Step 06",
    title: "Getting the Best Deal",
    description:
      "We'll help you negotiate the best terms and prepare your offer. Our goal is to secure the property at the right price and on favorable terms.",
  },
];

const teamData: TeamMember[] = [
  {
    id: 3,
    name: "Ekeshi Emmanuel",
    role: "Head of Property Management",
    image: "/logo/Team/WhatsApp Image 2026-04-28 at 1.43.17 PM.jpeg",
    email: "emuzikchima@gmail.com",
    linkedin: "https://www.linkedin.com/in/emmanuel-ekeshi-79332a2b9/",
  },
  {
    id: 2,
    name: "Oyeniyi Seun",
    role: "Backend Engineer",
    image: "/logo/Team/WhatsApp Image 2026-04-28 at 7.52.21 PM.jpeg",
    email: "iamseunoyeniyi@gmail.com",
    linkedin: "https://www.linkedin.com/in/seunoyeniyi",
  },
  {
    id: 1,
    name: "Arewa Tolulope",
    role: "Frontend Engineer",
    image: "/logo/Team/WhatsApp Image 2026-04-07 at 10.01.32 AM.jpeg",
    email: "arewatolulope5@gmail.com",
    linkedin: "https://www.linkedin.com/in/arewa-tolulope-1496a7238/",
  },
  {
    id: 4,
    name: "Isaiah Olumide",
    role: "Property Acquisition Specialist",
    image: "/logo/Team/WhatsApp Image 2026-04-25 at 5.41.00 AM.jpeg",
    email: "Isaiahmusicgiantimgsznf@gmail.com",
    linkedin: "https://www.linkedin.com/in/isaiah-olumide-7426a9273/",
  },
];

const iconMap = {
  star: FaStar,
  graduation: FaGraduationCap,
  users: FaUsers,
  shield: FaShieldAlt,
};

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

const SectionHeader = ({
  title,
  description,
  className = "mb-8 sm:mb-10",
}: {
  title: string;
  description: string;
  className?: string;
}) => (
  <div className={`max-w-2xl space-y-3 ${className}`}>
    <img
      src="/logo/Abstract Design (1).png"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className="w-12 object-contain"
    />
    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
      {title}
    </h2>
    <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
      {description}
    </p>
  </div>
);

const StepCard = ({ item }: { item: Step }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = item.description.length > 80;

  return (
    <article className={`${CARD} flex h-full flex-col p-6`}>
      <span className="mb-4 inline-flex w-fit rounded-full bg-[#703BF7]/10 px-3 py-1 text-xs font-semibold text-[#703BF7] dark:bg-[#703BF7]/25 dark:text-white">
        {item.step}
      </span>

      <h3 className="mb-2 text-xl font-semibold leading-snug text-gray-900 dark:text-white">
        {item.title}
      </h3>

      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {isExpanded || !isLong
          ? item.description
          : `${item.description.substring(0, 80)}... `}
        {isLong && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
            className="ml-1 inline-block cursor-pointer text-xs font-semibold text-[#703BF7] hover:underline dark:text-[#a98bff]"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </p>
    </article>
  );
};

const StatCard = ({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) => (
  <div className={`${CARD} px-4 py-4 ${className}`}>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function About() {
  useScrollToHash();

  const handleMessage = (
    e: FormEvent<HTMLFormElement>,
    member: TeamMember,
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const input = form.elements.namedItem("message") as HTMLInputElement;

    const subject = `Message for ${member.name}`;
    const body = [
      `Hello ${member.name},`,
      "",
      input.value,
      "",
      "Best regards,",
    ].join("\n");

    window.location.href = `mailto:${member.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    input.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Helmet>
        <title>About RewaCiti | Trusted Real Estate Platform in Ile-Ife</title>
        <meta
          name="description"
          content="Learn how RewaCiti helps buyers, renters, and students find trusted real estate listings and housing in Ile-Ife and Osun State."
        />
        <meta
          property="og:title"
          content="About RewaCiti | Trusted Real Estate Platform"
        />
        <meta
          property="og:description"
          content="RewaCiti is a growing real estate platform for student housing, property sales, and investment guidance in Ile-Ife."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="About RewaCiti | Trusted Real Estate Platform"
        />
        <meta
          name="twitter:description"
          content="Learn how RewaCiti helps buyers, renters, and students access trusted housing and property services in Ile-Ife."
        />
        <link rel="canonical" href="https://rewaciti.com/about" />
      </Helmet>

      <Navbar />

      <main>
        {/* ---------------------------- JOURNEY ---------------------------- */}
        <section
          className={`${SECTION} bg-gray-200 dark:bg-black/50`}
          id="Journey"
        >
          <div
            className={`${PAGE_CONTAINER} grid items-center gap-10 lg:grid-cols-2 lg:gap-14`}
          >
            {/* Image first on mobile, right column on desktop */}
            <div className="lg:order-last">
              <div
                className="relative overflow-hidden rounded-2xl border border-gray-600/30 bg-cover bg-center p-4 sm:p-6"
                style={{ backgroundImage: "url('/logo/Abstract Design.png')" }}
              >
                <div
                  className="absolute inset-0 bg-neutral-900/90"
                  aria-hidden="true"
                />
                <img
                  src={hero}
                  alt="RewaCiti team and properties"
                  loading="lazy"
                  decoding="async"
                  className="relative h-[300px] w-full rounded-xl bg-gray-300 object-cover sm:h-[380px] lg:h-[420px] dark:bg-black/10"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <img
                  src="/logo/Abstract Design (1).png"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="w-12 object-contain"
                />
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
                  Our Journey
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
                  Our story is one of continuous growth and evolution. We
                  started as a small team with big dreams, determined to create
                  a real estate platform that transcended the ordinary. Over the
                  years, we've expanded our reach, forged valuable partnerships,
                  and gained the trust of countless clients.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <StatCard value="50+" label="Happy customers" />
                <StatCard value="60+" label="Properties for clients" />
                <StatCard
                  value="5+"
                  label="Years of experience"
                  className="col-span-2 sm:col-span-1"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------- VALUES ---------------------------- */}
        <section className={SECTION} id="Values">
          <div
            className={`${PAGE_CONTAINER} grid gap-8 lg:grid-cols-3 lg:gap-12`}
          >
            <SectionHeader
              className="lg:col-span-1 lg:self-center"
              title="Our Values"
              description="Our story is one of continuous growth and evolution. We started as a small team with big dreams, determined to create a real estate platform that transcended the ordinary."
            />

            {/* gap-px over a tinted background draws clean dividers */}
            <div className="grid h-fit gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-sm sm:grid-cols-2 lg:col-span-2 dark:border-white/10 dark:bg-white/10">
              {valuesData.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <div
                    key={item.id}
                    className="space-y-4 bg-white p-6 dark:bg-[#1A1A1A]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#703BF7]/10 text-[#703BF7] dark:bg-[#703BF7]/25 dark:text-[#c3b0fb]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------- ACHIEVEMENTS ------------------------- */}
        <section
          className={`${SECTION} bg-gray-200 dark:bg-black/50`}
          id="Achievements"
        >
          <div className={PAGE_CONTAINER}>
            <SectionHeader
              title="Our Achievements"
              description="Our story is one of continuous growth and evolution. We started as a small team with big dreams, determined to create a real estate platform that transcended the ordinary."
            />

            <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
              {Achievements.map((item: AchievementItem) => (
                <article key={item.id} className={`${CARD} h-full p-6`}>
                  <div className="mb-4 h-1 w-10 rounded-full bg-[#703BF7]" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------- PROCESS --------------------------- */}
        <section className={SECTION} id="Process">
          <div className={PAGE_CONTAINER}>
            <SectionHeader
              title="Navigating the RewaCiti Experience"
              description="At RewaCiti, we've designed a straightforward process to help you find and purchase your dream property with ease. Here's a step-by-step guide to how it all works."
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {stepsData.map((item) => (
                <StepCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ TEAM ----------------------------- */}
        <section
          className={`${SECTION} bg-gray-200 dark:bg-black/50`}
          id="Team"
        >
          <div className={PAGE_CONTAINER}>
            <SectionHeader
              title="Meet the RewaCiti Team"
              description="At RewaCiti, our success is driven by the dedication and expertise of our team. Get to know the people behind our mission to make your real estate dreams a reality."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {teamData.map((member: TeamMember) => (
                <article
                  key={member.id}
                  className={`${CARD} p-5 transition-shadow hover:shadow-lg`}
                >
                  {/* Photo + LinkedIn */}
                  <div className="relative">
                    <img
                      src={member.image}
                      alt={member.name}
                      loading="lazy"
                      decoding="async"
                      className="h-60 w-full rounded-xl object-cover"
                    />

                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on LinkedIn`}
                      className="absolute -bottom-5 left-1/2 -translate-x-1/2 cursor-pointer rounded-full bg-[#703BF7] p-1 shadow-md ring-4 ring-white transition-colors hover:bg-[#5b2fd1] dark:ring-[#1A1A1A]"
                    >
                      <FaLinkedin className="h-7 w-7 p-1 text-white" />
                    </a>
                  </div>

                  {/* Name + role */}
                  <div className="mt-8 space-y-1 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {member.role}
                    </p>
                  </div>

                  {/* Say hello (opens the user's email app) */}
                  <form
                    onSubmit={(e) => handleMessage(e, member)}
                    className="flex w-full items-center overflow-hidden rounded-full border border-gray-300 p-1.5 pl-4 focus-within:border-[#703BF7] dark:border-white/15"
                  >
                    <input
                      type="text"
                      name="message"
                      autoComplete="off"
                      aria-label={`Message for ${member.name}`}
                      placeholder="Say hello ✋"
                      className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                    />
                    <button
                      type="submit"
                      aria-label={`Email ${member.name}`}
                      className="flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#703BF7] p-2 transition-colors hover:bg-[#5b2fd1]"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;