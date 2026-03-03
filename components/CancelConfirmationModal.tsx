"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface CancelConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isAdmin?: boolean;
}

export default function CancelConfirmationModal({
  open,
  onClose,
  onConfirm,
  isAdmin = false,
}: CancelConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);
  const requiredText = "yes i really want to cancel frfr";
  const isMatched = inputValue === requiredText;

  // Smooth visual progress: creeps forward while processing, snaps to 100% when done
  useEffect(() => {
    if (!processing) {
      setVisualProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setVisualProgress((prev) => {
        if (prev < 70) return prev + 1.5;
        if (prev < 90) return prev + 0.4;
        if (prev < 97) return prev + 0.15;
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [processing]);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await onConfirm();
      setVisualProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 350));
    } finally {
      setProcessing(false);
      setInputValue("");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={processing ? undefined : onClose}
      />

      <div className="glass-panel relative w-full max-w-sm z-10 rounded-2xl p-6 backdrop-blur-xl border border-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute top-4 right-4 glass-button p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning icon and heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-xl font-light text-white/90">
            Cancel Appointment?
          </h2>
        </div>

        {/* Description */}
        <p className="text-sm text-white/60 mb-6">
          This action cannot be undone. Once cancelled,{" "}
          {isAdmin ? (
            <>
              you&apos;ll need to contact the user to reschedule. An email
              notification will be sent.
            </>
          ) : (
            <>
              the admin will be notified and you&apos;ll need to request a new
              time.
            </>
          )}
        </p>

        {/* Confirmation input */}
        <div className="mb-6">
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">
            Type to confirm
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={requiredText}
            disabled={processing}
            className="w-full glass-input rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/30 bg-white/5 border border-white/10 focus:border-white/20 focus:bg-white/10 transition-all outline-none disabled:opacity-50"
          />
          <p className="text-xs text-white/30 mt-2">
            Enter exactly:{" "}
            <span className="text-red-300/80 font-mono">{requiredText}</span>
          </p>
        </div>

        {/* Feedback for input */}
        {inputValue.length > 0 && !isMatched && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-300/80">
              Text doesn&apos;t match. Please type it exactly.
            </p>
          </div>
        )}

        {isMatched && !processing && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-300/80">
              ✓ Confirmation text matches
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 glass-button py-2.5 px-2 rounded-xl text-sm font-medium text-white/60 hover:text-white/80 hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            Keep
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatched || processing}
            className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              processing
                ? "clearing-progress border border-red-500/40 text-red-300"
                : isMatched
                  ? "bg-red-500/30 border border-red-500/40 text-red-300 hover:bg-red-500/40 cursor-pointer"
                  : "bg-red-500/10 border border-red-500/20 text-red-300/50 cursor-not-allowed opacity-50"
            }`}
            style={
              processing
                ? ({
                    "--progress": visualProgress / 100,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                  Cancelling
                  {visualProgress > 1
                    ? ` ${Math.round(visualProgress)}%`
                    : "..."}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Cancel Appointment
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
