import { NextRequest, NextResponse } from "next/server";
import {
  databases,
  DATABASE_ID,
  AVAILABILITY_COLLECTION_ID,
} from "@/lib/appwrite-server";

// DELETE availability rule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await databases.deleteDocument(
      DATABASE_ID,
      AVAILABILITY_COLLECTION_ID,
      id
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: "Failed to delete availability rule" },
      { status: 500 }
    );
  }
}
