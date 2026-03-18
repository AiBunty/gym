"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";

/* ─────────────────────────────────────────────
   FAQ Database  (keyword-matched)
───────────────────────────────────────────── */
const FAQ_DB = [
  {
    keywords: ["price", "cost", "fee", "membership", "plan", "monthly", "charges", "how much", "rate", "rupee", "₹"],
    answer:
      "Our membership plans are:\n\n💰 1 Month — ₹2,500\n   All Gym Access, Group Classes & FREE Daily Energy Booster 🥤\n\n💰 3 Months — ₹7,000\n   Save ₹500 vs monthly!\n\n💰 6 Months — ₹13,000 🏆 Best Value!\n   All of the above + Personalized Goal Setting\n\nAll plans give full access to gym equipment and group classes!",
  },
  {
    keywords: ["timing", "time", "batch", "schedule", "open", "hours", "when", "morning", "evening", "slot"],
    answer:
      "We run 5 daily batches:\n\n🌅 Morning: 6:00 AM | 7:00 AM | 8:00 AM\n🌆 Evening: 5:00 PM | 7:00 PM\n\nNote: 4 PM & 6 PM slots are reserved for Personal Training only.",
  },
  {
    keywords: ["trial", "free", "guest pass", "try", "visit", "first time", "new member", "join"],
    answer:
      "Yes! 🎉 We offer a FREE 2-Day Guest Pass — no booking needed!\n\nJust walk in during any batch timing and mention you're here for your free trial. Coach Sayali will get you settled in right away. No strings attached!",
  },
  {
    keywords: ["location", "address", "where", "place", "find", "map", "nashik", "mahatma nagar", "directions"],
    answer:
      "We're right here:\n\n📍 101, 1st Floor, Padma Vishwa Orchid,\nOpp. Mahatma Nagar Cricket Ground, Nashik.\n\n🗺️ Google Maps: https://www.google.com/maps/search/?api=1&query=Wani%27s+Club+Level+Up+Nashik\n\nEasy to spot — just opposite the cricket ground in Mahatma Nagar! 🏏",
  },
  {
    keywords: ["personal training", "pt", "one on one", "private", "personal coach"],
    answer:
      "Absolutely! 💪 We offer Personal Training (PT) with one-on-one coaching.\n\n✅ PT includes:\n• Personalized workout programming\n• Goal-based progress tracking\n• Technique correction and accountability\n• Flexible slot preference (subject to availability)\n\n🕓 Priority PT slots mentioned at the club: 4 PM and 6 PM\n\n💰 PT fee is shown in the PT section/card on our website and may vary based on plan duration or package type.\n\n📲 To book PT, contact Coach Sayali directly: 9158243377",
  },
  {
    keywords: ["lap", "weight loss program", "7 days", "10 days", "lap charges", "shake charges", "combo", "lap registration"],
    answer:
      "Great choice! 🥗 LAP is our focused weight-loss program conducted in sessions.\n\n📌 LAP details:\n• Session-based enrollment (Live / Upcoming)\n• 7-day and 10-day formats\n• Includes structured routine, checklist and coaching flow\n\n💰 Pricing is shown in the LAP section as:\n• LAP Charges\n• Shake Charges\n• Or Combo Price (for selected sessions)\n\n⏳ Important: Registration closes before the session start date (cutoff applies per session).\n\n📝 How to join:\n1) Open LAP section on website\n2) Select a live/upcoming session\n3) Click Register and submit details\n\nFor immediate help, message Coach Sayali at 9158243377.",
  },
  {
    keywords: ["class", "classes", "yoga", "zumba", "crossfit", "aerobics", "program", "activity", "workout", "pillar"],
    answer:
      "We cover everything under our Three Pillars:\n\n💪 STRENGTH — Weight Training, CrossFit & Functional Fitness\n⚡ ENERGY — High-Intensity Aerobics & Zumba\n🌸 BALANCE — Yoga, Sound Healing & Outdoor Treks\n\nAll group classes are included in every membership plan!",
  },
  {
    keywords: ["contact", "call", "phone", "number", "whatsapp", "reach", "talk", "message"],
    answer:
      "Reach Coach Sayali Wani directly:\n\n📞 Call / WhatsApp: 9158243377\n📸 Instagram: @wanisclublevelup\n📘 Facebook: wanisclublevelup\n\nThere's also a WhatsApp button (green 💬) at the bottom-right of this page!",
  },
  {
    keywords: ["parking", "bike", "car", "vehicle", "park"],
    answer:
      "Yes! 🚗 Parking is available near Padma Vishwa Orchid.\n\nThe gym is on the 1st floor and easily accessible. For specific queries, call us at 9158243377.",
  },
  {
    keywords: ["nutrition", "diet", "food", "eat", "meal", "supplement", "protein", "weight loss", "fat", "gain"],
    answer:
      "Our 6-Month plan includes Personalized Goal Setting that covers nutrition advice from coaches. 🥗\n\nAll memberships also include a FREE Daily Energy Booster 🥤 to fuel your workouts!\n\nFor a detailed nutrition plan, speak to Coach Sayali — she crafts it around your specific goals.",
  },
  {
    keywords: ["cancel", "refund", "stop", "leave", "exit", "money back", "pause"],
    answer:
      "For cancellation or refund queries, please contact Coach Sayali directly at 📞 9158243377.\n\nShe'll walk you through all available options and make sure you're taken care of. We always work with our members! 🙏",
  },
  {
    keywords: ["equipment", "machine", "treadmill", "facilities", "amenities", "gym has", "available", "floor", "dumbbell", "barbell", "rope", "ladder", "pullup", "pull up", "stepper", "belt", "stick"],
    answer:
      "Wani's Club Level Up is fully equipped for a complete workout! 💪\n\n🏋️ Dumbbells & Barbells\n🪢 Battle Ropes\n🪜 Agility Ladder\n🔝 Pull-up Rod\n🥢 Training Sticks\n🦶 Steppers\n🔴 Elastic Resistance Belts\n🏟️ Open Workout Floor for functional training\n🚿 Clean, hygienic washrooms\n\nEverything you need — all coach-monitored in a premium environment!",
  },
  {
    keywords: ["wear", "bring", "carry", "clothes", "clothing", "shoes", "napkin", "towel", "dress", "attire", "what to", "need to bring", "come with", "footwear"],
    answer:
      "Great question! Here's what to bring when you come to the gym:\n\n👟 Clean Shoes — dedicated gym/indoor shoes only (not outdoor shoes)\n👕 Comfortable Workout Clothing — something you can move freely in\n🧻 Napkins / Small Towel — to wipe down equipment and stay fresh\n💧 Water Bottle — stay hydrated!\n\nThat's it — keep it simple and comfortable. We'll handle the rest! 🔥",
  },
  {
    keywords: ["coach", "sayali", "wani", "trainer", "instructor", "founder", "who"],
    answer:
      "Coach Sayali Wani is the founder and head trainer here! 🌟\n\nShe's an expert fitness professional who personally guides members through their transformation — weight loss, strength, yoga, CrossFit, and more.\n\n📞 Reach her at: 9158243377",
  },
  {
    keywords: ["hello", "hi", "hey", "namaste", "good morning", "good evening", "sup"],
    answer:
      "Hey there! 👋😄 Welcome to Wani's Club Level Up!\n\nI can help you with info about memberships, batch timings, free trial, classes, location, and more. What would you like to know? 💪🔥",
  },
  {
    keywords: ["thank", "thanks", "great", "awesome", "perfect", "nice", "good"],
    answer:
      "You're welcome! 😊🙌 Feel free to ask anything else — I'm here to help!\n\nReady to Level Up? 💪🔥 Grab your FREE 2-Day Trial and come see us at the gym!",
  },
];

const SUGGESTIONS = [
  "What are the membership prices?",
  "What are the batch timings?",
  "Do you offer a free trial?",
  "Tell me about PT plans",
  "How does LAP work?",
  "Where are you located?",
  "What classes do you offer?",
  "What equipment do you have?",
  "What should I bring to the gym?",
];

function findAnswer(query: string): string {
  const lower = query.toLowerCase();
  let bestMatch = { score: 0, answer: "" };

  for (const faq of FAQ_DB) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (lower.includes(kw)) {
        score += kw.split(" ").length; // multi-word keywords score higher
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { score, answer: faq.answer };
    }
  }

  if (bestMatch.score > 0) return bestMatch.answer;

  return "Hmm, I'm not sure about that one! 🤔\n\nTry asking about our membership prices, batch timings, free trial, classes, or location. Or call Coach Sayali directly at 9158243377! 💪";
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
  typing?: boolean;
};

let _msgId = 0;

/* ─────────────────────────────────────────────
   Typing Dots
───────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff7d00]">
        <Bot size={14} className="text-black" />
      </div>
      <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main FAQ Chat Section
───────────────────────────────────────────── */
export default function FaqChatSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: _msgId++,
      role: "bot",
      text: "Hey there! 👋 I'm the Wani's Club Level Up assistant.\n\nAsk me anything about memberships, classes, timings, location, free trials and more! 💪🔥",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll only within the chat box — never jumps the page
  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, showDots]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = { id: _msgId++, role: "user", text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      setShowDots(true);

      const answer = findAnswer(text);

      // Thinking delay — feels natural
      const thinkDelay = 600 + Math.random() * 400;

      setTimeout(() => {
        setShowDots(false);

        const botId = _msgId++;
        // Insert empty bot bubble that we'll fill character by character
        setMessages((prev) => [
          ...prev,
          { id: botId, role: "bot", text: "", typing: true },
        ]);

        let i = 0;
        // Slightly faster for longer answers
        const charDelay = answer.length > 200 ? 12 : 18;

        intervalRef.current = setInterval(() => {
          i++;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, text: answer.slice(0, i) } : m
            )
          );

          if (i >= answer.length) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botId ? { ...m, typing: false } : m
              )
            );
            setIsTyping(false);
            inputRef.current?.focus();
          }
        }, charDelay);
      }, thinkDelay);
    },
    [isTyping]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <motion.section
      id="chat"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="py-10"
    >
      {/* Section heading */}
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
          💬 Ask{" "}
          <span className="text-[#ff7d00]">Anything</span>
        </h2>
        <p className="mt-2 text-[#94a3b8]">
          Instant answers from our AI assistant — no waiting, no calling needed.
        </p>
      </div>

      {/* Chat Window */}
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-[0_0_50px_rgba(255,125,0,0.08)]">

        {/* ── Header bar ── */}
        <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-5 py-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7d00] shadow-[0_0_14px_rgba(255,125,0,0.5)]">
            <Bot size={20} className="text-black" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              Club Level Up Assistant
            </p>
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online · Replies instantly
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
            <span>FAQ AI</span>
            <Sparkles size={12} className="text-[#ff7d00]" />
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={chatContainerRef}
          className="h-[340px] overflow-y-auto px-4 py-5 space-y-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Bot avatar */}
                {msg.role === "bot" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff7d00] shadow-[0_0_8px_rgba(255,125,0,0.4)] mb-1">
                    <Bot size={14} className="text-black" />
                  </div>
                )}

                <div
                  className={`relative max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-[#ff7d00] text-black font-medium shadow-[0_4px_16px_rgba(255,125,0,0.3)]"
                      : "rounded-bl-sm bg-zinc-800 text-white"
                  }`}
                >
                  {msg.text}
                  {/* Blinking cursor while streaming */}
                  {msg.typing && (
                    <span className="ml-0.5 inline-block h-[1em] w-0.5 align-middle bg-[#ff7d00]"
                      style={{ animation: "blink 0.85s step-start infinite" }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking dots — shown before typewriter starts */}
          <AnimatePresence>
            {showDots && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
              >
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          <div />
        </div>

        {/* ── Suggested questions ── */}
        <div className="border-t border-zinc-800/70 px-4 pt-3 pb-2">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-zinc-600">
            Quick questions
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={isTyping}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 transition-all duration-200 hover:border-[#ff7d00] hover:text-[#ff7d00] hover:bg-[#ff7d00]/5 disabled:pointer-events-none disabled:opacity-30"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input bar ── */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Ask about memberships, timings, classes…"
            className="flex-1 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:ring-1 focus:ring-[#ff7d00] disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff7d00] text-black transition hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_12px_rgba(255,125,0,0.35)]"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </motion.section>
  );
}
