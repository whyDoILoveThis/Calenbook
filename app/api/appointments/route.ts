import { NextRequest, NextResponse } from "next/server";
import {
  databases,
  storage,
  DATABASE_ID,
  APPOINTMENTS_COLLECTION_ID,
  AVAILABILITY_COLLECTION_ID,
  BUCKET_ID,
  ID,
  Query,
  InputFile,
} from "@/lib/appwrite-server";

// GET all appointments (optionally filter by month)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const status = searchParams.get("status");

    const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(500)];

    if (month) {
      const startDate = `${month}-01`;
      const endMonth = parseInt(month.split("-")[1]);
      const year = parseInt(month.split("-")[0]);
      const nextMonth = endMonth === 12 ? 1 : endMonth + 1;
      const nextYear = endMonth === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
      queries.push(Query.greaterThanEqual("date", startDate));
      queries.push(Query.lessThan("date", endDate));
    }

    if (status) {
      queries.push(Query.equal("status", status));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      queries
    );

    return NextResponse.json({ appointments: response.documents });
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
    const images = formData.getAll("images") as File[];

    // Check if the date falls on an unavailable day
    const appointmentDate = new Date(date + "T00:00:00");
    const dayOfWeek = appointmentDate.getDay(); // 0=Sun, 6=Sat

    const availRules = await databases.listDocuments(
      DATABASE_ID,
      AVAILABILITY_COLLECTION_ID,
      [Query.limit(500)]
    );

    const isUnavailable = availRules.documents.some((rule) => {
      if (rule.type === "specific_date" && rule.value === date) return true;
      if (rule.type === "weekday" && parseInt(rule.value) === dayOfWeek) return true;
      return false;
    });

    if (isUnavailable) {
      return NextResponse.json(
        { error: "This date is unavailable for appointments" },
        { status: 400 }
      );
    }

    // Upload images
    const imageIds: string[] = [];
    for (const image of images) {
      if (image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const file = InputFile.fromBuffer(buffer, image.name || "upload.jpg");
        const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
        imageIds.push(uploaded.$id);
      }
    }

    const appointment = await databases.createDocument(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        ...(userName ? { userName } : {}),
        userEmail,
        date,
        requestedTime,
        arrivalTime: null,
        finishedTime: null,
        description,
        imageIds,
        status: "pending",
      }
    );

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
