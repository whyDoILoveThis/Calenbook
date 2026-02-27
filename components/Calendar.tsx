"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { isAdmin } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export default function Calendar() {
  const {
    currentMonth,
    setCurrentMonth,
    appointments,
    availability,
    setSelectedDate,
    setShowBookingModal,
    setSelectedAppointment,
    setShowAdminPanel,
  } = useAppStore();

  const { user } = useUser();
  const userIsAdmin = isAdmin(user?.id);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const unavailableDates = useMemo(() => {
    const dates = new Set<string>();
    availability.forEach((rule) => {
      if (rule.type === "specific_date") {
        dates.add(rule.value);
      }
    });
    return dates;
  }, [availability]);

  const unavailableWeekdays = useMemo(() => {
    const weekdays = new Set<number>();
    availability.forEach((rule) => {
      if (rule.type === "weekday") {
        weekdays.add(parseInt(rule.value));
      }
    });
    return weekdays;
  }, [availability]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, typeof appointments> = {};
    appointments.forEach((apt) => {
      if (!map[apt.date]) map[apt.date] = [];
      map[apt.date].push(apt);
    });
    return map;
  }, [appointments]);

  const isDayUnavailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return (
      unavailableDates.has(dateStr) || unavailableWeekdays.has(getDay(date))
    );
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    if (isDayUnavailable(date) && !userIsAdmin) {
      return;
    }

    // If admin, clicking on a date with appointments opens the admin panel
    if (userIsAdmin) {
      const dayAppointments = appointmentsByDate[dateStr];
      if (dayAppointments && dayAppointments.length > 0) {
        setSelectedDate(dateStr);
        setShowAdminPanel(true);
        return;
      }
      // Admin can also book
      setSelectedDate(dateStr);
      setShowBookingModal(true);
      return;
    }

    // Regular user - open booking modal
    setSelectedDate(dateStr);
    setShowBookingModal(true);
  };

  const handleDotClick = (
    e: React.MouseEvent,
    apt: (typeof appointments)[0],
  ) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    if (userIsAdmin) {
      setShowAdminPanel(true);
    } else {
      useAppStore.getState().setShowAppointmentDetail(true);
    }
  };

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="glass-button p-2 rounded-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-light tracking-wider text-white/90">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="glass-button p-2 rounded-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2 sm:px-4 pb-1 sm:pb-2">
        {weekDayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] sm:text-xs uppercase tracking-widest text-white/40 font-medium py-1 sm:py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 flex-1 px-2 sm:px-4 pb-2 sm:pb-4 gap-0.5 sm:gap-1">
        {days.map((date, idx) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const inMonth = isSameMonth(date, currentMonth);
          const today = isToday(date);
          const unavailable = isDayUnavailable(date);
          const dayAppointments = appointmentsByDate[dateStr] || [];
          const hasAppointments = dayAppointments.length > 0;

          return (
            <button
              key={idx}
              onClick={() => inMonth && handleDayClick(date)}
              disabled={!inMonth}
              className={`
                relative flex flex-col items-start justify-start rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 aspect-square overflow-hidden
                ${!inMonth ? "opacity-20 cursor-default" : "cursor-pointer"}
                ${
                  unavailable && inMonth
                    ? "bg-red-500/10 border border-red-500/30 hover:bg-red-500/15"
                    : inMonth
                      ? "glass-cell hover:bg-white/10"
                      : ""
                }
                ${today ? "ring-1 ring-purple-400/50" : ""}
              `}
            >
              <span
                className={`
                  text-xs sm:text-sm font-medium leading-none
                  ${!inMonth ? "text-white/20" : ""}
                  ${today ? "text-purple-300" : "text-white/70"}
                  ${unavailable && inMonth ? "text-red-400/80" : ""}
                `}
              >
                {format(date, "d")}
              </span>

              {unavailable && inMonth && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-400/60 mt-0.5" />
              )}

              {/* Appointment dots */}
              {hasAppointments && inMonth && (
                <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-auto w-full">
                  {dayAppointments.slice(0, 5).map((apt) => (
                    <span
                      key={apt.$id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleDotClick(e, apt)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleDotClick(e as unknown as React.MouseEvent, apt);
                      }}
                      className={`
                        w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 hover:scale-150 cursor-pointer
                        ${
                          apt.status === "approved"
                            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                            : apt.status === "rejected"
                              ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.3)]"
                              : "bg-white/30"
                        }
                      `}
                      title={`${apt.userName || "Anonymous"} - ${apt.status}`}
                    />
                  ))}
                  {dayAppointments.length > 5 && (
                    <span className="text-[10px] text-white/40">
                      +{dayAppointments.length - 5}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
