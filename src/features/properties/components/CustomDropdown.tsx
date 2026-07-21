import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

interface Option {
  label: string;
  value: string;
}

interface Props {
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export default function CustomDropdown({
  icon,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  className = "",
  buttonClassName = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;
  const isSelected = !!selectedOption;

  const defaultButtonClass = "w-full h-12 px-3 flex items-center justify-between rounded-lg border border-gray-600/70 bg-gray-300 dark:bg-black/70 text-gray-900 dark:text-white";

  return (
    <div
      ref={ref}
      className={`relative ${
        disabled ? "opacity-50 pointer-events-none" : ""
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={buttonClassName || defaultButtonClass}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon}
          <span className={`truncate whitespace-nowrap ${!isSelected ? "opacity-80" : ""}`}>
            {selectedLabel}
          </span>
        </div>

        <FiChevronDown
          className={`transition ml-2 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 min-w-full w-full rounded-xl border border-gray-700 bg-gray-300 dark:bg-neutral-900 shadow-xl overflow-hidden left-0">
          <div className="max-h-72 overflow-y-auto overflow-x-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left whitespace-nowrap transition text-sm
                ${
                  value === option.value
                    ? "bg-[#703BF7] text-white font-medium"
                    : "hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-900 dark:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}