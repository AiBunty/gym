"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface TrialFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrialOfferFormModal({ isOpen, onClose }: TrialFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAge("");
    setInterests("");
    setStatus("idle");
    setStatusMessage("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setStatus("error");
      setStatusMessage("Please fill in name, email, and phone");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/submit/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, age, interests }),
      });

      const result = await response.json();

      if (result.ok) {
        setStatus("success");
        setStatusMessage(
          "Thank you! Your 2-day trial is booked.\n\nPlease bring:\n• Clean indoor shoes\n• Comfortable workout clothing\n• Napkin or small towel\n• Water bottle\n\nSee you at the club!"
        );
        setName("");
        setEmail("");
        setPhone("");
        setAge("");
        setInterests("");
        setTimeout(() => {
          handleClose();
        }, 3200);
      } else {
        setStatus("error");
        setStatusMessage(result.message || "Failed to submit. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl ${isSubmitting ? "animate-pulse ring-2 ring-brand-orange/30" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 p-6">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wide text-brand-orange">
              2-Day Free Trial
            </h2>
            <p className="text-xs text-zinc-400 mt-1">No commitment. Just experience our programs.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 hover:bg-zinc-800 transition disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {isSubmitting ? (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-sm text-brand-orange">
            <Loader2 size={16} className="animate-spin" /> Submitting your trial registration...
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange transition"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange transition"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange transition"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange transition"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">
                Interests
              </label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g., Weight Loss"
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange transition"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {status === "success" && (
            <div className="whitespace-pre-line rounded-lg border border-green-500 bg-green-500/20 px-3 py-2 text-sm text-green-300">
              {statusMessage}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg bg-red-500/20 border border-red-500 px-3 py-2 text-sm text-red-300">
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 font-bold text-black uppercase tracking-wide transition hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : "Start Free Trial"}
          </button>

          <p className="text-xs text-zinc-500 text-center">
            We&apos;ll send trial details to your email
          </p>
        </form>
      </div>
    </div>
  );
}
