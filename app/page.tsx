"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAppStore } from "@/lib/store";
import { useAppointments, useAvailability, useUserSync } from "@/hooks/useData";
import Calendar from "@/components/Calendar";
import Header from "@/components/Header";
import SplashPage from "@/components/SplashPage";
import BookingModal from "@/components/BookingModal";
import AdminPanel from "@/components/AdminPanel";
import AvailabilityPanel from "@/components/AvailabilityPanel";
import AppointmentDetail from "@/components/AppointmentDetail";
import UserAppointmentsList from "@/components/UserAppointmentsList";
import PinEntryModal from "@/components/PinEntryModal";
import ManagePinsModal from "@/components/ManagePinsModal";
import { Toaster } from "react-hot-toast";

export default function Home() {
  const { isLoaded, user } = useUser();
  const {
    currentMonth,
    showApp,
    showBookingModal,
    showAdminPanel,
    showAvailabilityPanel,
    showAppointmentDetail,
    showUserAppointments,
    showPinModal,
    showManagePinsModal,
    pinAccess,
    loading,
  } = useAppStore();

  const { listenAppointments, listenPersonalAppointments } = useAppointments();
  const { fetchAvailability } = useAvailability();

  // Sync current user to Firebase on sign-in
  useUserSync();

  useEffect(() => {
    if (!isLoaded) return;
    console.log("[TRACE] Setting up listener for all appointments");
    const unsubscribe = listenAppointments();
    return () => {
      console.log("[TRACE] Cleaning up listener for all appointments");
      if (unsubscribe) unsubscribe();
    };
  }, [isLoaded, listenAppointments]);

  // Listen to personal appointments when user is in personal mode
  useEffect(() => {
    if (!isLoaded || !user?.id || pinAccess !== "personal") return;
    const unsubscribe = listenPersonalAppointments(user.id);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLoaded, user?.id, pinAccess, listenPersonalAppointments]);

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

      {showApp ? (
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
      ) : (
        <SplashPage />
      )}

      {showBookingModal && <BookingModal />}
      {showAdminPanel && <AdminPanel />}
      {showAvailabilityPanel && <AvailabilityPanel />}
      {showAppointmentDetail && <AppointmentDetail />}
      {showUserAppointments && <UserAppointmentsList />}
      {showPinModal && <PinEntryModal />}
      {showManagePinsModal && <ManagePinsModal />}
    </div>
  );
}
