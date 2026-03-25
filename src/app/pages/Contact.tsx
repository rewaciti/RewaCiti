import Navbar from "../../shared/components/Layout/Navbar";
import { FaEnvelope, FaPhone, FaDirections } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import Footer from "../../shared/components/Layout/Footer";
import useScrollToHash from "../../shared/hooks/useScrollToHash";
import { useState } from "react";
import axios from "axios";

function Contact() {
  const [agreed, setAgreed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [source, setSource] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useScrollToHash();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    setIsSubmitting(true);

    const fullName = `${firstName} ${lastName}`.trim();

    const payload = {
      companyId: "69b4712ce95a2df514b1c789",
      pipelineId: "69b49c7541d35d158e336621",
      title: `Contact Inquiry from ${fullName}`,
      name: fullName,
      email: email,
      phone: phone,
      note: message,
      customData: [
        { label: "Inquiry Type", value: inquiryType },
        { label: "Source", value: source },
      ],
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      alert("Message sent successfully!");
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setInquiryType("");
      setSource("");
      setMessage("");
      setAgreed(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const services1 = [
    {
      img: "/logo/servicecontainer/Icon Container (17).png",
      text: "RewaCity@yahoo.com",
    },
    {
      img: "/logo/servicecontainer/Icon Container (16).png",
      text: "+234 701 896 0275",
    },
    {
      img: "/logo/servicecontainer/Icon Container (15).png",
      text: "Location",
    },
    {
      img: "/logo/servicecontainer/Icon Container (14).png",
      text: "Social Media",
    },
  ];
  return (
    <div className="">
      <Navbar />
      <div className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 p-5 py-10  space-y-6">
        <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
          Get in Touch with RewaCitty
        </h1>

        <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
          Welcome to RewaCitty's Contact Us page. We're here to assist you with
          any inquiries, requests, or feedback you may have. Whether you're
          looking to buy or sell a property, explore investment opportunities,
          or simply want to connect, we're just a message away. Reach out to us,
          and let's start a conversation.
        </p>
      </div>

      <section
        className="px-4 py-2 bg-gray-300 dark:bg-black/30 border-t-5 border-b-5 border-gray-600/30"
        id="Contactinfo"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* BOX ITEM */}
          {services1.map((item, index) => (
            <div
              key={index}
              className="relative bg-white dark:bg-[#1A1A1A] border border-gray-600/30 rounded-xl p-6 flex flex-col items-center hover:scale-[1.02] transition"
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
              <p className="text-gray-900 dark:text-white text-center text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-300 dark:bg-black/30 p-4" id="Contactform">
        <div className="flex-1 flex flex-col justify-center space-y-3 z-10 mb-6">
          <img
            src="/logo/Abstract Design (1).png"
            alt="Icon"
            className="w-13 h-13 object-contain"
          />

          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Let's Connect</h1>

          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
            We're excited to connect with you and learn more about your real
            estate goals. Use the form below to get in touch with RewaCitty.
            Whether you're a prospective client, partner, or simply curious
            about our services, we're here to answer your questions and provide
            the assistance you need.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border border-gray-600/30 p-4 rounded-xl dark:bg-[#121212] bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* First & Last Name */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">First Name</label>
              <input
                type="text"
                placeholder="Enter First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Last Name</label>
              <input
                type="text"
                placeholder="Enter Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white"
              />
            </div>

            {/* Email & Phone */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Email</label>
              <input
                type="email"
                placeholder="Enter your Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Phone</label>
              <input
                type="tel"
                placeholder="Enter Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white"
              />
            </div>

            {/* Inquiry Type & Source */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Inquiry Type</label>

              <select 
                required 
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white"
              >
                <option value="" hidden className=" ">
                  Select Inquiry Type
                </option>

                <option value="buying" className="">
                  Buying Property
                </option>

                <option value="selling" className="">
                  Selling Property
                </option>

                <option value="renting" className="">
                  Renting
                </option>

                <option value="management" className="">
                  Property Management
                </option>

                <option value="investment" className="">
                  Investment
                </option>
                <option value="agent" className="">
                  Be an Agent
                </option>
              </select>
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                How Did You Hear About Us?
              </label>

              <select 
                required 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 dark:text-white text-gray-900 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7]"
              >
                <option value="" hidden className=" ">
                  Select Option
                </option>

                <option value="social" className="">
                  Social Media
                </option>

                <option value="google" className="">
                  Google Search
                </option>

                <option value="friend" className="">
                  Friend / Referral
                </option>

                <option value="ads" className="">
                  Online Ads
                </option>

                <option value="other" className="">
                  Other
                </option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className=" text-gray-700 dark:text-gray-300 text-sm mb-1 block">Message</label>
            <textarea
              rows={4}
              required
              placeholder="Enter your Message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/30 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#703BF7] dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
            />
          </div>

          {/* Agreement */}
          <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="text-gray-900 dark:text-white text-sm">
                I agree with the{" "}
                <a href="/terms-policies" className="hover:text-[#703BF7] text-gray-900 dark:text-white text-sm underline dark:hover:text-[#703BF7]">
                  Terms & Conditions
                </a>
              </p>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2 flex items-center justify-end">
            <button
                type="submit"
                disabled={!agreed || isSubmitting}
                className={`px-4 py-3 rounded-lg font-medium transition
                  ${agreed && !isSubmitting
                    ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white" 
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                  }`}
              >
                {isSubmitting ? "Sending..." : "Send Your Message"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-gray-300 dark:bg-black/30 p-4" id="Ouroffices">
        <div className="flex-1 flex flex-col justify-center space-y-3 z-10 mb-6">
          <img
            src="/logo/Abstract Design (1).png"
            alt="Icon"
            className="w-13 h-13 object-contain"
          />

          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
            Discover Our Office Location
          </h1>

          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
            RewaCitty is here to serve you across multiple locations. Whether
            you're looking to meet our team, discuss real estate opportunities,
            or simply drop by for a chat, we have offices conveniently located
            to serve your needs. Explore the categories below to find the
            RewaCitty office nearest to you
          </p>
        </div>
        <div className="border border-gray-600/30 rounded-xl p-6 dark:bg-[#1A1A1A] bg-white space-y-5">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Main Headquarters
            </h3>
            <p className="text-gray-800 dark:text-gray-400 text-sm">
              Adan and Eve Hostel,Ibadan Rd, energy filling station,camus gate, OAU, Ile-Ife.
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            Our main headquarters serve as the heart of RewaCiti.Located in the
            bustling city center, this is where our core team of experts
            operates, driving the excellence and innovation that define us.
          </p>

          {/* Contact Info */}
          <div className="space-y-3 md:flex gap-5">
            {/* Email */}
            <a
              href="mailto:info@RewaCitty.com"
              className="flex items-center gap-3 text-gray-300 hover:text-[#703BF7] transition bg-black p-2 px-4 rounded-full w-full  border border-gray-600/70 md:w-fit justify-center"
            >
              <FaEnvelope />
              <span>rewacity@yahoo.com</span>
            </a>

            {/* Phone */}
            <a
              href="tel:+11234567890"
              className="flex items-center gap-3 text-gray-300 hover:text-[#703BF7] transition bg-black p-2 px-4 rounded-full w-full border border-gray-600/70 md:w-fit justify-center"
            >
              <FaPhone />
              <span>+234 701 896 0275</span>
            </a>

            {/* City */}
            <div className="flex items-center gap-3 text-gray-300 bg-black  px-4 rounded-full w-full border border-gray-600/70 h-11 md:w-fit justify-center ">
              <FiMapPin />
              <span>OAU, Ile-Ife</span>
            </div>
          </div>

          {/* Action Button */}
          <a
            href="https://www.google.com/maps/place/Adam+and+Eve+Hostel/@7.4947457,4.5248031,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgICcxreZKg!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHVAwepfoA-TPS0YVlGhOaP24wuMT4wRE4bmRN8Nr_K9chUpKMqbpHs6C_JUKr5qvbwGRGV9dbvG2BGyoUgO9sm5-67AycS9427fDDcOureud3jqCAroqvcMgDLMYnUKKXFcdZD6xFk%3Dw203-h270-k-no!7i3120!8i4160!4m7!3m6!1s0x103837296ccb765b:0xa5dca41cd9bf8328!8m2!3d7.4948027!4d4.5246398!10e5!16s%2Fg%2F12ht2d5dw?entry=ttu&g_ep=EgoyMDI2MDMyMi4wIKXMDSoASAFQAw%3D%3Dogle.com/maps?q=Awolowo+Hall+OAU+Ile-Ifehttps://www.google.com/maps/place/Adam+and+Eve+Hostel/@7.4947457,4.5248031,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgICcxreZKg!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHVAwepfoA-TPS0YVlGhOaP24wuMT4wRE4bmRN8Nr_K9chUpKMqbpHs6C_JUKr5qvbwGRGV9dbvG2BGyoUgO9sm5-67AycS9427fDDcOureud3jqCAroqvcMgDLMYnUKKXFcdZD6xFk%3Dw203-h270-k-no!7i3120!8i4160!4m9!3m8!1s0x103837296ccb765b:0xa5dca41cd9bf8328!8m2!3d7.4948027!4d4.5246398!10e5!14m1!1BCgIgAQ!16s%2Fg%2F12ht2d5dw?entry=ttu&g_ep=EgoyMDI2MDMyMi4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#703BF7] hover:bg-[#5c2fe0] transition rounded-lg text-white font-medium w-full justify-center mt-4 lg:w-fit"
          >
            <FaDirections />
            Get Direction
          </a>
        </div>
      </section>
      <section className="bg-gray-300 dark:bg-black/30">
        <Footer />
      </section>
    </div>
  );
}

export default Contact;
