import { NextRequest, NextResponse } from "next/server";
import { getAll, createWithAutoId } from "@/lib/firebase-helpers";
import { Availability } from "@/lib/types";

// GET all availability rules
export async function GET() {
  try {
    const availability = await getAll("availability");
    return NextResponse.json({ availability });
  } catch (error: unknown) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { availability: [] },
      { status: 200 }
    );
  }
}

// POST create new availability rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, reason } = body;

        // Check if rule already exists
    const all = await getAll("availability");
    if ((all as Availability[])
        .some((rule) => rule.type === type && rule.value === value)) {
      return NextResponse.json(
        { error: "This availability rule already exists" },
        { status: 409 }
      );
    }

    const ruleData = { createdAt: Date.now(), type, value, reason };
    const rule = await createWithAutoId("availability", ruleData);
    // Add $id to response only (not saved in Firebase)
    return NextResponse.json({ availability: { ...ruleData, $id: rule.$id || "" } }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating availability:", error);
    return NextResponse.json(
      { error: "Failed to create availability rule" },
      { status: 500 }
    );
  }
}
