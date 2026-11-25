import { FiMoon, FiSun } from "react-icons/fi";
import { useThemeStore } from "@/shared/store/useThemeStore";

const AgentThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="grid h-10 w-10 place-items-center rounded-full border-0 bg-[#f3f4f6] text-[#111827] cursor-pointer transition-colors duration-150 ease-[ease] hover:bg-[#b79bff] hover:text-white dark:bg-[#232323] dark:text-white"
    >
      {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
    </button>
  );
};

export default AgentThemeToggle;
