"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import FaqChatSection from "./FaqChat";
import TrialOfferFormModal from "@/components/TrialOfferFormModal";
import {
  defaultBatchTimings,
  defaultFeaturedEvent,
  defaultPlans,
  type BatchTimings,
  type FeaturedEvent,
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
  Phone,
  Sparkles,
  UserCheck,
  Zap,
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
  formType: "trial" | "plan_enquiry" | "weight_loss_program";
  data: Record<string, string>;
};

async function submitToGoogleSheets(payload: SubmissionPayload): Promise<void> {
  try {
    await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Form submission to WhatsApp should still continue even if sheet write fails.
  }
}

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [batchTimings, setBatchTimings] = useState<BatchTimings>(defaultBatchTimings);
  const [featuredEvent, setFeaturedEvent] = useState<FeaturedEvent>(defaultFeaturedEvent);
  const [showFeaturedPopup, setShowFeaturedPopup] = useState(false);
  const [showProgramRegistration, setShowProgramRegistration] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<"7 Days" | "10 Days">("7 Days");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showLapRegistration, setShowLapRegistration] = useState(false);
  const [selectedLapProgram, setSelectedLapProgram] = useState<"7 Days" | "10 Days">("7 Days");
  const [showTrialForm, setShowTrialForm] = useState(false);

  const visiblePlans = plans.filter((plan) => !plan.inactive);
  const isLapPlan = (plan: Plan) => {
    const name = (plan.name || "").toLowerCase();
    const attendance = (plan.attendance || "").toLowerCase();
    return name.includes("lap") || attendance.includes("lap");
  };
  const getLapProgram = (plan: Plan): "7 Days" | "10 Days" => {
    const content = `${plan.name} ${plan.attendance}`.toLowerCase();
    return content.includes("10") ? "10 Days" : "7 Days";
  };
  const membershipPlans = visiblePlans.filter((plan) => !isLapPlan(plan));
  const lapPlans = plans.filter((plan) => isLapPlan(plan));
  const liveLapPlans = lapPlans.filter((plan) => !plan.inactive);
  const upcomingLapPlans = lapPlans.filter((plan) => Boolean(plan.inactive));
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
      } catch {
        // Keep defaults when CMS is unavailable.
      }
    };

    loadCmsData();
  }, []);

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
          <a
            href="#trial-form"
            className="rounded-full bg-brand-orange px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Claim Guest Pass
          </a>
        </nav>
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
          <div
            className="elfsight-app-014a0409-351d-44b8-8917-448010688bcc"
            data-elfsight-app-lazy
          />
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
            The first 3 plans are for physical attendance at the gym. Online class has a single dedicated plan at ₹1,800.
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
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-400">Live: Registration Open</p>
              <div className="grid gap-6 md:grid-cols-2">
                {liveLapPlans.map((plan, index) => {
                  const program = getLapProgram(plan);
                  const label = program === "10 Days" ? "Best Value" : "Quick Start";
                  const cardClass = program === "10 Days"
                    ? "rounded-2xl border border-brand-orange/50 bg-zinc-900/50 p-6 ring-1 ring-brand-orange/20"
                    : "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6";
                  return (
                    <motion.div
                      key={`${plan.name}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: index * 0.1 }}
                      className={cardClass}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-orange">{label}</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">{plan.name}</h3>
                      <div className="my-4 flex items-baseline gap-1">
                        <span className="font-display text-4xl text-brand-orange">₹{plan.price}</span>
                      </div>
                      <ul className="mb-6 space-y-2 text-left text-sm text-zinc-300">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-brand-orange" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          setSelectedLapProgram(program);
                          setShowLapRegistration(true);
                        }}
                        className="w-full rounded-xl bg-brand-orange px-4 py-3 font-bold text-black transition hover:brightness-110"
                      >
                        Register for {program}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {upcomingLapPlans.length > 0 ? (
            <div className="mt-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-sky-300">Upcoming LAP Sessions</p>
              <div className="grid gap-6 md:grid-cols-2">
                {upcomingLapPlans.map((plan, index) => {
                  const program = getLapProgram(plan);
                  return (
                    <motion.div
                      key={`upcoming-${plan.name}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: index * 0.1 }}
                      className="rounded-2xl border border-sky-400/30 bg-zinc-900/40 p-6"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-300">Upcoming</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">{plan.name}</h3>
                      <div className="my-4 flex items-baseline gap-1">
                        <span className="font-display text-4xl text-brand-orange">₹{plan.price}</span>
                      </div>
                      <ul className="mb-6 space-y-2 text-left text-sm text-zinc-300">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-brand-orange" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          setSelectedLapProgram(program);
                          setShowLapRegistration(true);
                        }}
                        className="w-full rounded-xl border border-sky-300 bg-sky-300/10 px-4 py-3 font-bold text-sky-200 transition hover:bg-sky-300/20"
                      >
                        Book for Upcoming LAP Session
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

        {/* ── FAQ Chat ── */}
        <FaqChatSection />

        {/* ── Trial Form ── */}
        <TrialForm />

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

      <ProgramRegistrationModal
        open={showProgramRegistration}
        initialProgram={selectedProgram}
        eventData={featuredEvent}
        onClose={() => setShowProgramRegistration(false)}
      />

      <LapRegistrationModal
        open={showLapRegistration}
        initialProgram={selectedLapProgram}
        onClose={() => setShowLapRegistration(false)}
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
    phone: "",
    goal: "",
    program: initialProgram,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData({
      name: "",
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

    await submitToGoogleSheets({
      formType: "weight_loss_program",
      data: {
        name: formData.name,
        phone: formData.phone,
        goal: formData.goal || "Not specified",
        program: formData.program,
        eventTitle: eventData.title || "Weight Loss Program",
      },
    });

    const msg = encodeURIComponent(
      `Hi Coach Sayali! 👋\n\nI want to register for the ${formData.program} Weight Loss Program (additional cost).\n\nName: ${formData.name}\nPhone: ${formData.phone}\nGoal: ${formData.goal || "Not specified"}\n\nPlease share full details and fee structure.`
    );

    window.open(`https://wa.me/919158243377?text=${msg}`, "_blank");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl border border-brand-orange/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)]"
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
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <input
            required
            type="tel"
            inputMode="numeric"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <select
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value as "7 Days" | "10 Days" })}
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
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-orange py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-70"
          >
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
  onClose: () => void;
};

function LapRegistrationModal({ open, initialProgram, onClose }: LapRegistrationModalProps) {
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

  useEffect(() => {
    if (!open) return;
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

    await submitToGoogleSheets({
      formType: "weight_loss_program",
      data: {
        planName: `LAP - ${formData.program}`,
        planPrice: formData.program === "7 Days" ? "4,999" : "6,999",
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        goal: formData.goal || "Not specified",
        program: `LAP ${formData.program}`,
        currentWeight: formData.currentWeight,
        targetWeight: formData.targetWeight,
      },
    });

    const msg = encodeURIComponent(
      `Hi Coach Sayali! 👋\n\nI want to register for the *LAP ${formData.program} Program*.\n\n*Personal Details*\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nAge: ${formData.age}\n\n*Weight Loss Info*\nCurrent Weight: ${formData.currentWeight} kg\nTarget Weight: ${formData.targetWeight} kg\nGoal: ${formData.goal || "Not specified"}\n\nPlease share the full program details, shake options, and fee structure. Thank you!`
    );

    window.open(`https://wa.me/919158243377?text=${msg}`, "_blank");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl border border-brand-orange/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)]"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-orange">LAP Program Registration</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              LAP - {formData.program}
              <br />
              <span className="text-brand-orange">
                {formData.program === "7 Days" ? "₹4,999" : "₹6,999"}
              </span>
            </h3>
            <p className="mt-1 text-sm text-zinc-300">Meal replacement shakes + personalized diet coaching.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              required
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              required
              type="number"
              placeholder="Target Weight (kg)"
              step="0.1"
              value={formData.targetWeight}
              onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <textarea
            rows={3}
            placeholder="Your health goal (weight loss timeline, dietary restrictions, medical conditions, etc.)"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-orange py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-70"
          >
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

  useEffect(() => {
    if (!selectedPlan) return;
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

    const phone = "919158243377";
    const msg = encodeURIComponent(
      `Hi Coach Sayali! 👋\n\nI want to enroll in a membership plan.\n\n*Selected Plan:* ${selectedPlan.name} (₹${selectedPlan.price})\n\n*Customer Details*\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nAge: ${formData.age}\nGender: ${formData.gender}\nStrength Level: ${formData.strengthLevel}\nImportant Notes: ${formData.notes || "None"}\n\nPlease share the payment link to proceed. Thank you!`
    );

    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-xl rounded-3xl border border-[#ff7d00]/30 bg-zinc-950 p-6 shadow-[0_0_36px_rgba(255,125,0,0.2)] sm:p-7"
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
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
            />
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff7d00]"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-xl bg-brand-orange py-3.5 font-bold text-black transition hover:brightness-110 disabled:opacity-70"
          >
            {isSubmitting ? "Opening WhatsApp..." : "Submit & Request Payment Link"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Trial Form Component ── */
function TrialForm() {
  const [formData, setFormData] = useState({ name: "", goal: "", batch: "6:00 AM – 7:00 AM" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submitToGoogleSheets({
      formType: "trial",
      data: {
        name: formData.name,
        goal: formData.goal || "Not specified",
        batch: formData.batch,
      },
    });

    const phone = "919158243377";
    const msg = encodeURIComponent(
      `Hi Coach Sayali! 🔥\n\nI want to claim my *FREE 2-DAY TRIAL* at Wani's Club Level Up.\n\n*Name:* ${formData.name}\n*Fitness Goal:* ${formData.goal || "Not specified"}\n*Preferred Batch:* ${formData.batch}\n\nSee you at the gym!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    setSubmitted(true);
  };

  return (
    <motion.section
      id="trial-form"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto my-10 max-w-md rounded-3xl border border-[#ff7d00]/30 bg-zinc-900 p-8"
    >
      <h3 className="mb-6 text-center text-2xl font-bold text-white">
        Claim Your <span className="text-brand-orange">Free 2-Day Pass</span>
      </h3>

      {submitted ? (
        <div className="py-8 text-center">
          <p className="text-4xl">🎉</p>
          <p className="mt-3 text-lg font-semibold text-white">
            WhatsApp is opening — see you at the gym!
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-5 rounded-xl bg-zinc-800 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Submit again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Your Name</label>
            <input
              required
              type="text"
              placeholder="Enter your name"
              className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Fitness Goal</label>
            <input
              type="text"
              placeholder="e.g. Weight loss, Strength"
              className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Preferred Batch</label>
            <select
              className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-[#ff7d00]"
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            >
              <option>6:00 AM – 7:00 AM</option>
              <option>7:00 AM – 8:00 AM</option>
              <option>8:00 AM – 9:00 AM</option>
              <option>5:00 PM – 6:00 PM</option>
              <option>7:00 PM – 8:00 PM</option>
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
            className="mt-2 w-full rounded-xl bg-brand-orange py-4 font-bold uppercase tracking-wide text-black shadow-[0_0_18px_rgba(255,125,0,0.4)] transition hover:brightness-110"
          >
            Get My Pass via WhatsApp 🚀
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
    <footer id="contact" className="border-t border-zinc-800 bg-black px-6 pb-8 pt-16">
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
