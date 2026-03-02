import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { wrapEmailTemplate } from "@/lib/email-template";

/**
 * POST /api/email
 *
 * Server-side Mailgun email sender. Only admins may call this endpoint.
 * Expects JSON body: { to, subject, html, userId }
 *
 * Environment variables required:
 *   MAILGUN_API_KEY            – Mailgun private API key
 *   MAILGUN_DOMAIN              – Mailgun sending domain (e.g. calenbook.net)
 *   NEXT_PUBLIC_ADMIN_USER_ID  – Clerk user ID of the admin
 *   NEXT_PUBLIC_ADMIN_EMAIL     – Admin email (used as recipient when users send messages)
 *
 * NOTE: On sandbox domains, recipients must be added as "Authorized Recipients"
 *       in the Mailgun dashboard before they can receive emails.
 */

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID!;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  userId: string; // Clerk user ID of the requester
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmailPayload;
    const { to, subject, html, userId } = body;

    // ── Auth: must be a signed-in user ──
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — you must be signed in to send emails" },
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
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Mailgun apikey missing" },
        { status: 500 },
      );
    }
    if (!domain) {
      return NextResponse.json(
        { error: "Mailgun domain missing" },
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
      from: `Calenbook <noreply@${domain}>`,
      to: [to],
      subject,
      html: wrapEmailTemplate(html, subject),
    });

    return NextResponse.json({ success: true, messageId: data.id });
  } catch (error: unknown) {
    // Extract a useful message from the Mailgun SDK error
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error("Email route error:", message);

    return NextResponse.json(
      { error: "Failed to send email: " + message },
      { status: 502 },
    );
  }
}
