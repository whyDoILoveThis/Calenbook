"use client";

import { useState, useRef, useEffect } from "react";
import { X, ArrowRight, User, Shield } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { isAdmin } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

export default function PinEntryModal() {
  const { setShowPinModal, setShowApp, setPinAccess } = useAppStore();
  const { user } = useUser();
  const userIsAdmin = isAdmin(user?.id);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    // Auto advance to next field
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (pasted.length === 4) {
      const next = pasted.split("");
      setDigits(next);
      inputRefs.current[3]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = digits.join("");
    if (code.length !== 4) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pins/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId: user?.id }),
      });
      const data = (await res.json()) as { valid: boolean; error?: string };

      if (data.valid) {
        setPinAccess("full");
        setShowApp(true);
        setShowPinModal(false);
        toast.success("Full access granted");
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setDigits(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        toast.error(data.error || "Invalid or expired pin");
      }
    } catch {
      toast.error("Could not validate pin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoPin = () => {
    setPinAccess("personal");
    setShowApp(true);
    setShowPinModal(false);
  };

  const code = digits.join("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowPinModal(false)}
      />

      <div
        className={`glass-panel relative w-full max-w-sm z-10 rounded-2xl p-8 flex flex-col items-center gap-6 ${shake ? "pin-shake" : ""}`}
      >
        {/* Close */}
        <button
          onClick={() => setShowPinModal(false)}
          className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-light text-white/90 tracking-wide">
          Enter Access Pin
        </h2>
        <p className="text-sm text-white/40 text-center -mt-2">
          Enter the 4-digit pin from your admin to see all appointments.
        </p>

        {/* 4-digit inputs */}
        <div className="flex gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-14 h-16 text-center text-2xl font-light glass-input rounded-xl focus:border-purple-500/40 text-white/90"
              disabled={submitting}
            />
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={code.length !== 4 || submitting}
          className="primary-button w-full py-3 rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Submit
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[11px] text-white/25 uppercase tracking-widest">
            or
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* No pin */}
        {!userIsAdmin && (
          <button
            onClick={handleNoPin}
            className="glass-button w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer text-white/50 hover:text-white/70"
          >
            <User className="w-4 h-4" />
            No Pin
          </button>
        )}

        {/* Admin bypass */}
        {userIsAdmin && (
          <button
            onClick={() => {
              setPinAccess("full");
              setShowApp(true);
              setShowPinModal(false);
            }}
            className="glass-button w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer text-purple-300/70 hover:text-purple-300 border-purple-500/15 hover:border-purple-500/30"
          >
            <Shield className="w-4 h-4" />
            Bypass Pin
          </button>
        )}
      </div>
    </div>
  );
}
