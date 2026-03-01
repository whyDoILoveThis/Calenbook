"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Save,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAvailability, useAppointments } from "@/hooks/useData";
import { WEEKDAYS, formatTime } from "@/lib/utils";
import TimeSelector from "./TimeSelector";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useUser } from "@clerk/nextjs";
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
const CLEAR_CONFIRMATION_PHRASE =
  "yes i understand i am clearing and entire month. do it now. im seriously serious frfr.";

export default function AvailabilityPanel() {
  const { availability, setShowAvailabilityPanel, appointments, currentMonth } =
    useAppStore();
  const {
    createAvailability,
    updateAvailability,
    deleteAvailability,
    fetchAvailability,
  } = useAvailability();
  const { deleteAppointment } = useAppointments();
  const { user } = useUser();

  const [tab, setTab] = useState<"hours" | "overrides">("hours");
  const [saving, setSaving] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInput, setClearInput] = useState("");
  const [clearing, setClearing] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const monthLabel = format(currentMonth, "MMMM yyyy");

  const handleClearCalendar = async () => {
    if (clearInput !== CLEAR_CONFIRMATION_PHRASE) return;
    if (!user?.id) return;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startStr = format(monthStart, "yyyy-MM-dd");
    const endStr = format(monthEnd, "yyyy-MM-dd");

    const monthAppointments = appointments.filter(
      (apt) => apt.date >= startStr && apt.date <= endStr,
    );

    if (monthAppointments.length === 0) {
      toast.error("No appointments to clear this month.");
      return;
    }

    setClearing(true);
    try {
      let deleted = 0;
      for (const apt of monthAppointments) {
        await deleteAppointment(apt.$id, user.id);
        deleted++;
      }
      toast.success(
        `Cleared ${deleted} appointment${deleted !== 1 ? "s" : ""} from ${monthLabel}.`,
      );
      setShowClearConfirm(false);
      setClearInput("");
      setShowSettingsDropdown(false);
    } catch (error) {
      console.error("Failed to clear calendar:", error);
      toast.error("Failed to clear some appointments. Try again.");
    } finally {
      setClearing(false);
    }
  };

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
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {/* Settings dropdown */}
          <div ref={settingsRef} className="relative">
            <button
              onClick={() => setShowSettingsDropdown((v) => !v)}
              className="glass-button p-1.5 rounded-lg"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showSettingsDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setShowSettingsDropdown(false);
                    setShowClearConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Calendar
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAvailabilityPanel(false)}
            className="glass-button p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
                    <div className="flex items-center gap-2 pl-0 sm:pl-4 flex-wrap sm:flex-nowrap">
                      <div className="flex-1 min-w-0">
                        <TimeSelector
                          value={day.startTime}
                          onChange={(t) => updateDay(idx, { startTime: t })}
                          label="Start"
                          showLabel={false}
                          showAmPmButtons={false}
                          className="flex-1"
                        />
                      </div>
                      <span className="text-white/30 text-xs shrink-0">to</span>
                      <div className="flex-1 min-w-0">
                        <TimeSelector
                          value={day.endTime}
                          onChange={(t) => updateDay(idx, { endTime: t })}
                          label="End"
                          showLabel={false}
                          showAmPmButtons={false}
                          className="flex-1"
                        />
                      </div>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <TimeSelector
                      value={overrideStart}
                      onChange={setOverrideStart}
                      label="Start"
                      showLabel={false}
                      showAmPmButtons={false}
                      className="flex-1"
                    />
                  </div>
                  <span className="text-white/30 text-sm shrink-0">to</span>
                  <div className="flex-1 min-w-[200px]">
                    <TimeSelector
                      value={overrideEnd}
                      onChange={setOverrideEnd}
                      label="End"
                      showLabel={false}
                      showAmPmButtons={false}
                      className="flex-1"
                    />
                  </div>
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

      {/* Clear Calendar Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowClearConfirm(false);
              setClearInput("");
            }}
          />
          <div className="glass-panel relative z-10 w-full max-w-md rounded-2xl p-6">
            <button
              onClick={() => {
                setShowClearConfirm(false);
                setClearInput("");
              }}
              className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-light text-white/90">
                  Clear Calendar
                </h3>
                <p className="text-xs text-white/40">{monthLabel}</p>
              </div>
            </div>

            <p className="text-sm text-white/60 mb-2">
              This will permanently delete{" "}
              <span className="text-red-300 font-medium">all appointments</span>{" "}
              for <span className="text-white/90">{monthLabel}</span>. This
              action cannot be undone.
            </p>

            <p className="text-sm text-white/50 mb-3">
              Type the following phrase exactly to confirm:
            </p>
            <div className="glass-button rounded-xl px-3 py-2 mb-4 text-xs text-yellow-300/80 font-mono break-words select-all">
              {CLEAR_CONFIRMATION_PHRASE}
            </div>

            <input
              type="text"
              value={clearInput}
              onChange={(e) => setClearInput(e.target.value)}
              placeholder="Type the confirmation phrase..."
              className="w-full glass-button rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder-white/30 outline-none focus:ring-1 focus:ring-red-500/40 mb-4"
              disabled={clearing}
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearInput("");
                }}
                className="flex-1 glass-button px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/90 transition-colors"
                disabled={clearing}
              >
                Cancel
              </button>
              <button
                onClick={handleClearCalendar}
                disabled={clearInput !== CLEAR_CONFIRMATION_PHRASE || clearing}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
              >
                {clearing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    Clearing...
                  </span>
                ) : (
                  "Clear All Appointments"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
