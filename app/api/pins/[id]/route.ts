import { NextRequest, NextResponse } from "next/server";
import { deleteById } from "@/lib/firebase-helpers";

// DELETE a pin by ID
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteById("pins", id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting pin:", error);
    return NextResponse.json(
      { error: "Failed to delete pin" },
      { status: 500 },
    );
  }
}
