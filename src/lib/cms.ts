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

export type SmtpProvider =
  | "gmail"
  | "zoho"
  | "stackmail"
  | "yahoo"
  | "titan"
  | "custom";

export type EmailSettings = {
  enabled: boolean;
  provider: SmtpProvider;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
  adminNotifyEmails: string[];
};

export type EmailTemplates = {
  userSubject: string;
  userHtml: string;
  userText: string;
  adminSubject: string;
  adminHtml: string;
  adminText: string;
};

export type LapPlan = {
  title: string;
  startDate: string;
  endDate: string;
  registrationCutoffHours: number;
  numberOfDays: number;
  lapCharges: string;
  shakeCharges: string;
  pricingMode: "separate" | "combo";
  comboPrice: string;
  description: string;
  activities: string[];
  dailyChecklist: string[];
  registrationFormEnabled: boolean;
  status: "live" | "upcoming";
};

export type PersonalTraining = {
  enabled: boolean;
  title: string;
  price: string;
  imageUrl: string;
  description: string;
  features: string[];
  ctaText: string;
};

export type CmsData = {
  pricingPlans: Plan[];
  batchTimings: BatchTimings;
  featuredEvent: FeaturedEvent;
  lapPlans: LapPlan[];
  personalTraining: PersonalTraining;
  emailSettings: EmailSettings;
  emailTemplates: EmailTemplates;
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

export const defaultLapPlans: LapPlan[] = [
  {
    title: "LAP 1 - 7 Day Demo",
    startDate: "2026-03-25",
    endDate: "2026-03-31",
    registrationCutoffHours: 6,
    numberOfDays: 7,
    lapCharges: "4999",
    shakeCharges: "1200",
    pricingMode: "combo",
    comboPrice: "5999",
    description: "Demo LAP batch with complete daily accountability and guided transformation.",
    activities: [
      "Registration form completion",
      "Daily weight photo submission",
      "Daily water intake tracking",
      "Daily meals photos",
      "Activity and habit tracking",
    ],
    dailyChecklist: [
      "Maintain good habits",
      "Complete 8 hours sleep cycle",
      "Follow diet plan",
    ],
    registrationFormEnabled: true,
    status: "live",
  },
  {
    title: "LAP Next Session - 15 April",
    startDate: "2026-04-15",
    endDate: "2026-04-24",
    registrationCutoffHours: 6,
    numberOfDays: 10,
    lapCharges: "6999",
    shakeCharges: "1500",
    pricingMode: "combo",
    comboPrice: "7999",
    description: "Upcoming LAP session for next month with complete coaching and compliance tracking.",
    activities: [
      "Registration form completion",
      "Daily weight photo submission",
      "Daily water intake tracking",
      "Daily meals photos",
      "Daily habit checklist",
    ],
    dailyChecklist: [
      "Maintain good habits",
      "Complete 8 hours sleep cycle",
      "Follow diet plan",
    ],
    registrationFormEnabled: true,
    status: "upcoming",
  },
];

const legacyPersonalTrainingImageUrl =
  "https://images.unsplash.com/photo-1571019613914-85f342c55f55?auto=format&fit=crop&w=1200&q=80";

export const defaultPersonalTraining: PersonalTraining = {
  enabled: true,
  title: "Personal Training",
  price: "8000",
  imageUrl:
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  description: "One-on-one coaching focused on body transformation, strength development, posture correction and accountability.",
  features: [
    "Customized workout plan",
    "Weekly progress tracking",
    "Diet and habit coaching",
    "Direct trainer attention",
  ],
  ctaText: "Book Personal Training",
};

export const defaultEmailSettings: EmailSettings = {
  enabled: false,
  provider: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromName: "Wani's Club Level Up",
  fromEmail: "",
  adminNotifyEmails: [],
};

export const defaultEmailTemplates: EmailTemplates = {
  userSubject: "Welcome to Wani's Club Level Up",
  userHtml:
    "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up</div><div style=\"padding:20px;color:#e4e4e7\"><img src=\"https://i.ibb.co/QBfngyt/Untitled-design-7.png\" alt=\"Wani's Club Level Up\" style=\"width:62px;height:62px;border-radius:50%;background:#fff;padding:4px;display:block;margin:0 auto 14px auto\"/><h2 style=\"margin:0 0 12px 0;color:#fff;text-align:center\">Hi {{name}}, welcome!</h2><p style=\"margin:0 0 10px 0\">Thank you for your submission for <b>{{program}}</b>.</p><p style=\"margin:0 0 10px 0\">Our team will contact you shortly with the next steps.</p><p style=\"margin:0;color:#a1a1aa\">Team Wani's Club Level Up</p></div></div></div>",
  userText: "Hi {{name}}, thank you for your submission for {{program}}. Our team will contact you shortly.",
  adminSubject: "New Website Form Submission - {{formType}}",
  adminHtml:
    "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up - Admin Alert</div><div style=\"padding:20px;color:#e4e4e7\"><img src=\"https://i.ibb.co/QBfngyt/Untitled-design-7.png\" alt=\"Wani's Club Level Up\" style=\"width:56px;height:56px;border-radius:50%;background:#fff;padding:4px;display:block;margin:0 auto 14px auto\"/><h2 style=\"margin:0 0 12px 0;color:#fff;text-align:center\">New Submission Received</h2><p style=\"margin:0 0 8px 0\"><b>Name:</b> {{name}}</p><p style=\"margin:0 0 8px 0\"><b>Email:</b> {{email}}</p><p style=\"margin:0 0 8px 0\"><b>Phone:</b> {{phone}}</p><p style=\"margin:0 0 8px 0\"><b>Program:</b> {{program}}</p><p style=\"margin:0;color:#a1a1aa\">Submitted at {{submittedAt}}</p></div></div></div>",
  adminText: "New submission: {{name}} | {{email}} | {{phone}} | {{program}} | {{submittedAt}}",
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

function toDateInputValue(input: unknown): string {
  if (input === null || input === undefined) return "";

  if (typeof input === "number" && Number.isFinite(input)) {
    // Support both Unix milliseconds and Google Sheets serial date values.
    const date = input > 1_000_000_000_000
      ? new Date(input)
      : new Date(Math.round((input - 25569) * 86400 * 1000));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
    return "";
  }

  const raw = String(input).trim();
  if (!raw) return "";

  const isoPrefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const normalized = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(normalized.getTime())) {
      return normalized.toISOString().slice(0, 10);
    }
  }

  return "";
}

function calculateEndDateFromStart(startDate: string, numberOfDays: number): string {
  if (!startDate || !numberOfDays || numberOfDays < 1) return "";
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  start.setDate(start.getDate() + (numberOfDays - 1));
  return start.toISOString().slice(0, 10);
}

export function normalizeCmsData(input: unknown): CmsData {
  if (!input || typeof input !== "object") {
    return {
      pricingPlans: defaultPlans,
      batchTimings: defaultBatchTimings,
      featuredEvent: defaultFeaturedEvent,
      lapPlans: defaultLapPlans,
      personalTraining: defaultPersonalTraining,
      emailSettings: defaultEmailSettings,
      emailTemplates: defaultEmailTemplates,
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

  const lapPlans: LapPlan[] = Array.isArray(data.lapPlans)
    ? (data.lapPlans as Array<Record<string, unknown>>)
        .map((plan) => {
          const numberOfDays = Number(plan.numberOfDays ?? 0);
          const startDate = toDateInputValue(plan.startDate);
          const endDateFromSheet = toDateInputValue(plan.endDate);
          return {
            title: String(plan.title ?? "").trim(),
            startDate,
            endDate: endDateFromSheet || calculateEndDateFromStart(startDate, numberOfDays),
            registrationCutoffHours: Number(plan.registrationCutoffHours ?? 6),
            numberOfDays,
            lapCharges: String(plan.lapCharges ?? "").trim(),
            shakeCharges: String(plan.shakeCharges ?? "").trim(),
            pricingMode: String(plan.pricingMode ?? "separate").trim().toLowerCase() === "combo" ? "combo" as const : "separate" as const,
            comboPrice: String(plan.comboPrice ?? "").trim(),
            description: String(plan.description ?? "").trim(),
            activities: toStringArray(plan.activities),
            dailyChecklist: toStringArray(plan.dailyChecklist),
            registrationFormEnabled: Boolean(plan.registrationFormEnabled),
            status: String(plan.status ?? "upcoming").trim().toLowerCase() === "live" ? "live" as const : "upcoming" as const,
          };
        })
        .filter((plan) => plan.title && plan.startDate)
    : defaultLapPlans;

  const personalTrainingRaw = (data.personalTraining ?? {}) as Record<string, unknown>;
  const personalTrainingImageUrl = String(personalTrainingRaw.imageUrl ?? "").trim();
  const personalTraining: PersonalTraining = {
    enabled: Boolean(personalTrainingRaw.enabled ?? defaultPersonalTraining.enabled),
    title: String(personalTrainingRaw.title ?? defaultPersonalTraining.title),
    price: String(personalTrainingRaw.price ?? defaultPersonalTraining.price),
    imageUrl:
      !personalTrainingImageUrl || personalTrainingImageUrl === legacyPersonalTrainingImageUrl
        ? defaultPersonalTraining.imageUrl
        : personalTrainingImageUrl,
    description: String(personalTrainingRaw.description ?? defaultPersonalTraining.description),
    features: toStringArray(personalTrainingRaw.features),
    ctaText: String(personalTrainingRaw.ctaText ?? defaultPersonalTraining.ctaText),
  };

  const emailSettingsRaw = (data.emailSettings ?? {}) as Record<string, unknown>;
  const emailSettings: EmailSettings = {
    enabled: Boolean(emailSettingsRaw.enabled),
    provider: (["gmail", "zoho", "stackmail", "yahoo", "titan", "custom"] as const).includes(
      String(emailSettingsRaw.provider ?? "gmail").toLowerCase() as SmtpProvider
    )
      ? (String(emailSettingsRaw.provider ?? "gmail").toLowerCase() as SmtpProvider)
      : "gmail",
    host: String(emailSettingsRaw.host ?? defaultEmailSettings.host),
    port: Number(emailSettingsRaw.port ?? defaultEmailSettings.port),
    secure: Boolean(emailSettingsRaw.secure),
    user: String(emailSettingsRaw.user ?? ""),
    password: String(emailSettingsRaw.password ?? ""),
    fromName: String(emailSettingsRaw.fromName ?? defaultEmailSettings.fromName),
    fromEmail: String(emailSettingsRaw.fromEmail ?? ""),
    adminNotifyEmails: toStringArray(emailSettingsRaw.adminNotifyEmails),
  };

  const emailTemplatesRaw = (data.emailTemplates ?? {}) as Record<string, unknown>;
  const emailTemplates: EmailTemplates = {
    userSubject: String(emailTemplatesRaw.userSubject ?? defaultEmailTemplates.userSubject),
    userHtml: String(emailTemplatesRaw.userHtml ?? defaultEmailTemplates.userHtml),
    userText: String(emailTemplatesRaw.userText ?? defaultEmailTemplates.userText),
    adminSubject: String(emailTemplatesRaw.adminSubject ?? defaultEmailTemplates.adminSubject),
    adminHtml: String(emailTemplatesRaw.adminHtml ?? defaultEmailTemplates.adminHtml),
    adminText: String(emailTemplatesRaw.adminText ?? defaultEmailTemplates.adminText),
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
    lapPlans: lapPlans.length > 0 ? lapPlans : defaultLapPlans,
    personalTraining,
    emailSettings,
    emailTemplates,
  };
}
