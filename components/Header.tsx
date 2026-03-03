"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import {
  Shield,
  CalendarClock,
  Inbox,
  CalendarOff,
  Calendar,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { isAdmin } from "@/lib/utils";

export default function Header() {
  const { user } = useUser();
  const userIsAdmin = isAdmin(user?.id);
  const {
    showApp,
    setShowApp,
    setShowAdminPanel,
    setShowAvailabilityPanel,
    setSelectedDate,
    setShowUserAppointments,
    setShowPinModal,
    appointments,
    personalAppointments,
    pinAccess,
  } = useAppStore();

  const isPersonalMode = !userIsAdmin && pinAccess === "personal";

  const pendingCount = appointments.filter(
    (apt) => apt.status === "pending",
  ).length;

  const userAppointmentCount = isPersonalMode
    ? personalAppointments.length
    : appointments.filter(
        (apt) => apt.userEmail === user?.primaryEmailAddress?.emailAddress,
      ).length;

  return (
    <header className="flex items-center justify-between px-6 py-4 glass-header">
      <div
        onClick={() => setShowApp(false)}
        className={`flex items-center gap-3 ${showApp ? "cursor-pointer" : "cursor-default"}`}
      >
        <CalendarClock className="w-6 h-6 text-purple-400" />
        <h1 className="text-lg font-light tracking-wider text-white/80">
          Calenbook
        </h1>
        {userIsAdmin && (
          <span className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
            <Shield className="w-3 h-3" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!showApp ? (
          <button
            onClick={() => setShowPinModal(true)}
            className="primary-button px-4 py-2 rounded-xl text-sm font-medium tracking-wide cursor-pointer"
          >
            Try for Free
          </button>
        ) : userIsAdmin ? (
          <>
            {/** */}
            <button
              onClick={() => {
                setSelectedDate(null);
                setShowAdminPanel(true);
              }}
              className="glass-button px-3 py-2 rounded-xl text-sm flex items-center gap-2 relative"
            >
              <Inbox className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs flex items-center justify-center text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAvailabilityPanel(true)}
              className="glass-button px-3 py-2 rounded-xl text-sm flex items-center gap-2"
            >
              <CalendarOff className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              useAppStore.getState().setSelectedDate(null);
              setShowUserAppointments(true);
            }}
            className="glass-button px-3 py-2 rounded-xl text-sm flex items-center gap-2 relative"
          >
            <Calendar className="w-4 h-4" />
            {userAppointmentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs flex items-center justify-center text-white">
                {userAppointmentCount}
              </span>
            )}
          </button>
        )}
        {showApp && (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "glass-panel",
              },
            }}
          />
        )}
      </div>
    </header>
  );
}
