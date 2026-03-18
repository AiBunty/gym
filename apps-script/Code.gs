const SPREADSHEET_ID = "1dQosymyc5l_6wcPTjIip3M3wqj8jINH9eIY7NA5-KU8";
const CMS_SHEET_NAME = "CMS";
const SUBMISSIONS_SHEET_NAME = "Submissions";
const TRIAL_USERS_SHEET_NAME = "Trial Users";
const ADMIN_CREDS_SHEET_NAME = "Admin Credentials";

function doGet(e) {
  try {
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
    const body = parseJsonBody_(e);

    if (body && body.action === "saveCms") {
      saveCmsData_(body.data || {});
      return jsonResponse_({ ok: true, message: "CMS saved." });
    }

    if (body && body.action === "getRegistrations") {
      const registrations = getRegistrations_();
      return jsonResponse_({ ok: true, registrations });
    }

    if (body && body.action === "submitTrial") {
      saveTrialUser_(body.data || {});
      return jsonResponse_({ ok: true, message: "Trial submitted." });
    }

    if (body && body.action === "validateAdmin") {
      const isValid = validateAdminCredentials_(body.username, body.password);
      if (!isValid) {
        return jsonResponse_({ ok: false, message: "Invalid credentials" });
      }
      return jsonResponse_({ ok: true, message: "Valid credentials" });
    }

    if (body && body.action === "getTrialUsers") {
      const users = getTrialUsers_();
      return jsonResponse_({ ok: true, data: { users } });
    }

    if (body && body.action === "getPaymentUsers") {
      const users = getPaymentUsers_();
      return jsonResponse_({ ok: true, data: { users } });
    }

    if (body && body.action === "deleteUser") {
      deleteUser_(body.sheetName || "Submissions", body.rowIndex || 0);
      return jsonResponse_({ ok: true, message: "User deleted." });
    }

    if (body && body.action === "togglePlan") {
      togglePlanStatus_(body.planIndex || 0);
      return jsonResponse_({ ok: true, message: "Plan toggled." });
    }

    if (body && body.action === "toggleBatchTiming") {
      toggleBatchTimingStatus_(body.batchType || "", body.timingIndex || 0);
      return jsonResponse_({ ok: true, message: "Batch timing toggled." });
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
    };

    seedCmsSheet_(defaults);
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
  };
}

function seedCmsSheet_(data) {
  const sheet = getOrCreateSheet_(CMS_SHEET_NAME, ["key", "value"]);
  const values = [
    ["pricingPlans", JSON.stringify(data.pricingPlans || [])],
    ["batchTimings", JSON.stringify(data.batchTimings || {})],
    ["featuredEvent", JSON.stringify(data.featuredEvent || {})],
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
  ]);

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
  ];

  sheet.appendRow(row);
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
  ]);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  const registrations = [];

  data.forEach(function (row) {
    registrations.push({
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
function validateAdminCredentials_(username, password) {
  const sheet = getOrCreateSheet_(ADMIN_CREDS_SHEET_NAME, ["username", "password_hash", "salt", "algo"]);

  // Initialize with secure default admin user when the sheet is empty.
  // Default password: admin123 (change in sheet after first login).
  if (sheet.getLastRow() < 2) {
    const salt = generateSalt_();
    const hash = createSecureHash_("admin123", salt);
    sheet.appendRow(["admin", hash, salt, "sha256-50000"]);
  }

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

  sheet.appendRow(row);
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
  ]);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
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
      notes: String(row[12] || "")
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
