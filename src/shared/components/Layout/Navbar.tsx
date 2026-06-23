import { NavLink, useNavigate } from "react-router";
import logo from "/Symbol.png";
import { useState, useRef, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore";
import { FiSun, FiMoon, FiPlus, FiTrash2 } from "react-icons/fi";
import { usePropertyStore } from "../../../features/properties/store/usePropertyStore";
import { toast } from "sonner";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const shortlistRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useThemeStore();
  const { shortlistedProperties, toggleShortlist } = usePropertyStore();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/About" },
    { name: "Properties", path: "/properties" },
    { name: "Services", path: "/Service" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shortlistRef.current && !shortlistRef.current.contains(event.target as Node)) {
        setIsShortlistOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-gray-300 text-black dark:bg-[#1A1A1A] dark:text-white">
      {/* Top small bar */}
      <div
        className="h-10 flex items-center justify-between px-4 sm:px-10 w-full text-black dark:bg-[#1A1A1A] bg-gray-400"
        style={{
          backgroundImage: "url('/logo/Abstract Design.png')",
          backgroundPosition: "center",
        }}
      >
        
        <div className="flex justify-center lg:ml-[40%] sm:ml-[20%] items-center">        
         <p className="flex items-center mr-1 text-gray-900 dark:text-white ">✨Discover Properties with RewaCiti</p>
          <NavLink to="/blog" aria-label="View blog page" className="underline text-sm hidden sm:block text-gray-900 dark:text-white">
            View Blog
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          {/* Shortlist Counter & Dropdown */}
          <div className="relative" ref={shortlistRef}>
            <button 
              onClick={() => setIsShortlistOpen(!isShortlistOpen)}
              title="Shortlist"
              className="flex items-center gap-1 text-gray-900 dark:text-white hover:text-[#703BF7] transition-colors relative group cursor-pointer"
            >
              <div className="relative p-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white transition-all duration-300">
                <FiPlus size={20} />
                {shortlistedProperties.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#703BF7] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {shortlistedProperties.length}
                  </span>
                )}
              </div>
            </button>

            {isShortlistOpen && (
              <div className="absolute right-0 top-4 mt-2 w-72 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-100 overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-300/50 dark:bg-white/5 flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Your Shortlist</h3>
                  <span className="text-[10px] bg-[#703BF7]/10 text-[#703BF7] dark:bg-[#703BF7] dark:text-white px-2 py-0.5 rounded-full font-bold">
                    {shortlistedProperties.length} items
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                  {shortlistedProperties.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 dark:text-gray-600 mb-2 flex justify-center">
                        <FiPlus size={24} className="rotate-45" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">No properties shortlisted yet.</p>
                    </div>
                  ) : (
                    shortlistedProperties.map((property) => (
                      <div 
                        key={property.id}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-3 group border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
                      >
                        <div className="relative overflow-hidden rounded-lg w-12 h-12 shrink-0">
                          <img 
                            src={property.img} 
                            alt={property.name}
                            className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                            onClick={() => {
                              navigate(`/properties/${property.slug}`);
                              setIsShortlistOpen(false);
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-xs font-semibold truncate cursor-pointer text-gray-900 dark:text-gray-200"
                            onClick={() => {
                              navigate(`/properties/${property.slug}`);
                              setIsShortlistOpen(false);
                            }}
                          >
                            {property.name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate cursor-pointer"
                            onClick={() => {
                              navigate(`/properties/${property.slug}`);
                              setIsShortlistOpen(false);
                            }}>
                            {property.location.area}, {property.location.city_town}, {property.location.state} state.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            toggleShortlist(property);
                            toast.success("Removed from shortlist");
                          }}
                          className="p-1.5 text-black hover:text-red-500 dark:text-white dark:hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {shortlistedProperties.length > 0 && (
                  <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-300/50 dark:bg-white/5 text-center">
                    <NavLink 
                      to="/properties" 
                      onClick={() => setIsShortlistOpen(false)}
                      className="text-[10px] text-[#703BF7] dark:text-white font-bold hover:underline"
                    >
                      Browse More Properties
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-1 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white transition-all duration-300"
          >
            {theme === "dark" ? (
              <>
                <FiSun size={20} />
              </>
            ) : (
              <>
                <FiMoon size={20} />
              </>
            )}
          </button>
        </div>

      </div>
      <hr className="h-px bg-gray-600 border-0 w-full" />

      {/* MAIN NAVBAR */}
      <div className="max-w-[95%] mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 text-gray-800 text-[30px] font-bold dark:text-white">
            <img src={logo} alt="logo" className="h-10 mr-1" />
           <span> RewaCiti</span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex lg:space-x-6 space-x-3 items-center text-gray-800 2xl:text-[18px] sm:text-[15px] dark:text-white">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${
                    isActive
                      ? 'p-2 px-3 bg-[#703BF7] text-white border border-gray-300 rounded-md'
                      : 'text-gray-800 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-[#9677df] hover:border-[#703BF7] p-2 px-3 rounded-md'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Desktop Contact Button */}
         <div className="hidden md:block">
            <NavLink to="/Contact">
              {({ isActive }) => (
                <button
                  className={`py-2 px-4 rounded-md border transition
                    ${
                      isActive
                        ? 'bg-[#703BF7] text-white border-[#703BF7]'
                        : 'bg-gray-100 text-gray-800 border-gray-200 dark:hover:bg-[#9677df] hover:bg-[#9677df] hover:text-white hover:border-[#703BF7] dark:bg-black/30 dark:text-white'
                    }
                  `}
                >
                  Contact Us
                </button>
              )}
            </NavLink>
          </div>


          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)}>
               <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
               </svg>
            </button>
          </div>

          {/* MOBILE MENU */}
         {isOpen && (
          <div
            className={`fixed top-10.5 right-0 w-[55%] bg-gray-200/90 dark:bg-[#1A1A1A] backdrop-blur-lx 
            text-gray-800 dark:text-white p-6 rounded-xl shadow-xl z-50 
            flex flex-col items-start space-y-4 transition duration-300`}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-800 dark:text-white text-2xl absolute top-3 right-5"
            >
              ✕
            </button>

            {/* Menu Items */}
            <div className="flex flex-col space-y-4 w-full mt-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `text-[17px] ${
                      isActive ? "text-[#703BF7] font-semibold" : ""
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Purple Contact Button */}
              <NavLink to="/Contact">
              {({ isActive }) => (
                <button
                  className={`
                    ${
                      isActive
                        ? "text-[#703BF7] font-semibold"
                        : ""
                    }
                  `}
                >
                  Contact Us
                </button>
              )}
            </NavLink>
            </div>
          </div>
        )}
        </div>
      </div>
      <hr className="h-px bg-gray-600 border-0 w-full" />
    </div>
  );
};

export default Navbar;