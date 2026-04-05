import { NavLink } from "react-router";
import logo from "/Symbol.png";
import Hanburger from "/logo/Icon.png";
import { useState } from "react";
import { useThemeStore } from "../../store/useThemeStore";
import { FiSun, FiMoon} from "react-icons/fi";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/About" },
    { name: "Properties", path: "/properties" },
    { name: "Services", path: "/Service" },
  ];

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
          <NavLink to="/Service" className="underline text-sm hidden sm:block text-gray-900 dark:text-white">
            Learn More
          </NavLink>
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
              <img src={Hanburger} alt="mobile menu" className="w-7" />
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