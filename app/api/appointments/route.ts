import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push } from "firebase/database";
import { getAll } from "@/lib/firebase-helpers";
import { storage, BUCKET_ID, ID, InputFile } from "@/lib/appwrite-server";
import { Appointment } from "@/lib/types";

// GET all appointments (optionally filter by month)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const status = searchParams.get("status");

    // Use helper to ensure $id and createdAt normalization
    let appointments = (await getAll("appointments")) as Appointment[];

    // Filter by month and status if needed
    if (month) {
      appointments = appointments.filter((apt) => {
        return apt.date.startsWith(month);
      });
    }
    if (status) {
      appointments = appointments.filter((apt) => apt.status === status);
    }

    // Sort by $createdAt (normalized by helper)
    appointments = appointments.sort((a: Appointment, b: Appointment) =>
      Number(b.$createdAt ?? 0) - Number(a.$createdAt ?? 0),
    );

    return NextResponse.json({ appointments });
  } catch (error: unknown) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ appointments: [] }, { status: 200 });
  }
}

// POST create new appointment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // pull the required fields with the expected types
    const userId = formData.get("userId") as string;
    const userName = (formData.get("userName") as string) || undefined;
    const userEmail = formData.get("userEmail") as string;
    const date = formData.get("date") as string;
    const requestedTime = formData.get("requestedTime") as string;
    const description = formData.get("description") as string;
    const color = (formData.get("color") as string) || "#60A5FA"; // default blue
    const mode = formData.get("mode") as string | null; // "personal" or null

    // Images: upload to Appwrite, store fileId and view URL in Firebase
    const images = (formData.getAll("images") as unknown) as File[];
    const imageIds: string[] = [];
    const imageUrls: string[] = [];

    let uploadFailed = false;
    for (const image of images) {
      if (image.size > 0) {
        try {
          const buffer = Buffer.from(await image.arrayBuffer());
          const file = InputFile.fromBuffer(buffer, image.name || "upload.jpg");
          const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
          imageIds.push(uploaded.$id);
          // Use proxy URL so Appwrite endpoint is never exposed to clients
          imageUrls.push(`/api/images/${uploaded.$id}`);
        } catch (err) {
          console.error("Image upload failed:", err);
          // don't abort; we'll still create the appointment but record a warning
          uploadFailed = true;
          // skip this image
          continue;
        }
      }
    }

    // Personal mode: write to personal-appointments/{userId}/, auto-approve, skip availability
    if (mode === "personal") {
      const newRef = push(ref(db, `personal-appointments/${userId}`));
      const appointment = {
        createdAt: Date.now(),
        userId,
        ...(userName ? { userName } : {}),
        userEmail,
        date,
        requestedTime,
        arrivalTime: requestedTime,
        finishedTime: null,
        description,
        color,
        imageIds,
        imageUrls,
        status: "approved",
      };
      await set(newRef, appointment);

      const resp: { appointment: typeof appointment & { $id: string }, warning?: string } = { appointment: { ...appointment, $id: newRef.key! } };
      if (uploadFailed) {
        resp.warning = "Some images could not be uploaded. You can add them later.";
      }
      return NextResponse.json(resp, { status: 201 });
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
      createdAt: Date.now(),
      userId,
      ...(userName ? { userName } : {}),
      userEmail,
      date,
      requestedTime,
      arrivalTime: null,
      finishedTime: null,
      description,
      color,
      imageIds,
      imageUrls,
      status: "pending",
    };
    await set(newRef, appointment);

    // Add $id to response only (not saved in Firebase)
    const resp: { appointment: typeof appointment & { $id: string }, warning?: string } = { appointment: { ...appointment, $id: newRef.key } };
    if (uploadFailed) {
      resp.warning = "Some images could not be uploaded. You can add them later.";
    }
    return NextResponse.json(resp, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
