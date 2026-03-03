"use client";

import { useState } from "react";
import { X, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface EmailConfirmModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when the modal is dismissed (escape, backdrop, or explicit close) */
  onClose: () => void;
  /**
   * Called after the admin makes a choice.
   * - `sendEmail: true`  → admin confirmed sending the email
   * - `sendEmail: false` → admin chose to skip the email
   */
  onConfirm: (sendEmail: boolean) => void;
  /** Pre-filled recipient email (editable in custom-email mode) */
  defaultTo?: string;
  /** Pre-filled subject line */
  defaultSubject?: string;
  /** Pre-filled HTML body */
  defaultBody?: string;
  /** Clerk user ID of the currently signed-in admin */
  userId: string;
  /**
   * When true the modal shows a full compose form
   * (for manually crafted admin emails from the AvailabilityPanel).
   * When false it shows a simpler "send notification or skip" prompt
   * (for status-change flows in AdminPanel / AppointmentDetail).
   */
  composeMode?: boolean;
  /** Label shown on the send button (defaults to "Send Email") */
  sendLabel?: string;
  /** Label shown on the skip button (defaults to "Don't Send") */
  skipLabel?: string;
  /** If true, there is no skip option — only send or cancel */
  requireSend?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function EmailConfirmModal({
  open,
  onClose,
  onConfirm,
  defaultTo = "",
  defaultSubject = "",
  defaultBody = "",
  userId,
  composeMode = false,
  sendLabel = "Send Email",
  skipLabel = "Don't Send",
  requireSend = false,
}: EmailConfirmModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);

  // Re-sync defaults when the modal opens with new values
  // (controlled via key or useEffect from parent)
  // We rely on the parent updating `defaultTo` etc. and remounting via `key`

  if (!open) return null;

  /** Actually send the email via the server route */
  const handleSend = async () => {
    const recipientEmail = composeMode ? to : defaultTo;
    const emailSubject = composeMode ? subject : defaultSubject;
    const emailBody = composeMode ? body : defaultBody;

    if (!recipientEmail || !emailSubject || !emailBody) {
      toast.error("Please fill in all email fields");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          html: emailBody,
          userId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Email sent successfully");
        onConfirm(true);
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch {
      toast.error("Network error — could not send email");
    } finally {
      setSending(false);
    }
  };

  /** Skip sending (status change still proceeds) */
  const handleSkip = () => {
    onConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="glass-panel relative z-10 w-full max-w-md rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-300" />
            <h3 className="text-lg font-light text-white/90">
              {composeMode ? "Send Email" : "Email Notification"}
            </h3>
          </div>
          <button onClick={onClose} className="glass-button p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {composeMode ? (
          /* ── Full compose form ── */
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full glass-input px-3 py-2 rounded-xl text-sm text-white/90 placeholder-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full glass-input px-3 py-2 rounded-xl text-sm text-white/90 placeholder-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">
                Message (HTML)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email content..."
                rows={5}
                className="w-full glass-input px-3 py-2 rounded-xl text-sm text-white/90 placeholder-white/30 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 glass-button py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
              >
                Don&apos;t Send
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !to || !subject || !body}
                className="flex-1 primary-button py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : sendLabel}
              </button>
            </div>
          </div>
        ) : (
          /* ── Simple confirm / skip prompt ── */
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Would you like to send an email notification to{" "}
              <span className="text-white/80">{defaultTo || "the user"}</span>?
            </p>

            {/* Preview of what will be sent */}
            {defaultSubject && (
              <div className="glass-button rounded-xl p-3 space-y-1">
                <p className="text-xs text-white/40">Subject</p>
                <p className="text-sm text-white/70">{defaultSubject}</p>
              </div>
            )}

            <div className="flex gap-3">
              {!requireSend && (
                <button
                  onClick={handleSkip}
                  className="flex-1 glass-button py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
                >
                  {skipLabel}
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 primary-button py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : sendLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
