"use client";

import { useState, useMemo } from "react";
import GlassDropdown from "./GlassDropdown";
import {
  X,
  Check,
  XCircle,
  Clock,
  User,
  Mail,
  FileText,
  Trash2,
  ChevronLeft,
  Image as ImageIcon,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAppointments } from "@/hooks/useData";
import { Appointment } from "@/lib/types";
import { formatTime, isTimeConflict } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { useUser } from "@clerk/nextjs";
import IconDocument from "./icons/IconDocument";

export default function AdminPanel() {
  const { user } = useUser();
  const {
    selectedDate,
    appointments,
    setShowAdminPanel,
    setSelectedDate,
    selectedAppointment,
    setSelectedAppointment,
    setShowBookingModal,
  } = useAppStore();

  const { updateAppointment, deleteAppointment } = useAppointments();

  const [arrivalTime, setArrivalTime] = useState("");
  const [finishedTime, setFinishedTime] = useState("");
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState<"list" | "detail">("list");

  const filteredAppointments = useMemo(() => {
    if (selectedDate) {
      return appointments.filter((apt) => apt.date === selectedDate);
    }
    return appointments.filter((apt) => apt.status === "pending");
  }, [appointments, selectedDate]);

  const approvedOnDate = useMemo(() => {
    if (!selectedAppointment) return [];
    return appointments.filter(
      (apt) =>
        apt.date === selectedAppointment.date &&
        apt.status === "approved" &&
        apt.$id !== selectedAppointment.$id,
    );
  }, [appointments, selectedAppointment]);

  const hasConflict = useMemo(() => {
    if (!arrivalTime || !finishedTime) return false;
    return approvedOnDate.some(
      (apt) =>
        apt.arrivalTime &&
        apt.finishedTime &&
        isTimeConflict(
          arrivalTime,
          finishedTime,
          apt.arrivalTime,
          apt.finishedTime,
        ),
    );
  }, [arrivalTime, finishedTime, approvedOnDate]);

  const handleClose = () => {
    setShowAdminPanel(false);
    setSelectedDate(null);
    setSelectedAppointment(null);
    setView("list");
  };

  const handleSelectAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setArrivalTime(apt.arrivalTime || apt.requestedTime || "");
    setFinishedTime(apt.finishedTime || "");
    setView("detail");
  };

  const handleApprove = async () => {
    if (!selectedAppointment) return;
    if (!arrivalTime || !finishedTime) {
      toast.error("Please set both arrival and finished times");
      return;
    }
    // Warn about conflict but allow admin to proceed
    if (hasConflict) {
      toast("Warning: This overlaps with an existing appointment", {
        icon: "⚠️",
      });
    }

    setProcessing(true);
    try {
      const result = await updateAppointment(selectedAppointment.$id, {
        status: "approved",
        arrivalTime,
        finishedTime,
      });
      if (result.success) {
        toast.success("Appointment approved!");
        setView("list");
        setSelectedAppointment(null);
      } else {
        toast.error(result.error || "Failed to approve appointment");
      }
    } catch {
      toast.error("Network error — could not approve appointment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAppointment) return;
    setProcessing(true);
    try {
      const result = await updateAppointment(selectedAppointment.$id, {
        status: "rejected",
      });
      if (result.success) {
        toast.success("Appointment rejected");
        setView("list");
        setSelectedAppointment(null);
      } else {
        toast.error(result.error || "Failed to reject appointment");
      }
    } catch {
      toast.error("Network error — could not reject appointment");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment || !user) return;
    setProcessing(true);
    try {
      await deleteAppointment(selectedAppointment.$id, user.id);
      toast.success("Appointment deleted");
      setView("list");
      setSelectedAppointment(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete appointment";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 rounded-2xl p-6">
        <div className="absolute top-4 right-4 flex gap-6">
          <button
            onClick={() => {
              setShowBookingModal(true);
              setShowAdminPanel(false);
            }}
            className="glass-button p-1.5 rounded-lg"
          >
            <IconDocument />
          </button>
          <button
            onClick={handleClose}
            className="glass-button p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {view === "list" ? (
          <>
            <h2 className="text-xl font-light text-white/90 mb-1">
              {selectedDate
                ? `Appointments: ${format(
                    new Date(selectedDate + "T00:00:00"),
                    "MMM d, yyyy",
                  )}`
                : "Pending Requests"}
            </h2>
            <p className="text-sm text-white/40 mb-6">
              {filteredAppointments.length} appointment
              {filteredAppointments.length !== 1 ? "s" : ""}
            </p>

            <div className="space-y-3">
              {filteredAppointments.length === 0 && (
                <p className="text-center text-white/30 py-8">
                  No appointments found
                </p>
              )}
              {filteredAppointments.map((apt, idx) => (
                <button
                  key={apt.$id || idx}
                  onClick={() => handleSelectAppointment(apt)}
                  className="w-full glass-button rounded-xl p-4 text-left transition-all hover:bg-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          apt.status === "approved"
                            ? "bg-emerald-400"
                            : apt.status === "rejected"
                              ? "bg-red-400"
                              : "bg-white/30"
                        }`}
                      />
                      <span className="text-sm font-medium text-white/80">
                        {apt.userName || "Anonymous"}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        apt.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : apt.status === "rejected"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-white/10 text-white/50"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate">
                    {apt.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-white/30">
                    <span>Requested: {formatTime(apt.requestedTime)}</span>
                    {apt.arrivalTime && (
                      <span>Arrival: {formatTime(apt.arrivalTime)}</span>
                    )}
                    {apt.finishedTime && (
                      <span>Finished: {formatTime(apt.finishedTime)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          selectedAppointment && (
            <>
              <button
                onClick={() => {
                  setView("list");
                  setSelectedAppointment(null);
                }}
                className="flex items-center gap-1 text-sm text-white/40 hover:text-white/60 mb-4 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="space-y-5">
                {/* User info */}
                <div className="glass-button rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/80">
                      {selectedAppointment.userName || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/60">
                      {selectedAppointment.userEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/60">
                      Requested: {formatTime(selectedAppointment.requestedTime)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-white/40 mb-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </label>
                  <div className="glass-button rounded-xl p-4 text-sm text-white/70 whitespace-pre-wrap">
                    {selectedAppointment.description}
                  </div>
                </div>

                {/* Images */}
                {selectedAppointment.imageUrls &&
                  selectedAppointment.imageUrls.length > 0 && (
                    <div>
                      <label className="flex items-center gap-2 text-sm text-white/40 mb-2">
                        <ImageIcon className="w-4 h-4" />
                        Reference Images
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedAppointment.imageUrls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="Reference"
                              className="w-full h-40 object-contain rounded-lg hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Existing appointments on this date */}
                {approvedOnDate.length > 0 && (
                  <div className="glass-button rounded-xl p-4">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Existing appointments on this date
                    </span>
                    <div className="mt-2 space-y-1">
                      {approvedOnDate.map((apt, i) => (
                        <div
                          key={
                            apt.$id ||
                            `${apt.userId}-${apt.date}-${apt.requestedTime}-${i}`
                          }
                          className="text-sm text-amber-300/80"
                        >
                          {apt.userName || "Anonymous"}:{" "}
                          {formatTime(apt.arrivalTime!)} -{" "}
                          {formatTime(apt.finishedTime!)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time selection for approval */}
                {selectedAppointment.status === "pending" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/40 mb-2 block">
                        Arrival Time
                      </label>
                      <div className="flex gap-2 items-center custom-scrollbar">
                        <GlassDropdown
                          value={
                            arrivalTime
                              ? (() => {
                                  const [h] = arrivalTime.split(":");
                                  let hour = parseInt(h);
                                  hour = hour % 12 || 12;
                                  return String(hour).padStart(2, "0");
                                })()
                              : ""
                          }
                          onChange={(v) => {
                            let h = parseInt(v);
                            const ampm = arrivalTime
                              ? parseInt(arrivalTime.split(":")[0]) >= 12
                                ? "PM"
                                : "AM"
                              : "AM";
                            const m = arrivalTime
                              ? arrivalTime.split(":")[1]
                              : "00";
                            if (ampm === "PM" && h !== 12) h += 12;
                            if (ampm === "AM" && h === 12) h = 0;
                            setArrivalTime(
                              `${h.toString().padStart(2, "0")}:${m}`,
                            );
                          }}
                          options={[
                            { value: "", label: "HRS" },
                            ...Array.from({ length: 12 }, (_, i) => ({
                              value: String(i + 1).padStart(2, "0"),
                              label: String(i + 1).padStart(2, "0"),
                            })),
                          ]}
                          className="min-w-16"
                        />
                        <span className="text-white/40">:</span>
                        <GlassDropdown
                          value={arrivalTime ? arrivalTime.split(":")[1] : ""}
                          onChange={(v) => {
                            const h = arrivalTime
                              ? parseInt(arrivalTime.split(":")[0])
                              : 0;
                            const m = v;
                            setArrivalTime(
                              `${h.toString().padStart(2, "0")}:${m}`,
                            );
                          }}
                          options={[
                            { value: "", label: "MM" },
                            ...["00", "15", "30", "45"].map((m) => ({
                              value: m,
                              label: m,
                            })),
                          ]}
                          className="min-w-16"
                        />
                        <GlassDropdown
                          value={
                            arrivalTime
                              ? parseInt(arrivalTime.split(":")[0]) >= 12
                                ? "PM"
                                : "AM"
                              : "AM"
                          }
                          onChange={(v) => {
                            const ampm = v;
                            const [h, m] = arrivalTime
                              ? arrivalTime.split(":")
                              : ["00", "00"];
                            let hour = parseInt(h);
                            if (ampm === "PM" && hour < 12) hour += 12;
                            if (ampm === "AM" && hour === 12) hour = 0;
                            setArrivalTime(
                              `${hour.toString().padStart(2, "0")}:${m}`,
                            );
                          }}
                          options={[
                            { value: "AM", label: "AM" },
                            { value: "PM", label: "PM" },
                          ]}
                          className="min-w-16"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-white/40 mb-2 block">
                        Estimated Finish Time
                      </label>
                      <div className="flex gap-2 items-center custom-scrollbar">
                        <GlassDropdown
                          value={
                            finishedTime
                              ? (() => {
                                  const [h] = finishedTime.split(":");
                                  let hour = parseInt(h);
                                  hour = hour % 12 || 12;
                                  return String(hour).padStart(2, "0");
                                })()
                              : ""
                          }
                          onChange={(v) => {
                            let h = parseInt(v);
                            const ampm = finishedTime
                              ? parseInt(finishedTime.split(":")[0]) >= 12
                                ? "PM"
                                : "AM"
                              : "AM";
                            const m = finishedTime
                              ? finishedTime.split(":")[1]
                              : "00";
                            if (ampm === "PM" && h !== 12) h += 12;
                            if (ampm === "AM" && h === 12) h = 0;
                            setFinishedTime(
                              `${h.toString().padStart(2, "0")}:${m}`,
                            );
                          }}
                          options={[
                            { value: "", label: "HRS" },
                            ...Array.from({ length: 12 }, (_, i) => ({
                              value: String(i + 1).padStart(2, "0"),
                              label: String(i + 1).padStart(2, "0"),
                            })),
                          ]}
                          className="min-w-16"
                        />
                        <span className="text-white/40">:</span>
                        <GlassDropdown
                          value={finishedTime ? finishedTime.split(":")[1] : ""}
                          onChange={(v) => {
                            const h = finishedTime
                              ? parseInt(finishedTime.split(":")[0])
                              : 0;
                            const m = v;
                            setFinishedTime(
                              `${h.toString().padStart(2, "0")}:${m}`,
                            );
                          }}
                          options={[
                            { value: "", label: "MM" },
                            ...["00", "15", "30", "45"].map((m) => ({
                              value: m,
                              label: m,
                            })),
                          ]}
                          className="min-w-16"
                        />
                        <GlassDropdown
                          value={
                            finishedTime
                              ? parseInt(finishedTime.split(":")[0]) >= 12
                                ? "PM"
                                : "AM"
                              : "AM"
                          }
                          onChange={(v) => {
                            const ampm = v;
                            const [h, m] = finishedTime
                              ? finishedTime.split(":")
                              : ["00", "00"];
                            let hour = parseInt(h);
                            if (ampm === "PM" && hour < 12) hour += 12;
                            if (ampm === "AM" && hour === 12) hour = 0;
                            setFinishedTime(
                              `${hour.toString().padStart(2, "0")}:${m}`,
                            );
                          }}
                          options={[
                            { value: "AM", label: "AM" },
                            { value: "PM", label: "PM" },
                          ]}
                          className="min-w-16"
                        />
                      </div>
                    </div>

                    {hasConflict && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-sm text-orange-300">
                        ⚠️ This time range overlaps with an existing
                        appointment.
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="flex-1 primary-button py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={processing}
                        className="flex-1 bg-red-500/20 border border-red-500/30 text-red-300 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={processing}
                  className="w-full glass-button py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Appointment
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
