"use client";

import { useUser } from "@clerk/nextjs";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import IconDocument from "./icons/IconDocument";

export default function UserAppointmentsList() {
  const { user } = useUser();
  const {
    appointments,
    selectedDate,
    showUserAppointments,
    setShowUserAppointments,
    setSelectedAppointment,
    setShowAppointmentDetail,
    setShowBookingModal,
  } = useAppStore();

  const userAppointments = appointments.filter(
    (apt) =>
      apt.userEmail === user?.primaryEmailAddress?.emailAddress &&
      apt.date === selectedDate,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "pending":
      default:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  if (!showUserAppointments) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light text-white/90">
              Your Appointments
            </h2>
            {formattedDate && (
              <p className="text-sm text-white/40 mt-0.5">{formattedDate}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowUserAppointments(false);
                setShowBookingModal(true);
              }}
              className="text-white/60 hover:text-white/90 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              title="Book another appointment"
            >
              <IconDocument size={20} />
            </button>
            <button
              onClick={() => setShowUserAppointments(false)}
              className="text-white/60 hover:text-white/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="overflow-y-auto flex-1">
          {userAppointments.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/50">
              <p>No appointments for this day</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {userAppointments.map((apt) => (
                <button
                  key={apt.$id}
                  onClick={() => {
                    setSelectedAppointment(apt);
                    setShowAppointmentDetail(true);
                    setShowUserAppointments(false);
                  }}
                  className="w-full glass-button px-4 py-3 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex flex-col gap-1">
                        <p className="text-white/90 font-light">
                          {formatTime(apt.requestedTime)}
                        </p>
                        <p className="text-xs text-white/50">
                          {apt.description.substring(0, 50)}
                          {apt.description.length > 50 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}
                  >
                    {getStatusLabel(apt.status)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
