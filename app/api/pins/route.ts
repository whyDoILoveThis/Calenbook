import { NextRequest, NextResponse } from "next/server";
import { getAll, createWithAutoId } from "@/lib/firebase-helpers";
import { Pin } from "@/lib/types";

// GET all pins
export async function GET() {
  try {
    const pins = (await getAll("pins")) as unknown as Pin[];
    // Filter out expired pins automatically
    const now = Date.now();
    const active = pins.filter(
      (p) => p.expiresAt === null || p.expiresAt === undefined || p.expiresAt > now,
    );
    return NextResponse.json({ pins: active });
  } catch (error: unknown) {
    console.error("Error fetching pins:", error);
    return NextResponse.json({ pins: [] }, { status: 200 });
  }
}

// POST create new pin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, expiresAt, label, forUserId, forUserEmail, forUserName } = body as {
      code: string;
      expiresAt: number | null;
      label?: string;
      forUserId?: string;
      forUserEmail?: string;
      forUserName?: string;
    };

    if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { error: "Pin must be exactly 4 digits" },
        { status: 400 },
      );
    }

    // Check for duplicate active pin
    const all = (await getAll("pins")) as unknown as Pin[];
    const now = Date.now();
    const duplicate = all.find(
      (p) =>
        p.code === code &&
        (p.expiresAt === null || p.expiresAt === undefined || p.expiresAt > now),
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "An active pin with this code already exists" },
        { status: 409 },
      );
    }

    const pinData: Record<string, unknown> = {
      code,
      createdAt: Date.now(),
      expiresAt: expiresAt ?? null,
      label: label || "",
      ...(forUserId ? { forUserId, forUserEmail: forUserEmail || "", forUserName: forUserName || "" } : {}),
    };

    const result = await createWithAutoId("pins", pinData);
    return NextResponse.json(
      { pin: { ...pinData, $id: result.$id || "" } },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating pin:", error);
    return NextResponse.json(
      { error: "Failed to create pin" },
      { status: 500 },
    );
  }
}
