"use client";

/**
 * Rainbow-ordered color dot selector for appointments.
 *
 * Red and green are intentionally omitted because the calendar uses
 * green borders (approved) and red borders (rejected) as status
 * indicators – having the same hue as the dot color would make the
 * status hard to read.
 */

const DOT_COLORS = [
  { hex: "#F472B6", label: "Pink" },
  { hex: "#FB923C", label: "Orange" },
  { hex: "#FBBF24", label: "Amber" },
  { hex: "#A3E635", label: "Lime" }, // yellow-green, contrasts with pure green border
  { hex: "#2DD4BF", label: "Teal" },
  { hex: "#38BDF8", label: "Sky" },
  { hex: "#60A5FA", label: "Blue" },
  { hex: "#A78BFA", label: "Violet" },
  { hex: "#E879F9", label: "Fuchsia" },
  { hex: "#FFFFFF", label: "White" },
] as const;

export type DotColor = (typeof DOT_COLORS)[number]["hex"];

export const DEFAULT_DOT_COLOR: DotColor = "#60A5FA";

interface ColorDotSelectorProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorDotSelector({
  value,
  onChange,
}: ColorDotSelectorProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {DOT_COLORS.map((c) => {
          const selected = value === c.hex;
          return (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => onChange(c.hex)}
              className={`w-6 h-6 rounded-full transition-all duration-150 border-2 ${
                selected
                  ? "border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  : "border-transparent hover:scale-110 hover:border-white/30"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-white/25 border-t border-white/10 pt-1.5">
        This color is permanent and cannot be changed later.
      </p>
    </div>
  );
}

export { DOT_COLORS };
