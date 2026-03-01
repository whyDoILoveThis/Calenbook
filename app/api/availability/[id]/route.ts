import { NextRequest, NextResponse } from "next/server";
import { deleteById, updateById } from "@/lib/firebase-helpers";

// PATCH update availability rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { startTime, endTime, isClosed, reason } = body;

    const updates: Record<string, unknown> = {};
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (isClosed !== undefined) updates.isClosed = isClosed;
    if (reason !== undefined) updates.reason = reason;

    await updateById("availability", id, updates);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability rule" },
      { status: 500 }
    );
  }
}

// DELETE availability rule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteById("availability", id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: "Failed to delete availability rule" },
      { status: 500 }
    );
  }
}
