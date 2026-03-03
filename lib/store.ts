"use client";

import { create } from "zustand";
import { Appointment, Availability } from "@/lib/types";

type PinAccess = "full" | "personal" | null;

interface AppState {
  appointments: Appointment[];
  personalAppointments: Appointment[];
  availability: Availability[];
  currentMonth: Date;
  selectedDate: string | null;
  showBookingModal: boolean;
  showAdminPanel: boolean;
  showAvailabilityPanel: boolean;
  showAppointmentDetail: boolean;
  showUserAppointments: boolean;
  selectedAppointment: Appointment | null;
  loading: boolean;
  showApp: boolean;
  pinAccess: PinAccess;
  showPinModal: boolean;
  showManagePinsModal: boolean;
  // Timestamp (ms) until which realtime listener should treat empty snapshots as transient
  pendingWriteUntil: number | null;

  setAppointments: (appointments: Appointment[]) => void;
  setPersonalAppointments: (appointments: Appointment[]) => void;
  setAvailability: (availability: Availability[]) => void;
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: string | null) => void;
  setShowBookingModal: (show: boolean) => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowAvailabilityPanel: (show: boolean) => void;
  setShowAppointmentDetail: (show: boolean) => void;
  setShowUserAppointments: (show: boolean) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setLoading: (loading: boolean) => void;
  setShowApp: (show: boolean) => void;
  setPinAccess: (access: PinAccess) => void;
  setShowPinModal: (show: boolean) => void;
  setShowManagePinsModal: (show: boolean) => void;
  setPendingWriteUntil: (ts: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appointments: [],
  personalAppointments: [],
  availability: [],
  currentMonth: new Date(),
  selectedDate: null,
  showBookingModal: false,
  showAdminPanel: false,
  showAvailabilityPanel: false,
  showAppointmentDetail: false,
  showUserAppointments: false,
  selectedAppointment: null,
  loading: false,
  showApp: false,
  pinAccess: null,
  showPinModal: false,
  showManagePinsModal: false,
  pendingWriteUntil: null,

  setAppointments: (appointments) => set({ appointments }),
  setPersonalAppointments: (personalAppointments) => set({ personalAppointments }),
  setAvailability: (availability) => set({ availability }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setShowBookingModal: (showBookingModal) => set({ showBookingModal }),
  setShowAdminPanel: (showAdminPanel) => set({ showAdminPanel }),
  setShowAvailabilityPanel: (showAvailabilityPanel) =>
    set({ showAvailabilityPanel }),
  setShowAppointmentDetail: (showAppointmentDetail) =>
    set({ showAppointmentDetail }),
  setShowUserAppointments: (showUserAppointments) =>
    set({ showUserAppointments }),
  setSelectedAppointment: (selectedAppointment) =>
    set({ selectedAppointment }),
  setLoading: (loading) => set({ loading }),
  setShowApp: (showApp) => set({ showApp }),
  setPinAccess: (pinAccess) => set({ pinAccess }),
  setShowPinModal: (showPinModal) => set({ showPinModal }),
  setShowManagePinsModal: (showManagePinsModal) => set({ showManagePinsModal }),
  setPendingWriteUntil: (pendingWriteUntil) => set({ pendingWriteUntil }),
}));
