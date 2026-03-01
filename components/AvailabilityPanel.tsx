"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Plus, Trash2, Calendar, Clock, Save } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAvailability } from "@/hooks/useData";
import { WEEKDAYS, formatTime } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Types for local weekly-schedule editing state                     */
/* ------------------------------------------------------------------ */
interface DaySchedule {
  ruleId: string | null;
  enabled: boolean;
  startTime: string;
  endTime: string;
  dirty: boolean;
}

const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function AvailabilityPanel() {
  const { availability, setShowAvailabilityPanel } = useAppStore();
  const {
    createAvailability,
    updateAvailability,
    deleteAvailability,
    fetchAvailability,
  } = useAvailability();

  const [tab, setTab] = useState<"hours" | "overrides">("hours");
  const [saving, setSaving] = useState(false);

  /* ---------- Weekly schedule state ---------- */
  const weeklyRules = useMemo(
    () => availability.filter((r) => r.type === "weekly_hours"),
    [availability],
  );

  const legacyClosedDays = useMemo(
    () => availability.filter((r) => r.type === "weekday"),
    [availability],
  );

  const buildSchedule = (): DaySchedule[] =>
    Array.from({ length: 7 }, (_, idx) => {
      const rule = weeklyRules.find((r) => r.value === String(idx));
      const legacyClosed = legacyClosedDays.find(
        (r) => r.value === String(idx),
      );

      if (rule) {
        return {
          ruleId: rule.$id,
          enabled: !rule.isClosed,
          startTime: rule.startTime || DEFAULT_START,
          endTime: rule.endTime || DEFAULT_END,
          dirty: false,
        };
      }
      if (legacyClosed) {
        return {
          ruleId: null,
          enabled: false,
          startTime: DEFAULT_START,
          endTime: DEFAULT_END,
          dirty: false,
        };
      }
      return {
        ruleId: null,
        enabled: true,
        startTime: DEFAULT_START,
        endTime: DEFAULT_END,
        dirty: false,
      };
    });

  const [schedule, setSchedule] = useState<DaySchedule[]>(buildSchedule);

  useEffect(() => {
    setSchedule(buildSchedule());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability]);

  const updateDay = (idx: number, patch: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch, dirty: true } : d)),
    );
  };

  const hasDirty = schedule.some((d) => d.dirty);

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      for (let idx = 0; idx < 7; idx++) {
        const day = schedule[idx];
        if (!day.dirty) continue;

        const legacy = legacyClosedDays.find((r) => r.value === String(idx));
        if (legacy) {
          await deleteAvailability(legacy.$id);
        }

        if (day.ruleId) {
          await updateAvailability(day.ruleId, {
            startTime: day.startTime,
            endTime: day.endTime,
            isClosed: !day.enabled,
          });
        } else {
          await createAvailability({
            type: "weekly_hours",
            value: String(idx),
            reason: "",
            startTime: day.startTime,
            endTime: day.endTime,
            isClosed: !day.enabled,
          });
        }
      }
      toast.success("Hours saved");
      await fetchAvailability();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save hours";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Date overrides state ---------- */
  const dateOverrides = useMemo(
    () => availability.filter((r) => r.type === "date_override"),
    [availability],
  );
  const legacyDateRules = useMemo(
    () => availability.filter((r) => r.type === "specific_date"),
    [availability],
  );

  const [overrideDate, setOverrideDate] = useState("");
  const [overrideStart, setOverrideStart] = useState(DEFAULT_START);
  const [overrideEnd, setOverrideEnd] = useState(DEFAULT_END);
  const [overrideClosed, setOverrideClosed] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [addingOverride, setAddingOverride] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddOverride = async () => {
    if (!overrideDate) {
      toast.error("Please select a date");
      return;
    }
    setAddingOverride(true);
    try {
      await createAvailability({
        type: "date_override",
        value: overrideDate,
        reason: overrideReason,
        startTime: overrideClosed ? "" : overrideStart,
        endTime: overrideClosed ? "" : overrideEnd,
        isClosed: overrideClosed,
      });
      toast.success("Date override added");
      setOverrideDate("");
      setOverrideStart(DEFAULT_START);
      setOverrideEnd(DEFAULT_END);
      setOverrideClosed(false);
      setOverrideReason("");
      await fetchAvailability();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add override";
      toast.error(message);
    } finally {
      setAddingOverride(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
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

  /* ---------- Time options ---------- */
  const timeOptions = useMemo(() => {
    const opts: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        opts.push(
          `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
        );
      }
    }
    return opts;
  }, []);

  /* ---------- Render ---------- */
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
          Set your hours of operation &amp; date-specific overrides
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("hours")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              tab === "hours"
                ? "bg-purple-500/20 border border-purple-400/30 text-purple-200"
                : "glass-button"
            }`}
          >
            <Clock className="w-4 h-4" />
            Weekly Hours
          </button>
          <button
            onClick={() => setTab("overrides")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              tab === "overrides"
                ? "bg-purple-500/20 border border-purple-400/30 text-purple-200"
                : "glass-button"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Date Overrides
          </button>
        </div>

        {/* ====================== WEEKLY HOURS TAB ====================== */}
        {tab === "hours" && (
          <div className="space-y-3">
            {WEEKDAYS.map((dayName, idx) => {
              const day = schedule[idx];
              return (
                <div
                  key={dayName}
                  className="glass-button rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/80 w-24">
                      {dayName}
                    </span>
                    <button
                      onClick={() => updateDay(idx, { enabled: !day.enabled })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        day.enabled
                          ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                          : "bg-red-500/15 border border-red-400/20 text-red-300"
                      }`}
                    >
                      {day.enabled ? "Open" : "Closed"}
                    </button>
                  </div>

                  {day.enabled && (
                    <div className="flex items-center gap-2 pl-0 sm:pl-4">
                      <select
                        value={day.startTime}
                        onChange={(e) =>
                          updateDay(idx, { startTime: e.target.value })
                        }
                        className="glass-input rounded-lg px-2 py-1.5 text-xs text-white/90 bg-white/5 flex-1 min-w-0"
                      >
                        {timeOptions.map((t) => (
                          <option
                            key={t}
                            value={t}
                            className="bg-slate-900 text-white"
                          >
                            {formatTime(t)}
                          </option>
                        ))}
                      </select>
                      <span className="text-white/30 text-xs shrink-0">to</span>
                      <select
                        value={day.endTime}
                        onChange={(e) =>
                          updateDay(idx, { endTime: e.target.value })
                        }
                        className="glass-input rounded-lg px-2 py-1.5 text-xs text-white/90 bg-white/5 flex-1 min-w-0"
                      >
                        {timeOptions.map((t) => (
                          <option
                            key={t}
                            value={t}
                            className="bg-slate-900 text-white"
                          >
                            {formatTime(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleSaveSchedule}
              disabled={saving || !hasDirty}
              className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                hasDirty
                  ? "primary-button"
                  : "glass-button opacity-50 cursor-default"
              }`}
            >
              {saving ? (
                <span className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : hasDirty ? "Save Schedule" : "No Changes"}
            </button>
          </div>
        )}

        {/* ===================== DATE OVERRIDES TAB ===================== */}
        {tab === "overrides" && (
          <div className="space-y-4">
            {/* Add override form */}
            <div className="glass-button rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                Add Override
              </h3>

              <input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-sm text-white/90"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOverrideClosed(!overrideClosed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    overrideClosed
                      ? "bg-red-500/20 border border-red-400/30 text-red-300"
                      : "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                  }`}
                >
                  {overrideClosed ? "Closed" : "Custom Hours"}
                </button>
                <span className="text-xs text-white/30">
                  {overrideClosed
                    ? "Will be fully closed on this date"
                    : "Set custom operating hours"}
                </span>
              </div>

              {!overrideClosed && (
                <div className="flex items-center gap-2">
                  <select
                    value={overrideStart}
                    onChange={(e) => setOverrideStart(e.target.value)}
                    className="glass-input rounded-lg px-2 py-2 text-sm text-white/90 bg-white/5 flex-1"
                  >
                    {timeOptions.map((t) => (
                      <option
                        key={t}
                        value={t}
                        className="bg-slate-900 text-white"
                      >
                        {formatTime(t)}
                      </option>
                    ))}
                  </select>
                  <span className="text-white/30 text-sm">to</span>
                  <select
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                    className="glass-input rounded-lg px-2 py-2 text-sm text-white/90 bg-white/5 flex-1"
                  >
                    {timeOptions.map((t) => (
                      <option
                        key={t}
                        value={t}
                        className="bg-slate-900 text-white"
                      >
                        {formatTime(t)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full glass-input rounded-xl p-3 text-sm text-white/90 placeholder:text-white/20"
              />

              <button
                onClick={handleAddOverride}
                disabled={addingOverride}
                className="w-full primary-button py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                {addingOverride ? (
                  <span className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Override
              </button>
            </div>

            {/* Existing overrides list */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
                Active Overrides
              </h3>

              {dateOverrides.length === 0 && legacyDateRules.length === 0 && (
                <p className="text-center text-white/30 py-4 text-sm">
                  No date overrides set
                </p>
              )}

              {dateOverrides.map((rule) => (
                <div
                  key={rule.$id}
                  className="flex items-center justify-between glass-button rounded-xl p-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm text-white/70">
                      {format(
                        new Date(rule.value + "T00:00:00"),
                        "MMM d, yyyy",
                      )}
                    </span>
                    {rule.isClosed ? (
                      <span className="ml-2 text-xs text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-md">
                        Closed
                      </span>
                    ) : (
                      <span className="ml-2 text-xs text-purple-300/80">
                        {formatTime(rule.startTime || "")} –{" "}
                        {formatTime(rule.endTime || "")}
                      </span>
                    )}
                    {rule.reason && (
                      <p className="text-xs text-white/30">{rule.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.$id)}
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

              {legacyDateRules.map((rule) => (
                <div
                  key={rule.$id}
                  className="flex items-center justify-between glass-button rounded-xl p-3 opacity-70"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm text-white/70">
                      {format(
                        new Date(rule.value + "T00:00:00"),
                        "MMM d, yyyy",
                      )}
                    </span>
                    <span className="ml-2 text-xs text-red-400/60 bg-red-500/10 px-2 py-0.5 rounded-md">
                      Unavailable (legacy)
                    </span>
                    {rule.reason && (
                      <p className="text-xs text-white/30">{rule.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.$id)}
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
        )}
      </div>
    </div>
  );
}
