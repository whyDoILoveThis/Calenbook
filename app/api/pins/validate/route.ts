import { NextRequest, NextResponse } from "next/server";
import { getAll } from "@/lib/firebase-helpers";
import { Pin } from "@/lib/types";

// POST validate a pin code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body as { code: string; userId?: string };

    if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { valid: false, error: "Pin must be exactly 4 digits" },
        { status: 400 },
      );
    }

    const all = (await getAll("pins")) as unknown as Pin[];
    const now = Date.now();
    const match = all.find(
      (p) =>
        p.code === code &&
        (p.expiresAt === null || p.expiresAt === undefined || p.expiresAt > now),
    );

    if (match) {
      // If pin is user-specific, check that the requesting user matches
      if (match.forUserId && userId && match.forUserId !== userId) {
        return NextResponse.json({ valid: false, error: "This pin is not assigned to your account" });
      }
      return NextResponse.json({ valid: true });
    }
    return NextResponse.json({ valid: false, error: "Invalid or expired pin" });
  } catch (error: unknown) {
    console.error("Error validating pin:", error);
    return NextResponse.json(
      { valid: false, error: "Validation failed" },
      { status: 500 },
    );
  }
}
