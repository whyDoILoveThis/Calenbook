"use client";

import { useState, useRef, useMemo } from "react";
import GlassDropdown from "./GlassDropdown";
import {
  X,
  Upload,
  Clock,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAppointments } from "@/hooks/useData";
import { useUser } from "@clerk/nextjs";
import { format, getDay } from "date-fns";
import toast from "react-hot-toast";
import { isAdmin, formatTime, timeToMinutes } from "@/lib/utils";
import IconList from "./icons/IconList";

export default function BookingModal() {
  const {
    selectedDate,
    setShowBookingModal,
    setSelectedDate,
    appointments,
    availability,
    setShowAdminPanel,
    setSelectedAppointment,
    setShowAppointmentDetail,
  } = useAppStore();
  const { createAppointment } = useAppointments();
  const { user } = useUser();

  const [selectedTime, setSelectedTime] = useState("");
  const [ampm, setAmpm] = useState<"AM" | "PM">("PM");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userIsAdmin = isAdmin(user?.id);
  const hasTooManyAppointments =
    !userIsAdmin &&
    appointments.filter(
      (apt) =>
        apt.userId === user?.id &&
        (apt.status === "pending" || apt.status === "approved"),
    ).length >= 3;

  // Get approved appointments on the selected date for overlap checking
  const approvedOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter(
      (apt) =>
        apt.date === selectedDate &&
        apt.status === "approved" &&
        apt.arrivalTime &&
        apt.finishedTime,
    );
  }, [appointments, selectedDate]);

  // Determine operating hours for the selected date
  const operatingHours = useMemo<
    { start: string; end: string } | "closed" | null
  >(() => {
    if (!selectedDate) return null;
    const dateObj = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = getDay(dateObj); // 0=Sun … 6=Sat

    // 1. Check for a date_override matching this exact date
    const dateOverride = availability.find(
      (r) => r.type === "date_override" && r.value === selectedDate,
    );
    if (dateOverride) {
      if (dateOverride.isClosed) return "closed";
      if (dateOverride.startTime && dateOverride.endTime) {
        return { start: dateOverride.startTime, end: dateOverride.endTime };
      }
    }

    // 2. Check for legacy specific_date (unavailable) rule
    const legacyDate = availability.find(
      (r) => r.type === "specific_date" && r.value === selectedDate,
    );
    if (legacyDate) return "closed";

    // 3. Check for weekly_hours for this weekday
    const weeklyRule = availability.find(
      (r) => r.type === "weekly_hours" && r.value === String(dayOfWeek),
    );
    if (weeklyRule) {
      if (weeklyRule.isClosed) return "closed";
      if (weeklyRule.startTime && weeklyRule.endTime) {
        return { start: weeklyRule.startTime, end: weeklyRule.endTime };
      }
    }

    // 4. Check legacy weekday unavailability
    const legacyWeekday = availability.find(
      (r) => r.type === "weekday" && r.value === String(dayOfWeek),
    );
    if (legacyWeekday) return "closed";

    // No rules → no restrictions
    return null;
  }, [selectedDate, availability]);

  // Build 30-min time slot options filtered by AM/PM
  const timeSlotOptions = useMemo(() => {
    const slots: {
      value: string;
      label: string;
      disabled?: boolean;
      variant?: "normal" | "red" | "yellow";
    }[] = [];

    const startH = ampm === "AM" ? 0 : 12;
    const endH = ampm === "AM" ? 12 : 24;

    for (let h = startH; h < endH; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        const label = formatTime(time24);

        let outsideHours = false;
        if (operatingHours === "closed") {
          outsideHours = true;
        } else if (operatingHours) {
          const slotMins = timeToMinutes(time24);
          const openMins = timeToMinutes(operatingHours.start);
          const closeMins = timeToMinutes(operatingHours.end);
          outsideHours = slotMins < openMins || slotMins >= closeMins;
        }

        if (outsideHours) {
          slots.push({
            value: time24,
            label,
            disabled: !userIsAdmin,
            variant: userIsAdmin ? "yellow" : "red",
          });
        } else {
          slots.push({ value: time24, label });
        }
      }
    }
    return slots;
  }, [operatingHours, userIsAdmin, ampm]);

  // Check for overlap with existing approved appointments
  const timeOverlap = useMemo(() => {
    if (!selectedTime) return null;
    const selectedMinutes = timeToMinutes(selectedTime);
    return (
      approvedOnDate.find((apt) => {
        const start = timeToMinutes(apt.arrivalTime!);
        const end = timeToMinutes(apt.finishedTime!);
        return selectedMinutes >= start && selectedMinutes < end;
      }) ?? null
    );
  }, [selectedTime, approvedOnDate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setShowBookingModal(false);
    setSelectedDate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent more than 2 active appointments/requests (admins have no limit)
    const userIsAdmin = isAdmin(user?.id);
    if (!userIsAdmin) {
      const activeCount = appointments.filter(
        (apt) =>
          apt.userId === user?.id &&
          (apt.status === "pending" || apt.status === "approved"),
      ).length;
      if (activeCount >= 3) {
        toast.error(
          "You cannot have more than 3 active appointments or requests at a time.",
        );
        return;
      }
    }

    // Compose requestedTime from unified selector
    const time = selectedTime;
    if (!time) {
      toast.error("Please select an arrival time");
      return;
    }
    // Block if time overlaps with existing appointment (non-admin only)
    if (!userIsAdmin && timeOverlap) {
      toast.error("Selected time overlaps with an existing appointment");
      return;
    }
    if (!description.trim()) {
      toast.error("Please add a description");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("userId", user?.id || "");
      const name = user?.fullName || user?.firstName || "";
      if (name) formData.append("userName", name);
      formData.append(
        "userEmail",
        user?.emailAddresses?.[0]?.emailAddress || "",
      );
      formData.append("date", selectedDate!);
      formData.append("requestedTime", time);
      formData.append("description", description);

      images.forEach((image) => {
        formData.append("images", image);
      });

      const result = await createAppointment(formData);
      toast.success("Appointment request submitted!");
      if (result.warning) {
        toast.error(result.warning);
      }
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit appointment request";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedDate) return null;

  const displayDate = format(
    new Date(selectedDate + "T00:00:00"),
    "EEEE, MMMM d, yyyy",
  );

  // If user is maxed out, show only the appointments list
  if (hasTooManyAppointments) {
    const userAppointments = appointments.filter(
      (apt) => apt.date === selectedDate && apt.userId === user?.id,
    );

    const handleMaxedClose = () => {
      setShowBookingModal(false);
      setSelectedDate(null);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleMaxedClose}
        />
        <div className="glass-panel relative w-full max-w-sm rounded-2xl p-6 z-10">
          <button
            onClick={handleMaxedClose}
            className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-lg font-light text-white/90 mb-1">
            Your Appointments
          </h2>
          <p className="text-sm text-white/40 mb-4">{displayDate}</p>

          <div className="space-y-2">
            {userAppointments.map((apt) => (
              <button
                key={apt.$id}
                onClick={() => {
                  setSelectedAppointment(apt);
                  setShowAppointmentDetail(true);
                }}
                className="glass-button p-3 rounded-lg flex items-center justify-between gap-2 hover:bg-white/15 transition-all w-full text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-white/60 shrink-0" />
                  <span className="text-white/80 truncate">
                    {apt.requestedTime}
                    {apt.finishedTime && ` - ${apt.finishedTime}`}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                    apt.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : apt.status === "rejected"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {apt.status}
                </span>
              </button>
            ))}
          </div>

          {userAppointments.length === 0 && (
            <p className="text-white/40 text-sm">
              You don&apos;t have any appointments scheduled for this date.
            </p>
          )}

          <p className="text-orange-400/50 text-xs mt-4">
            You&apos;ve reached the maximum of 3 active appointments. Cancel or
            complete existing ones to book more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="glass-panel relative w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 rounded-2xl p-6">
        {/* Close button */}
        <div className="absolute top-4 right-4 flex gap-6">
          {/* Show list button only if this date has appointments */}
          {appointments.filter((apt) => apt.date === selectedDate).length >
            0 && (
            <button
              onClick={() => {
                const userIsAdmin = isAdmin(user?.id);
                if (userIsAdmin) {
                  setShowAdminPanel(true);
                  setShowBookingModal(false);
                } else {
                  setShowMyAppointments(true);
                }
              }}
              className="glass-button p-1.5 rounded-lg"
            >
              <IconList size={16} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="glass-button p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-xl font-light text-white/90 mb-1">
          Request Appointment
        </h2>
        <p className="text-sm text-white/40 mb-6">{displayDate}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Time Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
              <Clock className="w-4 h-4" />
              Preferred Arrival Time
            </label>
            <div className="flex gap-2 items-center">
              <GlassDropdown
                value={selectedTime}
                onChange={setSelectedTime}
                options={[
                  { value: "", label: "Select a time" },
                  ...timeSlotOptions,
                ]}
                placeholder="Select a time"
                className="flex-1"
              />
              <div className="flex rounded-xl overflow-hidden border border-purple-400/20">
                <button
                  type="button"
                  onClick={() => {
                    setAmpm("AM");
                    setSelectedTime("");
                  }}
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
                  onClick={() => {
                    setAmpm("PM");
                    setSelectedTime("");
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-all ${
                    ampm === "PM"
                      ? "bg-purple-500/30 text-purple-200"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Operating hours info */}
            {operatingHours && operatingHours !== "closed" && (
              <p className="mt-1.5 text-xs text-white/30">
                Hours of operation: {formatTime(operatingHours.start)} –{" "}
                {formatTime(operatingHours.end)}
              </p>
            )}
            {operatingHours === "closed" && (
              <p className="mt-1.5 text-xs text-red-400/60">
                This day is marked as closed
              </p>
            )}

            {/* Overlap warning */}
            {timeOverlap && (
              <div className="flex items-start gap-2 mt-2 text-red-400/80 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  This time overlaps with an existing appointment (
                  {formatTime(timeOverlap.arrivalTime!)} –{" "}
                  {formatTime(timeOverlap.finishedTime!)})
                </span>
              </div>
            )}

            {/* Show existing appointments on this date */}
            {approvedOnDate.length > 0 && !timeOverlap && (
              <div className="mt-2 text-xs text-white/30">
                Booked:{" "}
                {approvedOnDate
                  .map(
                    (apt) =>
                      `${formatTime(apt.arrivalTime!)}–${formatTime(apt.finishedTime!)}`,
                  )
                  .join(", ")}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need, any details, preferences, etc..."
              rows={4}
              className="w-full glass-input rounded-xl p-3 text-sm text-white/90 placeholder:text-white/20 resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
              <ImageIcon className="w-4 h-4" />
              Reference Images
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass-button w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 transition-colors flex flex-col items-center gap-2"
            >
              <Upload className="w-6 h-6 text-white/40" />
              <span className="text-sm text-white/40">
                Click to upload images
              </span>
            </button>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !!timeOverlap}
            className="w-full primary-button py-3 rounded-xl text-sm font-medium transition-all duration-200"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </button>
        </form>
      </div>

      {/* My Appointments List Modal (for non-admin users) */}
      {showMyAppointments && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMyAppointments(false)}
          />
          <div className="glass-panel relative w-full max-w-sm rounded-2xl p-6 z-10">
            <button
              onClick={() => setShowMyAppointments(false)}
              className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-light text-white/90 mb-4">
              Your Appointments
            </h2>

            <div className="space-y-2">
              {appointments
                .filter(
                  (apt) => apt.date === selectedDate && apt.userId === user?.id,
                )
                .map((apt) => (
                  <button
                    key={apt.$id}
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setShowAppointmentDetail(true);
                    }}
                    className="glass-button p-3 rounded-lg flex items-center justify-between gap-2 hover:bg-white/15 transition-all w-full text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-white/60 shrink-0" />
                      <span className="text-white/80 truncate">
                        {apt.requestedTime}
                        {apt.finishedTime && ` - ${apt.finishedTime}`}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                        apt.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : apt.status === "rejected"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </button>
                ))}
            </div>

            {appointments.filter(
              (apt) => apt.date === selectedDate && apt.userId === user?.id,
            ).length === 0 && (
              <p className="text-white/40 text-sm">
                No appointments scheduled for this date.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
