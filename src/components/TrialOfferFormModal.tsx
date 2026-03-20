"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

interface TrialFormProps {
  isOpen: boolean;
  onClose: () => void;
  batchOptions: string[];
}

export default function TrialOfferFormModal({ isOpen, onClose, batchOptions }: TrialFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "Weight Loss",
    batch: batchOptions[0] || "6:00 AM – 7:00 AM",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOfferStatus, setSubmittedOfferStatus] = useState<"eligible" | "already_redeemed">("eligible");

  useEffect(() => {
    if (batchOptions.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      batch: prev.batch || batchOptions[0],
    }));
  }, [batchOptions]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      goal: "Weight Loss",
      batch: batchOptions[0] || "6:00 AM – 7:00 AM",
    });
    setSubmitted(false);
    setSubmittedOfferStatus("eligible");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formType: "trial",
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          goal: formData.goal || "Not specified",
          batch: formData.batch,
        },
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      alert(result?.message || "Trial registration is currently unavailable.");
      setIsSubmitting(false);
      return;
    }

    const result = await response.json().catch(() => null);
    const resolvedOfferStatus =
      result?.offerStatus === "already_redeemed" ? "already_redeemed" : "eligible";

    const phone = "919158243377";
    const offerLine =
      resolvedOfferStatus === "already_redeemed"
        ? "I want to book my *FREE 2-DAY TRIAL* again. Complimentary shake offer is *ALREADY REDEEMED*."
        : "I want to claim my *FREE 2-DAY TRIAL + 1 COMPLIMENTARY SHAKE*.";
    const msg = encodeURIComponent(
      `Hi Coach Sayali! 🔥\n\n${offerLine} at Wani's Club Level Up.\n\n*Name:* ${formData.name}\n*Mobile:* ${formData.phone}\n*Email:* ${formData.email}\n*Fitness Goal:* ${formData.goal || "Not specified"}\n*Preferred Batch:* ${formData.batch}\n\nSee you at the gym!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    setSubmittedOfferStatus(resolvedOfferStatus);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl ${isSubmitting ? "animate-pulse ring-2 ring-brand-orange/30" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 p-6">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wide text-brand-orange">
              2-Day Free Trial + Complimentary Shake
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Same trial form, same process. No extra steps.</p>
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
          {submitted ? (
            <div className="py-4 text-center">
              <p className="text-4xl">🎉</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {submittedOfferStatus === "already_redeemed"
                  ? "Thank you! Your 2-day trial is confirmed. Complimentary shake offer is already redeemed."
                  : "Thank you! Your free trial + complimentary shake booking is confirmed."}
              </p>
              <p className="mt-2 text-sm text-zinc-300">Please bring these items for your workout:</p>
              <ul className="mx-auto mt-3 max-w-sm space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-left text-sm text-zinc-200">
                <li>• Clean indoor shoes</li>
                <li>• Comfortable workout clothing</li>
                <li>• Napkin or small towel</li>
                <li>• Water bottle</li>
              </ul>
              <p className="mt-3 text-sm text-zinc-300">WhatsApp is opening with your trial details. See you at the club.</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-5 rounded-xl bg-zinc-800 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Submit again
              </button>
            </div>
          ) : (
            <>
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
                  {(batchOptions.length > 0
                    ? batchOptions
                    : ["6:00 AM – 7:00 AM", "7:00 AM – 8:00 AM", "8:00 AM – 9:00 AM", "5:00 PM – 6:00 PM", "7:00 PM – 8:00 PM"]).map((batch) => (
                    <option key={batch}>{batch}</option>
                  ))}
                </select>
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <span className="mt-0.5 text-base leading-none">⚠️</span>
                  <p className="text-xs leading-relaxed text-red-300">
                    <span className="font-semibold text-red-400">Batch slots are limited!</span> Each batch has a fixed capacity - once full, you&apos;ll be moved to a waitlist and may lose your preferred timing. Secure your spot now before it&apos;s gone!
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-4 font-bold uppercase tracking-wide text-black shadow-[0_0_18px_rgba(255,125,0,0.4)] transition hover:brightness-110 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {isSubmitting ? "Opening WhatsApp..." : "Claim Free Trial + Shake"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
