"use client";
import { useState, useRef, useEffect } from "react";

interface GlassDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
    disabled?: boolean;
    variant?: "normal" | "red" | "yellow";
  }[];
  placeholder?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export default function GlassDropdown({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  onOpenChange,
}: GlassDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (onOpenChange) onOpenChange(open);
  }, [open, onOpenChange]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative min-w-16 ${className}`} tabIndex={0}>
      <button
        type="button"
        className="glass-input rounded-xl p-2 text-sm text-white/90 bg-linear-to-br from-purple-900/60 to-purple-700/40 border border-purple-400/20 shadow-inner focus:ring-2 focus:ring-purple-400/40 transition-all w-full flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "" : "text-white/30"}>
          {selected ? selected.label : placeholder || "Select"}
        </span>
        <svg
          className="w-4 h-4 ml-2 text-white/40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-full min-w-30 z-50 rounded-xl glass-panel bg-linear-to-br from-purple-900/80 to-purple-700/70 border border-purple-400/20 shadow-xl overflow-hidden animate-fade-in backdrop-blur-md">
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                className={`block w-full text-left px-4 py-2 text-sm transition-all ${
                  opt.disabled ? "rounded-none" : "rounded-lg"
                } ${
                  opt.disabled
                    ? "opacity-40 cursor-not-allowed bg-red-500/10 text-red-400/60"
                    : opt.variant === "red"
                      ? "bg-red-500/10 text-red-400/80 cursor-not-allowed"
                      : opt.variant === "yellow"
                        ? "bg-yellow-500/10 text-yellow-300/80 hover:bg-yellow-500/20"
                        : value === opt.value
                          ? "bg-purple-500/30 text-purple-200"
                          : "hover:bg-white/10 text-white/80"
                }`}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
