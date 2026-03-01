"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { useAppStore } from "@/lib/store";
import { useAppointments, useAvailability } from "@/hooks/useData";
import Calendar from "@/components/Calendar";
import Header from "@/components/Header";
import BookingModal from "@/components/BookingModal";
import AdminPanel from "@/components/AdminPanel";
import AvailabilityPanel from "@/components/AvailabilityPanel";
import AppointmentDetail from "@/components/AppointmentDetail";
import { Toaster } from "react-hot-toast";

export default function Home() {
  const { isLoaded } = useUser();
  const {
    currentMonth,
    showBookingModal,
    showAdminPanel,
    showAvailabilityPanel,
    showAppointmentDetail,
    loading,
  } = useAppStore();

  const { listenAppointments } = useAppointments();
  const { fetchAvailability } = useAvailability();

  useEffect(() => {
    if (!isLoaded) return;
    const monthStr = format(currentMonth, "yyyy-MM");
    console.log("[TRACE] Setting up listener for month:", monthStr);
    const unsubscribe = listenAppointments(monthStr);
    return () => {
      console.log("[TRACE] Cleaning up listener for month:", monthStr);
      if (unsubscribe) unsubscribe();
    };
  }, [isLoaded, currentMonth, listenAppointments]);

  useEffect(() => {
    if (isLoaded) {
      fetchAvailability();
    }
  }, [isLoaded, fetchAvailability]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(15, 23, 42, 0.9)",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            borderRadius: "12px",
          },
        }}
      />

      <Header />

      <main className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
            <div className="glass-button px-4 py-1.5 rounded-full text-xs text-white/50 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              Loading...
            </div>
          </div>
        )}
        <Calendar />
      </main>

      {showBookingModal && <BookingModal />}
      {showAdminPanel && <AdminPanel />}
      {showAvailabilityPanel && <AvailabilityPanel />}
      {showAppointmentDetail && <AppointmentDetail />}
    </div>
  );
}
