import Navbar from "../../shared/components/Layout/Navbar"
import hero from "/logo/Image (1).png"
import { FaStar, FaUsers, FaShieldAlt,FaGraduationCap, FaLinkedin } from "react-icons/fa";
import Entericon from "/logo/Send.png";
import type { ValueItem,Step,TeamMember, AchievementItem } from "../../types";
import Footer from "../../shared/components/Layout/Footer";
import useScrollToHash from "../../shared/hooks/useScrollToHash";




const valuesData:ValueItem[] = [
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

const Achievements = [
  {
    id: 1,
    title: "3+ Years of Excellence",
    description:"With over 3 years in the industry, we've amassed a wealth of knowledge and experience."
  },
  {
    id: 2,
    title: "Happy Clients",
    description:"Our greatest achievement is the satisfaction of our clients. Their success stories fuel our passion for what we do."
  },
  {
    id: 3,
    title: "Industry Recognition",
    description:"We've earned the respect of our peers and industry leaders, with accolades and awards that reflect our commitment to excellence."
  },
];

const stepsData: Step[] = [
  {
    id: 1,
    step: "Step 01",
    title: "Discover a World of Possibilities",
    description:"Your journey begins with exploring our carefully curated property listings. Use our intuitive search tools to filter properties based on your preferences, including location,"
  },
  {
    id: 2,
    step: "Step 02",
    title: "Narrowing Down Your Choices",
    description:"Once you've found properties that catch your eye,make a shortlist. This allows you to compare and revisit your favorites as you make your decision."
  },
  {
    id: 3,
    step: "Step 03",
    title: "Personalized Guidance",
    description:"Have questions about a property or need more information? Our dedicated team of real estate experts is just a call or message away."
  },
  {
    id: 4,
    step: "Step 04",
    title: "See It for Yourself",
    description:"Arrange viewings of the properties you're interested in. We'll coordinate with the property owners and accompany you to get a firsthand look at your potential new home."
  },
  {
    id: 5,
    step: "Step 05",
    title: "Making Informed Decisions",
    description:"Before making an offer, our team will assist you with due diligence, including property inspections, legal checks, and market analysis. We want you to be fully informed."
  },
  {
    id: 6,
    step: "Step 06",
    title: "Getting the Best Deal",
    description:"We'll help you negotiate the best terms and prepare your offer. Our goal is to secure the property at the right price and on favorable terms."
  }
];

const teamData: TeamMember[] = [
  {
    id: 1,
    name: "John Williams",
    role: "Founder & CEO",
    image: "/team/member1.jpg",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Chief Real Estate Officer",
    image: "/team/member2.jpg",
  },
  {
    id: 3,
    name: "Michael Brown",
    role: "Head of Property Management",
    image: "/team/member3.jpg",
  },
  {
    id: 4,
    name: "Emily Carter",
    role: "Legal Counsel",
    image: "/team/member4.jpg",
  },
];



const iconMap = {
  star: <FaStar className="w-12 h-12 text-[#9a79ee] border p-3 rounded-full border-[#703BF7]" />,
  graduation: <FaGraduationCap className="w-12 h-12 text-[#9a79ee] border p-3 rounded-full border-[#703BF7]"  />,
  users: <FaUsers className="w-12 h-12 text-[#9a79ee] border p-3 rounded-full border-[#703BF7]"  />,
  shield: <FaShieldAlt className="w-12 h-12 text-[#9a79ee] border p-3 rounded-full border-[#703BF7]"  />,
};

function About() {
  useScrollToHash();
  return (
    <div>
        <Navbar />
        <section className="relative flex flex-col md:flex-row bg-gray-300 dark:bg-black/30 py-6 px-4 lg:gap-10 md:gap-3" id="Journey">
          <div className="flex-1  flex flex-col justify-center space-y-6 z-10 order-last md:order-first ">
           <img
              src="/logo/Abstract Design (1).png"
              alt="Icon"
              className="w-13 h-13 object-contain"
            />
          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
            Our Journey
          </h1>

          <p className="text-gray-600 dark:text-gray-400 text-[14px] max-w-[95%]">
            Our story is one of continuous growth and evolution. We started as a small team with big dreams, determined to create a real estate platform that transcended the ordinary. Over the years, we've expanded our reach, forged valuable partnerships, and gained the trust of countless clients.
          </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center text-center md:text-left w-full">
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-600/30 text-gray-900 dark:text-white px-4 py-3 rounded w-full">
                  <p className="text-lg font-semibold">200+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Happy customers</p>
                </div>
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-600/30 text-gray-900 dark:text-white px-4 py-3 rounded w-full">
                  <p className="text-lg font-semibold">10k+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
                </div>
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-600/30 text-gray-900 dark:text-white px-4 py-3 rounded w-full col-span-2 md:col-span-1">
                  <p className="text-lg font-semibold">16+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Years of Experience</p>
                </div>
              </div>   
        </div>

        
        <div className="flex-1 relative order-first md:order-last justify-center items-center flex mx-auto md:mb-10 mb-5">
          {/* Padding wrapper */}
          <div className="p-4 sm:p-6 relative z-10 border border-gray-600/30 rounded-sm flex justify-center items-center"
          style={{
            backgroundImage: "url('/logo/Abstract Design.png')",
          }}>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-neutral-900/90 rounded-sm -z-10"></div>

            {/* Image */}
            <img
              src={hero}
              alt="Hero"
              className="w-full h-[300px] object-cover bg-gray-300 dark:bg-black/10 rounded-2xl sm:rounded-none max-h-[700px] xl:max-h-[500px] sm:min-w-[300px]"
            />
          </div>
      </div>
    </section>

    <section className="bg-gray-300 dark:bg-black/30 md:py-6 py-3 px-4 lg:gap-12 flex flex-col md:flex-row gap-8 md:gap-0" id="Values">
        {/* LEFT SIDE — 1 PART WIDTH */}
        <div className="flex-1 flex flex-col justify-center space-y-6 z-10 ">
          <img
            src="/logo/Abstract Design (1).png"
            alt="Icon"
            className="w-13 h-13 object-contain"
          />

          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Our Values</h1>

          <p className="dark:text-gray-400 text-gray-600 text-[14px] max-w-[95%]">
            Our story is one of continuous growth and evolution. We started as a small team with big dreams, determined to create a real estate platform that transcended the ordinary.
          </p>
        </div>

        {/* RIGHT SIDE — 2 PARTS WIDTH */}
        <div className="border-7 dark:bg-[#121212] bg-white border-neutral-800/50 rounded-3xl h-fit flex-2">
          <div className="flex-2 border border-neutral-700/30 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
  
              {valuesData.map((item, index) => (
                <div
                  key={item.id}
                  className={`
                    p-3 space-y-4 border-gray-700/40 border-b 
                    ${index < 2 ? "sm:border-b " : ""}
                    ${index % 2 === 0 ? "sm:border-r" : ""}  
                  `}
                >
                  <div className="flex items-center gap-4">
                    {iconMap[item.icon]}
                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold">{item.title}</h3>
                  </div>
  
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
  
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-300 dark:bg-black/30 md:py-6 py-3 px-4 lg:gap-10" id="Achievements">
         <div className="flex-1 flex flex-col justify-center space-y-3 z-10 ">
          <img
            src="/logo/Abstract Design (1).png"
            alt="Icon"
            className="w-13 h-13 object-contain"
          />

          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Our Achievements</h1>

          <p className="dark:text-gray-400 text-gray-600 text-[14px] max-w-[95%]">
           Our story is one of continuous growth and evolution. We started as a small team with big dreams, determined to create a real estate platform that transcended the ordinary.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-2 mx-auto mt-8">
            {Achievements.map((item: AchievementItem) => (
              <div
                key={item.id}
                className="dark:bg-[#121212] bg-white  border-7 border-neutral-800/50 rounded-3xl"
              >
                <div className=" rounded-2xl border border-gray-700/40 p-5 space-y-4 h-full">

                <h3 className="text-gray-900 dark:text-white text-lg font-semibold">{item.title}</h3>
                <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="bg-gray-300 dark:bg-black/30 md:py-6 py-3 px-4 lg:gap-10" id="Process">
         <div className="flex-1 flex flex-col justify-center space-y-3 z-10 ">
          <img
            src="/logo/Abstract Design (1).png"
            alt="Icon"
            className="w-13 h-13 object-contain"
          />

          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Navigating the Rẹ́wàCity Experience</h1>

          <p className="dark:text-gray-400 text-gray-600 text-[14px] max-w-[95%]">
            At Rẹ́wàCity, we've designed a straightforward process to help you find and purchase your dream property with ease. Here's a step-by-step guide to how it all works.
          </p>
        </div>

         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mx-auto mt-8">
          {stepsData.map((item) => (
              <div
                key={item.id}
                className="mx-auto">
                  <p className="text-gray-900 dark:text-white font-semibold text-sm border-l border-[#703BF7] p-2">{item.step}</p>

                  <div className="relative border dark:bg-[#121212] bg-white border-gray-700/40 p-4 rounded-md rounded-l-none rounded-b-md space-y-3 mx-auto justify-center">
                    {/* Top-left border accent */}
                    <div className="absolute top-0 left-0 w-25 h-px bg-[#703BF7]"></div>
                    <div className="absolute top-0 left-0 w-px h-10 bg-[#703BF7]"></div>

                    {/* Faint Purple Glow */}
                    <div className="absolute top-0 left-0 w-24 h-10 bg-linear-to-br dark:from-[#201a2f] from-[rgb(90,64,156)] via-purple-700/10 to-transparent pointer-events-none"></div>

                    <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
                      {item.title}
                    </h3>

                    <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
              </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-300 dark:bg-black/30 md:py-6 py-3 px-4 lg:gap-10 space-y-5" id="Team">
          <div className="flex-1 flex flex-col justify-center space-y-3 z-10 ">
          <img
            src="/logo/Abstract Design (1).png"
            alt="Icon"
            className="w-13 h-13 object-contain"
          />

          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Meet the Rẹ́wàCity Team</h1>

          <p className="dark:text-gray-400 text-gray-600 text-[14px] max-w-[95%]">
            At Rẹ́wàCity, our success is driven by the dedication and expertise of our team. Get to know the people behind our mission to make your real estate dreams a reality.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mx-auto">
          {teamData.map((member: TeamMember) => (
            <div
              key={member.id}
              className="p-5 rounded-xl dark:bg-[#121212] bg-white border border-gray-700/40 shadow-md hover:shadow-lg transition"
            >
              {/* IMAGE + TWITTER */}
              <div className="relative">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-56 object-cover rounded-lg"
                />

                {/* Floating Twitter Icon */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#703BF7] p-1 rounded-full shadow-md cursor-pointer hover:bg-purple-600">
                  <FaLinkedin className="text-white w-7 h-7 p-1" />
                </div>
              </div>

              {/* Name + Role */}
              <div className="mt-8 text-center space-y-1">
                <h3 className=" text-gray-900 dark:text-white text-lg font-semibold">{member.name}</h3>
                <p className="dark:text-gray-400 text-gray-600 text-sm mb-2">{member.role}</p>
              </div>

              {/* Email Chat Box */}
              <form className="flex items-center p-2 rounded-full overflow-hidden border border-gray-600/30 w-full">
                <input
                  type="text"
                  placeholder="Say Hello ✋"
                  className="text-gray-900 dark:text-white outline-none w-full placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button type="submit" className="flex items-center justify-center p-2 bg-[#703BF7] rounded-full">
                  <img src={Entericon} alt="enter" className="w-3 h-3" />
                </button>
              </form>
            </div>
          ))}
      </div>
    </section>
    <section className="bg-gray-300 dark:bg-black/30 pt-5">
        <Footer/>
      </section> 
  </div>
  )
}

export default About;