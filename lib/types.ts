export interface Appointment {
  $id: string;
  $createdAt: number; // Timestamp in milliseconds
  userId: string;
  userName?: string;
  userEmail: string;
  date: string; // ISO date string YYYY-MM-DD
  requestedTime: string; // HH:MM requested arrival
  arrivalTime: string | null; // HH:MM set by admin on approval
  finishedTime: string | null; // HH:MM set by admin on approval
  description: string;
  imageIds: string[]; // file IDs in Appwrite storage
  imageUrls: string[]; // Preview URLs for images
  status: "pending" | "approved" | "rejected";
}

export interface Availability {
  $id: string;
  $createdAt: number; // Timestamp in milliseconds
  type: "weekday" | "specific_date" | "weekly_hours" | "date_override";
  value: string; // "0"-"6" for weekday/weekly_hours (0=Sun), or "YYYY-MM-DD" for specific/date_override
  reason: string;
  startTime?: string; // HH:MM — opening time (for weekly_hours / date_override)
  endTime?: string;   // HH:MM — closing time (for weekly_hours / date_override)
  isClosed?: boolean; // true = closed that day entirely
}

export interface AppointmentFormData {
  date: string;
  requestedTime: string;
  description: string;
  images: File[];
}

export interface AdminApprovalData {
  arrivalTime: string;
  finishedTime: string;
}
