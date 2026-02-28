"use client";

import { useState } from "react";
import { X, Plus, Trash2, Calendar, RotateCcw } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAvailability } from "@/hooks/useData";
import { WEEKDAYS } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function AvailabilityPanel() {
  const { availability, setShowAvailabilityPanel } = useAppStore();
  const { createAvailability, deleteAvailability, fetchAvailability } =
    useAvailability();

  const [tab, setTab] = useState<"weekday" | "specific">("weekday");
  const [selectedWeekday, setSelectedWeekday] = useState("0");
  const [selectedDate, setSelectedDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const weekdayRules = availability.filter((r) => r.type === "weekday");
  const dateRules = availability.filter((r) => r.type === "specific_date");

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const type = tab === "weekday" ? "weekday" : "specific_date";
      const value = tab === "weekday" ? selectedWeekday : selectedDate;

      if (tab === "specific" && !selectedDate) {
        toast.error("Please select a date");
        return;
      }

      await createAvailability({ type, value, reason });
      toast.success("Unavailable period added");
      setReason("");
      await fetchAvailability();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add unavailability";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAvailability(id);
      toast.success("Rule removed");
      await fetchAvailability();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove rule";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowAvailabilityPanel(false)}
      />

      <div className="glass-panel relative w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 rounded-2xl p-6">
        <button
          onClick={() => setShowAvailabilityPanel(false)}
          className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-light text-white/90 mb-1">
          Manage Availability
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Set days you&apos;re not available
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("weekday")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              tab === "weekday"
                ? "bg-purple-500/20 border border-purple-400/30 text-purple-200"
                : "glass-button"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Recurring Days
          </button>
          <button
            onClick={() => setTab("specific")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              tab === "specific"
                ? "bg-purple-500/20 border border-purple-400/30 text-purple-200"
                : "glass-button"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Specific Dates
          </button>
        </div>

        {/* Add Form */}
        <div className="space-y-3 mb-6">
          {tab === "weekday" ? (
            <div className="grid grid-cols-4 gap-2">
              {WEEKDAYS.map((day, idx) => {
                const alreadySet = weekdayRules.some(
                  (r) => r.value === String(idx),
                );
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedWeekday(String(idx))}
                    disabled={alreadySet}
                    className={`
                      p-2 rounded-lg text-sm transition-all
                      ${alreadySet ? "bg-red-500/10 text-red-400/40 cursor-not-allowed" : ""}
                      ${
                        selectedWeekday === String(idx) && !alreadySet
                          ? "bg-purple-500/30 border border-purple-400/50 text-purple-200"
                          : !alreadySet
                            ? "glass-button hover:bg-white/10"
                            : ""
                      }
                    `}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full glass-input rounded-xl p-3 text-sm text-white/90"
            />
          )}

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full glass-input rounded-xl p-3 text-sm text-white/90 placeholder:text-white/20"
          />

          <button
            onClick={handleAdd}
            disabled={submitting}
            className="w-full primary-button py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Unavailable Period
          </button>
        </div>

        {/* Current Rules */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
            Current Rules
          </h3>

          {availability.length === 0 && (
            <p className="text-center text-white/30 py-4">
              No availability rules set
            </p>
          )}

          {weekdayRules.map((rule, idx) => (
            <div
              key={rule.$id || `weekday-${rule.value}-${idx}`}
              className="flex items-center justify-between glass-button rounded-xl p-3"
            >
              <div>
                <span className="text-sm text-white/70">
                  Every {WEEKDAYS[parseInt(rule.value)]}
                </span>
                {rule.reason && (
                  <span className="text-xs text-white/30 ml-2">
                    — {rule.reason}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(rule.$id)}
                className={`text-red-400/40 hover:text-red-400 transition-colors ${deletingId === rule.$id ? "opacity-50 cursor-wait" : ""}`}
                disabled={deletingId === rule.$id}
              >
                {deletingId === rule.$id ? (
                  <span className="w-4 h-4 animate-spin border-2 border-red-400 border-t-transparent rounded-full inline-block" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}

          {dateRules.map((rule, idx) => (
            <div
              key={rule.$id || `date-${rule.value}-${idx}`}
              className="flex items-center justify-between glass-button rounded-xl p-3"
            >
              <div>
                <span className="text-sm text-white/70">
                  {format(new Date(rule.value + "T00:00:00"), "MMM d, yyyy")}
                </span>
                {rule.reason && (
                  <span className="text-xs text-white/30 ml-2">
                    — {rule.reason}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(rule.$id)}
                className={`text-red-400/40 hover:text-red-400 transition-colors ${deletingId === rule.$id ? "opacity-50 cursor-wait" : ""}`}
                disabled={deletingId === rule.$id}
              >
                {deletingId === rule.$id ? (
                  <span className="w-4 h-4 animate-spin border-2 border-red-400 border-t-transparent rounded-full inline-block" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
