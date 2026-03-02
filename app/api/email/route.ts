import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import Mailgun from "mailgun.js";

/**
 * POST /api/email
 *
 * Server-side Mailgun email sender. Only admins may call this endpoint.
 * Expects JSON body: { to, subject, html, userId }
 *
 * Environment variables required:
 *   MAILGUN_API_KEY            – Mailgun private API key
 *   MAILGUN_SANDBOX_DOMAIN     – Mailgun sending domain (sandbox or custom)
 *   NEXT_PUBLIC_ADMIN_USER_ID  – Clerk user ID of the admin
 *
 * NOTE: On sandbox domains, recipients must be added as "Authorized Recipients"
 *       in the Mailgun dashboard before they can receive emails.
 */

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID!;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  userId: string; // Clerk user ID of the requester — must match admin
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmailPayload;
    const { to, subject, html, userId } = body;

    // ── Auth: only the admin may send emails ──
    if (!userId || userId !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: "Unauthorized — only admins can send emails" },
        { status: 403 },
      );
    }

    // ── Validate inputs ──
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 },
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 },
      );
    }

    // ── Read Mailgun credentials from env ──
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_SANDBOX_DOMAIN;

    if (!apiKey || !domain) {
      return NextResponse.json(
        { error: "Mailgun is not configured on this server" },
        { status: 500 },
      );
    }

    // ── Send via Mailgun SDK ──
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: apiKey,
      // For EU domains, uncomment:
      // url: "https://api.eu.mailgun.net"
    });

    const data = await mg.messages.create(domain, {
      from: `Calenbook <postmaster@${domain}>`,
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({ success: true, messageId: data.id });
  } catch (error: unknown) {
    // Extract a useful message from the Mailgun SDK error
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error("Email route error:", message);

    // If Mailgun rejected the request (auth, domain, recipient not authorized, etc.)
    if (message.includes("not allowed to send") || message.includes("Forbidden")) {
      return NextResponse.json(
        {
          error:
            "Mailgun rejected the request. If using a sandbox domain, make sure the recipient is added as an Authorized Recipient in your Mailgun dashboard.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Failed to send email: " + message },
      { status: 502 },
    );
  }
}
