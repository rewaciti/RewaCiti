import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { createPortal } from "react-dom";

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
  danger?: boolean;
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
  triggerContent?: React.ReactNode;
  ariaLabel?: string;
  portal?: boolean;
  menuClassName?: string;
  menuItemClassName?: string;
  menuWidth?: number;
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
  triggerContent,
  ariaLabel,
  portal = false,
  menuClassName = "",
  menuItemClassName = "",
  menuWidth = 240,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!portal || !open) return;
    const closeOnScrollOrResize = () => setOpen(false);
    window.addEventListener("scroll", closeOnScrollOrResize, true);
    window.addEventListener("resize", closeOnScrollOrResize);
    return () => {
      window.removeEventListener("scroll", closeOnScrollOrResize, true);
      window.removeEventListener("resize", closeOnScrollOrResize);
    };
  }, [open, portal]);

  useLayoutEffect(() => {
    if (!portal || !open || !buttonRef.current || !menuRef.current) return;

    const buttonBounds = buttonRef.current.getBoundingClientRect();
    const iconRight = buttonRef.current.querySelector("svg")?.getBoundingClientRect().right ?? buttonBounds.right;
    const menuBounds = menuRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const viewportWidth = document.documentElement.clientWidth;
    const left = Math.max(
      viewportPadding,
      Math.min(iconRight - menuBounds.width + 8, viewportWidth - menuBounds.width - viewportPadding),
    );

    setMenuPosition((current) => current && current.left === left
      ? current
      : {
          left,
          top: current?.top ?? viewportPadding,
          maxHeight: current?.maxHeight ?? window.innerHeight - viewportPadding * 2,
        });
  }, [open, options.length, portal]);

  const selectedOption = options.find((o) => o.value === value);
  const isSelected = Boolean(value && selectedOption && selectedOption.value !== "");
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;

  const defaultButtonClass = "w-full h-10 px-3 flex items-center justify-between rounded-lg border border-gray-600/70 bg-gray-300 dark:bg-black/70 text-gray-900 dark:text-white";
  const toggleOpen = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }

    if (portal && buttonRef.current) {
      const bounds = buttonRef.current.getBoundingClientRect();
      const gap = 8;
      const viewportPadding = 8;
      const top = bounds.bottom + gap;
      const maxHeight = Math.max(0, window.innerHeight - top - viewportPadding);
      const iconRight = buttonRef.current.querySelector("svg")?.getBoundingClientRect().right ?? bounds.right;
      const left = Math.max(
        viewportPadding,
        Math.min(iconRight - menuWidth + 8, document.documentElement.clientWidth - menuWidth - viewportPadding),
      );
      setMenuPosition({ top, left, maxHeight });
    }
    setOpen(true);
  };

  const dropdownMenu = !disabled && (
    <div
      ref={menuRef}
      className={portal ? menuClassName : `absolute z-9999 mt-2 min-w-full w-full rounded-xl border border-gray-700 bg-white text-gray-900 shadow-xl overflow-hidden left-0 transition-all duration-200 ease-out origin-top transform dark:border-white/10 dark:bg-neutral-900 dark:text-white ${open ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"} ${menuClassName}`}
      style={portal ? { ...menuPosition, boxSizing: "border-box", zIndex: 9999, width: menuWidth, maxWidth: "calc(100vw - 16px)" } : { zIndex: 9999 }}
      role={portal ? "menu" : undefined}
      onClick={portal ? (event) => event.stopPropagation() : undefined}
    >
      <div className={portal ? undefined : "max-h-72 overflow-y-auto overflow-x-auto"}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role={portal ? "menuitem" : undefined}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={`${portal ? menuItemClassName : "block w-full px-4 py-3 text-left whitespace-nowrap transition text-sm"} ${option.danger ? "is-danger" : value === option.value ? "bg-[#703BF7] text-white font-medium" : "hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-900 dark:text-white"}`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className={`relative ${open ? "z-100" : "z-10"} ${
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
      } ${className}`}
      style={{ zIndex: open ? 60 : undefined }}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup={portal ? "menu" : "listbox"}
        aria-expanded={open}
        onClick={(event) => {
          if (portal) event.stopPropagation();
          toggleOpen();
        }}
        className={triggerContent
          ? `${buttonClassName} cursor-pointer`
          : `${buttonClassName || defaultButtonClass} flex items-center justify-between ${disabled ? "cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
      >
        {triggerContent ?? (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {icon}
              <span className={`truncate whitespace-nowrap ${!isSelected ? "opacity-80" : ""}`}>
                {selectedLabel}
              </span>
            </div>
            <FiChevronDown className={`transition ml-auto shrink-0 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>
      {portal ? (open ? createPortal(dropdownMenu, document.body) : null) : dropdownMenu}
    </div>
  );
}
