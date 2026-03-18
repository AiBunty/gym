export type Plan = {
  name: string;
  price: string;
  features: string[];
  attendance: string;
  highlight?: boolean;
  inactive?: boolean;
};

export type BatchTimings = {
  morning: string[];
  evening: string[];
  note: string;
  inactiveTimings?: {
    morning?: Record<string, boolean>;
    evening?: Record<string, boolean>;
  };
};

export type FeaturedEvent = {
  enabled: boolean;
  title: string;
  subtitle: string;
  offerings: string[];
  products: string[];
  ctaText: string;
};

export type CmsData = {
  pricingPlans: Plan[];
  batchTimings: BatchTimings;
  featuredEvent: FeaturedEvent;
};

export const defaultPlans: Plan[] = [
  {
    name: "1 Month",
    price: "2,500",
    features: ["All Gym Access", "Group Classes", "FREE Daily Energy Booster! 🥤"],
    attendance: "Physical Attendance",
    highlight: false,
  },
  {
    name: "3 Months",
    price: "7,000",
    features: ["All Gym Access", "Group Classes", "FREE Daily Energy Booster! 🥤", "Save ₹500 vs monthly"],
    attendance: "Physical Attendance",
    highlight: false,
  },
  {
    name: "6 Months",
    price: "13,000",
    features: ["All Gym Access", "Group Classes", "FREE Daily Energy Booster! 🥤", "Personalized Goal Setting", "Best Value for results!"],
    attendance: "Physical Attendance",
    highlight: true,
  },
  {
    name: "Online Class",
    price: "1,800",
    features: ["Live Online Sessions", "Coach-Guided Workouts", "Single Online Membership Plan"],
    attendance: "Online Attendance",
    highlight: false,
  },
];

export const defaultBatchTimings: BatchTimings = {
  morning: ["6:00 AM", "7:00 AM", "8:00 AM"],
  evening: ["5:00 PM", "7:00 PM"],
  note: "Note: 4 PM & 6 PM slots are reserved for Personal Training",
  inactiveTimings: {
    morning: {},
    evening: {},
  },
};

export const defaultFeaturedEvent: FeaturedEvent = {
  enabled: false,
  title: "Featured Offering",
  subtitle: "",
  offerings: [],
  products: [],
  ctaText: "Contact Us",
};

function toStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeCmsData(input: unknown): CmsData {
  if (!input || typeof input !== "object") {
    return {
      pricingPlans: defaultPlans,
      batchTimings: defaultBatchTimings,
      featuredEvent: defaultFeaturedEvent,
    };
  }

  const data = input as Record<string, unknown>;

  const pricingPlans = Array.isArray(data.pricingPlans)
    ? (data.pricingPlans as Array<Record<string, unknown>>)
        .map((plan) => ({
          name: String(plan.name ?? "").trim(),
          price: String(plan.price ?? "").trim(),
          features: toStringArray(plan.features),
          attendance: String(plan.attendance ?? "Physical Attendance").trim(),
          highlight: Boolean(plan.highlight),
          inactive: Boolean(plan.inactive),
        }))
        .filter((plan) => plan.name && plan.price)
    : defaultPlans;

  const batchRaw = (data.batchTimings ?? {}) as Record<string, unknown>;
  const rawInactiveTimings = (batchRaw.inactiveTimings ?? {}) as Record<string, unknown>;
  const morningInactive = (rawInactiveTimings.morning ?? {}) as Record<string, unknown>;
  const eveningInactive = (rawInactiveTimings.evening ?? {}) as Record<string, unknown>;

  const batchTimings: BatchTimings = {
    morning: toStringArray(batchRaw.morning),
    evening: toStringArray(batchRaw.evening),
    note: String(batchRaw.note ?? defaultBatchTimings.note),
    inactiveTimings: {
      morning: Object.fromEntries(Object.entries(morningInactive).map(([key, value]) => [key, Boolean(value)])),
      evening: Object.fromEntries(Object.entries(eveningInactive).map(([key, value]) => [key, Boolean(value)])),
    },
  };

  const eventRaw = (data.featuredEvent ?? {}) as Record<string, unknown>;
  const featuredEvent: FeaturedEvent = {
    enabled: Boolean(eventRaw.enabled),
    title: String(eventRaw.title ?? defaultFeaturedEvent.title),
    subtitle: String(eventRaw.subtitle ?? ""),
    offerings: toStringArray(eventRaw.offerings),
    products: toStringArray(eventRaw.products),
    ctaText: String(eventRaw.ctaText ?? defaultFeaturedEvent.ctaText),
  };

  return {
    pricingPlans: pricingPlans.length > 0 ? pricingPlans : defaultPlans,
    batchTimings: {
      morning: batchTimings.morning.length > 0 ? batchTimings.morning : defaultBatchTimings.morning,
      evening: batchTimings.evening.length > 0 ? batchTimings.evening : defaultBatchTimings.evening,
      note: batchTimings.note || defaultBatchTimings.note,
      inactiveTimings: {
        morning: batchTimings.inactiveTimings?.morning || {},
        evening: batchTimings.inactiveTimings?.evening || {},
      },
    },
    featuredEvent,
  };
}
