import logo from "/Symbol.png"; 
import Entericon from "/logo/Send.png";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { Link } from "react-router";
import { useState } from "react";
import axios from "axios";

function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyId: "69b4712ce95a2df514b1c789",
      pipelineId: "69b49c7541d35d158e336621",
      title: `Newsletter Subscription: ${email}`,
      name: "Newsletter Subscriber",
      email: email,
      note: "User subscribed to newsletter via footer form.",
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      alert("Subscribed successfully!");
      setEmail("");
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="">
        <div className="relative py-10 px-5 bg-cover"
            style={{
              backgroundImage: "url('/logo/CTA.png')",
            }}
        >
            {/* overlay */}
            <div className="absolute inset-0 bg-black/50 dark:bg-black/0"></div>

            <div className="relative sm:flex justify-between items-center space-y-6 sm:space-y-0">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white">Start Your Real Estate Journey Today</h1>
              <p className="dark:text-gray-400 text-gray-100 w-[90%]">
                Your dream property is just a click away. Whether you're looking for a new home, a strategic investment, or expert real estate advice, RewaCiti is here to assist you every step of the way. Take the first step towards your real estate goals and explore our available properties or get in touch with our team for personalized assistance.
              </p>
            </div>
    
             <button className="bg-[#703BF7] hover:bg-[#9677df] text-white px-3 py-2 rounded text-sm sm:w-[30%] w-full">
               <Link to = "/AllProperties">Explore Properties</Link>
            </button>
          </div>  
        </div>
        <hr className=" dark:border-gray-600/30 border-gray-900/30 border" />


        <div className="py-8 px-4 lg:flex space-y-10 lg:space-y-0 justify-between">
          <div className="mr-[5%]  space-y-4">
            <p className="flex items-center space-x-2 text-gray-800 text-[30px] font-bold dark:text-white">
              <img src={logo} alt="logo" className="h-10 mr-1" /><span className="text-black dark:text-white">RewaCiti</span></p>
              <div>
                <div className="text-black dark:text-white">Get updates about new properties</div>
              </div>
            <form onSubmit={handleSubmit} className="flex items-center p-2 rounded overflow-hidden border dark:border-gray-400/30 border-gray-900 lg:w-[250px] w-full">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-black dark:text-white outline-none w-full bg-transparent"
                disabled={isSubmitting}
              />
              <button type="submit" className="flex items-center justify-center disabled:opacity-50" disabled={isSubmitting}>
                <img src={Entericon} alt="enter" className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="w-full lg:w-[90%] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:gap-8 lg:gap-4 h-fit divide-x md:divide-x-0 dark:divide-gray-400/30 divide-gray-900/30">
              {/* COLUMN 1 — Home */}
                <div className="p-4">
                  <h3 className="dark:text-gray-400 text-gray-600 font-semibold mb-5"><Link to="/">Home</Link></h3>
                  <ul className="space-y-5 text-sm">
                    <li>
                      <Link to="/#features" className="hover:text-[#703BF7] text-black dark:text-white dark:hover:text-[#703BF7] cursor-pointer">Features</Link>
                    </li>
                    <li>
                      <Link to="/#properties" className="hover:text-[#703BF7] text-black dark:text-white dark:hover:text-[#703BF7] cursor-pointer">Properties</Link>
                    </li>
                    <li>
                      <Link to="/#testimonials" className="hover:text-[#703BF7] text-black dark:text-white dark:hover:text-[#703BF7] cursor-pointer">Testimonials</Link>
                    </li>
                    <li>
                      <Link to="/#faq" className="hover:text-[#703BF7] text-black dark:text-white dark:hover:text-[#703BF7] cursor-pointer">FAQ</Link>
                    </li>
                  </ul>
                  <hr className="my-4 dark:border-gray-400/30 border-gray-900/30 md:hidden" />
                </div>

                {/* COLUMN 2 — About Us */}
                 <div className="p-4">
                  <h3 className="dark:text-gray-400 text-gray-600 font-semibold mb-5"><Link to="/About">About Us</Link></h3>
                  <ul className="space-y-5 text-sm">
                    <li>
                        <Link to="/About#Journey" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Our Story</Link>
                    </li>
                    <li>
                      <Link to="/About#Values" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Our Values</Link>
                    </li>
                    <li>
                      <Link to="/About#Achievements" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Our Achievements</Link>
                    </li>
                    <li>
                      <Link to="/About#Process" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">How it work</Link>
                    </li>
                    <li>
                      <Link to="/About#Team" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Our Team</Link>
                    </li>
                  </ul>
                  <hr className="my-4 dark:border-gray-400/30 border-gray-900/30 md:hidden" />
                </div>

                {/* COLUMN 3 — Properties */}
                <div className="p-4">
                  <h3 className="dark:text-gray-400 text-gray-600 font-semibold mb-5"><Link to="/Properties">Properties</Link></h3>
                  <ul className="space-y-5 text-sm">
                    <li>
                        <Link to="/Properties#Categories" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Categories</Link>
                    </li>
                    <li>
                      <Link to="/Properties#Portfolio" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Portfolio</Link>
                    </li>
                  </ul>
                  <hr className="my-4 dark:border-gray-400/30 border-gray-900/30 md:hidden" />

                  <div className="py-4 sm:hidden">
                    <h3 className="dark:text-gray-400 text-gray-600 font-semibold mb-5"><Link to="/Contact">Contact Us</Link></h3>
                    <ul className="space-y-5 text-sm">
                      <li>
                          <Link to="/Contact#Contactinfo" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7] ">Contact info</Link>
                      </li>
                      <li>
                          <Link to="/Contact#Contactform" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Contact Form</Link>
                      </li>
                      <li>
                        <Link to="/Contact#Ouroffices" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Our Offices</Link>
                      </li>
                    </ul>
                    <hr className="my-4 dark:border-gray-400/30 border-gray-900/30 md:hidden" />
                  </div>
                </div>

                {/* COLUMN 4 — Services */}
                <div className="p-4">
                  <h3 className="dark:text-gray-400 text-gray-600 font-semibold mb-5"><Link to="/Service">Services</Link></h3>
                  <ul className="space-y-5 text-sm">
                     <li>
                      <Link to="/Service#whatweoffer" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">What We Offer</Link>
                    </li>
                    <li>
                        <Link to="/Service#valuation" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Valuation Mastery</Link>
                    </li> 
                    <li>
                      <Link to="/Service#Management" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Property Management</Link>
                    </li>
                    <li>
                      <Link to="/Service#marketing" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Strategic Marketing</Link>
                    </li>
                  </ul>
                  <hr className="my-4 dark:border-gray-400/30 border-gray-900/30 md:hidden" />
                </div>

                {/* COLUMN 5 — Contact Us (shows on tablet and desktop) */}
                <div className="p-4 hidden sm:block">
                  <h3 className="dark:text-gray-400 text-gray-600 font-semibold mb-5"><Link to="/Contact">Contact Us</Link></h3>
                  <ul className="space-y-5 text-sm">
                      <li>
                          <Link to="/Contact#Contactinfo" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7] ">Contact info</Link>
                      </li>
                      <li>
                          <Link to="/Contact#Contactform" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Contact Form</Link>
                      </li>
                      <li>
                        <Link to="/Contact#Ouroffices" className="hover:text-[#703BF7] text-black dark:text-white cursor-pointer dark:hover:text-[#703BF7]">Our Offices</Link>
                      </li>
                    </ul>
                  <hr className="my-4 dark:border-gray-400/30 border-gray-900/30 md:hidden" />
                </div>

              </div>
            </div>


        <div className="w-full dark:bg-[#1A1A1A] bg-gray-400 py-4">
          <div className="w-[90%] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Left side: Year and Terms */}
            <div className="text-gray-900 dark:text-gray-500 text-sm flex flex-col md:flex-row items-center gap-2">
              <span>© {currentYear} RewaCiti. All rights reserved.</span>
              <a href="/terms-policies" className="hover:text-[#703BF7] text-gray-900 dark:text-gray-500 text-sm dark:hover:text-[#703BF7] cursor-pointer">
                Terms & Conditions
              </a>
            </div>

            {/* Right side: Social Media Icons */}
            <div className="flex gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:bg-blue-500 rounded-full w-8 h-8 bg-black items-center justify-center flex p-2">
                <FaFacebookF />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:bg-blue-500 rounded-full w-8 h-8 bg-black items-center justify-center flex">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:bg-pink-500 rounded-full w-8 h-8 bg-black items-center justify-center flex">
                <FaInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:bg-blue-500 rounded-full w-8 h-8 bg-black items-center justify-center flex">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>

    </div>
  )
}

export default Footer