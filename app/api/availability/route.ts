import { NextRequest, NextResponse } from "next/server";
import {
  databases,
  DATABASE_ID,
  AVAILABILITY_COLLECTION_ID,
  ID,
  Query,
} from "@/lib/appwrite-server";

// GET all availability rules
export async function GET() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      AVAILABILITY_COLLECTION_ID,
      [Query.limit(500)]
    );
    return NextResponse.json({ availability: response.documents });
  } catch (error: unknown) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// POST create new availability rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, reason } = body;

    // Check if rule already exists
    const existing = await databases.listDocuments(
      DATABASE_ID,
      AVAILABILITY_COLLECTION_ID,
      [Query.equal("type", type), Query.equal("value", value), Query.limit(1)]
    );

    if (existing.total > 0) {
      return NextResponse.json(
        { error: "This availability rule already exists" },
        { status: 409 }
      );
    }

    const rule = await databases.createDocument(
      DATABASE_ID,
      AVAILABILITY_COLLECTION_ID,
      ID.unique(),
      { type, value, reason }
    );

    return NextResponse.json({ availability: rule }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating availability:", error);
    return NextResponse.json(
      { error: "Failed to create availability rule" },
      { status: 500 }
    );
  }
}
