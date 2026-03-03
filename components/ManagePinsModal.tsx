"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Key,
  Clock,
  Infinity,
  Globe,
  UserCheck,
  Search,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Pin, DbUser } from "@/lib/types";
import { useUsers } from "@/hooks/useData";
import toast from "react-hot-toast";

const TIMEOUT_OPTIONS = [
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "6 hours", ms: 6 * 60 * 60 * 1000 },
  { label: "12 hours", ms: 12 * 60 * 60 * 1000 },
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "Never expires", ms: 0 },
];

function formatTimeRemaining(expiresAt: number | null | undefined): string {
  if (expiresAt === null || expiresAt === undefined) return "Never";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ManagePinsModal() {
  const { setShowManagePinsModal } = useAppStore();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [selectedTimeout, setSelectedTimeout] = useState(TIMEOUT_OPTIONS[3].ms); // default 24h
  const [customMinutes, setCustomMinutes] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [creating, setCreating] = useState(false);

  // User assignment state
  const [pinScope, setPinScope] = useState<"global" | "user">("global");
  const [allUsers, setAllUsers] = useState<DbUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { listenUsers } = useUsers();

  // Listen to users list
  useEffect(() => {
    const unsub = listenUsers((users) => setAllUsers(users));
    return () => unsub();
  }, [listenUsers]);

  // ═══════════════════════════════════════════════════════════════
  // ██ DEMO USERS — DELETE THIS ENTIRE BLOCK WHEN DONE TESTING ██
  // ═══════════════════════════════════════════════════════════════
  const DEMO_USERS: DbUser[] = [
    {
      $id: "demo_1",
      name: "Olivia Martinez",
      email: "olivia.martinez@gmail.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_2",
      name: "Liam Chen",
      email: "liam.chen@outlook.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_3",
      name: "Sophia Patel",
      email: "sophia.patel@yahoo.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_4",
      name: "Noah Williams",
      email: "noah.w@protonmail.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_5",
      name: "Emma Johnson",
      email: "emma.j@icloud.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_6",
      name: "James Kim",
      email: "james.kim@gmail.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_7",
      name: "Ava Rodriguez",
      email: "ava.rodriguez@hotmail.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_8",
      name: "Ethan Nakamura",
      email: "ethan.n@gmail.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_9",
      name: "Isabella Thompson",
      email: "isabella.t@outlook.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_10",
      name: "Mason Davis",
      email: "mason.davis@yahoo.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_11",
      name: "Charlotte Lee",
      email: "charlotte.lee@gmail.com",
      firstSeen: 0,
      lastSeen: 0,
    },
    {
      $id: "demo_12",
      name: "Alexander Brown",
      email: "alex.brown@protonmail.com",
      firstSeen: 0,
      lastSeen: 0,
    },
  ];
  const mergedUsers = useMemo(() => [...allUsers, ...DEMO_USERS], [allUsers]);
  // ═══════════════════════════════════════════════════════════════
  // ██ END DEMO USERS BLOCK                                     ██
  // ═══════════════════════════════════════════════════════════════

  // Filtered users based on search
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return mergedUsers;
    const q = userSearch.toLowerCase();
    return mergedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

  const fetchPins = useCallback(async () => {
    try {
      const res = await fetch("/api/pins");
      const data = (await res.json()) as { pins: Pin[] };
      setPins(data.pins || []);
    } catch {
      toast.error("Failed to load pins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  // Auto-refresh pin timeouts every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPins();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPins]);

  const handleCreate = async () => {
    if (newCode.length !== 4 || !/^\d{4}$/.test(newCode)) {
      toast.error("Pin must be exactly 4 digits");
      return;
    }

    let expiresAt: number | null = null;
    if (useCustom) {
      const mins = parseInt(customMinutes);
      if (!mins || mins <= 0) {
        toast.error("Enter a valid number of minutes");
        return;
      }
      expiresAt = Date.now() + mins * 60 * 1000;
    } else if (selectedTimeout > 0) {
      expiresAt = Date.now() + selectedTimeout;
    }
    // selectedTimeout === 0 means never expires → expiresAt stays null

    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        code: newCode,
        expiresAt,
        label: newLabel,
      };
      if (pinScope === "user" && selectedUser) {
        payload.forUserId = selectedUser.$id;
        payload.forUserEmail = selectedUser.email;
        payload.forUserName = selectedUser.name;
      }
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { pin?: Pin; error?: string };
      if (!res.ok) {
        toast.error(data.error || "Failed to create pin");
        return;
      }
      toast.success(`Pin ${newCode} created`);
      setNewCode("");
      setNewLabel("");
      setPinScope("global");
      setSelectedUser(null);
      setUserSearch("");
      fetchPins();
    } catch {
      toast.error("Failed to create pin");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/pins/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete pin");
        return;
      }
      toast.success("Pin revoked");
      setPins((prev) => prev.filter((p) => p.$id !== id));
    } catch {
      toast.error("Failed to delete pin");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowManagePinsModal(false)}
      />

      <div className="glass-panel relative w-full max-w-md max-h-[90vh] overflow-y-auto z-10 rounded-2xl p-6">
        <button
          onClick={() => setShowManagePinsModal(false)}
          className="absolute top-4 right-4 glass-button p-1.5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-light text-white/90 mb-1 flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-400" />
          Manage Pins
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Create access pins for users to view all appointments.
        </p>

        {/* ── Active pins list ─────────────────────────── */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-white/30 mb-3">
            Active Pins
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            </div>
          ) : pins.length === 0 ? (
            <div className="text-sm text-white/25 text-center py-6">
              No active pins
            </div>
          ) : (
            <div className="space-y-2">
              {pins.map((pin) => (
                <div
                  key={pin.$id}
                  className="glass-button rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg text-white/80 tracking-[0.3em]">
                      {pin.code}
                    </span>
                    <div className="flex flex-col">
                      {pin.label && (
                        <span className="text-xs text-white/50">
                          {pin.label}
                        </span>
                      )}
                      {pin.forUserName ? (
                        <span className="text-[11px] text-purple-300/60 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          {pin.forUserName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/30 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Global
                        </span>
                      )}
                      <span className="text-[11px] text-white/30 flex items-center gap-1">
                        {pin.expiresAt ? (
                          <>
                            <Clock className="w-3 h-3" />
                            {formatTimeRemaining(pin.expiresAt)}
                          </>
                        ) : (
                          <>
                            <Infinity className="w-3 h-3" />
                            Never expires
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(pin.$id)}
                    disabled={deleting === pin.$id}
                    className="glass-button p-2 rounded-lg text-red-300 hover:bg-red-500/10 hover:border-red-500/20 transition-colors cursor-pointer"
                  >
                    {deleting === pin.$id ? (
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Add new pin form ─────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-5">
          <h3 className="text-xs uppercase tracking-widest text-white/30 mb-4">
            Create New Pin
          </h3>

          <div className="space-y-4">
            {/* Pin code */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                4-Digit Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={newCode}
                onChange={(e) =>
                  setNewCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="0000"
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-[0.3em] text-center text-white/90"
              />
            </div>

            {/* Label (optional) */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Label <span className="text-white/20">(optional)</span>
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Client A, Demo"
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white/90"
              />
            </div>

            {/* Scope: Global vs Specific User */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Assign To
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setPinScope("global");
                    setSelectedUser(null);
                    setUserSearch("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pinScope === "global" ? "primary-button" : "glass-button"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Global
                </button>
                <button
                  onClick={() => setPinScope("user")}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    pinScope === "user" ? "primary-button" : "glass-button"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Specific User
                </button>
              </div>

              {pinScope === "user" && (
                <div className="relative">
                  {selectedUser ? (
                    <div className="glass-button rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-white/80">
                          {selectedUser.name || "Unnamed"}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {selectedUser.email}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setUserSearch("");
                        }}
                        className="text-white/30 hover:text-white/60 transition-colors p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          placeholder="Search by name or email…"
                          className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white/90"
                        />
                      </div>
                      {showUserDropdown && (
                        <div className="absolute left-0 right-0 mt-1 glass-panel bg-slate-900! rounded-xl max-h-100 overflow-y-auto z-20 border border-white/[0.06]">
                          {filteredUsers.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-white/30 text-center">
                              No users found
                            </div>
                          ) : (
                            filteredUsers.map((u) => (
                              <button
                                key={u.$id}
                                onClick={() => {
                                  setSelectedUser(u);
                                  setUserSearch("");
                                  setShowUserDropdown(false);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-white/[0.06] transition-colors flex flex-col cursor-pointer"
                              >
                                <span className="text-sm text-white/80">
                                  {u.name || "Unnamed"}
                                </span>
                                <span className="text-[11px] text-white/40">
                                  {u.email}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Timeout */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Expiration
              </label>
              {!useCustom ? (
                <div className="flex flex-wrap gap-2">
                  {TIMEOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedTimeout(opt.ms)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        selectedTimeout === opt.ms
                          ? "primary-button"
                          : "glass-button"
                      }`}
                    >
                      {opt.ms === 0 ? (
                        <span className="flex items-center gap-1">
                          <Infinity className="w-3 h-3" />
                          Never
                        </span>
                      ) : (
                        opt.label
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setUseCustom(true)}
                    className="glass-button px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  >
                    Custom…
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm text-white/90"
                    min={1}
                  />
                  <span className="text-xs text-white/40">min</span>
                  <button
                    onClick={() => {
                      setUseCustom(false);
                      setCustomMinutes("");
                    }}
                    className="glass-button px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  >
                    Presets
                  </button>
                </div>
              )}
            </div>

            {/* Create button */}
            <button
              onClick={handleCreate}
              disabled={
                newCode.length !== 4 ||
                creating ||
                (pinScope === "user" && !selectedUser)
              }
              className="primary-button w-full py-3 rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 cursor-pointer"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Pin
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
