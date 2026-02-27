export interface Appointment {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  userName?: string;
  userEmail: string;
  date: string; // ISO date string YYYY-MM-DD
  requestedTime: string; // HH:MM requested arrival
  arrivalTime: string | null; // HH:MM set by admin on approval
  finishedTime: string | null; // HH:MM set by admin on approval
  description: string;
  imageIds: string[]; // file IDs in Appwrite storage
  status: "pending" | "approved" | "rejected";
}

export interface Availability {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  type: "weekday" | "specific_date";
  value: string; // "0"-"6" for weekday (0=Sun), or "YYYY-MM-DD" for specific
  reason: string;
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
