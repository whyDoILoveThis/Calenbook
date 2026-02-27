import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push } from "firebase/database";
// Removed unused appwrite-server imports; dynamic import for InputFile and ID is done in POST

// GET all appointments (optionally filter by month)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const status = searchParams.get("status");

    const appointmentsRef = ref(db, "appointments");
    const snapshot = await get(appointmentsRef);
    let appointments: Record<string, unknown>[] = [];
    if (snapshot.exists()) {
      appointments = Object.values(snapshot.val());
    }

    // Filter by month and status if needed
    let filtered = appointments;
    if (month) {
      filtered = filtered.filter((apt) => {
        const date = (apt as Record<string, unknown>).date;
        return typeof date === "string" && date.startsWith(month);
      });
    }
    if (status) {
      filtered = filtered.filter((apt) => apt.status === status);
    }
    filtered = filtered.sort((a, b) => Number(b.$createdAt || 0) - Number(a.$createdAt || 0));

    return NextResponse.json({ appointments: filtered });
  } catch (error: unknown) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST create new appointment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const userName = (formData.get("userName") as string) || undefined;
    const userEmail = formData.get("userEmail") as string;
    const date = formData.get("date") as string;
    const requestedTime = formData.get("requestedTime") as string;
    const description = formData.get("description") as string;
    // Images: upload to Appwrite, store fileId and preview URL in Firebase
    const { storage, BUCKET_ID } = await import("@/lib/appwrite-server");
    const images = formData.getAll("images") as File[];
    const imageIds: string[] = [];
    const imageUrls: string[] = [];
    for (const image of images) {
      if (image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const { InputFile, ID } = await import("@/lib/appwrite-server");
        const file = InputFile.fromBuffer(buffer, image.name || "upload.jpg");
        const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
        imageIds.push(uploaded.$id);
        // Build preview URL for Appwrite file
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        const url = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/preview?project=${projectId}&width=400`;
        imageUrls.push(url);
      }
    }

    // Check if the date falls on an unavailable day
    const availRef = ref(db, "availability");
    const availSnap = await get(availRef);
    let isUnavailable = false;
    if (availSnap.exists()) {
      const rules = Object.values(availSnap.val()) as { type: string; value: string }[];
      const appointmentDate = new Date(date + "T00:00:00");
      const dayOfWeek = appointmentDate.getDay();
      isUnavailable = rules.some((rule) => {
        if (rule.type === "specific_date" && rule.value === date) return true;
        if (rule.type === "weekday" && parseInt(rule.value) === dayOfWeek) return true;
        return false;
      });
    }
    if (isUnavailable) {
      return NextResponse.json(
        { error: "This date is unavailable for appointments" },
        { status: 400 }
      );
    }

    // Create appointment
    const newRef = push(ref(db, "appointments"));
    const appointment = {
      $id: newRef.key,
      $createdAt: Date.now(),
      userId,
      ...(userName ? { userName } : {}),
      userEmail,
      date,
      requestedTime,
      arrivalTime: null,
      finishedTime: null,
      description,
      imageIds,
      imageUrls,
      status: "pending",
    };
    await set(newRef, appointment);

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
