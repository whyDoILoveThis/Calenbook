"use client";

import { useState } from "react";
import { X, Clock, FileText, Trash2, Image as ImageIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAppointments } from "@/hooks/useData";
import { formatTime, isAdmin } from "@/lib/utils";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { BUCKET_ID } from "@/lib/appwrite";

export default function AppointmentDetail() {
  const {
    selectedAppointment,
    setSelectedAppointment,
    setShowAppointmentDetail,
    currentMonth,
  } = useAppStore();
  const { deleteAppointment, fetchAppointments } = useAppointments();
  const { user } = useUser();
  const [processing, setProcessing] = useState(false);

  if (!selectedAppointment) return null;

  const isOwner = user?.id === selectedAppointment.userId;
  const userIsAdmin = isAdmin(user?.id);
  const canSeeFullDetails = isOwner || userIsAdmin;

  const handleClose = () => {
    setSelectedAppointment(null);
    setShowAppointmentDetail(false);
  };

  const handleDelete = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      await deleteAppointment(selectedAppointment.$id, user.id);
      toast.success("Appointment cancelled");
      await fetchAppointments(format(currentMonth, "yyyy-MM"));
      setSelectedAppointment(null);
      setShowAppointmentDetail(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel appointment";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const getImageUrl = (fileId: string) => {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/preview?project=${projectId}&width=400`;
  };

  const displayDate = format(
    new Date(selectedAppointment.date + "T00:00:00"),
    "EEEE, MMMM d, yyyy",
  );

  // Minimal view for non-owner, non-admin — only show time info
  if (!canSeeFullDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <div className="glass-panel relative w-full max-w-xs z-10 rounded-2xl p-5">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 glass-button p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="text-sm text-white/40 mb-3">{displayDate}</p>

          <div className="glass-button rounded-xl p-4">
            {selectedAppointment.arrivalTime ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-emerald-400/60" />
                  <span className="text-sm text-white/60">
                    Arrival: {formatTime(selectedAppointment.arrivalTime)}
                  </span>
                </div>
                {selectedAppointment.finishedTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-400/60" />
                    <span className="text-sm text-white/60">
                      Finish: {formatTime(selectedAppointment.finishedTime)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/60">
                  Requested: {formatTime(selectedAppointment.requestedTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full view for owner or admin
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="glass-panel relative w-full max-w-md max-h-[90vh] overflow-y-auto z-10 rounded-2xl p-6">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-light text-white/90 mb-1">
          Appointment Details
        </h2>
        <p className="text-sm text-white/40 mb-4">{displayDate}</p>

        {/* Status */}
        <div className="mb-4">
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${
              selectedAppointment.status === "approved"
                ? "bg-emerald-500/20 text-emerald-300"
                : selectedAppointment.status === "rejected"
                  ? "bg-red-500/20 text-red-300"
                  : "bg-white/10 text-white/50"
            }`}
          >
            {selectedAppointment.status.charAt(0).toUpperCase() +
              selectedAppointment.status.slice(1)}
          </span>
        </div>

        {/* Requested Time */}
        <div className="glass-button rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/60">
              Requested: {formatTime(selectedAppointment.requestedTime)}
            </span>
          </div>
          {selectedAppointment.arrivalTime && (
            <div className="flex items-center gap-3 mt-2">
              <Clock className="w-4 h-4 text-emerald-400/60" />
              <span className="text-sm text-white/60">
                Arrival: {formatTime(selectedAppointment.arrivalTime)}
                {selectedAppointment.finishedTime &&
                  ` — Finish: ${formatTime(selectedAppointment.finishedTime)}`}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-white/40 mb-2">
            <FileText className="w-4 h-4" />
            Description
          </label>
          <div className="glass-button rounded-xl p-4 text-sm text-white/70 whitespace-pre-wrap">
            {selectedAppointment.description}
          </div>
        </div>

        {/* Images */}
        {selectedAppointment.imageIds &&
          selectedAppointment.imageIds.length > 0 && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-white/40 mb-2">
                <ImageIcon className="w-4 h-4" />
                Reference Images
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectedAppointment.imageIds.map((id) => (
                  <a
                    key={id}
                    href={getImageUrl(id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(id)}
                      alt="Reference"
                      className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

        {/* Cancel / Delete - only for owner */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={processing}
            className="w-full glass-button py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {processing ? "Cancelling..." : "Cancel Appointment"}
          </button>
        )}
      </div>
    </div>
  );
}
