"use client";

import {
  CalendarClock,
  CalendarCheck,
  Clock,
  Sparkles,
  Shield,
  Zap,
  Bell,
  Users,
  Globe,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Scheduling",
    desc: "Add events to your day in a single tap. No friction, no clutter — just your time, organized.",
  },
  {
    icon: Clock,
    title: "Always Up to Date",
    desc: "Your calendar syncs in real time so you always see the latest picture of your day.",
  },
  {
    icon: Bell,
    title: "Never Forget",
    desc: "Get email reminders for upcoming events so nothing slips through the cracks.",
  },
  {
    icon: Shield,
    title: "Your Data, Your Rules",
    desc: "Full control over your schedule with a private, secure dashboard only you can see.",
  },
  {
    icon: Users,
    title: "Color-Coded Life",
    desc: "Tag events by category — work, personal, fitness, social — and see your week at a glance.",
  },
  {
    icon: Globe,
    title: "Beautiful on Any Device",
    desc: "A stunning glass UI that feels native on desktop, tablet, and phone.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Pick a date",
    desc: "Open your calendar and tap the day you want to plan.",
  },
  {
    num: "02",
    title: "Add an event",
    desc: "Choose a time, give it a name, and pick a color — done in seconds.",
  },
  {
    num: "03",
    title: "Stay on track",
    desc: "Get a reminder before it starts so you never miss a beat.",
  },
];

const STATS = [
  { value: "99.9%", label: "Uptime" },
  { value: "<1s", label: "Load time" },
  { value: "24/7", label: "Access" },
  { value: "∞", label: "Events" },
];

/* ------------------------------------------------------------------ */

export default function SplashPage() {
  const setShowPinModal = useAppStore((s) => s.setShowPinModal);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden splash-scroll">
      {/* ── Ambient orbs ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[10%] left-[15%] w-[520px] h-[520px] bg-purple-600/[0.07] rounded-full blur-[160px] splash-orb-slow" />
        <div className="absolute bottom-[5%] right-[10%] w-[600px] h-[600px] bg-violet-500/[0.05] rounded-full blur-[180px] splash-orb-slower" />
        <div className="absolute top-[55%] left-[55%] w-[300px] h-[300px] bg-fuchsia-500/[0.04] rounded-full blur-[120px] splash-orb-slow" />
      </div>

      {/* ═══════════════════  HERO  ═══════════════════════ */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-32 max-w-3xl mx-auto splash-fade-up">
        {/* Logo mark */}
        <div className="relative mb-10">
          <div className="w-[88px] h-[88px] rounded-3xl bg-linear-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(147,51,234,0.15)]">
            <CalendarClock className="w-11 h-11 text-purple-400" />
          </div>
          <span className="absolute -top-1.5  -right-1.5 w-6 h-6 rounded-full bg-purple-950 border border-purple-400/30 flex items-center justify-center splash-pulse">
            <Sparkles className="w-3 h-3 text-purple-300" />
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-[200] tracking-tight text-white/90 leading-[1.1]">
          Your time,{" "}
          <span className="bg-linear-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            beautifully organized
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl font-light text-white/40 max-w-xl leading-relaxed">
          The personal calendar that makes planning your days feel effortless —
          minimal, fast, and always in sync.
        </p>

        {/* Pill badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {[
            { icon: CalendarCheck, text: "Plan in seconds" },
            { icon: Clock, text: "Always in sync" },
            { icon: Sparkles, text: "Smart reminders" },
          ].map((p) => (
            <div
              key={p.text}
              className="glass-button px-4 py-2 rounded-full text-[13px] flex items-center gap-2 select-none"
            >
              <p.icon className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-white/50">{p.text}</span>
            </div>
          ))}
        </div>

        {/* CTA group */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={() => setShowPinModal(true)}
            className="group primary-button px-10 py-3.5 rounded-2xl text-[15px] font-medium tracking-wide cursor-pointer flex items-center gap-2 shadow-[0_0_40px_rgba(147,51,234,0.18)]"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <p className="text-[11px] text-white/20 tracking-wide uppercase">
            No credit card required
          </p>
        </div>

        {/* Scroll cue */}
        <div className="mt-20 flex flex-col items-center gap-1 text-white/15 splash-bounce">
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ═══════════════════  FEATURES  ═══════════════════ */}
      <section className="relative z-10 px-6 pb-32 max-w-6xl mx-auto">
        <div className="text-center mb-16 splash-fade-up">
          <p className="text-[11px] uppercase tracking-[0.25em] text-purple-400/70 mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-[200] tracking-tight text-white/85">
            Your day, your way —{" "}
            <span className="text-white/40">all in one place</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group splash-card rounded-2xl p-6 flex flex-col gap-4 splash-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-linear-to-br from-purple-500/15 to-violet-500/10 border border-purple-500/15 flex items-center justify-center transition-all group-hover:from-purple-500/20 group-hover:to-violet-500/15 group-hover:shadow-[0_0_20px_rgba(147,51,234,0.12)]">
                <f.icon className="w-5 h-5 text-purple-400 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="text-[15px] font-medium text-white/80 tracking-wide">
                {f.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-white/35 font-light">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════  HOW IT WORKS  ═══════════════ */}
      <section className="relative z-10 px-6 pb-32 max-w-4xl mx-auto">
        <div className="text-center mb-16 splash-fade-up">
          <p className="text-[11px] uppercase tracking-[0.25em] text-purple-400/70 mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-[200] tracking-tight text-white/85">
            Three steps. <span className="text-white/40">That&apos;s it.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className="splash-card rounded-2xl p-7 flex flex-col gap-3 text-center items-center splash-fade-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="text-4xl font-[100] bg-linear-to-b from-purple-400/60 to-purple-400/20 bg-clip-text text-transparent select-none">
                {s.num}
              </span>
              <h3 className="text-[15px] font-medium text-white/80">
                {s.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-white/35 font-light">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════  STATS BAR  ══════════════════ */}
      <section className="relative z-10 px-6 pb-32 max-w-5xl mx-auto splash-fade-up">
        <div className="splash-card rounded-3xl p-8 sm:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl sm:text-4xl font-[200] bg-linear-to-br from-purple-300 to-violet-400 bg-clip-text text-transparent">
                  {s.value}
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/30">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════  BUILT-FOR SECTION  ══════════ */}
      <section className="relative z-10 px-6 pb-32 max-w-4xl mx-auto">
        <div className="text-center mb-14 splash-fade-up">
          <p className="text-[11px] uppercase tracking-[0.25em] text-purple-400/70 mb-3">
            Perfect for
          </p>
          <h2 className="text-3xl sm:text-4xl font-[200] tracking-tight text-white/85">
            People who value <span className="text-white/40">their time</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 splash-fade-up">
          {[
            "Students planning classes & study sessions",
            "Freelancers juggling multiple projects",
            "Busy parents keeping the family organized",
            "Anyone who wants a calmer, clearer day",
          ].map((item) => (
            <div
              key={item}
              className="splash-card rounded-2xl px-6 py-5 flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-[14px] text-white/60 font-light">
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════  FINAL CTA  ══════════════════ */}
      <section className="relative z-10 px-6 pb-40 max-w-3xl mx-auto text-center splash-fade-up">
        <div className="splash-card rounded-3xl p-10 sm:p-14 flex flex-col items-center gap-6 border-purple-500/10">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500/15 to-violet-600/15 border border-purple-500/15 flex items-center justify-center">
            <CalendarClock className="w-7 h-7 text-purple-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight text-white/85">
            Ready to take control of your time?
          </h2>
          <p className="text-[14px] text-white/35 font-light max-w-md leading-relaxed">
            Replace sticky notes, scattered reminders, and mental gymnastics
            with one beautiful calendar.
          </p>
          <button
            onClick={() => setShowPinModal(true)}
            className="group primary-button px-10 py-3.5 rounded-2xl text-[15px] font-medium tracking-wide cursor-pointer flex items-center gap-2 shadow-[0_0_40px_rgba(147,51,234,0.18)] mt-2"
          >
            Try Calenbook Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 text-center">
        <p className="text-[11px] text-white/20 tracking-wide">
          © {new Date().getFullYear()} Calenbook · Built with care
        </p>
      </footer>
    </div>
  );
}
