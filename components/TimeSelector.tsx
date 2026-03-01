"use client";

import { useMemo, useState } from "react";
import GlassDropdown from "./GlassDropdown";
import { formatTime, timeToMinutes } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimeSelectorProps {
  value: string; // HH:MM in 24h format
  onChange: (time: string) => void;
  label?: string;
  showLabel?: boolean;
  className?: string;
  defaultAmPm?: "AM" | "PM";
  showAmPmButtons?: boolean;
  /** Operating hours for the relevant date — enables red/yellow highlighting */
  operatingHours?: { start: string; end: string } | "closed" | null;
  /** When true, outside-hours slots are yellow (selectable) instead of red (disabled) */
  isAdmin?: boolean;
}

export default function TimeSelector({
  value,
  onChange,
  label = "Time",
  showLabel = true,
  className = "",
  defaultAmPm = "PM",
  showAmPmButtons = true,
  operatingHours = null,
  isAdmin: isAdminUser = false,
}: TimeSelectorProps) {
  // Determine current AM/PM from the 24h value, or fall back to default
  const getCurrentAmPm = (): "AM" | "PM" => {
    if (!value) return defaultAmPm;
    const hour = parseInt(value.split(":")[0]);
    return hour >= 12 ? "PM" : "AM";
  };

  const [ampm, setAmpm] = useState<"AM" | "PM">(getCurrentAmPm());

  // For showAmPmButtons=false: map incoming 24h value → 12h key for the dropdown
  // e.g. "17:00" → "05:00",  "00:00" → "00:00",  "12:00" → "00:00"
  const displayValue = useMemo(() => {
    if (showAmPmButtons || !value) return value;
    const h = parseInt(value.split(":")[0]);
    const m = value.split(":")[1];
    return `${(h % 12).toString().padStart(2, "0")}:${m}`;
  }, [value, showAmPmButtons]);

  // Convert a 12h dropdown key + period to 24h
  const to24h = (time12: string, period: "AM" | "PM"): string => {
    if (!time12) return "";
    const h = parseInt(time12.split(":")[0]); // 0-11
    const m = time12.split(":")[1];
    const h24 = period === "PM" ? h + 12 : h;
    return `${h24.toString().padStart(2, "0")}:${m}`;
  };

  // Generate 30-min time slot options with optional operating-hours highlighting
  const timeSlotOptions = useMemo(() => {
    const slots: {
      value: string;
      label: string;
      disabled?: boolean;
      variant?: "normal" | "red" | "yellow";
    }[] = [];

    // Helper: check if a 24h time is outside operating hours
    const outsideStatus = (
      t24: string,
    ): { disabled?: boolean; variant?: "normal" | "red" | "yellow" } => {
      if (!operatingHours) return {};
      let outside = false;
      if (operatingHours === "closed") {
        outside = true;
      } else {
        const slotMins = timeToMinutes(t24);
        const openMins = timeToMinutes(operatingHours.start);
        const closeMins = timeToMinutes(operatingHours.end);
        outside = slotMins < openMins || slotMins >= closeMins;
      }
      if (outside) {
        return {
          disabled: !isAdminUser,
          variant: isAdminUser ? "yellow" : "red",
        };
      }
      return {};
    };

    if (showAmPmButtons) {
      // Slot values are already 24h — e.g. AM: 00:00–11:30, PM: 12:00–23:30
      const startH = ampm === "AM" ? 0 : 12;
      const endH = ampm === "AM" ? 12 : 24;

      for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += 30) {
          const t24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
          slots.push({
            value: t24,
            label: formatTime(t24),
            ...outsideStatus(t24),
          });
        }
      }
    } else {
      // Slot values are 12h keys (00:00–11:30); 24h equivalent depends on ampm
      for (let h = 0; h < 12; h++) {
        for (let m = 0; m < 60; m += 30) {
          const key12 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
          const displayH = h === 0 ? 12 : h;
          const lbl = `${displayH}:${m.toString().padStart(2, "0")}`;
          // 24h equivalent for operating hours comparison
          const h24 = ampm === "PM" ? h + 12 : h;
          const t24 = `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
          slots.push({ value: key12, label: lbl, ...outsideStatus(t24) });
        }
      }
    }
    return slots;
  }, [ampm, showAmPmButtons, operatingHours, isAdminUser]);

  // Handle AM/PM change (toggle buttons or dropdown)
  const handleAmPmChange = (newAmpm: "AM" | "PM") => {
    setAmpm(newAmpm);
    if (showAmPmButtons) {
      // Option values change entirely (00–11 ↔ 12–23), so clear selection
      onChange("");
    } else if (value) {
      // Re-map the current 24h value into the new period
      const h12 = parseInt(value.split(":")[0]) % 12;
      const m = value.split(":")[1];
      const h24 = newAmpm === "PM" ? h12 + 12 : h12;
      onChange(`${h24.toString().padStart(2, "0")}:${m}`);
    }
  };

  // Handle time selection from the dropdown
  const handleTimeSelect = (selected: string) => {
    if (!showAmPmButtons && selected) {
      // Convert 12h key → 24h before calling parent
      onChange(to24h(selected, ampm));
    } else {
      onChange(selected);
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
          <Clock className="w-4 h-4" />
          {label}
        </label>
      )}
      <div className="flex gap-2 items-center">
        <GlassDropdown
          value={showAmPmButtons ? value : displayValue || ""}
          onChange={handleTimeSelect}
          options={[{ value: "", label: "Select a time" }, ...timeSlotOptions]}
          placeholder="Select a time"
          className="flex-1"
        />
        {showAmPmButtons ? (
          <div className="flex rounded-xl overflow-hidden border border-purple-400/20">
            <button
              type="button"
              onClick={() => handleAmPmChange("AM")}
              className={`px-3 py-2 text-sm font-medium transition-all ${
                ampm === "AM"
                  ? "bg-purple-500/30 text-purple-200"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handleAmPmChange("PM")}
              className={`px-3 py-2 text-sm font-medium transition-all ${
                ampm === "PM"
                  ? "bg-purple-500/30 text-purple-200"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              PM
            </button>
          </div>
        ) : (
          <GlassDropdown
            value={ampm}
            onChange={(v) => handleAmPmChange(v as "AM" | "PM")}
            options={[
              { value: "AM", label: "AM" },
              { value: "PM", label: "PM" },
            ]}
            className="min-w-20"
          />
        )}
      </div>
    </div>
  );
}
