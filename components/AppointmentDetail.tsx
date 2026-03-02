"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Clock,
  FileText,
  Trash2,
  Image as ImageIcon,
  User,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAppointments } from "@/hooks/useData";
import {
  formatTime,
  isAdmin,
  isTimeConflict,
  getOperatingHours,
  toProxyUrl,
} from "@/lib/utils";
import { Appointment } from "@/lib/types";
import GlassDropdown from "./GlassDropdown";
import TimeSelector from "./TimeSelector";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import EmailConfirmModal from "./EmailConfirmModal";

export default function AppointmentDetail() {
  const {
    selectedAppointment,
    setSelectedAppointment,
    setShowAppointmentDetail,
    setShowAdminPanel,
    appointments,
    availability,
  } = useAppStore();
  const { deleteAppointment, updateAppointment } = useAppointments();
  const { user } = useUser();
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<Appointment["status"] | undefined>(
    selectedAppointment?.status || "pending",
  );
  const [editingRequestedTime, setEditingRequestedTime] = useState(false);
  const [requestedTime, setRequestedTime] = useState<string>(
    selectedAppointment?.requestedTime || "",
  );
  const [arrivalTime, setArrivalTime] = useState<string>(
    selectedAppointment?.arrivalTime || "",
  );
  const [finishedTime, setFinishedTime] = useState<string>(
    selectedAppointment?.finishedTime || "",
  );
  const [saving, setSaving] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  // Email confirmation modal state for admin save
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    setStatus(selectedAppointment?.status || "pending");
    setArrivalTime(selectedAppointment?.arrivalTime || "");
    setFinishedTime(selectedAppointment?.finishedTime || "");
    setRequestedTime(selectedAppointment?.requestedTime || "");
    setEditingRequestedTime(false);
  }, [selectedAppointment]);

  // Overlap detection for admin time editing
  const approvedOnDate = useMemo(() => {
    if (!selectedAppointment) return [];
    return appointments.filter(
      (apt) =>
        apt.date === selectedAppointment.date &&
        apt.status === "approved" &&
        apt.arrivalTime &&
        apt.finishedTime &&
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

  // Operating hours for the appointment's date (drives red/yellow highlighting)
  const operatingHours = useMemo(() => {
    if (!selectedAppointment) return null;
    return getOperatingHours(selectedAppointment.date, availability);
  }, [selectedAppointment, availability]);

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
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel appointment";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText("");
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText === "yes i want to cancel frfr") {
      handleDelete();
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
        <div className="absolute top-4 right-4 flex gap-3">
          {userIsAdmin && (
            <button
              onClick={() => {
                setShowAppointmentDetail(false);
                setShowAdminPanel(true);
              }}
              className="glass-button p-1.5 rounded-lg"
              title="Back to admin overview"
            >
              <ChevronLeft className="w-4 h-4" />
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

        {/* Email confirm modal — admin is prompted before save completes */}
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
                          : status === "completed"
                            ? "bg-blue-500/20 text-blue-300"
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
                    { value: "completed", label: "Completed" },
                  ]}
                  className="min-w-24"
                />
              </div>
              <button
                onClick={() => {
                  // Show email modal; actual save runs after the admin chooses
                  setShowEmailModal(true);
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
                    : selectedAppointment.status === "completed"
                      ? "bg-blue-500/20 text-blue-300"
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
          {editingRequestedTime &&
          isOwner &&
          selectedAppointment.status === "pending" ? (
            <div className="space-y-2">
              <label className="text-sm text-white/40 block">
                Select New Time
              </label>
              <div className="flex gap-2">
                <select
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-white/90 bg-white/5 flex-1"
                >
                  <option value="" disabled>
                    Select time
                  </option>
                  {Array.from({ length: 48 }, (_, i) => {
                    const h = Math.floor(i / 2);
                    const m = (i % 2) * 30;
                    const time24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                    return (
                      <option
                        key={time24}
                        value={time24}
                        className="bg-slate-900 text-white"
                      >
                        {formatTime(time24)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!selectedAppointment || !requestedTime) return;
                    setSaving(true);
                    const res = await updateAppointment(
                      selectedAppointment.$id,
                      {
                        requestedTime,
                      },
                    );
                    if (res.success) {
                      toast.success("Time updated");
                      setSelectedAppointment({
                        ...selectedAppointment,
                        requestedTime,
                      });
                      setEditingRequestedTime(false);
                    } else {
                      toast.error(res.error || "Failed to update time");
                    }
                    setSaving(false);
                  }}
                  disabled={saving || !requestedTime}
                  className="glass-button px-3 py-1 rounded-md text-sm flex-1"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
                <button
                  onClick={() => {
                    setEditingRequestedTime(false);
                    setRequestedTime(selectedAppointment?.requestedTime || "");
                  }}
                  className="glass-button px-3 py-1 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/60">
                  Requested: {formatTime(selectedAppointment.requestedTime)}
                </span>
              </div>
              {isOwner && selectedAppointment.status === "pending" && (
                <button
                  onClick={() => setEditingRequestedTime(true)}
                  className="text-xs text-purple-300/80 hover:text-purple-300 transition-colors"
                >
                  Change
                </button>
              )}
            </div>
          )}
          {userIsAdmin ? (
            <div className="mt-3 space-y-4">
              <TimeSelector
                value={arrivalTime}
                onChange={setArrivalTime}
                label="Arrival Time"
                showLabel={true}
                defaultAmPm={
                  arrivalTime
                    ? parseInt(arrivalTime.split(":")[0]) >= 12
                      ? "PM"
                      : "AM"
                    : "AM"
                }
                operatingHours={operatingHours}
                isAdmin={true}
              />

              <TimeSelector
                value={finishedTime}
                onChange={setFinishedTime}
                label="Estimated Finish Time"
                showLabel={true}
                defaultAmPm={
                  finishedTime
                    ? parseInt(finishedTime.split(":")[0]) >= 12
                      ? "PM"
                      : "AM"
                    : "PM"
                }
                operatingHours={operatingHours}
                isAdmin={true}
              />

              {/* Overlap warning */}
              {hasConflict && (
                <div className="flex items-start gap-2 mt-2 text-orange-400/80 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    This time range overlaps with an existing appointment on
                    this date.
                  </span>
                </div>
              )}

              {/* Show existing appointments on this date */}
              {approvedOnDate.length > 0 && (
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
                  const displayUrl = toProxyUrl(url);
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

        {/* Cancel / Delete - for owner or admin */}
        {(isOwner || userIsAdmin) && (
          <button
            onClick={handleDeleteClick}
            disabled={processing}
            className="w-full glass-button py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isOwner ? "Cancel Appointment" : "Delete Appointment"}
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="glass-panel rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-light text-white/90 mb-2">
              Cancel Appointment?
            </h2>
            <p className="text-sm text-white/50 mb-5">
              This action cannot be undone. To confirm, type the text below:
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-sm font-mono text-red-300/80">
                yes i want to cancel frfr
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type the text above..."
              className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white/90 placeholder-white/30 mb-5"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 glass-button py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
              >
                Keep It
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={
                  deleteConfirmText !== "yes i want to cancel frfr" ||
                  processing
                }
                className="flex-1 bg-red-500/20 border border-red-500/30 text-red-300 py-3 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {processing ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal — admin save flow */}
      {showEmailModal && selectedAppointment && (
        <EmailConfirmModal
          open={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onConfirm={async () => {
            // Email was sent or skipped — now execute the actual save
            setShowEmailModal(false);
            if (!selectedAppointment) return;
            setSaving(true);
            const payload: Partial<
              Pick<Appointment, "status" | "arrivalTime" | "finishedTime">
            > = { status: status as Appointment["status"] };
            if (arrivalTime) payload.arrivalTime = arrivalTime;
            if (finishedTime) payload.finishedTime = finishedTime;
            if (hasConflict) {
              toast("Warning: This overlaps with an existing appointment", {
                icon: "⚠️",
              });
            }
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
          defaultTo={selectedAppointment.userEmail}
          defaultSubject={`Appointment update — ${selectedAppointment.date}`}
          defaultBody={`<p>Hi ${selectedAppointment.userName || "there"},</p><p>Your appointment on <strong>${selectedAppointment.date}</strong> has been updated to <strong>${status}</strong>.</p>${arrivalTime ? `<p>Arrival: ${arrivalTime}</p>` : ""}${finishedTime ? `<p>Estimated finish: ${finishedTime}</p>` : ""}`}
          userId={user?.id || ""}
        />
      )}
    </div>
  );
}
