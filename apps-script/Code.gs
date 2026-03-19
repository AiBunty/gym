var SPREADSHEET_ID = "1dQosymyc5l_6wcPTjIip3M3wqj8jINH9eIY7NA5-KU8";
var CMS_SHEET_NAME = "CMS";
var SUBMISSIONS_SHEET_NAME = "Submissions";
var TRIAL_USERS_SHEET_NAME = "Trial Users";
var ADMIN_CREDS_SHEET_NAME = "Admin Credentials";
var LAP_REGISTRATIONS_SHEET_NAME = "LAP Registrations";
var LAP_PLANS_SHEET_NAME = "LAP Plans";
var PERSONAL_TRAINING_SHEET_NAME = "Personal Training";

function doGet(e) {
  try {
    ensureCoreSheetsInitialized_();
    ensureAdminCredentialsInitialized_();
    syncRequestedDefaultAdminCredentials_();
    const data = getCmsData_();
    return jsonResponse_({ ok: true, ...data });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      message: String(err && err.message ? err.message : err),
    });
  }
}

function doPost(e) {
  try {
    ensureCoreSheetsInitialized_();
    ensureAdminCredentialsInitialized_();
    syncRequestedDefaultAdminCredentials_();
    const body = parseJsonBody_(e);
    const params = (e && e.parameter) ? e.parameter : {};
    const action = String((body && body.action) || params.action || "");
    const username = String((body && body.username) || params.username || "");
    const password = String((body && body.password) || params.password || "");

    if (action === "saveCms") {
      saveCmsData_(body.data || {});
      return jsonResponse_({ ok: true, message: "CMS saved." });
    }

    if (action === "getRegistrations") {
      const registrations = getRegistrations_();
      return jsonResponse_({ ok: true, registrations });
    }

    if (action === "submitTrial") {
      saveTrialUser_(body.data || {});
      return jsonResponse_({ ok: true, message: "Trial submitted." });
    }

    if (action === "validateAdmin") {
      const isValid = validateAdminCredentials_(username, password);
      if (!isValid) {
        return jsonResponse_({ ok: false, message: "Invalid credentials" });
      }
      return jsonResponse_({ ok: true, message: "Valid credentials" });
    }

    if (action === "setAdminCredentials") {
      setAdminCredentials_(username, password);
      return jsonResponse_({ ok: true, message: "Admin credentials saved." });
    }

    if (action === "getTrialUsers") {
      const users = getTrialUsers_();
      return jsonResponse_({ ok: true, data: { users } });
    }

    if (action === "getPaymentUsers") {
      const users = getPaymentUsers_();
      return jsonResponse_({ ok: true, data: { users } });
    }

    if (action === "getPersonalTrainingUsers") {
      const users = getPersonalTrainingUsers_();
      return jsonResponse_({ ok: true, data: { users } });
    }

    if (action === "deleteUser") {
      deleteUser_(body.sheetName || "Submissions", body.rowIndex || 0);
      return jsonResponse_({ ok: true, message: "User deleted." });
    }

    if (action === "updatePaymentStatus") {
      updatePaymentStatus_(body.rowIndex || 0, body.paidStatus || "UNPAID");
      return jsonResponse_({ ok: true, message: "Payment status updated." });
    }

    if (action === "togglePlan") {
      togglePlanStatus_(body.planIndex || 0);
      return jsonResponse_({ ok: true, message: "Plan toggled." });
    }

    if (action === "toggleBatchTiming") {
      toggleBatchTimingStatus_(body.batchType || "", body.timingIndex || 0);
      return jsonResponse_({ ok: true, message: "Batch timing toggled." });
    }

    if (action === "initializeLapTabs") {
      const result = initializeLapTabs_();
      return jsonResponse_({ ok: true, message: "LAP tabs initialized.", data: result });
    }

    saveSubmission_(body || {});
    return jsonResponse_({ ok: true, message: "Submission saved." });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      message: String(err && err.message ? err.message : err),
    });
  }
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function ensureCoreSheetsInitialized_() {
  getOrCreateSheet_(SUBMISSIONS_SHEET_NAME, [
    "timestamp",
    "formType",
    "source",
    "submittedAt",
    "name",
    "phone",
    "email",
    "program",
    "planName",
    "planPrice",
    "batch",
    "goal",
    "notes",
    "dataJson",
  ]);

  getOrCreateSheet_(TRIAL_USERS_SHEET_NAME, [
    "timestamp",
    "name",
    "email",
    "phone",
    "age",
    "interests",
    "submittedAt",
  ]);

  getOrCreateSheet_(LAP_REGISTRATIONS_SHEET_NAME, [
    "timestamp",
    "submittedAt",
    "name",
    "phone",
    "email",
    "program",
    "planName",
    "startDate",
    "endDate",
    "numberOfDays",
    "lapCharges",
    "shakeCharges",
    "comboPrice",
    "goal",
    "notes",
    "dataJson",
  ]);

  getOrCreateSheet_(LAP_PLANS_SHEET_NAME, [
    "planId",
    "title",
    "startDate",
    "endDate",
    "registrationCutoffHours",
    "registrationCutoffAt",
    "numberOfDays",
    "lapCharges",
    "shakeCharges",
    "pricingMode",
    "comboPrice",
    "registrationFormEnabled",
    "status",
    "description",
    "activities",
    "dailyChecklist",
    "updatedAt",
  ]);

  getOrCreateSheet_(PERSONAL_TRAINING_SHEET_NAME, [
    "timestamp",
    "submittedAt",
    "name",
    "phone",
    "email",
    "goal",
    "preferredSlot",
    "notes",
    "planName",
    "planPrice",
    "dataJson",
  ]);

  ensureLapPlansSheetSeeded_();
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (headers && headers.length > 0 && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function getCmsData_() {
  const sheet = getOrCreateSheet_(CMS_SHEET_NAME, ["key", "value"]);

  if (sheet.getLastRow() < 2) {
    const defaults = {
      pricingPlans: [
        {
          name: "1 Month",
          price: "2500",
          features: ["All Gym Access", "Group Classes", "FREE Daily Energy Booster! 🥤"],
          attendance: "Physical Attendance",
          highlight: false,
        },
        {
          name: "3 Months",
          price: "7000",
          features: ["All Gym Access", "Group Classes", "FREE Daily Energy Booster! 🥤", "Save ₹500 vs monthly"],
          attendance: "Physical Attendance",
          highlight: false,
        },
        {
          name: "6 Months",
          price: "13000",
          features: ["All Gym Access", "Group Classes", "FREE Daily Energy Booster! 🥤", "Personalized Goal Setting", "Best Value for results!"],
          attendance: "Physical Attendance",
          highlight: true,
        },
        {
          name: "Online Class",
          price: "1800",
          features: ["Live Online Sessions", "Coach-Guided Workouts", "Single Online Membership Plan"],
          attendance: "Online Attendance",
          highlight: false,
        },
      ],
      batchTimings: {
        morning: ["6:00 AM", "7:00 AM", "8:00 AM"],
        evening: ["5:00 PM", "7:00 PM"],
        note: "Note: 4 PM & 6 PM slots are reserved for Personal Training",
      },
      featuredEvent: {
        enabled: false,
        title: "Featured Offering",
        subtitle: "",
        offerings: [],
        products: [],
        ctaText: "Contact Us",
      },
      lapPlans: getDefaultLapPlans_(),
      personalTraining: {
        enabled: true,
        title: "Personal Training",
        price: "8000",
        imageUrl: "https://images.unsplash.com/photo-1571019613914-85f342c55f55?auto=format&fit=crop&w=1200&q=80",
        description: "One-on-one coaching focused on body transformation and accountability.",
        features: ["Customized workout", "Weekly progress tracking", "Diet coaching", "Direct trainer attention"],
        ctaText: "Book Personal Training",
      },
      emailSettings: {
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
      },
      emailTemplates: {
        userSubject: "Welcome to Wani's Club Level Up",
        userHtml: "<div><h2>Hi {{name}}, welcome!</h2><p>Thanks for your submission for {{program}}.</p></div>",
        userText: "Hi {{name}}, thanks for your submission for {{program}}.",
        adminSubject: "New Website Form Submission - {{formType}}",
        adminHtml: "<div><h2>New Submission</h2><p>{{name}} | {{email}} | {{phone}} | {{program}}</p></div>",
        adminText: "New submission: {{name}} | {{email}} | {{phone}} | {{program}} | {{submittedAt}}",
      },
    };

    seedCmsSheet_(defaults);
    syncLapPlansSheet_(defaults.lapPlans);
    return defaults;
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const result = {};

  rows.forEach(function (row) {
    const key = String(row[0] || "").trim();
    const rawValue = String(row[1] || "").trim();
    if (!key) return;

    try {
      result[key] = rawValue ? JSON.parse(rawValue) : null;
    } catch (err) {
      result[key] = null;
    }
  });

  return {
    pricingPlans: Array.isArray(result.pricingPlans) ? result.pricingPlans : [],
    batchTimings: result.batchTimings || { morning: [], evening: [], note: "" },
    featuredEvent: result.featuredEvent || {
      enabled: false,
      title: "",
      subtitle: "",
      offerings: [],
      products: [],
      ctaText: "",
    },
    lapPlans: Array.isArray(result.lapPlans) && result.lapPlans.length > 0 ? result.lapPlans : getLapPlansFromSheet_(),
    personalTraining: result.personalTraining || {
      enabled: true,
      title: "Personal Training",
      price: "8000",
      imageUrl: "https://images.unsplash.com/photo-1571019613914-85f342c55f55?auto=format&fit=crop&w=1200&q=80",
      description: "One-on-one coaching focused on body transformation and accountability.",
      features: ["Customized workout", "Weekly progress tracking", "Diet coaching", "Direct trainer attention"],
      ctaText: "Book Personal Training",
    },
    emailSettings: result.emailSettings || {
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
    },
    emailTemplates: result.emailTemplates || {
      userSubject: "Welcome to Wani's Club Level Up",
      userHtml: "<div><h2>Hi {{name}}, welcome!</h2><p>Thanks for your submission for {{program}}.</p></div>",
      userText: "Hi {{name}}, thanks for your submission for {{program}}.",
      adminSubject: "New Website Form Submission - {{formType}}",
      adminHtml: "<div><h2>New Submission</h2><p>{{name}} | {{email}} | {{phone}} | {{program}}</p></div>",
      adminText: "New submission: {{name}} | {{email}} | {{phone}} | {{program}} | {{submittedAt}}",
    },
  };
}

function seedCmsSheet_(data) {
  const sheet = getOrCreateSheet_(CMS_SHEET_NAME, ["key", "value"]);
  const values = [
    ["pricingPlans", JSON.stringify(data.pricingPlans || [])],
    ["batchTimings", JSON.stringify(data.batchTimings || {})],
    ["featuredEvent", JSON.stringify(data.featuredEvent || {})],
    ["lapPlans", JSON.stringify(data.lapPlans || getDefaultLapPlans_())],
    ["personalTraining", JSON.stringify(data.personalTraining || {})],
    ["emailSettings", JSON.stringify(data.emailSettings || {})],
    ["emailTemplates", JSON.stringify(data.emailTemplates || {})],
  ];

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
  }

  sheet.getRange(2, 1, values.length, 2).setValues(values);
}

function saveCmsData_(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid CMS payload.");
  }

  const sheet = getOrCreateSheet_(CMS_SHEET_NAME, ["key", "value"]);
  const map = {
    pricingPlans: JSON.stringify(data.pricingPlans || []),
    batchTimings: JSON.stringify(data.batchTimings || {}),
    featuredEvent: JSON.stringify(data.featuredEvent || {}),
    lapPlans: JSON.stringify(data.lapPlans || []),
    personalTraining: JSON.stringify(data.personalTraining || {}),
    emailSettings: JSON.stringify(data.emailSettings || {}),
    emailTemplates: JSON.stringify(data.emailTemplates || {}),
  };

  const existing = sheet.getLastRow() >= 2 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues() : [];
  const keyToRow = {};

  existing.forEach(function (row, index) {
    keyToRow[String(row[0])] = index + 2;
  });

  Object.keys(map).forEach(function (key) {
    const rowIndex = keyToRow[key];
    if (rowIndex) {
      sheet.getRange(rowIndex, 2).setValue(map[key]);
    } else {
      sheet.appendRow([key, map[key]]);
    }
  });

  syncLapPlansSheet_(Array.isArray(data.lapPlans) ? data.lapPlans : []);
}

function getDefaultLapPlans_() {
  return [
    {
      title: "LAP 1 - 7 Day Demo",
      startDate: "2026-03-25",
      endDate: "2026-03-31",
      numberOfDays: 7,
      lapCharges: "4999",
      shakeCharges: "1200",
      pricingMode: "combo",
      comboPrice: "5999",
      registrationCutoffHours: 6,
      description: "Demo LAP batch with complete daily accountability and guided transformation.",
      activities: [
        "Registration form",
        "Daily weight photo submission",
        "Daily water intake noting",
        "Daily meal pics",
        "Daily habits tracking",
      ],
      dailyChecklist: [
        "Maintain good habits",
        "Complete 8 hrs sleep cycle",
        "Follow diet",
      ],
      registrationFormEnabled: true,
      status: "live",
    },
    {
      title: "LAP Next Month - 15 April",
      startDate: "2026-04-15",
      endDate: "2026-04-24",
      numberOfDays: 10,
      lapCharges: "6999",
      shakeCharges: "1500",
      pricingMode: "combo",
      comboPrice: "7999",
      registrationCutoffHours: 6,
      description: "Upcoming next-month LAP session with full tracking and coaching.",
      activities: [
        "Registration form",
        "Daily weight photo submission",
        "Daily water intake noting",
        "Daily meal pics",
        "Daily habits tracking",
      ],
      dailyChecklist: [
        "Maintain good habits",
        "Complete 8 hrs sleep cycle",
        "Follow diet",
      ],
      registrationFormEnabled: true,
      status: "upcoming",
    },
  ];
}

function ensureLapPlansSheetSeeded_() {
  const sheet = getOrCreateSheet_(LAP_PLANS_SHEET_NAME, [
    "planId",
    "title",
    "startDate",
    "endDate",
    "registrationCutoffHours",
    "registrationCutoffAt",
    "numberOfDays",
    "lapCharges",
    "shakeCharges",
    "pricingMode",
    "comboPrice",
    "registrationFormEnabled",
    "status",
    "description",
    "activities",
    "dailyChecklist",
    "updatedAt",
  ]);

  if (sheet.getLastRow() > 1) {
    return;
  }

  syncLapPlansSheet_(getDefaultLapPlans_());
}

function syncLapPlansSheet_(plans) {
  const safePlans = Array.isArray(plans) && plans.length > 0 ? plans : getDefaultLapPlans_();
  const sheet = getOrCreateSheet_(LAP_PLANS_SHEET_NAME, [
    "planId",
    "title",
    "startDate",
    "endDate",
    "registrationCutoffHours",
    "registrationCutoffAt",
    "numberOfDays",
    "lapCharges",
    "shakeCharges",
    "pricingMode",
    "comboPrice",
    "registrationFormEnabled",
    "status",
    "description",
    "activities",
    "dailyChecklist",
    "updatedAt",
  ]);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 17).clearContent();
  }

  const values = safePlans.map(function (plan, index) {
    var cutoffHours = Number(plan.registrationCutoffHours || 6);
    if (!isFinite(cutoffHours) || cutoffHours <= 0) {
      cutoffHours = 6;
    }

    var cutoffAt = "";
    if (plan.startDate) {
      var start = new Date(String(plan.startDate) + "T00:00:00");
      if (!isNaN(start.getTime())) {
        start.setHours(start.getHours() - cutoffHours);
        cutoffAt = start.toISOString();
      }
    }

    return [
      "LAP-" + (index + 1),
      String(plan.title || ""),
      String(plan.startDate || ""),
      String(plan.endDate || ""),
      cutoffHours,
      cutoffAt,
      Number(plan.numberOfDays || 0),
      String(plan.lapCharges || ""),
      String(plan.shakeCharges || ""),
      String(plan.pricingMode || "separate"),
      String(plan.comboPrice || ""),
      Boolean(plan.registrationFormEnabled),
      String(plan.status || "upcoming"),
      String(plan.description || ""),
      JSON.stringify(Array.isArray(plan.activities) ? plan.activities : []),
      JSON.stringify(Array.isArray(plan.dailyChecklist) ? plan.dailyChecklist : []),
      new Date().toISOString(),
    ];
  });

  sheet.getRange(2, 1, values.length, 17).setValues(values);
}

function getLapPlansFromSheet_() {
  const sheet = getOrCreateSheet_(LAP_PLANS_SHEET_NAME, [
    "planId",
    "title",
    "startDate",
    "endDate",
    "registrationCutoffHours",
    "registrationCutoffAt",
    "numberOfDays",
    "lapCharges",
    "shakeCharges",
    "pricingMode",
    "comboPrice",
    "registrationFormEnabled",
    "status",
    "description",
    "activities",
    "dailyChecklist",
    "updatedAt",
  ]);

  if (sheet.getLastRow() < 2) {
    return getDefaultLapPlans_();
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 17).getValues();
  return rows
    .map(function (row) {
      const title = String(row[1] || "");
      if (!title) return null;

      var activities = [];
      var dailyChecklist = [];

      try {
        activities = JSON.parse(String(row[14] || "[]"));
      } catch (err) {
        activities = [];
      }

      try {
        dailyChecklist = JSON.parse(String(row[15] || "[]"));
      } catch (err) {
        dailyChecklist = [];
      }

      var cutoffHours = Number(row[4] || 6);
      if (!isFinite(cutoffHours) || cutoffHours <= 0) {
        cutoffHours = 6;
      }

      return {
        title: title,
        startDate: String(row[2] || ""),
        endDate: String(row[3] || ""),
        registrationCutoffHours: cutoffHours,
        numberOfDays: Number(row[6] || 0),
        lapCharges: String(row[7] || ""),
        shakeCharges: String(row[8] || ""),
        pricingMode: String(row[9] || "separate"),
        comboPrice: String(row[10] || ""),
        registrationFormEnabled: String(row[11]) === "true" || row[11] === true,
        status: String(row[12] || "upcoming"),
        description: String(row[13] || ""),
        activities: Array.isArray(activities) ? activities : [],
        dailyChecklist: Array.isArray(dailyChecklist) ? dailyChecklist : [],
      };
    })
    .filter(function (plan) { return !!plan; });
}

function initializeLapTabs_() {
  ensureCoreSheetsInitialized_();
  const plansSheet = getOrCreateSheet_(LAP_PLANS_SHEET_NAME, []);
  const registrationsSheet = getOrCreateSheet_(LAP_REGISTRATIONS_SHEET_NAME, []);

  return {
    plansSheet: LAP_PLANS_SHEET_NAME,
    registrationsSheet: LAP_REGISTRATIONS_SHEET_NAME,
    plansRows: plansSheet.getLastRow(),
    registrationsRows: registrationsSheet.getLastRow(),
  };
}

function saveSubmission_(payload) {
  const sheet = getOrCreateSheet_(SUBMISSIONS_SHEET_NAME, [
    "timestamp",
    "formType",
    "source",
    "submittedAt",
    "name",
    "phone",
    "email",
    "program",
    "planName",
    "planPrice",
    "batch",
    "goal",
    "notes",
    "dataJson",
    "paidStatus",
  ]);

  ensureSubmissionsPaidStatusColumn_(sheet);

  const data = payload && payload.data && typeof payload.data === "object" ? payload.data : {};

  const row = [
    new Date(),
    String(payload.formType || ""),
    String(payload.source || ""),
    String(payload.submittedAt || ""),
    String(data.name || ""),
    String(data.phone || ""),
    String(data.email || ""),
    String(data.program || ""),
    String(data.planName || ""),
    String(data.planPrice || ""),
    String(data.batch || ""),
    String(data.goal || ""),
    String(data.notes || ""),
    JSON.stringify(data),
    "UNPAID",
  ];

  const formType = String(payload.formType || "").toLowerCase();
  const isLapEntry = isLapSubmission_(payload, data);
  const email = normalizeIdentity_(data.email);
  const phone = normalizeIdentity_(data.phone);

  if (!isLapEntry && (email || phone)) {
    const existingRow = findExistingSubmissionRow_(sheet, formType, email, phone);
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  } else {
    sheet.appendRow(row);
  }

  if (formType === "trial") {
    saveTrialUser_({
      name: data.name,
      email: data.email,
      phone: data.phone,
      age: data.age,
      interests: data.interests || data.goal || data.batch || "",
      submittedAt: payload.submittedAt || "",
    });
  }

  if (isLapEntry) {
    saveLapRegistration_(payload, data);
  }

  if (formType === "personal_training") {
    savePersonalTrainingLead_(payload, data);
  }
}

function saveLapRegistration_(payload, data) {
  const sheet = getOrCreateSheet_(LAP_REGISTRATIONS_SHEET_NAME, [
    "timestamp",
    "submittedAt",
    "name",
    "phone",
    "email",
    "program",
    "planName",
    "startDate",
    "endDate",
    "numberOfDays",
    "lapCharges",
    "shakeCharges",
    "comboPrice",
    "goal",
    "notes",
    "dataJson",
  ]);

  const row = [
    new Date(),
    String(payload.submittedAt || ""),
    String(data.name || ""),
    String(data.phone || ""),
    String(data.email || ""),
    String(data.program || ""),
    String(data.planName || ""),
    String(data.startDate || ""),
    String(data.endDate || ""),
    String(data.numberOfDays || ""),
    String(data.lapCharges || ""),
    String(data.shakeCharges || ""),
    String(data.comboPrice || ""),
    String(data.goal || ""),
    String(data.notes || ""),
    JSON.stringify(data),
  ];

  sheet.appendRow(row);
}

function savePersonalTrainingLead_(payload, data) {
  const sheet = getOrCreateSheet_(PERSONAL_TRAINING_SHEET_NAME, [
    "timestamp",
    "submittedAt",
    "name",
    "phone",
    "email",
    "goal",
    "preferredSlot",
    "notes",
    "planName",
    "planPrice",
    "dataJson",
  ]);

  const row = [
    new Date(),
    String(payload.submittedAt || ""),
    String(data.name || ""),
    String(data.phone || ""),
    String(data.email || ""),
    String(data.goal || ""),
    String(data.preferredSlot || ""),
    String(data.notes || ""),
    String(data.planName || "Personal Training"),
    String(data.planPrice || "8000"),
    JSON.stringify(data),
  ];

  sheet.appendRow(row);
}

function normalizeIdentity_(value) {
  return String(value || "").trim().toLowerCase();
}

function isLapSubmission_(payload, data) {
  const formType = String(payload && payload.formType || "").toLowerCase();
  if (formType !== "weight_loss_program") return false;

  const program = String(data && data.program || "").toLowerCase();
  const planName = String(data && data.planName || "").toLowerCase();
  return program.indexOf("lap") !== -1 || planName.indexOf("lap") !== -1;
}

function findExistingSubmissionRow_(sheet, formType, email, phone) {
  if (sheet.getLastRow() < 2) return 0;

  const rows = sheet.getRange(2, 2, sheet.getLastRow() - 1, 6).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    const rowFormType = String(rows[i][0] || "").trim().toLowerCase();
    const rowPhone = normalizeIdentity_(rows[i][4]);
    const rowEmail = normalizeIdentity_(rows[i][5]);

    if (rowFormType !== formType) continue;

    if (email && rowEmail === email) return i + 2;
    if (phone && rowPhone === phone) return i + 2;
  }

  return 0;
}

function getRegistrations_() {
  const sheet = getOrCreateSheet_(SUBMISSIONS_SHEET_NAME, [
    "timestamp",
    "formType",
    "source",
    "submittedAt",
    "name",
    "phone",
    "email",
    "program",
    "planName",
    "planPrice",
    "batch",
    "goal",
    "notes",
    "dataJson",
    "paidStatus",
  ]);

  ensureSubmissionsPaidStatusColumn_(sheet);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
  const registrations = [];

  data.forEach(function (row, index) {
    var details = {};
    try {
      details = JSON.parse(String(row[13] || "{}"));
    } catch (err) {
      details = {};
    }

    registrations.push({
      rowIndex: index + 2,
      timestamp: new Date(row[0]).toISOString(),
      formType: String(row[1] || ""),
      source: String(row[2] || ""),
      submittedAt: String(row[3] || ""),
      name: String(row[4] || ""),
      phone: String(row[5] || ""),
      email: String(row[6] || ""),
      program: String(row[7] || ""),
      planName: String(row[8] || ""),
      planPrice: String(row[9] || ""),
      batch: String(row[10] || ""),
      goal: String(row[11] || ""),
      notes: String(row[12] || ""),
      paidStatus: String(row[14] || "UNPAID"),
      age: String(details.age || ""),
      currentWeight: String(details.currentWeight || ""),
      targetWeight: String(details.targetWeight || ""),
      gender: String(details.gender || ""),
      strengthLevel: String(details.strengthLevel || ""),
      preferredSlot: String(details.preferredSlot || ""),
      startDate: String(details.startDate || ""),
      endDate: String(details.endDate || ""),
      numberOfDays: String(details.numberOfDays || ""),
      lapCharges: String(details.lapCharges || ""),
      shakeCharges: String(details.shakeCharges || ""),
      comboPrice: String(details.comboPrice || ""),
    });
  });

  return registrations;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== ADMIN AUTHENTICATION ====================
function ensureAdminCredentialsInitialized_() {
  const sheet = getOrCreateSheet_(ADMIN_CREDS_SHEET_NAME, ["username", "password_hash", "salt", "algo"]);

  if (sheet.getLastRow() >= 2) {
    return;
  }

  const defaultUsername = String(getScriptProperty_("ADMIN_DEFAULT_USERNAME") || "admin");
  const defaultPassword = String(getScriptProperty_("ADMIN_DEFAULT_PASSWORD") || "admin123");
  const salt = generateSalt_();
  const hash = createSecureHash_(defaultPassword, salt);

  sheet.appendRow([defaultUsername, hash, salt, "sha256-50000"]);
}

function syncRequestedDefaultAdminCredentials_() {
  // Run only once, then stop overriding credentials on subsequent requests.
  if (getScriptProperty_("ADMIN_DEFAULT_SYNC_DONE") === "1") {
    return;
  }

  setAdminCredentials_("admin", "admin123");
  setScriptProperty_("ADMIN_DEFAULT_SYNC_DONE", "1");
}

function validateAdminCredentials_(username, password) {
  ensureAdminCredentialsInitialized_();
  const sheet = getOrCreateSheet_(ADMIN_CREDS_SHEET_NAME, ["username", "password_hash", "salt", "algo"]);

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

  for (var i = 0; i < rows.length; i++) {
    const rowUsername = String(rows[i][0] || "");
    if (rowUsername !== String(username || "")) continue;

    const storedHash = String(rows[i][1] || "");
    const storedSalt = String(rows[i][2] || "");
    const algo = String(rows[i][3] || "");

    if (algo === "sha256-50000" && storedSalt) {
      return createSecureHash_(String(password || ""), storedSalt) === storedHash;
    }

    // Legacy migration path: old values might be md5("admin") or prior weak hash.
    const legacyOk = isLegacyHashMatch_(String(password || ""), storedHash);
    if (!legacyOk) return false;

    const newSalt = generateSalt_();
    const newHash = createSecureHash_(String(password || ""), newSalt);
    sheet.getRange(i + 2, 2, 1, 3).setValues([[newHash, newSalt, "sha256-50000"]]);
    return true;
  }

  return false;
}

function setAdminCredentials_(username, password) {
  const normalizedUsername = String(username || "").trim();
  const rawPassword = String(password || "");

  if (!normalizedUsername) {
    throw new Error("Username is required.");
  }

  if (rawPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const sheet = getOrCreateSheet_(ADMIN_CREDS_SHEET_NAME, ["username", "password_hash", "salt", "algo"]);
  const salt = generateSalt_();
  const hash = createSecureHash_(rawPassword, salt);

  if (sheet.getLastRow() < 2) {
    sheet.appendRow([normalizedUsername, hash, salt, "sha256-50000"]);
    return;
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < rows.length; i++) {
    const existingUsername = String(rows[i][0] || "").trim();
    if (existingUsername === normalizedUsername) {
      sheet.getRange(i + 2, 2, 1, 3).setValues([[hash, salt, "sha256-50000"]]);
      return;
    }
  }

  sheet.appendRow([normalizedUsername, hash, salt, "sha256-50000"]);
}

function isLegacyHashMatch_(password, storedHash) {
  if (!storedHash) return false;

  // Match legacy md5 values
  if (storedHash.length === 32) {
    const md5 = digestToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, password));
    if (md5 === storedHash) return true;
  }

  // Match legacy weak numeric hash values
  return createLegacyHash_(password) === storedHash;
}

function createLegacyHash_(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var charCode = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + charCode;
    hash = hash & hash;
  }
  return String(hash);
}

function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setScriptProperty_(key, value) {
  PropertiesService.getScriptProperties().setProperty(String(key), String(value));
}

function createSecureHash_(password, salt) {
  var value = String(password || "") + ":" + String(salt || "");

  // Iterative SHA-256 stretching for stronger resistance to brute-force attacks.
  for (var i = 0; i < 50000; i++) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
    value = digestToHex_(digest) + ":" + salt;
  }

  return value.split(":")[0];
}

function digestToHex_(bytes) {
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

// ==================== TRIAL USERS MANAGEMENT ====================
function saveTrialUser_(data) {
  const sheet = getOrCreateSheet_(TRIAL_USERS_SHEET_NAME, [
    "timestamp",
    "name",
    "email",
    "phone",
    "age",
    "interests",
    "submittedAt"
  ]);

  const row = [
    new Date(),
    String(data.name || ""),
    String(data.email || ""),
    String(data.phone || ""),
    String(data.age || ""),
    String(data.interests || ""),
    String(data.submittedAt || "")
  ];

  const email = normalizeIdentity_(data.email);
  const phone = normalizeIdentity_(data.phone);
  const existingRow = findExistingTrialRow_(sheet, email, phone);

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function findExistingTrialRow_(sheet, email, phone) {
  if (sheet.getLastRow() < 2) return 0;

  const rows = sheet.getRange(2, 3, sheet.getLastRow() - 1, 2).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    const rowEmail = normalizeIdentity_(rows[i][0]);
    const rowPhone = normalizeIdentity_(rows[i][1]);

    if (email && rowEmail === email) return i + 2;
    if (phone && rowPhone === phone) return i + 2;
  }

  return 0;
}

function getTrialUsers_() {
  const sheet = getOrCreateSheet_(TRIAL_USERS_SHEET_NAME, [
    "timestamp",
    "name",
    "email",
    "phone",
    "age",
    "interests",
    "submittedAt"
  ]);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  const users = [];

  data.forEach(function (row, index) {
    users.push({
      rowIndex: index + 2,
      timestamp: new Date(row[0]).toISOString(),
      name: String(row[1] || ""),
      email: String(row[2] || ""),
      phone: String(row[3] || ""),
      age: String(row[4] || ""),
      interests: String(row[5] || ""),
      submittedAt: String(row[6] || "")
    });
  });

  return users;
}

function getPaymentUsers_() {
  const sheet = getOrCreateSheet_(SUBMISSIONS_SHEET_NAME, [
    "timestamp",
    "formType",
    "source",
    "submittedAt",
    "name",
    "phone",
    "email",
    "program",
    "planName",
    "planPrice",
    "batch",
    "goal",
    "notes",
    "dataJson",
    "paidStatus",
  ]);

  ensureSubmissionsPaidStatusColumn_(sheet);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
  const users = [];

  data.forEach(function (row, index) {
    users.push({
      rowIndex: index + 2,
      timestamp: new Date(row[0]).toISOString(),
      formType: String(row[1] || ""),
      source: String(row[2] || ""),
      submittedAt: String(row[3] || ""),
      name: String(row[4] || ""),
      phone: String(row[5] || ""),
      email: String(row[6] || ""),
      program: String(row[7] || ""),
      planName: String(row[8] || ""),
      planPrice: String(row[9] || ""),
      batch: String(row[10] || ""),
      goal: String(row[11] || ""),
      notes: String(row[12] || ""),
      paidStatus: String(row[14] || "UNPAID")
    });
  });

  return users;
}

function getPersonalTrainingUsers_() {
  const sheet = getOrCreateSheet_(PERSONAL_TRAINING_SHEET_NAME, [
    "timestamp",
    "submittedAt",
    "name",
    "phone",
    "email",
    "goal",
    "preferredSlot",
    "notes",
    "planName",
    "planPrice",
    "dataJson",
  ]);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
  const users = [];

  data.forEach(function (row, index) {
    users.push({
      rowIndex: index + 2,
      timestamp: new Date(row[0]).toISOString(),
      submittedAt: String(row[1] || ""),
      name: String(row[2] || ""),
      phone: String(row[3] || ""),
      email: String(row[4] || ""),
      goal: String(row[5] || ""),
      preferredSlot: String(row[6] || ""),
      notes: String(row[7] || ""),
      planName: String(row[8] || ""),
      planPrice: String(row[9] || ""),
    });
  });

  return users;
}

// ==================== USER DELETION ====================
function deleteUser_(sheetName, rowIndex) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error("Sheet not found");
  }
  
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error("Invalid row index");
  }
  
  sheet.deleteRow(rowIndex);
}

function updatePaymentStatus_(rowIndex, paidStatus) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SUBMISSIONS_SHEET_NAME);

  if (!sheet) {
    throw new Error("Submissions sheet not found");
  }

  ensureSubmissionsPaidStatusColumn_(sheet);

  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error("Invalid row index");
  }

  const normalized = String(paidStatus || "UNPAID").toUpperCase() === "PAID" ? "PAID" : "UNPAID";
  const paidStatusCol = findHeaderColumn_(sheet, "paidStatus");
  if (!paidStatusCol) {
    throw new Error("paidStatus column missing");
  }

  sheet.getRange(rowIndex, paidStatusCol).setValue(normalized);
}

function ensureSubmissionsPaidStatusColumn_(sheet) {
  if (!sheet || sheet.getLastRow() < 1) return;

  var paidStatusCol = findHeaderColumn_(sheet, "paidStatus");
  if (paidStatusCol) return;

  paidStatusCol = Math.max(1, sheet.getLastColumn()) + 1;
  sheet.getRange(1, paidStatusCol).setValue("paidStatus");

  if (sheet.getLastRow() > 1) {
    var rows = sheet.getLastRow() - 1;
    var values = [];
    for (var i = 0; i < rows; i++) {
      values.push(["UNPAID"]);
    }
    sheet.getRange(2, paidStatusCol, rows, 1).setValues(values);
  }
}

function findHeaderColumn_(sheet, headerName) {
  if (!sheet || sheet.getLastRow() < 1) return 0;
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i] || "").trim() === headerName) {
      return i + 1;
    }
  }
  return 0;
}

// ==================== TOGGLE SYSTEM ====================
function togglePlanStatus_(planIndex) {
  const cmsData = getCmsData_();
  
  if (!cmsData.pricingPlans || planIndex >= cmsData.pricingPlans.length) {
    throw new Error("Plan not found");
  }
  
  const plan = cmsData.pricingPlans[planIndex];
  plan.inactive = !plan.inactive; // Toggle inactive flag
  
  saveCmsData_(cmsData);
}

function toggleBatchTimingStatus_(batchType, timingIndex) {
  const cmsData = getCmsData_();
  const timings = cmsData.batchTimings[batchType];
  
  if (!timings || timingIndex >= timings.length) {
    throw new Error("Timing not found");
  }
  
  // Store inactive statuses in a separate field
  if (!cmsData.batchTimings.inactiveTimings) {
    cmsData.batchTimings.inactiveTimings = {};
    cmsData.batchTimings.inactiveTimings[batchType] = {};
  }
  
  const key = String(timingIndex);
  cmsData.batchTimings.inactiveTimings[batchType][key] = !cmsData.batchTimings.inactiveTimings[batchType][key];
  
  saveCmsData_(cmsData);
}
