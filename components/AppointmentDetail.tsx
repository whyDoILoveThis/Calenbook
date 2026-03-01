"use client";

import { useState, useEffect } from "react";
import {
  X,
  Clock,
  FileText,
  Trash2,
  Image as ImageIcon,
  User,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAppointments } from "@/hooks/useData";
import { formatTime, isAdmin } from "@/lib/utils";
import { Appointment } from "@/lib/types";
import GlassDropdown from "./GlassDropdown";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

export default function AppointmentDetail() {
  const {
    selectedAppointment,
    setSelectedAppointment,
    setShowAppointmentDetail,
  } = useAppStore();
  const { deleteAppointment, updateAppointment } = useAppointments();
  const { user } = useUser();
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | undefined
  >(selectedAppointment?.status || "pending");
  const [arrivalTime, setArrivalTime] = useState<string>(
    selectedAppointment?.arrivalTime || "",
  );
  const [finishedTime, setFinishedTime] = useState<string>(
    selectedAppointment?.finishedTime || "",
  );
  const [saving, setSaving] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    setStatus(selectedAppointment?.status || "pending");
    setArrivalTime(selectedAppointment?.arrivalTime || "");
    setFinishedTime(selectedAppointment?.finishedTime || "");
  }, [selectedAppointment]);

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
        <p className="text-sm text-white/40 mb-2">{displayDate}</p>

        {/* Owner info - only visible to admin or owner */}
        <div className="flex items-center gap-3 mb-4">
          <User className="w-4 h-4 text-white/40" />
          <div className="text-sm text-white/80">
            {selectedAppointment.userName ||
              selectedAppointment.userEmail ||
              selectedAppointment.userId ||
              "Anonymous"}
            {selectedAppointment.userEmail && (
              <div className="text-xs text-white/40">
                {selectedAppointment.userEmail}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          {userIsAdmin ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {!statusOpen && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      status === "approved"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : status === "rejected"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-white/10 text-white/50"
                    }`}
                  >
                    {(status ?? "pending").charAt(0).toUpperCase() +
                      (status ?? "pending").slice(1)}
                  </span>
                )}
                <GlassDropdown
                  value={status ?? "pending"}
                  onChange={(v) => setStatus(v as Appointment["status"])}
                  onOpenChange={(o) => setStatusOpen(o)}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                  className="min-w-24"
                />
              </div>
              <button
                onClick={async () => {
                  if (!selectedAppointment) return;
                  setSaving(true);
                  const payload: Partial<
                    Pick<Appointment, "status" | "arrivalTime" | "finishedTime">
                  > = { status: status as Appointment["status"] };
                  if (arrivalTime) payload.arrivalTime = arrivalTime;
                  if (finishedTime) payload.finishedTime = finishedTime;
                  const res = await updateAppointment(
                    selectedAppointment.$id,
                    payload as {
                      status: string;
                      arrivalTime?: string;
                      finishedTime?: string;
                    },
                  );
                  if (res.success) {
                    toast.success("Saved");
                    setSelectedAppointment({
                      ...selectedAppointment,
                      ...payload,
                    } as Appointment);
                  } else {
                    toast.error(res.error || "Failed to save");
                  }
                  setSaving(false);
                }}
                disabled={saving}
                className="glass-button px-3 py-1 rounded-md text-sm"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {/* Requested Time */}
        <div className="glass-button rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/60">
              Requested: {formatTime(selectedAppointment.requestedTime)}
            </span>
          </div>
          {userIsAdmin ? (
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-sm text-white/40 mb-2 block">
                  Arrival
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
                      const m = arrivalTime ? arrivalTime.split(":")[1] : "00";
                      if (ampm === "PM" && h !== 12) h += 12;
                      if (ampm === "AM" && h === 12) h = 0;
                      setArrivalTime(`${h.toString().padStart(2, "0")}:${m}`);
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
                      setArrivalTime(`${h.toString().padStart(2, "0")}:${m}`);
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
                      setFinishedTime(`${h.toString().padStart(2, "0")}:${m}`);
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
                      setFinishedTime(`${h.toString().padStart(2, "0")}:${m}`);
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
            </div>
          ) : (
            selectedAppointment.arrivalTime && (
              <div className="flex items-center gap-3 mt-2">
                <Clock className="w-4 h-4 text-emerald-400/60" />
                <span className="text-sm text-white/60">
                  Arrival: {formatTime(selectedAppointment.arrivalTime)}
                  {selectedAppointment.finishedTime &&
                    ` — Finish: ${formatTime(selectedAppointment.finishedTime)}`}
                </span>
              </div>
            )
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
        {selectedAppointment.imageUrls &&
          selectedAppointment.imageUrls.length > 0 && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-white/40 mb-2">
                <ImageIcon className="w-4 h-4" />
                Reference Images
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectedAppointment.imageUrls.map((url, i) => {
                  // convert any /preview URLs to /view (free plan cannot transform)
                  let displayUrl = url;
                  try {
                    if (displayUrl.includes("/preview")) {
                      const u = new URL(displayUrl);
                      const project = u.searchParams.get("project");
                      displayUrl = displayUrl.split("/preview")[0] + "/view";
                      if (project) displayUrl += `?project=${project}`;
                    }
                  } catch {}
                  return (
                    <a
                      key={i}
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayUrl}
                        alt="Reference"
                        className="w-full h-32 object-contain rounded-lg hover:opacity-80 transition-opacity"
                      />
                    </a>
                  );
                })}
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
