import { FiMoon, FiSun } from "react-icons/fi";
import { useThemeStore } from "../../../shared/store/useThemeStore";

const AgentThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="agent-theme-toggle"
    >
      {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
    </button>
  );
};

export default AgentThemeToggle;
