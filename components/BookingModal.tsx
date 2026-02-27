"use client";

import { useState, useRef } from "react";
import GlassDropdown from "./GlassDropdown";
import { X, Upload, Clock, FileText, Image as ImageIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAppointments } from "@/hooks/useData";
import { useUser } from "@clerk/nextjs";
import { TIME_SLOTS, formatTime } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function BookingModal() {
  const {
    selectedDate,
    setShowBookingModal,
    setSelectedDate,
    currentMonth,
    appointments,
  } = useAppStore();
  const { createAppointment, fetchAppointments } = useAppointments();
  const { user } = useUser();

  const [requestedTime, setRequestedTime] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("PM");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Prevent more than 2 active appointments/requests
    const activeCount = appointments.filter(
      (apt) =>
        apt.userId === user?.id &&
        (apt.status === "pending" || apt.status === "approved"),
    ).length;
    if (activeCount >= 2) {
      toast.error(
        "You cannot have more than 2 active appointments or requests at a time.",
      );
      return;
    }

    // Compose requestedTime from hour, minute, ampm
    let time = requestedTime;
    if (!time) {
      if (!hour || !minute || !ampm) {
        toast.error("Please select an arrival time");
        return;
      }
      let h = parseInt(hour);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      time = `${h.toString().padStart(2, "0")}:${minute}`;
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

      await createAppointment(formData);
      toast.success("Appointment request submitted!");
      handleClose();
      fetchAppointments(format(currentMonth, "yyyy-MM"));
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
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

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
                value={hour}
                onChange={(v) => {
                  setHour(v);
                  setRequestedTime("");
                }}
                options={[
                  { value: "", label: "HRS" },
                  ...Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1).padStart(2, "0"),
                    label: String(i + 1).padStart(2, "0"),
                  })),
                ]}
                className="min-w-[64px]"
              />
              <span className="text-white/40">:</span>
              <GlassDropdown
                value={minute}
                onChange={(v) => {
                  setMinute(v);
                  setRequestedTime("");
                }}
                options={[
                  { value: "", label: "MM" },
                  ...["00", "15", "30", "45"].map((m) => ({
                    value: m,
                    label: m,
                  })),
                ]}
                className="min-w-[64px]"
              />
              <GlassDropdown
                value={ampm}
                onChange={(v) => {
                  setAmpm(v);
                  setRequestedTime("");
                }}
                options={[
                  { value: "AM", label: "AM" },
                  { value: "PM", label: "PM" },
                ]}
                className="min-w-[64px]"
              />
            </div>
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
                      className="w-full h-24 object-cover rounded-lg"
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
            disabled={submitting}
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
    </div>
  );
}
