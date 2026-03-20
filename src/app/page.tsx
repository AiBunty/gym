"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import FaqChatSection from "./FaqChat";
import TrialOfferFormModal from "@/components/TrialOfferFormModal";
import {
  defaultBatchTimings,
  defaultFeaturedEvent,
  defaultLapPlans,
  defaultPersonalTraining,
  defaultPlans,
  type BatchTimings,
  type FeaturedEvent,
  type LapPlan,
  type PersonalTraining,
  type Plan,
} from "@/lib/cms";
import {
  CheckCircle2,
  Gift,
  Leaf,
  Megaphone,
  Clock,
  Dumbbell,
  Facebook,
  Flower2,
  Heart,
  Instagram,
  MapPin,
  MessageCircle,
  Menu,
  Phone,
  Sparkles,
  X,
  UserCheck,
  Zap,
  Loader2,
} from "lucide-react";

const pillars = [
  {
    title: "STRENGTH",
    description: "Weight Training, CrossFit & Functional Fitness.",
    icon: Dumbbell,
  },
  {
    title: "ENERGY",
    description: "High-Intensity Aerobics & Zumba.",
    icon: Zap,
  },
  {
    title: "BALANCE",
    description: "Yoga, Sound Healing & Outdoor Treks.",
    icon: Flower2,
  },
];

const reveal = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
};

type SubmissionPayload = {
  formType: "trial" | "plan_enquiry" | "weight_loss_program" | "personal_training";
  data: Record<string, string>;
};

async function submitToGoogleSheets(payload: SubmissionPayload): Promise<{ ok: boolean; message?: string }> {
  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      return { ok: false, message: result?.message || "Submission failed." };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Submission failed due to network error." };
  }
}

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [lapPlans, setLapPlans] = useState<LapPlan[]>(defaultLapPlans);
  const [batchTimings, setBatchTimings] = useState<BatchTimings>(defaultBatchTimings);
  const [featuredEvent, setFeaturedEvent] = useState<FeaturedEvent>(defaultFeaturedEvent);
  const [personalTraining, setPersonalTraining] = useState<PersonalTraining>(defaultPersonalTraining);
  const [showFeaturedPopup, setShowFeaturedPopup] = useState(false);
  const [showProgramRegistration, setShowProgramRegistration] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<"7 Days" | "10 Days">("7 Days");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showLapRegistration, setShowLapRegistration] = useState(false);
  const [selectedLapProgram, setSelectedLapProgram] = useState<"7 Days" | "10 Days">("7 Days");
  const [selectedLapPlan, setSelectedLapPlan] = useState<LapPlan | null>(null);
  const [showTrialForm, setShowTrialForm] = useState(false);
  const [showPtRegistration, setShowPtRegistration] = useState(false);
  const [showTrialPromoPopup, setShowTrialPromoPopup] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [ptImageIndex, setPtImageIndex] = useState(0);

  const quickLinks = [
    { label: "PT", href: "#pt" },
    { label: "LAP", href: "#lap" },
    { label: "Fees", href: "#fees" },
    { label: "Chat", href: "#chat" },
    { label: "Location", href: "#location" },
  ];

  const personalTrainingImageCandidates = [personalTraining.imageUrl?.trim(), defaultPersonalTraining.imageUrl].filter(
    (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index
  );
  const personalTrainingImageSrc = personalTrainingImageCandidates[ptImageIndex] ?? null;

  const visiblePlans = plans.filter((plan) => !plan.inactive);
  const isLapPlan = (plan: Plan) => {
    const name = (plan.name || "").toLowerCase();
    const attendance = (plan.attendance || "").toLowerCase();
    return name.includes("lap") || attendance.includes("lap");
  };
  const getLapProgram = (plan: LapPlan): "7 Days" | "10 Days" => {
    return Number(plan.numberOfDays) >= 10 ? "10 Days" : "7 Days";
  };
  const getLapCutoffTimestamp = (plan: LapPlan): number | null => {
    if (!plan.startDate) return null;
    const start = new Date(`${plan.startDate}T00:00:00`).getTime();
    if (Number.isNaN(start)) return null;

    const cutoffHours = Number(plan.registrationCutoffHours ?? 6);
    const safeCutoffHours = Number.isFinite(cutoffHours) && cutoffHours > 0 ? cutoffHours : 6;
    return start - safeCutoffHours * 60 * 60 * 1000;
  };
  const getLapRegistrationWindow = (plan: LapPlan) => {
    const cutoffTs = getLapCutoffTimestamp(plan);
    if (!cutoffTs) {
      return { cutoffTs: null as number | null, msLeft: 0, isClosed: !plan.registrationFormEnabled, isEndingSoon: false };
    }

    const now = nowTick;
    const msLeft = cutoffTs - now;
    const endingSoonMs = 24 * 60 * 60 * 1000;

    return {
      cutoffTs,
      msLeft,
      isClosed: !plan.registrationFormEnabled || msLeft <= 0,
      isEndingSoon: plan.registrationFormEnabled && msLeft > 0 && msLeft <= endingSoonMs,
    };
  };
  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return "Closed";

    const totalMinutes = Math.floor(ms / (60 * 1000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };
  const membershipPlans = visiblePlans.filter((plan) => !isLapPlan(plan));
  const liveLapPlans = lapPlans.filter((plan) => plan.status === "live");
  const upcomingLapPlans = lapPlans.filter((plan) => plan.status === "upcoming");
  const visibleMorningTimings = batchTimings.morning.filter(
    (_, index) => !batchTimings.inactiveTimings?.morning?.[String(index)]
  );
  const visibleEveningTimings = batchTimings.evening.filter(
    (_, index) => !batchTimings.inactiveTimings?.evening?.[String(index)]
  );

  useEffect(() => {
    const loadCmsData = async () => {
      try {
        const response = await fetch("/api/cms", { cache: "no-store" });
        if (!response.ok) return;

        const result = await response.json();
        if (!result?.ok || !result?.data) return;

        if (Array.isArray(result.data.pricingPlans) && result.data.pricingPlans.length > 0) {
          setPlans(result.data.pricingPlans);
        }

        if (result.data.batchTimings) {
          setBatchTimings(result.data.batchTimings);
        }

        if (result.data.featuredEvent) {
          setFeaturedEvent(result.data.featuredEvent);
          if (result.data.featuredEvent.enabled) {
            setShowFeaturedPopup(true);
          }
        }

        if (Array.isArray(result.data.lapPlans) && result.data.lapPlans.length > 0) {
          setLapPlans(result.data.lapPlans);
        }

        if (result.data.personalTraining) {
          setPersonalTraining(result.data.personalTraining);
        }
      } catch {
        // Keep defaults when CMS is unavailable.
      }
    };

    loadCmsData();
  }, []);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setPtImageIndex(0);
  }, [personalTraining.imageUrl]);

  useEffect(() => {
    if (!isClientMounted) return;

    const popupKey = "trialPromoPopupDismissedAt";
    const lastDismissedAt = Number(window.localStorage.getItem(popupKey) || 0);
    const dismissCooldownMs = 6 * 60 * 60 * 1000;

    if (Number.isFinite(lastDismissedAt) && Date.now() - lastDismissedAt < dismissCooldownMs) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowTrialPromoPopup(true);
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isClientMounted]);

  const dismissTrialPromoPopup = () => {
    setShowTrialPromoPopup(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("trialPromoPopupDismissedAt", String(Date.now()));
    }
  };

  const claimTrialFromPopup = () => {
    dismissTrialPromoPopup();
    document.getElementById("trial-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(255,125,0,0.22),transparent_35%),radial-gradient(circle_at_80%_18%,rgba(255,125,0,0.12),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(148,163,184,0.1),transparent_40%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <Image src="https://i.ibb.co/QBfngyt/Untitled-design-7.png" alt="Wani's Club Level Up logo" width={42} height={42} className="rounded-full bg-white object-contain p-1" priority />
            <span className="font-display text-sm uppercase tracking-[0.16em] text-white sm:text-base">
              Wani&apos;s Club Level Up
            </span>
          </a>
          <div className="hidden items-center gap-4 md:flex">
            {quickLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:text-brand-orange">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/70 text-white transition hover:border-brand-orange md:hidden"
              aria-label={mobileNavOpen ? "Close quick links" : "Open quick links"}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <a
              href="#trial-form"
              className="rounded-full bg-brand-orange px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Claim Guest Pass
            </a>
          </div>
        </nav>
        {mobileNavOpen ? (
          <div className="border-t border-white/10 bg-black/85 px-4 py-3 backdrop-blur-lg md:hidden">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2">
              {quickLinks.map((link) => (
                <a
                  key={`mobile-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-200 transition hover:border-brand-orange hover:text-brand-orange"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main id="home" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <motion.section
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid items-center gap-8 py-8 md:grid-cols-2 md:py-12"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/40 bg-brand-orange/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-orange">
              <Sparkles size={14} /> Premium Fitness Community
            </div>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Ready to Level Up your fitness? {"\u{1F3CB}\uFE0F\u{1F525}"}
            </h1>
            <p className="max-w-xl text-base text-slate-gray sm:text-lg">
              At Wani&apos;s Club Level Up, we don&apos;t just workout - we transform!
              Join our Mahatma Nagar community for an all-in-one fitness
              experience.
            </p>
            <a
              href="#trial"
              className="inline-flex animate-pulse-soft items-center rounded-full bg-brand-orange px-6 py-3 font-semibold uppercase tracking-wide text-black shadow-[0_10px_40px_rgba(255,125,0,0.35)] transition hover:brightness-110"
            >
              GET YOUR FREE 2-DAY TRIAL
            </a>

            {/* Instagram follow CTA */}
            <a
              href="https://www.instagram.com/wanisclublevelup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
            >
              <Instagram size={16} />
              Follow us on Instagram
              <Heart size={14} className="fill-white" />
            </a>
          </div>

          <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-orange/30 blur-2xl" />
            <Image
              src="https://i.ibb.co/QBfngyt/Untitled-design-7.png"
              alt="Wani's Club Level Up emblem"
              width={180}
              height={180}
              className="mb-4 rounded-3xl bg-white object-contain p-3 shadow-[0_4px_24px_rgba(255,125,0,0.25)]"
            />
            <h2 className="font-display text-2xl uppercase tracking-wide text-brand-orange">
              Train Hard, Recover Smart
            </h2>
            <p className="mt-3 text-sm text-slate-gray sm:text-base">
              Functional strength. Dynamic energy. Deep balance. Everything under
              one roof with coach-led programs tailored for real life and real
              progress.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs sm:text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                5+ Daily Batches
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                Expert Guidance
              </div>
            </div>
          </div>
        </motion.section>

        <WeightLossAnnouncement
          eventData={featuredEvent}
          onRegister={(program) => {
            setSelectedProgram(program);
            setShowProgramRegistration(true);
          }}
        />

        {/* ── Instagram Feed ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-10"
        >
          <div className="mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
              We&apos;re Live on{" "}
              <span className="bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] bg-clip-text text-transparent">
                Instagram
              </span>
            </h2>
            <a
              href="https://www.instagram.com/wanisclublevelup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
            >
              <Instagram size={15} /> Follow @wanisclublevelup
            </a>
          </div>
          {/* Elfsight Instagram Feed */}
          {isClientMounted ? (
            <div
              className="elfsight-app-014a0409-351d-44b8-8917-448010688bcc"
              data-elfsight-app-lazy
            />
          ) : null}
        </motion.section>

        <motion.section
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="py-10"
        >
          <h3 className="font-display text-3xl uppercase tracking-wide">The Three Pillars</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.article
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="glass-card rounded-2xl border border-white/10 p-5"
                >
                  <Icon className="text-brand-orange" size={28} />
                  <h4 className="mt-4 font-display text-2xl tracking-wide text-white">
                    {pillar.title}
                  </h4>
                  <p className="mt-2 text-sm text-slate-gray sm:text-base">
                    {pillar.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          id="trial"
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="my-6 rounded-2xl border border-brand-orange/50 bg-brand-orange/15 px-5 py-6 text-center"
        >
          <p className="font-display text-xl tracking-wide sm:text-2xl">
            {"\u{1F381}"} GUEST PASS: 2-DAY FREE TRIAL. No booking needed - just
            walk in during batch timings!
          </p>
        </motion.section>

        {/* ── Schedule ── */}
        <motion.section
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-10"
        >
          <h2 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
            🕒 Workout <span className="text-brand-orange">Batch Timings</span>
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#39ff14]/40 bg-[#0a1a0a] p-8 shadow-[0_0_18px_rgba(57,255,20,0.15)] backdrop-blur-sm">
              <h3 className="mb-5 flex items-center justify-center gap-2 text-xl font-semibold text-[#39ff14]">
                <Clock size={20} /> Morning
              </h3>
              <div className="flex flex-wrap justify-center gap-3 text-lg text-white">
                {visibleMorningTimings.map((t) => (
                  <span key={t} className="rounded-lg border border-[#39ff14]/30 bg-[#39ff14]/10 px-4 py-2 font-semibold text-[#39ff14]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#39ff14]/40 bg-[#0a1a0a] p-8 shadow-[0_0_18px_rgba(57,255,20,0.15)] backdrop-blur-sm">
              <h3 className="mb-5 flex items-center justify-center gap-2 text-xl font-semibold text-[#39ff14]">
                <Clock size={20} /> Evening
              </h3>
              <div className="flex flex-wrap justify-center gap-3 text-lg text-white">
                {visibleEveningTimings.map((t) => (
                  <span key={t} className="rounded-lg border border-[#39ff14]/30 bg-[#39ff14]/10 px-4 py-2 font-semibold text-[#39ff14]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 italic text-zinc-400">
            <UserCheck size={18} className="text-brand-orange" />
            <p>{batchTimings.note}</p>
          </div>
        </motion.section>

        {/* ── Pricing ── */}
        <motion.section
          id="fees"
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-10"
        >
          <h2 className="text-center font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
            💎 Membership <span className="text-brand-orange">Plans</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-400 sm:text-base">
              Simple, transparent pricing with no hidden fees. Choose your plan and start your fitness journey today!
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {membershipPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className={`relative rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? "scale-105 border-[#ff7d00] bg-zinc-900 shadow-[0_0_24px_rgba(255,125,0,0.22)]"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-[#ff7d00]/60"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-orange px-4 py-1 text-xs font-bold uppercase tracking-wide text-black">
                    Best Value
                  </span>
                )}
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-orange">
                  {plan.attendance}
                </p>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="my-4 flex items-baseline gap-1 text-white">
                  <span className="font-display text-4xl text-brand-orange">₹{plan.price}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-zinc-300">
                      <CheckCircle2 size={17} className="shrink-0 text-brand-orange" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full rounded-xl py-3.5 font-bold transition-all ${
                    plan.highlight
                      ? "bg-brand-orange text-black hover:brightness-110"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  Select Plan
                </button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── LAP Program Registration ── */}
        <motion.section
          id="lap"
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="my-12 rounded-3xl border border-brand-orange/30 bg-zinc-900/40 p-8 text-center"
        >
          <Leaf className="mx-auto mb-4 text-brand-orange" size={32} />
          <h2 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
            🥗 LAP Program <span className="text-brand-orange">Weight Loss</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-gray sm:text-lg">
            LAP is conducted in sessions. Live sessions open registration, and upcoming sessions are announced here.
          </p>

          {liveLapPlans.length > 0 ? (
            <div className="mt-8">
              <p className="mb-4 inline-flex items-center rounded-full border border-brand-orange/40 bg-brand-orange/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">
                Live: Registration Open
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {liveLapPlans.map((plan, index) => {
                  const program = getLapProgram(plan);
                  const registrationWindow = getLapRegistrationWindow(plan);
                  const label = program === "10 Days" ? "Best Value" : "Quick Start";
                  const cardClass = program === "10 Days"
                    ? "flex h-full flex-col rounded-2xl border border-brand-orange/50 bg-gradient-to-br from-brand-orange/12 via-zinc-900/88 to-zinc-950 p-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.24)] ring-1 ring-brand-orange/25"
                    : "flex h-full flex-col rounded-2xl border border-brand-orange/30 bg-gradient-to-br from-zinc-900 via-zinc-900/96 to-zinc-950 p-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.22)]";
                  return (
                    <motion.div
                      key={`${plan.title}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: index * 0.1 }}
                      className={cardClass}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-orange">{label}</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">{plan.title}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.1em] text-zinc-400">
                        {plan.startDate} to {plan.endDate} • {plan.numberOfDays} days
                      </p>
                      {registrationWindow.isEndingSoon ? (
                        <p className="mt-3 inline-flex animate-pulse items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                          Registration Ending Soon (within 24 hours)
                        </p>
                      ) : null}
                      {!registrationWindow.isClosed ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/85">
                          Registration closes in {formatTimeLeft(registrationWindow.msLeft)}
                        </p>
                      ) : null}
                      <div className="my-4 space-y-1 text-left text-sm text-white">
                        {plan.pricingMode === "combo" ? (
                          <p><span className="font-semibold text-brand-orange">Combo:</span> ₹{plan.comboPrice}</p>
                        ) : (
                          <>
                            <p><span className="font-semibold text-brand-orange">LAP Charges:</span> ₹{plan.lapCharges}</p>
                            <p><span className="font-semibold text-brand-orange">Shake Charges:</span> ₹{plan.shakeCharges}</p>
                          </>
                        )}
                      </div>
                      <p className="mb-3 text-left text-sm text-white/80">{plan.description}</p>
                      <ul className="mb-4 space-y-2 text-left text-sm text-white/80">
                        {plan.activities.map((feature) => (
                          <li key={`${plan.title}-act-${feature}`} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-brand-orange" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <ul className="mb-6 space-y-2 text-left text-sm text-white/80">
                        {plan.dailyChecklist.map((item) => (
                          <li key={`${plan.title}-chk-${item}`} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        disabled={registrationWindow.isClosed}
                        onClick={() => {
                          setSelectedLapProgram(program);
                          setSelectedLapPlan(plan);
                          setShowLapRegistration(true);
                        }}
                        className="mt-auto w-full rounded-xl bg-brand-orange px-4 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {registrationWindow.isClosed ? "Registration Closed" : `Register for ${program}`}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {upcomingLapPlans.length > 0 ? (
            <div className="mt-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">Upcoming LAP Sessions</p>
              <div className="grid gap-6 md:grid-cols-2">
                {upcomingLapPlans.map((plan, index) => {
                  const program = getLapProgram(plan);
                  const registrationWindow = getLapRegistrationWindow(plan);
                  return (
                    <motion.div
                      key={`upcoming-${plan.title}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: index * 0.1 }}
                      className="rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-brand-orange/10 via-zinc-900/60 to-zinc-950/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.24)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-orange">Upcoming</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">{plan.title}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.1em] text-zinc-400">
                        Starts {plan.startDate} • {plan.numberOfDays} days
                      </p>
                      {registrationWindow.isEndingSoon ? (
                        <p className="mt-3 inline-flex animate-pulse items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                          Registration Ending Soon (within 24 hours)
                        </p>
                      ) : null}
                      {!registrationWindow.isClosed ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-300">
                          Registration closes in {formatTimeLeft(registrationWindow.msLeft)}
                        </p>
                      ) : null}
                      <div className="my-4 space-y-1 text-left text-sm text-zinc-200">
                        {plan.pricingMode === "combo" ? (
                          <p><span className="font-semibold text-brand-orange">Combo:</span> ₹{plan.comboPrice}</p>
                        ) : (
                          <>
                            <p><span className="font-semibold text-brand-orange">LAP Charges:</span> ₹{plan.lapCharges}</p>
                            <p><span className="font-semibold text-brand-orange">Shake Charges:</span> ₹{plan.shakeCharges}</p>
                          </>
                        )}
                      </div>
                      <p className="mb-3 text-left text-sm text-zinc-300">{plan.description}</p>
                      <ul className="mb-4 space-y-2 text-left text-sm text-zinc-300">
                        {plan.activities.map((feature) => (
                          <li key={`${plan.title}-up-act-${feature}`} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-brand-orange" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <ul className="mb-6 space-y-2 text-left text-sm text-zinc-300">
                        {plan.dailyChecklist.map((item) => (
                          <li key={`${plan.title}-up-chk-${item}`} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        disabled={registrationWindow.isClosed}
                        onClick={() => {
                          setSelectedLapProgram(program);
                          setSelectedLapPlan(plan);
                          setShowLapRegistration(true);
                        }}
                        className="w-full rounded-xl border border-brand-orange/60 bg-brand-orange px-4 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {registrationWindow.isClosed ? "Registration Closed" : "Book for Upcoming LAP Session"}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {liveLapPlans.length === 0 && upcomingLapPlans.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-zinc-700 bg-zinc-900/40 p-6">
              <p className="text-sm text-zinc-200 sm:text-base">
                Currently no LAP sessions are conducted. Check back soon for new LAP registration.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-zinc-400">
                No sessions running now
              </p>
            </div>
          ) : null}
        </motion.section>

        {personalTraining.enabled ? (
          <motion.section
            id="pt"
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="my-12 overflow-hidden rounded-3xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange/10 via-zinc-900/60 to-zinc-950/85"
          >
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative min-h-[280px] md:min-h-full">
                {personalTrainingImageSrc ? (
                  <Image
                    src={personalTrainingImageSrc}
                    alt={personalTraining.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={() => {
                      setPtImageIndex((current) => current + 1);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,125,0,0.28),transparent_45%),linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.98))] px-6 text-center">
                    <Heart className="mb-4 text-brand-orange" size={36} />
                    <p className="font-display text-3xl uppercase tracking-wide text-white">
                      {personalTraining.title}
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-zinc-300">
                      Personal coaching built around your transformation goals.
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              <div className="p-6 sm:p-8">
                <p className="inline-flex items-center gap-2 rounded-full border border-brand-orange/40 bg-brand-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-orange">
                  1-on-1 Elite Coaching
                </p>
                <h2 className="mt-4 font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">
                  {personalTraining.title}
                </h2>
                <p className="mt-3 text-sm text-zinc-300 sm:text-base">{personalTraining.description}</p>
                <p className="mt-4 text-3xl font-bold text-brand-orange">Rs {personalTraining.price}</p>

                <ul className="mt-5 space-y-2 text-sm text-zinc-200">
                  {personalTraining.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-brand-orange" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setShowPtRegistration(true)}
                  className="mt-6 w-full rounded-xl bg-brand-orange px-4 py-3 font-bold text-black transition hover:brightness-110"
                >
                  {personalTraining.ctaText || "Book Personal Training"}
                </button>
              </div>
            </div>
          </motion.section>
        ) : null}

        {/* ── FAQ Chat ── */}
        <FaqChatSection plans={plans} batchTimings={batchTimings} personalTraining={personalTraining} />

        {/* ── Trial Form ── */}
        <TrialForm batchOptions={[...visibleMorningTimings, ...visibleEveningTimings]} />

        {/* ── Reviews ── */}
        <Reviews />
      </main>

      {/* ── Footer ── */}
      <SiteFooter />

      {/* ── Floating Contact ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        <a
          href="tel:9158243377"
          aria-label="Call us"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 shadow-lg transition-all hover:bg-zinc-700"
        >
          <Phone size={22} className="text-white" />
        </a>
        <a
          href="https://wa.me/919158243377?text=Hi%20Sayali%2C%20I%20have%20a%20query%20about%20Wani's%20Club%20Level%20Up!"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex h-14 w-14 animate-bounce items-center justify-center rounded-full bg-green-500 shadow-lg transition-all hover:bg-green-600"
        >
          <MessageCircle size={22} className="text-white" />
        </a>
      </div>

      <FeaturedEventPopup
        open={showFeaturedPopup && featuredEvent.enabled}
        eventData={featuredEvent}
        onClose={() => setShowFeaturedPopup(false)}
      />

      <TrialPromoPopup
        open={showTrialPromoPopup}
        onClose={dismissTrialPromoPopup}
        onClaim={claimTrialFromPopup}
      />

      <ProgramRegistrationModal
        open={showProgramRegistration}
        initialProgram={selectedProgram}
        eventData={featuredEvent}
        onClose={() => setShowProgramRegistration(false)}
      />

      <LapRegistrationModal
        open={showLapRegistration}
        initialProgram={selectedLapProgram}
        selectedPlan={selectedLapPlan}
        onClose={() => {
          setShowLapRegistration(false);
          setSelectedLapPlan(null);
        }}
      />

      <PersonalTrainingModal
        open={showPtRegistration}
        personalTraining={personalTraining}
        onClose={() => setShowPtRegistration(false)}
      />

      <PlanEnquiryModal selectedPlan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      <TrialOfferFormModal isOpen={showTrialForm} onClose={() => setShowTrialForm(false)} />
    </div>
  );
}

type FeaturedEventPopupProps = {
  open: boolean;
  eventData: FeaturedEvent;
  onClose: () => void;
};

function FeaturedEventPopup({ open, eventData, onClose }: FeaturedEventPopupProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-2xl rounded-3xl border border-brand-orange/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)] sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-orange">Featured Offerings</p>
            <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">{eventData.title}</h3>
            {eventData.subtitle ? <p className="mt-2 text-sm text-zinc-300">{eventData.subtitle}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-orange">
              <Gift size={15} /> Offerings
            </p>
            {eventData.offerings.length > 0 ? (
              <ul className="space-y-2 text-sm text-zinc-300">
                {eventData.offerings.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-orange" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400">No offerings configured.</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-orange">
              <Sparkles size={15} /> Product Features
            </p>
            {eventData.products.length > 0 ? (
              <ul className="space-y-2 text-sm text-zinc-300">
                {eventData.products.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-orange" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400">No product features configured.</p>
            )}
          </div>
        </div>

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
          >
            {eventData.ctaText || "Explore"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type TrialPromoPopupProps = {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
};

function TrialPromoPopup({ open, onClose, onClaim }: TrialPromoPopupProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-xl rounded-3xl border border-brand-orange/35 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)] sm:p-7"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-orange">Limited Offer</p>
            <h3 className="mt-1 font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">Free 2-Day Trial</h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <p className="text-sm text-zinc-300 sm:text-base">
          We are offering a <span className="font-semibold text-brand-orange">2-day free trial</span>. Fill the trial form to register and visit the club without any calls.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClaim}
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand-orange px-4 py-3 font-bold text-black transition hover:brightness-110"
          >
            Fill Trial Form
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type WeightLossAnnouncementProps = {
  eventData: FeaturedEvent;
  onRegister: (program: "7 Days" | "10 Days") => void;
};

function WeightLossAnnouncement({ eventData, onRegister }: WeightLossAnnouncementProps) {
  if (!eventData.enabled) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="my-8 rounded-3xl border border-brand-orange/30 bg-zinc-900/40 p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-2 text-brand-orange">
        <Megaphone size={18} />
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">Announcement</p>
      </div>

      <h2 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
        Weight Loss <span className="text-brand-orange">Special Programs</span>
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-300 sm:text-base">
        7-day and 10-day weight loss programs are available at an additional cost beyond regular membership fees.
        {eventData.subtitle ? ` ${eventData.subtitle}` : ""}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-orange">Program Option</p>
          <h3 className="mt-1 text-2xl font-bold text-white">7 Days</h3>
          <p className="mt-2 text-sm text-zinc-300">Accelerated start for fat-loss momentum with coach accountability.</p>
          <button
            type="button"
            onClick={() => onRegister("7 Days")}
            className="mt-4 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
          >
            Register for 7 Days
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-orange">Program Option</p>
          <h3 className="mt-1 text-2xl font-bold text-white">10 Days</h3>
          <p className="mt-2 text-sm text-zinc-300">Deeper reset with progressive coaching, check-ins and nutrition guidance.</p>
          <button
            type="button"
            onClick={() => onRegister("10 Days")}
            className="mt-4 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
          >
            Register for 10 Days
          </button>
        </div>
      </div>

      {(eventData.offerings.length > 0 || eventData.products.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-orange">Included in Program</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              {eventData.offerings.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-orange">Featured Products</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              {eventData.products.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </motion.section>
  );
}

type ProgramRegistrationModalProps = {
  open: boolean;
  initialProgram: "7 Days" | "10 Days";
  eventData: FeaturedEvent;
  onClose: () => void;
};

function ProgramRegistrationModal({ open, initialProgram, eventData, onClose }: ProgramRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "",
    program: initialProgram,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitDone(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      goal: "",
      program: initialProgram,
    });
  }, [open, initialProgram]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitResult = await submitToGoogleSheets({
      formType: "weight_loss_program",
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        goal: formData.goal || "Not specified",
        program: formData.program,
        eventTitle: eventData.title || "Weight Loss Program",
      },
    });

    const msg = encodeURIComponent(
      `Hi Coach Sayali! 👋\n\nI want to register for the ${formData.program} Weight Loss Program (additional cost).\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nGoal: ${formData.goal || "Not specified"}\n\nPlease share full details and fee structure.`
    );

    window.open(`https://wa.me/919158243377?text=${msg}`, "_blank");
    setIsSubmitting(false);
    setSubmitDone(true);
    setTimeout(() => onClose(), 1600);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`w-full max-w-lg rounded-3xl border border-brand-orange/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)] ${isSubmitting ? "animate-pulse ring-2 ring-brand-orange/30" : ""}`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-orange">Program Registration</p>
            <h3 className="mt-1 text-xl font-bold text-white">Weight Loss Program</h3>
            <p className="mt-1 text-sm text-zinc-300">Additional cost applies over regular membership fee.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        {submitDone ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Thank you! Registration received. WhatsApp is opening with your details.
          </div>
        ) : isSubmitting ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-sm text-brand-orange">
            <Loader2 size={16} className="animate-spin" /> Sending your program request...
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <input
            required
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <input
            required
            type="tel"
            inputMode="numeric"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <select
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value as "7 Days" | "10 Days" })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          >
            <option>7 Days</option>
            <option>10 Days</option>
          </select>

          <textarea
            rows={3}
            placeholder="Your goal (fat loss, inch loss, event prep, etc.)"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : "Register & Get Full Program Info"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

type LapRegistrationModalProps = {
  open: boolean;
  initialProgram: "7 Days" | "10 Days";
  selectedPlan: LapPlan | null;
  onClose: () => void;
};

function LapRegistrationModal({ open, initialProgram, selectedPlan, onClose }: LapRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    goal: "",
    program: initialProgram,
    currentWeight: "",
    targetWeight: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitDone(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      age: "",
      goal: "",
      program: initialProgram,
      currentWeight: "",
      targetWeight: "",
    });
  }, [open, initialProgram]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitResult = await submitToGoogleSheets({
      formType: "weight_loss_program",
      data: {
        planName: selectedPlan?.title || `LAP - ${formData.program}`,
        planPrice: selectedPlan?.pricingMode === "combo"
          ? String(selectedPlan.comboPrice || "")
          : String(selectedPlan?.lapCharges || ""),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        goal: formData.goal || "Not specified",
        program: `LAP ${formData.program}`,
        startDate: selectedPlan?.startDate || "",
        endDate: selectedPlan?.endDate || "",
        numberOfDays: String(selectedPlan?.numberOfDays || ""),
        lapCharges: selectedPlan?.lapCharges || "",
        shakeCharges: selectedPlan?.shakeCharges || "",
        comboPrice: selectedPlan?.comboPrice || "",
        currentWeight: formData.currentWeight,
        targetWeight: formData.targetWeight,
      },
    });

    if (!submitResult.ok) {
      alert(submitResult.message || "Registration is currently unavailable for this LAP session.");
      setIsSubmitting(false);
      return;
    }

    const msg = encodeURIComponent(
      `Hi Coach Sayali! 👋\n\nI want to register for the *LAP ${formData.program} Program*.\n\n*Personal Details*\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nAge: ${formData.age}\n\n*Weight Loss Info*\nCurrent Weight: ${formData.currentWeight} kg\nTarget Weight: ${formData.targetWeight} kg\nGoal: ${formData.goal || "Not specified"}\n\nPlease share the full program details, shake options, and fee structure. Thank you!`
    );

    window.open(`https://wa.me/919158243377?text=${msg}`, "_blank");
    setIsSubmitting(false);
    setSubmitDone(true);
    setTimeout(() => onClose(), 1600);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`w-full max-w-lg rounded-3xl border border-brand-orange/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)] ${isSubmitting ? "animate-pulse ring-2 ring-brand-orange/30" : ""}`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-orange">LAP Program Registration</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              {selectedPlan?.title || `LAP - ${formData.program}`}
              <br />
              <span className="text-brand-orange">
                {selectedPlan?.pricingMode === "combo"
                  ? `₹${selectedPlan.comboPrice}`
                  : `₹${selectedPlan?.lapCharges || (formData.program === "7 Days" ? "4,999" : "6,999")}`}
              </span>
            </h3>
            <p className="mt-1 text-sm text-zinc-300">Meal replacement shakes + personalized diet coaching.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        {submitDone ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Thank you! Registration received. WhatsApp is opening with your details.
          </div>
        ) : isSubmitting ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-sm text-brand-orange">
            <Loader2 size={16} className="animate-spin" /> Registering you for this LAP session...
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="tel"
              inputMode="numeric"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              required
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="number"
              placeholder="Current Weight (kg)"
              step="0.1"
              value={formData.currentWeight}
              onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              required
              type="number"
              placeholder="Target Weight (kg)"
              step="0.1"
              value={formData.targetWeight}
              onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <textarea
            rows={3}
            placeholder="Your health goal (weight loss timeline, dietary restrictions, medical conditions, etc.)"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : "Register for LAP Program"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

type PlanEnquiryModalProps = {
  selectedPlan: Plan | null;
  onClose: () => void;
};

type PersonalTrainingModalProps = {
  open: boolean;
  personalTraining: PersonalTraining;
  onClose: () => void;
};

function PersonalTrainingModal({ open, personalTraining, onClose }: PersonalTrainingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "",
    preferredSlot: "Morning",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitDone(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      goal: "",
      preferredSlot: "Morning",
      notes: "",
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await submitToGoogleSheets({
      formType: "personal_training",
      data: {
        planName: personalTraining.title,
        planPrice: personalTraining.price,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        goal: formData.goal || "Not specified",
        preferredSlot: formData.preferredSlot,
        notes: formData.notes || "None",
      },
    });

    const msg = encodeURIComponent(
      `Hi Coach Sayali! 👋\n\nI want to enroll in ${personalTraining.title} (Rs ${personalTraining.price}).\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nPreferred Slot: ${formData.preferredSlot}\nGoal: ${formData.goal || "Not specified"}\nNotes: ${formData.notes || "None"}\n\nPlease share next steps and payment details.`
    );

    window.open(`https://wa.me/919158243377?text=${msg}`, "_blank");
    setIsSubmitting(false);
    setSubmitDone(true);
    setTimeout(() => onClose(), 1600);
  };

  return (
    <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`w-full max-w-lg rounded-3xl border border-brand-orange/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)] ${isSubmitting ? "animate-pulse ring-2 ring-brand-orange/30" : ""}`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-orange">Personal Training</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              {personalTraining.title}
              <br />
              <span className="text-brand-orange">Rs {personalTraining.price}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        {submitDone ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Thank you! Submission received. WhatsApp is opening with your details.
          </div>
        ) : isSubmitting ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-sm text-brand-orange">
            <Loader2 size={16} className="animate-spin" /> Saving your PT enquiry...
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="tel"
              inputMode="numeric"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <select
              value={formData.preferredSlot}
              onChange={(e) => setFormData({ ...formData, preferredSlot: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            >
              <option>Morning</option>
              <option>Evening</option>
              <option>Flexible</option>
            </select>
          </div>

          <textarea
            rows={3}
            placeholder="Your primary fitness goal"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <textarea
            rows={2}
            placeholder="Additional notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : personalTraining.ctaText || "Book Personal Training"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function PlanEnquiryModal({ selectedPlan, onClose }: PlanEnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    strengthLevel: "Beginner",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    if (!selectedPlan) return;
    setSubmitDone(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      age: "",
      gender: "",
      strengthLevel: "Beginner",
      notes: "",
    });
  }, [selectedPlan]);

  useEffect(() => {
    if (!selectedPlan) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPlan]);

  if (!selectedPlan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Open immediately during user interaction to avoid popup blockers.
    const phone = "919158243377";
    const waWindow = window.open("about:blank", "_blank");

    await submitToGoogleSheets({
      formType: "plan_enquiry",
      data: {
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        gender: formData.gender,
        strengthLevel: formData.strengthLevel,
        notes: formData.notes || "None",
      },
    });

    const msg = encodeURIComponent(
      `Hi Coach Sayali! 👋\n\nI want to enroll in a membership plan.\n\n*Selected Plan:* ${selectedPlan.name} (₹${selectedPlan.price})\n\n*Customer Details*\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nAge: ${formData.age}\nGender: ${formData.gender}\nStrength Level: ${formData.strengthLevel}\nImportant Notes: ${formData.notes || "None"}\n\nPlease share the payment link to proceed. Thank you!`
    );

    const waUrl = `https://wa.me/${phone}?text=${msg}`;
    if (waWindow && !waWindow.closed) {
      waWindow.location.href = waUrl;
    } else {
      window.open(waUrl, "_blank");
    }
    setIsSubmitting(false);
    setSubmitDone(true);
    setTimeout(() => onClose(), 1600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`w-full max-w-xl rounded-3xl border border-[#ff7d00]/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)] sm:p-7 ${isSubmitting ? "animate-pulse ring-2 ring-brand-orange/30" : ""}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-orange">Plan Enquiry</p>
            <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              {selectedPlan.name} <span className="text-brand-orange">(₹{selectedPlan.price})</span>
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Fill your details. We&apos;ll open WhatsApp so the owner can share the payment link.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        {submitDone ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Thank you! Submission received. WhatsApp is opening with your details.
          </div>
        ) : isSubmitting ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-sm text-brand-orange">
            <Loader2 size={16} className="animate-spin" /> Creating your plan enquiry...
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              type="tel"
              inputMode="numeric"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
            />
            <input
              required
              type="number"
              min={12}
              max={90}
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
            />
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
            >
              <option value="">Gender</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <select
            required
            value={formData.strengthLevel}
            onChange={(e) => setFormData({ ...formData, strengthLevel: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <textarea
            rows={3}
            placeholder="Anything important we should know? (injury, medical condition, goals, etc.)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3.5 font-bold text-black transition hover:brightness-110 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSubmitting ? "Opening WhatsApp..." : "Submit & Request Payment Link"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Trial Form Component ── */
type TrialFormProps = {
  batchOptions: string[];
};

function TrialForm({ batchOptions }: TrialFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "Weight Loss",
    batch: batchOptions[0] || "6:00 AM – 7:00 AM",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (batchOptions.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      batch: prev.batch || batchOptions[0],
    }));
  }, [batchOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    const submitResult = await submitToGoogleSheets({
      formType: "trial",
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        goal: formData.goal || "Not specified",
        batch: formData.batch,
      },
    });

    if (!submitResult.ok) {
      alert(submitResult.message || "Trial registration is currently unavailable.");
      setIsSubmitting(false);
      return;
    }

    const phone = "919158243377";
    const msg = encodeURIComponent(
      `Hi Coach Sayali! 🔥\n\nI want to claim my *FREE 2-DAY TRIAL* at Wani's Club Level Up.\n\n*Name:* ${formData.name}\n*Mobile:* ${formData.phone}\n*Email:* ${formData.email}\n*Fitness Goal:* ${formData.goal || "Not specified"}\n*Preferred Batch:* ${formData.batch}\n\nSee you at the gym!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <motion.section
      id="trial-form"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`mx-auto my-10 max-w-md rounded-3xl border border-[#ff7d00]/30 bg-zinc-900 p-8 ${isSubmitting ? "animate-pulse ring-2 ring-brand-orange/30" : ""}`}
    >
      <h3 className="mb-6 text-center text-2xl font-bold text-white">
        Claim Your <span className="text-brand-orange">Free 2-Day Pass</span>
      </h3>

      {submitted ? (
        <div className="py-8 text-center">
          <p className="text-4xl">🎉</p>
          <p className="mt-3 text-lg font-semibold text-white">Thank you! Your free trial booking is confirmed.</p>
          <p className="mt-2 text-sm text-zinc-300">Please bring these items for your workout:</p>
          <ul className="mx-auto mt-3 max-w-sm space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-left text-sm text-zinc-200">
            <li>• Clean indoor shoes</li>
            <li>• Comfortable workout clothing</li>
            <li>• Napkin or small towel</li>
            <li>• Water bottle</li>
          </ul>
          <p className="mt-3 text-sm text-zinc-300">WhatsApp is opening with your trial details. See you at the club.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-5 rounded-xl bg-zinc-800 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Submit again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSubmitting ? (
            <div className="flex items-center gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-sm text-brand-orange">
              <Loader2 size={16} className="animate-spin" /> Sending your free trial request...
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Your Name</label>
            <input
              required
              type="text"
              value={formData.name}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
              disabled={isSubmitting}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Mobile Number</label>
              <input
                required
                type="tel"
                inputMode="numeric"
                value={formData.phone}
                placeholder="Enter mobile number"
                className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
                disabled={isSubmitting}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Email</label>
              <input
                required
                type="email"
                value={formData.email}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
                disabled={isSubmitting}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Fitness Goal</label>
            <select
              required
              value={formData.goal}
              className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
              disabled={isSubmitting}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            >
              <option>Weight Loss</option>
              <option>Fat Loss</option>
              <option>Muscle Gain</option>
              <option>Strength Training</option>
              <option>General Fitness</option>
              <option>Mobility and Flexibility</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Preferred Batch</label>
            <select
              value={formData.batch}
              className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
              disabled={isSubmitting}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            >
              {(batchOptions.length > 0 ? batchOptions : ["6:00 AM – 7:00 AM", "7:00 AM – 8:00 AM", "8:00 AM – 9:00 AM", "5:00 PM – 6:00 PM", "7:00 PM – 8:00 PM"]).map((batch) => (
                <option key={batch}>{batch}</option>
              ))}
            </select>
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <span className="mt-0.5 text-base leading-none">⚠️</span>
              <p className="text-xs leading-relaxed text-red-300">
                <span className="font-semibold text-red-400">Batch slots are limited!</span> Each batch has a fixed capacity — once full, you&apos;ll be moved to a waitlist and may lose your preferred timing. Secure your spot now before it&apos;s gone!
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-4 font-bold uppercase tracking-wide text-black shadow-[0_0_18px_rgba(255,125,0,0.4)] transition hover:brightness-110 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : "Get My Pass via WhatsApp 🚀"}
          </button>
        </form>
      )}
    </motion.section>
  );
}

/* ── Reviews Component ── */
function Reviews() {
  return (
    <section className="py-12">
      <h2 className="mb-8 text-center font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
        What Our <span className="text-brand-orange">Members Say</span>
      </h2>
      <div
        className="elfsight-app-e675454f-c6e0-4a23-8cdd-d2a31a9d3d27"
        data-elfsight-app-lazy
      />
    </section>
  );
}

/* ── Site Footer ── */
function SiteFooter() {
  return (
    <footer id="location" className="border-t border-zinc-800 bg-black px-6 pb-8 pt-16">
      <div className="mx-auto mb-12 grid max-w-6xl gap-12 md:grid-cols-2">
        {/* Left */}
        <div>
          <h2 className="mb-6 text-3xl font-bold text-white">
            Find <span className="text-brand-orange">Us</span>
          </h2>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <Leaf size={16} className="text-emerald-300" />
            Herbalife Authorized Nutrition Club
          </div>
          <div className="mb-8 space-y-4">
            <p className="flex items-start gap-3 text-zinc-300">
              <MapPin className="mt-1 shrink-0 text-brand-orange" size={18} />
              <span>
                101, 1st Floor, Padma Vishwa Orchid, Opp. Mahatma Nagar Cricket
                Ground, Nashik.
              </span>
            </p>
            <p className="text-sm text-zinc-300">
              Healthy active lifestyle support with guided community nutrition and fitness routines.
            </p>
            <p className="flex items-center gap-3 text-zinc-300">
              <Phone className="shrink-0 text-brand-orange" size={18} />
              <a
                href="tel:9158243377"
                className="transition-colors hover:text-brand-orange"
              >
                9158243377 — Coach Sayali Wani
              </a>
            </p>
            <p className="flex items-center gap-3 text-zinc-300">
              <UserCheck className="shrink-0 text-brand-orange" size={18} />
              <a
                href="/admin-login"
                className="transition-colors hover:text-brand-orange"
              >
                Admin Login
              </a>
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="https://www.facebook.com/wanisclublevelup"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="rounded-full bg-zinc-900 p-3 text-white transition-all hover:bg-brand-orange"
            >
              <Facebook size={18} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="rounded-full bg-zinc-900 p-3 text-white transition-all hover:bg-brand-orange"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Right: Map */}
        <div className="h-64 overflow-hidden rounded-3xl border border-zinc-800 md:h-auto">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3749.2875999445855!2d73.75428579999999!3d19.9964406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bddebbb52f39333%3A0xc473a23631c4ff7c!2sWani's%20Club%20Level%20Up!5e0!3m2!1sen!2sin!4v1773769146341!5m2!1sen!2sin"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Wani's Club Level Up location"
          />
        </div>
      </div>

      <div className="border-t border-zinc-900 pt-8 text-center text-sm text-zinc-500 space-y-1.5">
        <p>© 2026 Wani&apos;s Club Level Up. All Rights Reserved.</p>
        <p>
          Created by{" "}
          <a
            href="https://www.dcoresystems.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange transition-colors hover:brightness-125"
          >
            www.dcoresystems.com
          </a>
        </p>
      </div>
    </footer>
  );
}
