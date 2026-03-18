"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import FaqChatSection from "./FaqChat";
import {
  CheckCircle2,
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

const plans = [
  {
    name: "1 Month",
    price: "2,500",
    features: ["All Gym Access", "Group Classes", "FREE Daily Energy Booster! 🥤"],
    highlight: false,
  },
  {
    name: "3 Months",
    price: "7,000",
    features: ["All Gym Access", "Group Classes", "Save ₹500 vs monthly"],
    highlight: false,
  },
  {
    name: "6 Months",
    price: "13,000",
    features: ["All Gym Access", "Group Classes", "Personalized Goal Setting", "Best Value for results!"],
    highlight: true,
  },
];

const reveal = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
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
                {["6:00 AM", "7:00 AM", "8:00 AM"].map((t) => (
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
                {["5:00 PM", "7:00 PM"].map((t) => (
                  <span key={t} className="rounded-lg border border-[#39ff14]/30 bg-[#39ff14]/10 px-4 py-2 font-semibold text-[#39ff14]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 italic text-zinc-400">
            <UserCheck size={18} className="text-brand-orange" />
            <p>Note: 4 PM &amp; 6 PM slots are reserved for Personal Training</p>
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

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
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
    </div>
  );
}

/* ── Trial Form Component ── */
function TrialForm() {
  const [formData, setFormData] = useState({ name: "", goal: "", batch: "Morning (6am–9am)" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              <option>Morning (6am–9am)</option>
              <option>Evening (5pm–8pm)</option>
            </select>
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
          <div className="mb-8 space-y-4">
            <p className="flex items-start gap-3 text-zinc-300">
              <MapPin className="mt-1 shrink-0 text-brand-orange" size={18} />
              <span>
                101, 1st Floor, Padma Vishwa Orchid, Opp. Mahatma Nagar Cricket
                Ground, Nashik.
              </span>
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

      <div className="border-t border-zinc-900 pt-8 text-center text-sm text-zinc-500">
        © 2026 Wani&apos;s Club Level Up. All Rights Reserved.
      </div>
    </footer>
  );
}
