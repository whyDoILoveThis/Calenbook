import { NextRequest, NextResponse } from "next/server";
import { storage, BUCKET_ID } from "@/lib/appwrite-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the actual file bytes from Appwrite
    const buffer = await storage.getFileView(BUCKET_ID, id);

    // Determine content type from the file metadata
    let contentType = "image/jpeg";
    try {
      const meta = await storage.getFile(BUCKET_ID, id);
      if (meta.mimeType) contentType = meta.mimeType;
    } catch {
      // Fallback to jpeg if metadata fetch fails
    }

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
