# Calenbook — Appointment Booking System

A modern, fullscreen calendar-based appointment booking system with a glass-morphism UI. Built with **Next.js 16**, **Appwrite**, **Clerk**, **Tailwind CSS 4**, and **Zustand**.

## Features

- **Fullscreen Calendar** — Monthly view with day navigation, responsive grid, and status-colored appointment dots
- **Appointment Booking** — Users tap a day to request an appointment: select an arrival time, add a description, and upload reference images
- **Admin CMS** — Admin reviews pending requests, approves (with arrival + finish time) or rejects them
- **Time Conflict Detection** — Server-side validation prevents overlapping approved appointments on the same date
- **Availability Management** — Admin blocks recurring weekdays or specific dates; blocked days appear red on the calendar
- **Clerk Auth** — Full sign-in/sign-up flow; admin role determined by user ID
- **Glass UI** — Dark theme with blur, transparency, radial gradients, animated modals, custom scrollbars, and glowing accent dots

### Appointment Status Dots

| Dot Color | Meaning                           |
| --------- | --------------------------------- |
| Grey      | Pending — awaiting admin approval |
| Green     | Approved                          |
| Red       | Rejected                          |

### Calendar Day Colors

| Color          | Meaning                    |
| -------------- | -------------------------- |
| Default (dark) | Available for booking      |
| Red tint       | Unavailable (set by admin) |
| Purple ring    | Today                      |

---

## Prerequisites

- [Node.js](https://nodejs.org) v20+
- A [Clerk](https://clerk.com) account
- An [Appwrite](https://appwrite.io) account (Cloud or self-hosted)

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd calenbook
npm install
```

### 2. Clerk

1. Create a new application at [clerk.com](https://clerk.com)
2. From the **API Keys** page, copy your **Publishable Key** and **Secret Key**
3. Paste them into `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Appwrite

1. Create a project at [cloud.appwrite.io](https://cloud.appwrite.io) (or your self-hosted instance)
2. Copy your **Project ID** and set it in `.env.local`
3. Generate an **API Key** with full database + storage scopes and set it in `.env.local`

#### Create a Database

Create a database and copy its ID into `NEXT_PUBLIC_APPWRITE_DATABASE_ID`.

#### Create the Appointments Collection

Create a collection and copy its ID into `NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID`. Add these attributes:

| Attribute       | Type   | Size | Required | Array |
| --------------- | ------ | ---- | -------- | ----- |
| `userId`        | String | 255  | Yes      | No    |
| `userName`      | String | 255  | No       | No    |
| `userEmail`     | String | 320  | Yes      | No    |
| `date`          | String | 10   | Yes      | No    |
| `requestedTime` | String | 5    | Yes      | No    |
| `arrivalTime`   | String | 5    | No       | No    |
| `finishedTime`  | String | 5    | No       | No    |
| `description`   | String | 5000 | Yes      | No    |
| `imageIds`      | String | 255  | No       | Yes   |
| `status`        | String | 20   | Yes      | No    |

Then create two **indexes** (these make queries faster — like adding a sorted column in a spreadsheet so the database doesn't have to scan every row):

1. In your Appointments collection, go to the **Indexes** tab
2. Click **Create Index** and fill in:
   - **Index Key**: `date_index`
   - **Type**: Key
   - **Attributes**: select `date` from the dropdown
   - Click **Create**
3. Click **Create Index** again:
   - **Index Key**: `status_index`
   - **Type**: Key
   - **Attributes**: select `status` from the dropdown
   - Click **Create**

> **What are indexes?** When the app fetches appointments for a specific month, it filters by `date`. Without an index, Appwrite would check every single document in the collection. With an index, it jumps straight to the matching documents — the same way a book index lets you jump to the right page instead of reading every page. The `status` index does the same thing when filtering by pending/approved/rejected.

#### Create the Availability Collection

Create a collection and copy its ID into `NEXT_PUBLIC_APPWRITE_AVAILABILITY_COLLECTION_ID`. Add these attributes:

| Attribute | Type   | Size | Required |
| --------- | ------ | ---- | -------- |
| `type`    | String | 20   | Yes      |
| `value`   | String | 10   | Yes      |
| `reason`  | String | 255  | No       |

#### Create a Storage Bucket

1. Create a bucket for image uploads
2. Copy its ID into `NEXT_PUBLIC_APPWRITE_BUCKET_ID`
3. Recommended: set max file size to 10 MB, allow extensions `jpg, jpeg, png, gif, webp, svg, bmp, tiff, tif, ico, heic, heif, avif`

#### Set Permissions

For **both collections** and the **storage bucket**, add these permissions:

- **Any** — Read, Create, Update, Delete

> You can tighten these later with Appwrite Functions for admin-only write operations.

### 4. Admin User

1. Start the app and sign up with the account you want to be admin
2. Go to [Clerk Dashboard → Users](https://dashboard.clerk.com) and copy your **User ID**
3. Set it in `.env.local`:

```env
NEXT_PUBLIC_ADMIN_USER_ID=user_2x...
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables Reference

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
CLERK_SECRET_KEY=sk_test_REPLACE_ME
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=REPLACE_ME
APPWRITE_API_KEY=REPLACE_ME
NEXT_PUBLIC_APPWRITE_DATABASE_ID=REPLACE_ME
NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID=REPLACE_ME
NEXT_PUBLIC_APPWRITE_AVAILABILITY_COLLECTION_ID=REPLACE_ME
NEXT_PUBLIC_APPWRITE_BUCKET_ID=REPLACE_ME

# Admin
NEXT_PUBLIC_ADMIN_USER_ID=REPLACE_ME
```

---

## How It Works

| Role      | Action                           | Result                                               |
| --------- | -------------------------------- | ---------------------------------------------------- |
| **User**  | Click an available day           | Booking popup: select time, add description & images |
| **User**  | Click an unavailable (red) day   | Nothing — day is blocked                             |
| **Admin** | Click a day with appointments    | Opens appointment list for that day                  |
| **Admin** | Click an empty available day     | Booking popup                                        |
| **Admin** | Click **Requests** in header     | View all pending requests across all dates           |
| **Admin** | Click **Availability** in header | Manage blocked weekdays & specific dates             |

---

## Project Structure

```
calenbook/
├── app/
│   ├── api/
│   │   ├── appointments/
│   │   │   ├── route.ts          # GET (list) + POST (create)
│   │   │   └── [id]/route.ts     # PATCH (approve/reject) + DELETE
│   │   ├── availability/
│   │   │   ├── route.ts          # GET (list) + POST (create)
│   │   │   └── [id]/route.ts     # DELETE
│   │   └── images/[id]/route.ts  # GET (redirect to Appwrite preview)
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── globals.css               # Glass-morphism design system
│   ├── layout.tsx                # Clerk provider + fonts
│   └── page.tsx                  # Main app shell
├── components/
│   ├── AdminPanel.tsx            # CMS: review, approve, reject, delete
│   ├── AvailabilityPanel.tsx     # Manage blocked days
│   ├── BookingModal.tsx          # User booking form
│   ├── Calendar.tsx              # Fullscreen monthly calendar
│   └── Header.tsx                # Nav bar with admin controls
├── hooks/
│   └── useData.ts                # Fetch/mutate appointments & availability
├── lib/
│   ├── appwrite.ts               # Appwrite client + constants
│   ├── store.ts                  # Zustand global state
│   ├── types.ts                  # TypeScript interfaces
│   └── utils.ts                  # Time helpers, admin check, constants
├── middleware.ts                  # Clerk auth middleware
├── .env.local                    # Environment variables
└── package.json
```
