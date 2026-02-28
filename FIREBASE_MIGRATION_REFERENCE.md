# Firebase Migration Quick Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Frontend (React/Next.js)              │
│   - Calendar, Booking Modal, Admin Panel        │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   Firebase Realtime      Appwrite Storage
   Database (Data)        (Images Only)
   
   - appointments         - Image files
   - availability         - File metadata
```

---

## Database Structure

### Firebase Realtime DB

```
{
  "appointments": {
    "key1": {
      "$id": "key1",
      "$createdAt": 1704067200000,
      "userId": "clerk_user_id",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "date": "2024-01-15",
      "requestedTime": "14:00",
      "arrivalTime": "14:15",
      "finishedTime": "15:45",
      "description": "Need service...",
      "imageIds": ["appwrite_file_id_1", "appwrite_file_id_2"],
      "imageUrls": [
        "https://cloud.appwrite.io/v1/storage/buckets/...",
        "https://cloud.appwrite.io/v1/storage/buckets/..."
      ],
      "status": "approved"
    }
  },
  "availability": {
    "key2": {
      "$id": "key2",
      "$createdAt": 1704067200000,
      "type": "weekday",
      "value": "0",
      "reason": "Weekend closure"
    },
    "key3": {
      "$id": "key3",
      "$createdAt": 1704067200000,
      "type": "specific_date",
      "value": "2024-12-25",
      "reason": "Holiday"
    }
  }
}
```

---

## API Endpoints

### Appointments

#### GET /api/appointments
```
Query params:
- month: "2024-01" (optional)
- status: "pending" | "approved" | "rejected" (optional)

Response:
{
  "appointments": [Appointment[]]
}
```

#### POST /api/appointments
```
FormData:
- userId: string
- userName: string (optional)
- userEmail: string
- date: "YYYY-MM-DD"
- requestedTime: "HH:MM"
- description: string
- images: File[] (optional)

Response:
{
  "appointment": Appointment
}
```

#### PATCH /api/appointments/[id]
```
Body:
{
  "status": "approved" | "rejected",
  "arrivalTime": "HH:MM" (optional),
  "finishedTime": "HH:MM" (optional)
}

Response:
{
  "appointment": Appointment
}
```

#### DELETE /api/appointments/[id]
```
Query params:
- userId: string

Response:
{
  "success": true
}
```

---

### Availability

#### GET /api/availability
```
Response:
{
  "availability": [Availability[]]
}
```

#### POST /api/availability
```
Body:
{
  "type": "weekday" | "specific_date",
  "value": "0-6" | "YYYY-MM-DD",
  "reason": string (optional)
}

Response:
{
  "availability": Availability
}
```

#### DELETE /api/availability/[id]
```
Response:
{
  "success": true
}
```

---

## Key Data Types

```typescript
interface Appointment {
  $id: string;
  $createdAt: number;  // milliseconds
  userId: string;
  userName?: string;
  userEmail: string;
  date: string;  // "YYYY-MM-DD"
  requestedTime: string;  // "HH:MM" (24-hour)
  arrivalTime: string | null;
  finishedTime: string | null;
  description: string;
  imageIds: string[];  // Appwrite file IDs
  imageUrls: string[];  // Appwrite preview URLs
  status: "pending" | "approved" | "rejected";
}

interface Availability {
  $id: string;
  $createdAt: number;  // milliseconds
  type: "weekday" | "specific_date";
  value: string;  // "0"-"6" or "YYYY-MM-DD"
  reason: string;
}
```

---

## Common Tasks

### Add an Appointment
```typescript
const formData = new FormData();
formData.append("userId", user.id);
formData.append("userEmail", user.emailAddresses[0].emailAddress);
formData.append("date", "2024-01-15");
formData.append("requestedTime", "14:00");
formData.append("description", "Service needed");
formData.append("images", imageFile);

const res = await fetch("/api/appointments", {
  method: "POST",
  body: formData
});
```

### Get All Appointments for a Month
```typescript
const res = await fetch("/api/appointments?month=2024-01");
const data = await res.json();
console.log(data.appointments);
```

### Approve an Appointment
```typescript
const res = await fetch(`/api/appointments/${id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    status: "approved",
    arrivalTime: "14:15",
    finishedTime: "15:45"
  })
});
```

### Block a Weekday
```typescript
const res = await fetch("/api/availability", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "weekday",
    value: "0",  // Sunday
    reason: "Closed on weekends"
  })
});
```

---

## Firebase Realtime Database Rules

**For Production**, add security rules to Firebase Console:

```json
{
  "rules": {
    "appointments": {
      ".read": true,
      ".write": "root.child('admin_ids').child(auth.uid).exists()",
      "$uid": {
        ".write": "$uid === auth.uid || root.child('admin_ids').child(auth.uid).exists()",
        ".read": "$uid === auth.uid || root.child('admin_ids').child(auth.uid).exists() || true"
      }
    },
    "availability": {
      ".read": true,
      ".write": "root.child('admin_ids').child(auth.uid).exists()"
    },
    "admin_ids": {
      ".read": false,
      ".write": false
    }
  }
}
```

---

## Troubleshooting

### Images not displaying
- Check Appwrite storage bucket ID is correct
- Verify `NEXT_PUBLIC_APPWRITE_ENDPOINT` is set
- Check CORS settings in Appwrite storage

### Appointments not saving
- Verify Firebase Realtime Database URL is correct
- Check Firebase authentication rules
- Monitor Firebase console for write errors

### Time conflicts not detected
- Ensure `arrivalTime` and `finishedTime` are in "HH:MM" format
- Check that appointment date matches

### Availability rules not blocking dates
- Verify `type` is either "weekday" or "specific_date"
- For weekdays: value should be "0"-"6" (0=Sunday)
- For dates: value should be "YYYY-MM-DD"

---

## Performance Notes

- Firebase Realtime DB is fast for read-heavy operations
- Appwrite Storage provides reliable image hosting
- Consider adding indexes for large datasets
- Cache appointment data on client when possible

