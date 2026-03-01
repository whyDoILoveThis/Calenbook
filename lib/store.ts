"use client";

import { create } from "zustand";
import { Appointment, Availability } from "@/lib/types";

interface AppState {
  appointments: Appointment[];
  availability: Availability[];
  currentMonth: Date;
  selectedDate: string | null;
  showBookingModal: boolean;
  showAdminPanel: boolean;
  showAvailabilityPanel: boolean;
  showAppointmentDetail: boolean;
  selectedAppointment: Appointment | null;
  loading: boolean;
  // Timestamp (ms) until which realtime listener should treat empty snapshots as transient
  pendingWriteUntil: number | null;

  setAppointments: (appointments: Appointment[]) => void;
  setAvailability: (availability: Availability[]) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: string | null) => void;
  setShowBookingModal: (show: boolean) => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowAvailabilityPanel: (show: boolean) => void;
  setShowAppointmentDetail: (show: boolean) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingWriteUntil: (ts: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appointments: [],
  availability: [],
  currentMonth: new Date(),
  selectedDate: null,
  showBookingModal: false,
  showAdminPanel: false,
  showAvailabilityPanel: false,
  showAppointmentDetail: false,
  selectedAppointment: null,
  loading: false,
  pendingWriteUntil: null,

  setAppointments: (appointments) => set({ appointments }),
  setAvailability: (availability) => set({ availability }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setShowBookingModal: (showBookingModal) => set({ showBookingModal }),
  setShowAdminPanel: (showAdminPanel) => set({ showAdminPanel }),
  setShowAvailabilityPanel: (showAvailabilityPanel) =>
    set({ showAvailabilityPanel }),
  setShowAppointmentDetail: (showAppointmentDetail) =>
    set({ showAppointmentDetail }),
  setSelectedAppointment: (selectedAppointment) =>
    set({ selectedAppointment }),
  setLoading: (loading) => set({ loading }),
  setPendingWriteUntil: (pendingWriteUntil) => set({ pendingWriteUntil }),
}));
