import { NavLink, useNavigate } from "react-router";
import logo from "/Symbol.png";
import { useState, useRef, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore";
import { FiSun, FiMoon, FiHeart, FiTrash2, FiLogOut } from "react-icons/fi";
import { usePropertyStore } from "../../../features/properties/store/usePropertyStore";
import { useAuthStore } from "../../../features/auth/store/useAuthStore";
import { toast } from "sonner";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const shortlistRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useThemeStore();
  const { shortlistedProperties, toggleShortlist } = usePropertyStore();
  const { isAuthenticated, customer, logout } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const profileInitials = (() => {
    const firstName = customer?.firstName?.trim();
    const lastName = customer?.lastName?.trim();
    const email = customer?.email?.trim();

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }

    if (email) {
      return email.slice(0, 2).toUpperCase();
    }

    return "U";
  })();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/About" },
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);



  useEffect(() => {
    if (isShortlistOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isShortlistOpen]);

  return (
    <>
      {/* TOP SMALL BAR — lives in normal flow, scrolls away with the page */}
      <div className="w-full bg-gray-400 dark:bg-[#1A1A1A] text-black dark:text-white">
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
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error("Please log in to access your wishlist.");
                    return;
                  }
                  setIsShortlistOpen(!isShortlistOpen);
                }}
                title="Shortlist"
                className="flex items-center gap-1 text-gray-900 dark:text-white hover:text-[#703BF7] transition-colors relative group cursor-pointer"
              >
                <div className="relative p-0.5 sm:p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white transition-all duration-300">
                  <FiHeart size={18} />
                  {shortlistedProperties.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-[#703BF7] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-fade-in">
                      {shortlistedProperties.length}
                    </span>
                  )}
                </div>
              </button>

              {/* Always mounted — animated with opacity/scale/translate so both open & close transitions play */}
              <div
                className={`absolute right-0 top-4 mt-2 w-72 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-100 overflow-hidden
                  origin-top-right transform transition-all duration-200 ease-out
                  ${isShortlistOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-300/50 dark:bg-white/5 flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Your Shortlist</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-[#703BF7]/10 text-[#703BF7] dark:bg-[#] dark:text-white px-2 py-0.5 rounded-full font-bold">
                      {shortlistedProperties.length} items
                    </span>
                    <button
                      onClick={() => setIsShortlistOpen(false)}
                      className="text-gray-800 dark:text-white text-lg hover:bg-[#9677df] rounded-full px-1 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                  {shortlistedProperties.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 dark:text-gray-600 mb-2 flex justify-center">
                        <FiHeart size={24} />
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
                          <p
                            className="text-[10px] text-gray-500 dark:text-gray-400 truncate cursor-pointer"
                            onClick={() => {
                              navigate(`/properties/${property.slug}`);
                              setIsShortlistOpen(false);
                            }}
                          >
                            {
                              (() => {
                                const locationParts = [
                                  property.location.area,
                                  property.location.city_town || property.location.city,
                                ].filter(Boolean);

                                const locationText = locationParts.length
                                  ? `${locationParts.join(", ")}${property.location.state ? `, ${property.location.state}` : ""}`
                                  : property.location.state
                                  ? property.location.state
                                  : "";

                                return locationText ? `${locationText} state.` : "";
                              })()
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            toast.success("Removed from shortlist");
                            void toggleShortlist(property);
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
      </div>

      {/* MAIN NAVBAR — sticky, stays pinned once you scroll past the top bar */}
      <div className="sticky top-0 z-50 bg-gray-300 text-black shadow-sm dark:bg-[#1A1A1A] dark:text-white">
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
                    `${isActive
                      ? 'p-2 px-3 bg-[#703BF7] text-white border border-gray-300 rounded-md'
                      : 'text-gray-800 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-[#9677df] hover:border-[#703BF7] p-2 px-3 rounded-md'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/Contact">
                {({ isActive }) => (
                  <button
                    className={`py-2 px-4 rounded-md border transition
                      ${isActive
                        ? 'bg-[#703BF7] text-white border-[#703BF7]'
                        : 'bg-gray-100 text-gray-800 border-gray-200 dark:hover:bg-[#9677df] hover:bg-[#9677df] hover:text-white hover:border-[#703BF7] dark:bg-black/30 dark:text-white'
                      }
                    `}
                  >
                    Contact
                  </button>
                )}
              </NavLink>

              {isAuthenticated ? (
                <button
                  type="button"
                  title="Profile"
                  onClick={() => navigate("/auth/profile")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-[#9677df] hover:text-white dark:border-gray-600 cursor-pointer animate-fade-in font-semibold text-sm bg-[#703BF7] text-white"
                >
                  {profileInitials}
                </button>
              ) : (
                <NavLink to="/auth/login">
                  {({ isActive }) => (
                    <button
                      className={`py-2 px-4 rounded-md border transition
                        ${isActive
                          ? 'bg-[#703BF7] text-white border-[#703BF7]'
                          : 'bg-gray-100 text-gray-800 border-gray-200 dark:hover:bg-[#9677df] hover:bg-[#9677df] hover:text-white hover:border-[#703BF7] dark:bg-black/30 dark:text-white'
                        }
                      `}
                    >
                      Login
                    </button>
                  )}
                </NavLink>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  title="Profile"
                  onClick={() => navigate("/auth/profile")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-[#703BF7] text-white transition hover:bg-[#9677df] hover:text-white dark:border-gray-600 cursor-pointer text-[13px] font-semibold"
                >
                  {profileInitials}
                </button>
              )}

              <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                <svg
                  className={`w-7 h-7 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                  )}
                </svg>
              </button>
            </div>

            {/* MOBILE MENU BACKDROP */}
            <div
              className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ease-in-out
                ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* MOBILE MENU — slides in/out from the right, always mounted for smooth transitions */}
            <div
              ref={menuRef}
              className={`fixed top-0 right-0 h-full w-64 max-w-[80%] bg-gray-200/95 dark:bg-[#1A1A1A] backdrop-blur-xl text-gray-800 dark:text-white p-6 shadow-xl z-50 flex flex-col items-start space-y-4
                transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-800 dark:text-white text-2xl absolute top-3 right-5"
                aria-label="Close menu"
              >
                ✕
              </button>

              {/* Menu Items */}
              <div className="flex flex-col space-y-4 w-full mt-4 grow">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `text-[17px] ${isActive ? "text-[#703BF7] font-semibold" : ""}`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}

                {/* Mobile Action Links */}
                <NavLink to="/Contact" onClick={() => setIsOpen(false)}>
                  {({ isActive }) => (
                    <button
                      className={`text-left w-full
                        ${isActive ? "text-[#703BF7] font-semibold" : ""}
                      `}
                    >
                      Contact
                    </button>
                  )}
                </NavLink>

                {isAuthenticated && (
                  <NavLink
                    to="/auth/profile"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `text-[17px] ${isActive ? "text-[#703BF7] font-semibold" : ""}`
                    }
                  >
                    Profile
                  </NavLink>
                )}

                <div className="mt-auto w-full pt-4 border-t border-gray-400 dark:border-gray-700">
                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                        navigate("/");
                        toast.success("Logged out successfully");
                      }}
                      className="text-[17px] text-red-500 font-semibold cursor-pointer text-left w-full flex items-center gap-2"
                    >
                      <FiLogOut size={18} />
                      Logout
                    </button>
                  ) : (
                    <NavLink to="/auth/login" onClick={() => setIsOpen(false)} className="w-full block">
                      {({ isActive }) => (
                        <button
                          className={`text-left w-full ${isActive ? "text-[#703BF7] font-semibold" : ""}`}
                        >
                          Login
                        </button>
                      )}
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr className="h-px dark:bg-gray-700 bg-gray-400 border-0 w-full" />
      </div>
    </>
  );
};

export default Navbar;