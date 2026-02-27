import { NextRequest, NextResponse } from "next/server";
import { deleteById } from "@/lib/firebase-helpers";

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
