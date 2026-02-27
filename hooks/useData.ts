"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Appointment, Availability } from "@/lib/types";
import toast from "react-hot-toast";

export function useAppointments() {
  const { setAppointments, setLoading } = useAppStore();

  const fetchAppointments = useCallback(
    async (month?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (month) params.set("month", month);
        const res = await fetch(`/api/appointments?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Could not load appointments");
          return;
        }
        if (data.appointments) {
          setAppointments(data.appointments as Appointment[]);
        }
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        toast.error("Network error — could not load appointments");
      } finally {
        setLoading(false);
      }
    },
    [setAppointments, setLoading]
  );

  const createAppointment = useCallback(
    async (formData: FormData): Promise<boolean> => {
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create appointment");
        }
        return true;
      } catch (error) {
        console.error("Failed to create appointment:", error);
        throw error;
      }
    },
    []
  );

  const updateAppointment = useCallback(
    async (
      id: string,
      data: { status: string; arrivalTime?: string; finishedTime?: string }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/appointments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) {
          return { success: false, error: result.error };
        }
        return { success: true };
      } catch (error) {
        console.error("Failed to update appointment:", error);
        return { success: false, error: "Network error" };
      }
    },
    []
  );

  const deleteAppointment = useCallback(async (id: string, userId: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}?userId=${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      throw error;
    }
  }, []);

  return {
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}

export function useAvailability() {
  const { setAvailability } = useAppStore();

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/availability");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not load availability");
        return;
      }
      if (data.availability) {
        setAvailability(data.availability as Availability[]);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
      toast.error("Network error — could not load availability");
    }
  }, [setAvailability]);

  const createAvailability = useCallback(
    async (data: {
      type: string;
      value: string;
      reason: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.error || "Failed to create rule");
        }
        return true;
      } catch (error) {
        console.error("Failed to create availability:", error);
        throw error;
      }
    },
    []
  );

  const deleteAvailability = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove rule");
      }
    } catch (error) {
      console.error("Failed to delete availability:", error);
      throw error;
    }
  }, []);

  return { fetchAvailability, createAvailability, deleteAvailability };
}
