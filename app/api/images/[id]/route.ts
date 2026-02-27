import { NextRequest, NextResponse } from "next/server";
import { storage, BUCKET_ID } from "@/lib/appwrite-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = storage.getFilePreview(BUCKET_ID, id);
    return NextResponse.redirect(result.toString());
  } catch (error: unknown) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
