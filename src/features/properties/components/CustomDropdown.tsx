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
}

export default function CustomDropdown({
  icon,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
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

  const selected =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div
      ref={ref}
      className={`relative ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-12 px-3 flex items-center justify-between rounded-lg border border-gray-600/70 bg-gray-300 dark:bg-black/70 text-gray-900 dark:text-white md:rounded-t-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon}
          <span className="truncate whitespace-nowrap">{selected}</span>
        </div>

        <FiChevronDown
          className={`transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 min-w-full rounded-xl border border-gray-700 bg-gray-300 dark:bg-neutral-900 shadow-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto overflow-x-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left whitespace-nowrap transition
                ${
                  value === option.value
                    ? "bg-[#703BF7] text-white"
                    : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-900 dark:text-white"
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