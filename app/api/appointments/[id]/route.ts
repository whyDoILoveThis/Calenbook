import { NextRequest, NextResponse } from "next/server";
import { getById, getAll, updateById, deleteById } from "@/lib/firebase-helpers";
import { isTimeConflict, isAdmin } from "@/lib/utils";
import { Appointment } from "@/lib/types";

// PATCH update appointment (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, arrivalTime, finishedTime } = body;
    console.log("[API] PATCH /api/appointments/" + id + " body:", body);

    // If approving, check for time conflicts
    if (status === "approved" && arrivalTime && finishedTime) {
      // Get the appointment being approved to know the date
const appointment = await getById("appointments", id) as Appointment | null;
      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }
            // Get all approved appointments on the same date
      const all = await getAll("appointments");
      const existing = (all as Appointment[])
        .filter((doc) => doc.date === appointment.date && doc.status === "approved" && doc.$id !== id);
      // Check for conflicts
      for (const doc of existing) {
        if (doc.arrivalTime && doc.finishedTime) {
          if (
            isTimeConflict(
              arrivalTime,
              finishedTime,
              doc.arrivalTime,
              doc.finishedTime
            )
          ) {
            return NextResponse.json(
              {
                error: `Time conflict with existing appointment (${doc.arrivalTime} - ${doc.finishedTime}). Please select a different time.`,
              },
              { status: 409 }
            );
          }
        }
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (arrivalTime) updateData.arrivalTime = arrivalTime;
    if (finishedTime) updateData.finishedTime = finishedTime;

    console.log("[API] PATCH updateData:", updateData);

    await updateById("appointments", id, updateData);
    let updated = await getById("appointments", id);
    if (updated) {
      updated = { ...updated, $id: id };
    }
    console.log("[API] PATCH updated record:", updated);
    return NextResponse.json({ appointment: updated });
  } catch (error: unknown) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Fetch the appointment to check ownership
const appointment = await getById("appointments", id) as Appointment | null;
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    // Only the owner or admin can delete
if (!isAdmin(userId ?? undefined) && appointment.userId !== userId) {
        return NextResponse.json(
        { error: "You can only delete your own appointments" },
        { status: 403 }
      );
    }

    await deleteById("appointments", id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
