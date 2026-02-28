"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Appointment, Availability } from "@/lib/types";
import toast from "react-hot-toast";
import type { DataSnapshot } from "firebase/database";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";

export function useAppointments() {
  const { setAppointments, setLoading } = useAppStore();

  // Realtime listener for appointments
  const listenAppointments = useCallback((month?: string) => {
    setLoading(true);
    const dbRef = ref(db, "appointments");
    const callback = (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      const raw = snapshot.val();
      const appointments = Object.entries(raw || {}).map(([key, value]) => ({ ...(value as Record<string, unknown>), $id: key })) as unknown[];

      const normalizeStatus = (s: unknown) =>
        s === "approved" || s === "rejected" || s === "pending" ? (s as Appointment["status"]) : "pending";

      const normalized = appointments.map((a) => {
        const o = a as Record<string, unknown>;
        return {
          $id: String(o["$id"] ?? o["id"] ?? ""),
          $createdAt: Number(o["$createdAt"] ?? o["createdAt"] ?? 0),
          userId: String(o["userId"] ?? ""),
          userName: typeof o["userName"] === "string" ? String(o["userName"]) : undefined,
          userEmail: String(o["userEmail"] ?? ""),
          date: String(o["date"] ?? ""),
          requestedTime: String(o["requestedTime"] ?? ""),
          arrivalTime: o["arrivalTime"] === null ? null : String(o["arrivalTime"] ?? ""),
          finishedTime: o["finishedTime"] === null ? null : String(o["finishedTime"] ?? ""),
          description: String(o["description"] ?? ""),
          imageIds: Array.isArray(o["imageIds"]) ? (o["imageIds"] as string[]) : [],
          imageUrls: Array.isArray(o["imageUrls"]) ? (o["imageUrls"] as string[]) : [],
          status: normalizeStatus(o["status"]),
        } as Appointment;
      });

      // Filter by month if provided
      let filtered = normalized;
      if (month) {
        filtered = filtered.filter((apt) => apt.date.startsWith(month));
      }

      const createdAtValue = (obj: unknown) => {
        const o = obj as Record<string, unknown>;
        const c = o["createdAt"] ?? o["$createdAt"] ?? 0;
        return Number(c as number) || 0;
      };

      filtered = filtered.sort((a, b) => createdAtValue(b) - createdAtValue(a));

      setAppointments(filtered as Appointment[]);
      setLoading(false);
    };

    onValue(dbRef, callback);
    // Return unsubscribe function
    return () => off(dbRef, "value", callback);
  }, [setAppointments, setLoading]);

  // Keep fetchAppointments for manual fetch (legacy)
  const fetchAppointments = useCallback(
    async (month?: string) => {
      console.log("[TRACE] fetchAppointments called", { month });
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (month) params.set("month", month);
        console.log("[TRACE] Fetching /api/appointments", params.toString());
            const res = await fetch(`/api/appointments?${params.toString()}`);
            console.log("[TRACE] Response status:", res.status);
            type AppListResp = { appointments?: unknown[]; error?: string };
            const data = (await res.json().catch(() => ({}))) as AppListResp;
            console.log("[TRACE] Response data:", data);
            if (!res.ok) {
              console.error("[TRACE] Appointments fetch error:", data.error);
              toast.error(data.error || "Could not load appointments");
              return;
            }
            if (data.appointments) {
              console.log("[TRACE] Setting appointments:", data.appointments);
              const normalizeStatus = (s: unknown) =>
                s === "approved" || s === "rejected" || s === "pending" ? (s as Appointment["status"]) : "pending";
              const normalized = (data.appointments || []).map((a) => {
                const o = a as Record<string, unknown>;
                return {
                  $id: String(o["$id"] ?? o["id"] ?? ""),
                  $createdAt: Number(o["$createdAt"] ?? o["createdAt"] ?? 0),
                  userId: String(o["userId"] ?? ""),
                  userName: typeof o["userName"] === "string" ? String(o["userName"]) : undefined,
                  userEmail: String(o["userEmail"] ?? ""),
                  date: String(o["date"] ?? ""),
                  requestedTime: String(o["requestedTime"] ?? ""),
                  arrivalTime: o["arrivalTime"] === null ? null : String(o["arrivalTime"] ?? ""),
                  finishedTime: o["finishedTime"] === null ? null : String(o["finishedTime"] ?? ""),
                  description: String(o["description"] ?? ""),
                  imageIds: Array.isArray(o["imageIds"]) ? (o["imageIds"] as string[]) : [],
                  imageUrls: Array.isArray(o["imageUrls"]) ? (o["imageUrls"] as string[]) : [],
                  status: normalizeStatus(o["status"]),
                } as Appointment;
              });
              setAppointments(normalized);
            } else {
              console.log("[TRACE] No appointments found, setting empty array.");
              setAppointments([]);
            }
      } catch (error) {
        console.error("[TRACE] Failed to fetch appointments:", error);
        toast.error("Network error — could not load appointments");
      } finally {
        console.log("[TRACE] Stopping loading state (appointments)");
        setLoading(false);
      }
    },
    [setAppointments, setLoading]
  );

  const createAppointment = useCallback(
    async (formData: FormData): Promise<{ success: boolean; warning?: string }> => {
      try {
          const res = await fetch("/api/appointments", {
            method: "POST",
            body: formData,
          });
          type CreateResp = { warning?: string; appointment?: Appointment; error?: string };
          const data = (await res.json().catch(() => ({}))) as CreateResp;
          if (!res.ok) {
            throw new Error(data.error || "Failed to create appointment");
          }
          return { success: true, warning: data.warning };
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
          type UpdateResp = { appointment?: Appointment; error?: string };
          const result = (await res.json().catch(() => ({}))) as UpdateResp;
          console.log("[TRACE] updateAppointment response:", res.status, result);
          if (!res.ok) {
            return { success: false, error: result.error };
          }
        // Optimistically update local store so UI reflects change immediately
        try {
          const state = useAppStore.getState();
          const current = state.appointments || [];
          const normalizeStatus = (s: unknown) =>
            s === "approved" || s === "rejected" || s === "pending" ? (s as Appointment["status"]) : "pending";
          const updated = current.map((apt) => {
            if (apt.$id !== id) return apt;
            const incoming = ((result.appointment as unknown) as Record<string, unknown>) || (data as Record<string, unknown>);
            const merged: Appointment = {
              ...apt,
              status: normalizeStatus(incoming.status ?? apt.status),
              arrivalTime: incoming.arrivalTime === null ? null : (String(incoming.arrivalTime ?? apt.arrivalTime)),
              finishedTime: incoming.finishedTime === null ? null : (String(incoming.finishedTime ?? apt.finishedTime)),
            };
            return merged;
          });
          state.setAppointments(updated);
        } catch (e) {
          console.warn("[TRACE] Failed to optimistically update appointments:", e);
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
    listenAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}

export function useAvailability() {
  const { setAvailability, setLoading } = useAppStore();

  const fetchAvailability = useCallback(async () => {
    console.log("[TRACE] fetchAvailability called");
    setLoading(true);
    try {
      console.log("[TRACE] Fetching /api/availability");
      const res = await fetch("/api/availability");
      console.log("[TRACE] Response status:", res.status);
      const data = await res.json();
      console.log("[TRACE] Response data:", data);
      if (!res.ok) {
        console.error("[TRACE] Availability fetch error:", data.error);
        toast.error(data.error || "Could not load availability");
        return;
      }
      if (data.availability) {
        console.log("[TRACE] Setting availability:", data.availability);
        setAvailability(data.availability as Availability[]);
      } else {
        console.log("[TRACE] No availability found, setting empty array.");
        setAvailability([]);
      }
    } catch (error) {
      console.error("[TRACE] Failed to fetch availability:", error);
      toast.error("Network error — could not load availability");
    } finally {
      console.log("[TRACE] Stopping loading state (availability)");
      setLoading(false);
    }
  }, [setAvailability, setLoading]);

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
