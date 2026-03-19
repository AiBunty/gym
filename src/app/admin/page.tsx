"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultBatchTimings, defaultEmailSettings, defaultEmailTemplates, defaultFeaturedEvent, defaultLapPlans, defaultPersonalTraining, defaultPlans, type CmsData, type LapPlan, type Plan } from "@/lib/cms";
import { Plus, Trash2, Save, RefreshCw, Mail, BarChart3, Download, LogOut, ToggleLeft, ToggleRight, Eye, EyeOff, Loader2 } from "lucide-react";

const defaultData: CmsData = {
  pricingPlans: defaultPlans,
  batchTimings: defaultBatchTimings,
  featuredEvent: defaultFeaturedEvent,
  lapPlans: defaultLapPlans,
  personalTraining: defaultPersonalTraining,
  emailSettings: defaultEmailSettings,
  emailTemplates: defaultEmailTemplates,
};

type CmsSectionKey =
  | "batchTimings"
  | "pricingPlans"
  | "lapPlans"
  | "personalTraining"
  | "featuredEvent"
  | "emailSettings"
  | "emailTemplates";

const cmsSectionLabels: Record<CmsSectionKey, string> = {
  batchTimings: "Batch Timings",
  pricingPlans: "Pricing Plans",
  lapPlans: "LAP Sessions",
  personalTraining: "Personal Training",
  featuredEvent: "Featured Event",
  emailSettings: "SMTP Settings",
  emailTemplates: "Email Templates",
};

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [adminKey, setAdminKey] = useState("");
  const [cmsData, setCmsData] = useState<CmsData>(defaultData);
  const [lastSavedCmsData, setLastSavedCmsData] = useState<CmsData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializingLapTabs, setIsInitializingLapTabs] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [cmsUsingDefaults, setCmsUsingDefaults] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState("admin");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [showAdminCredentialsPassword, setShowAdminCredentialsPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  const openDatePicker = (input: HTMLInputElement | null) => {
    const pickerInput = input as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!pickerInput?.showPicker) return;

    try {
      pickerInput.showPicker();
    } catch {
      // Ignore browsers that reject programmatic picker opening.
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkToken = async () => {
      const storedToken = localStorage.getItem("admin_token");
      if (!storedToken) {
        router.push("/admin-login");
        setIsAuthChecking(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/auth/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: storedToken }),
        });

        const result = await response.json();
        if (result?.ok) {
          setToken(storedToken);
        } else {
          localStorage.removeItem("admin_token");
          router.push("/admin-login");
        }
      } catch {
        localStorage.removeItem("admin_token");
        router.push("/admin-login");
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkToken();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin-login");
  };

  const handleUnauthorizedResponse = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setStatusMessage("Session expired. Please login again.");
    router.push("/admin-login");
  };

  const loadCms = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/cms", { cache: "no-store" });
      const result = await response.json();

      setCmsUsingDefaults(Boolean(result?.usingDefaults));

      if (result?.data) {
        setCmsData(result.data as CmsData);
        setLastSavedCmsData(result.data as CmsData);
      }

      if (result?.ok && result?.data) {
        setStatusMessage(
          result?.usingDefaults
            ? "Google Sheet CMS tab is empty. Showing code defaults. Enter admin key and click Seed CMS Sheet."
            : "CMS loaded successfully from Google Sheet."
        );
      } else {
        setCmsUsingDefaults(true);
        setStatusMessage(result?.message || "Unable to load CMS data. Using defaults.");
      }
    } catch {
      setCmsUsingDefaults(true);
      setStatusMessage("Unable to load CMS data. Using defaults.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCms();
  }, [loadCms]);

  const getSectionData = (data: CmsData, section: CmsSectionKey) => data[section];

  const hasUnsavedSection = (section: CmsSectionKey) => {
    return JSON.stringify(getSectionData(cmsData, section)) !== JSON.stringify(getSectionData(lastSavedCmsData, section));
  };

  const saveCms = async (section?: CmsSectionKey) => {
    if (section && !hasUnsavedSection(section)) {
      setStatusMessage(`${cmsSectionLabels[section]} has no unsaved changes.`);
      return;
    }

    if (!token && !adminKey.trim()) {
      setStatusMessage(
        section
          ? `${cmsSectionLabels[section]} not saved. Enter admin key or login again.`
          : "Enter admin key or login again before saving."
      );
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/admin/cms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey,
          token,
          data: cmsData,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        setStatusMessage(section ? `${cmsSectionLabels[section]} not saved. ${result?.message || "Save failed."}` : result?.message || "Save failed.");
        return;
      }

      setCmsUsingDefaults(false);
      setLastSavedCmsData(cmsData);
      if (section) {
        setStatusMessage(`${cmsSectionLabels[section]} saved to Google Sheet.`);
      } else {
        setStatusMessage(cmsUsingDefaults ? "Default CMS values saved to Google Sheet." : "Saved to Google Sheet via Apps Script.");
      }
    } catch {
      setStatusMessage(section ? `${cmsSectionLabels[section]} not saved due to network error.` : "Save failed due to network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAdminCredentials = async () => {
    if (!newAdminUsername.trim()) {
      setStatusMessage("Enter admin username.");
      return;
    }

    if (newAdminPassword.length < 6) {
      setStatusMessage("Admin password must be at least 6 characters.");
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setStatusMessage("Password and confirm password do not match.");
      return;
    }

    if (!token) {
      setStatusMessage("Session expired. Please login again.");
      return;
    }

    setIsSavingCredentials(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/admin/auth/set-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          username: newAdminUsername.trim(),
          password: newAdminPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok) {
        setStatusMessage(result?.message || "Failed to save admin credentials.");
        return;
      }

      setNewAdminPassword("");
      setConfirmAdminPassword("");
      setStatusMessage("Admin credentials saved in Google Sheet.");
    } catch {
      setStatusMessage("Failed to save admin credentials.");
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const updatePlan = (index: number, patch: Partial<Plan>) => {
    setCmsData((prev) => ({
      ...prev,
      pricingPlans: prev.pricingPlans.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)),
    }));
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    setCmsData((prev) => ({
      ...prev,
      pricingPlans: prev.pricingPlans.map((plan, i) => {
        if (i !== planIndex) return plan;
        return {
          ...plan,
          features: plan.features.map((feature, fi) => (fi === featureIndex ? value : feature)),
        };
      }),
    }));
  };

  const addFeature = (planIndex: number) => {
    setCmsData((prev) => ({
      ...prev,
      pricingPlans: prev.pricingPlans.map((plan, i) => (i === planIndex ? { ...plan, features: [...plan.features, "New Feature"] } : plan)),
    }));
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setCmsData((prev) => ({
      ...prev,
      pricingPlans: prev.pricingPlans.map((plan, i) => {
        if (i !== planIndex) return plan;
        return {
          ...plan,
          features: plan.features.filter((_, fi) => fi !== featureIndex),
        };
      }),
    }));
  };

  const addPlan = () => {
    setCmsData((prev) => ({
      ...prev,
      pricingPlans: [
        ...prev.pricingPlans,
        {
          name: "New Plan",
          price: "0",
          attendance: "Physical Attendance",
          features: ["Describe benefit"],
          highlight: false,
        },
      ],
    }));
  };

  const removePlan = (index: number) => {
    setCmsData((prev) => ({
      ...prev,
      pricingPlans: prev.pricingPlans.filter((_, i) => i !== index),
    }));
  };

  const updateLapPlan = (index: number, patch: Partial<LapPlan>) => {
    setCmsData((prev) => ({
      ...prev,
      lapPlans: (prev.lapPlans || []).map((plan, i) => (i === index ? { ...plan, ...patch } : plan)),
    }));
  };

  const addLapPlan = () => {
    setCmsData((prev) => ({
      ...prev,
      lapPlans: [
        ...(prev.lapPlans || []),
        {
          title: "LAP New Session",
          startDate: "",
          endDate: "",
          registrationCutoffHours: 6,
          numberOfDays: 7,
          lapCharges: "0",
          shakeCharges: "0",
          pricingMode: "separate",
          comboPrice: "0",
          description: "",
          activities: ["Registration form"],
          dailyChecklist: ["Follow diet"],
          registrationFormEnabled: true,
          status: "upcoming",
        },
      ],
    }));
  };

  const removeLapPlan = (index: number) => {
    setCmsData((prev) => ({
      ...prev,
      lapPlans: (prev.lapPlans || []).filter((_, i) => i !== index),
    }));
  };

  const calculateLapEndDate = (startDate: string, numberOfDays: number): string => {
    if (!startDate || !numberOfDays || numberOfDays < 1) return "";

    const start = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return "";

    start.setDate(start.getDate() + (numberOfDays - 1));
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, "0");
    const day = String(start.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const updateLapStartDate = (index: number, startDate: string) => {
    setCmsData((prev) => ({
      ...prev,
      lapPlans: (prev.lapPlans || []).map((plan, i) => {
        if (i !== index) return plan;
        return {
          ...plan,
          startDate,
          endDate: calculateLapEndDate(startDate, Number(plan.numberOfDays || 0)),
        };
      }),
    }));
  };

  const updateLapNumberOfDays = (index: number, numberOfDays: number) => {
    const safeDays = Math.max(1, numberOfDays || 1);
    setCmsData((prev) => ({
      ...prev,
      lapPlans: (prev.lapPlans || []).map((plan, i) => {
        if (i !== index) return plan;
        return {
          ...plan,
          numberOfDays: safeDays,
          endDate: calculateLapEndDate(plan.startDate, safeDays),
        };
      }),
    }));
  };

  // Reports & Email State
  const [activeTab, setActiveTab] = useState<"cms" | "reports" | "lapReports" | "trial" | "payment" | "pt" | "email">("cms");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [programFilter, setProgramFilter] = useState<"All" | "LAP 7 Days" | "LAP 10 Days">("All");
  const [lapPaymentFilter, setLapPaymentFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [expandedLapRows, setExpandedLapRows] = useState<number[]>([]);
  
  // Trial Users State
  const [trialUsers, setTrialUsers] = useState<any[]>([]);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialDateRangeStart, setTrialDateRangeStart] = useState("");
  const [trialDateRangeEnd, setTrialDateRangeEnd] = useState("");
  
  // Payment Users State
  const [paymentUsers, setPaymentUsers] = useState<any[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDateRangeStart, setPaymentDateRangeStart] = useState("");
  const [paymentDateRangeEnd, setPaymentDateRangeEnd] = useState("");

  // Personal Training Users State
  const [ptUsers, setPtUsers] = useState<any[]>([]);
  const [ptLoading, setPtLoading] = useState(false);
  
  // Email State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailHtmlBody, setEmailHtmlBody] = useState("");
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailAllSelected, setEmailAllSelected] = useState(false);
  const [emailAudienceSource, setEmailAudienceSource] = useState<"trial" | "payment" | "all">("all");
  const [smtpTestEmail, setSmtpTestEmail] = useState("");
  const [smtpTestLoading, setSmtpTestLoading] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    ok: boolean;
    message: string;
    suggestion?: string;
    technical?: string;
    details?: Record<string, unknown>;
  } | null>(null);
  const [selectedManualTemplatePreset, setSelectedManualTemplatePreset] = useState<"trial" | "plan_enquiry" | "lap">("trial");
  const [isSendingUnpaidReminders, setIsSendingUnpaidReminders] = useState(false);
  const [statusUpdatingRow, setStatusUpdatingRow] = useState<number | null>(null);
  const [deletingRows, setDeletingRows] = useState<string[]>([]);

  const getDeleteRowKey = (sheetName: string, rowIndex: number) => `${sheetName}:${Number(rowIndex)}`;

  const markRowDeleting = (sheetName: string, rowIndex: number) => {
    const rowKey = getDeleteRowKey(sheetName, rowIndex);
    setDeletingRows((prev) => (prev.includes(rowKey) ? prev : [...prev, rowKey]));
  };

  const clearRowDeleting = (sheetName: string, rowIndex: number) => {
    const rowKey = getDeleteRowKey(sheetName, rowIndex);
    setDeletingRows((prev) => prev.filter((value) => value !== rowKey));
  };

  const isRowDeleting = (sheetName: string, rowIndex: number) =>
    deletingRows.includes(getDeleteRowKey(sheetName, rowIndex));

  const activeAsyncLabel =
    deletingRows.length > 0 ? "Updating rows..." :
    statusUpdatingRow !== null ? "Updating payment status..." :
    isSendingUnpaidReminders ? "Sending unpaid reminders..." :
    emailSending ? "Sending email campaign..." :
    smtpTestLoading ? "Sending SMTP test..." :
    registrationsLoading ? "Fetching reports..." :
    trialLoading ? "Fetching trial users..." :
    paymentLoading ? "Fetching payment users..." :
    ptLoading ? "Fetching PT leads..." :
    isInitializingLapTabs ? "Initializing LAP tabs..." :
    isSavingCredentials ? "Saving admin credentials..." :
    isSaving ? "Saving CMS changes..." :
    isLoading ? "Reloading CMS..." :
    "";

  useEffect(() => {
    setEmailRecipients([]);
    setEmailAllSelected(false);
  }, [emailAudienceSource]);

  const applySmtpProviderDefaults = (provider: "gmail" | "zoho" | "stackmail" | "yahoo" | "titan" | "custom") => {
    const defaults = {
      gmail: { host: "smtp.gmail.com", port: 587, secure: false },
      zoho: { host: "smtp.zoho.com", port: 587, secure: false },
      stackmail: { host: "smtp.stackmail.com", port: 587, secure: false },
      yahoo: { host: "smtp.mail.yahoo.com", port: 587, secure: false },
      titan: { host: "smtp.titan.email", port: 587, secure: false },
      custom: { host: "", port: 587, secure: false },
    }[provider];

    setCmsData((prev) => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        provider,
        host: defaults.host,
        port: defaults.port,
        secure: defaults.secure,
      },
    }));
  };

  const initializeLapTabs = async () => {
    if (!token) {
      setStatusMessage("Session expired. Please login again.");
      return;
    }

    setIsInitializingLapTabs(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/admin/initialize-lap-tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok) {
        setStatusMessage(result?.message || "Failed to initialize LAP tabs.");
        return;
      }

      setStatusMessage("LAP tabs initialized successfully in Google Sheets.");
    } catch {
      setStatusMessage("Failed to initialize LAP tabs.");
    } finally {
      setIsInitializingLapTabs(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!token && !adminKey.trim()) {
      setStatusMessage("Session expired. Please login again or enter admin key.");
      return;
    }
    
    setRegistrationsLoading(true);
    setStatusMessage("");
    
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, token }),
      });

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }
      
      const result = await response.json();
      if (result?.ok && result?.data?.registrations) {
        setRegistrations(result.data.registrations);
        setStatusMessage(`Loaded ${result.data.registrations.length} registrations.`);
      } else {
        setStatusMessage(result?.message || "Failed to load registrations.");
      }
    } catch (error) {
      setStatusMessage("Failed to fetch registrations.");
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = registrations;
    
    // Filter by date range
    if (dateRangeStart || dateRangeEnd) {
      const start = dateRangeStart ? new Date(dateRangeStart).getTime() : 0;
      const end = dateRangeEnd ? new Date(dateRangeEnd).getTime() : Infinity;
      filtered = filtered.filter((reg) => {
        const regDate = new Date(reg.submittedAt).getTime();
        return regDate >= start && regDate <= end;
      });
    }
    
    // Filter by program
    if (programFilter !== "All") {
      filtered = filtered.filter((reg) => {
        if (programFilter === "LAP 7 Days") return reg.planName?.includes("7");
        if (programFilter === "LAP 10 Days") return reg.planName?.includes("10");
        return true;
      });
    }
    
    return filtered;
  };

  const filteredRegistrations = filterRegistrations();

  const isLapRegistration = (registration: any) => {
    const formType = String(registration?.formType || "").toLowerCase();
    const planName = String(registration?.planName || "").toLowerCase();
    const program = String(registration?.program || "").toLowerCase();
    return formType === "weight_loss_program" || planName.includes("lap") || program.includes("lap");
  };

  const getLapEventName = (registration: any) => {
    const plan = String(registration?.planName || "").trim();
    if (plan) return plan;
    const program = String(registration?.program || "").trim();
    if (program) return program;
    return "Unassigned LAP Session";
  };

  const getLapRegistrations = () => {
    return filteredRegistrations.filter(isLapRegistration);
  };

  const getVisibleLapRegistrations = () => {
    const lapRows = getLapRegistrations();
    if (lapPaymentFilter === "ALL") return lapRows;
    return lapRows.filter((row) => String(row?.paidStatus || "UNPAID") === lapPaymentFilter);
  };

  const groupLapRegistrations = () => {
    const grouped: Record<string, any[]> = {};
    for (const registration of getVisibleLapRegistrations()) {
      const eventName = getLapEventName(registration);
      if (!grouped[eventName]) grouped[eventName] = [];
      grouped[eventName].push(registration);
    }
    return grouped;
  };

  const toggleLapDetails = (rowIndex: number) => {
    setExpandedLapRows((prev) =>
      prev.includes(rowIndex)
        ? prev.filter((value) => value !== rowIndex)
        : [...prev, rowIndex]
    );
  };

  const getEmailAudienceUsers = () => {
    const trial = filterTrialUsers().map((user) => ({
      source: "trial",
      name: user.name,
      email: user.email,
      label: user.interests || "2-Day Trial",
    }));

    const payment = filterPaymentUsers().map((user) => ({
      source: "payment",
      name: user.name,
      email: user.email,
      label: user.planName || user.program || "Paid Program",
    }));

    if (emailAudienceSource === "trial") return trial;
    if (emailAudienceSource === "payment") return payment;

    const merged = [...trial, ...payment].filter((user) => Boolean(user.email));
    const seen = new Set<string>();
    return merged.filter((user) => {
      if (seen.has(user.email)) return false;
      seen.add(user.email);
      return true;
    });
  };

  const emailAudienceUsers = getEmailAudienceUsers();

  const loadAudienceUsers = async () => {
    if (emailAudienceSource === "trial") {
      await fetchTrialUsers();
      return;
    }
    if (emailAudienceSource === "payment") {
      await fetchPaymentUsers();
      return;
    }
    await Promise.all([fetchTrialUsers(), fetchPaymentUsers()]);
  };

  const isTimingLive = (batchType: "morning" | "evening", timingIndex: number) => {
    return !Boolean(cmsData.batchTimings.inactiveTimings?.[batchType]?.[String(timingIndex)]);
  };

  const toggleTimingLive = (batchType: "morning" | "evening", timingIndex: number) => {
    setCmsData((prev) => {
      const currentValue = Boolean(prev.batchTimings.inactiveTimings?.[batchType]?.[String(timingIndex)]);
      return {
        ...prev,
        batchTimings: {
          ...prev.batchTimings,
          inactiveTimings: {
            morning: {
              ...(prev.batchTimings.inactiveTimings?.morning || {}),
            },
            evening: {
              ...(prev.batchTimings.inactiveTimings?.evening || {}),
            },
            [batchType]: {
              ...(prev.batchTimings.inactiveTimings?.[batchType] || {}),
              [String(timingIndex)]: !currentValue,
            },
          },
        },
      };
    });
  };

  const togglePlanLive = (planIndex: number) => {
    setCmsData((prev) => ({
      ...prev,
      pricingPlans: prev.pricingPlans.map((plan, idx) => {
        if (idx !== planIndex) return plan;
        return {
          ...plan,
          inactive: !Boolean(plan.inactive),
        };
      }),
    }));
  };

  const handleEmailRecipientToggle = (email: string, isChecked: boolean) => {
    setEmailRecipients((prev) => {
      if (isChecked) {
        return prev.includes(email) ? prev : [...prev, email];
      }
      return prev.filter((value) => value !== email);
    });
  };

  const toggleAllRecipients = (isChecked: boolean) => {
    setEmailAllSelected(isChecked);
    if (isChecked) {
      const uniqueEmails = Array.from(new Set(emailAudienceUsers.map((user) => user.email).filter(Boolean)));
      setEmailRecipients(uniqueEmails);
    } else {
      setEmailRecipients([]);
    }
  };

  const sendEmail = async () => {
    if (emailRecipients.length === 0) {
      setStatusMessage("Select at least one recipient.");
      return;
    }
    if (!emailSubject.trim() || (!emailBody.trim() && !emailHtmlBody.trim())) {
      setStatusMessage("Enter subject and message body/html.");
      return;
    }
    
    setEmailSending(true);
    setStatusMessage("");
    
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          audienceSource: emailAudienceSource,
          recipientEmails: emailRecipients,
          subject: emailSubject,
          message: emailBody,
          html: emailHtmlBody,
        }),
      });
      
      const result = await response.json();
      if (result?.ok) {
        setStatusMessage(`Email sent to ${emailRecipients.length} recipients.`);
        setEmailSubject("");
        setEmailBody("");
        setEmailHtmlBody("");
        setEmailRecipients([]);
        setEmailAllSelected(false);
      } else {
        setStatusMessage(result?.message || "Failed to send emails.");
      }
    } catch (error) {
      setStatusMessage("Failed to send emails due to network error.");
    } finally {
      setEmailSending(false);
    }
  };

  // ==================== TRIAL USERS ====================
  const fetchTrialUsers = async () => {
    setTrialLoading(true);
    setStatusMessage("");
    
    try {
      const response = await fetch("/api/admin/trial-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }
      
      const result = await response.json();
      if (result?.ok && result?.data?.users) {
        setTrialUsers(result.data.users);
        setStatusMessage(`Loaded ${result.data.users.length} trial users.`);
      } else {
        setStatusMessage(result?.message || "Failed to load trial users.");
      }
    } catch (error) {
      setStatusMessage("Failed to fetch trial users.");
    } finally {
      setTrialLoading(false);
    }
  };

  function filterTrialUsers() {
    let filtered = trialUsers;
    
    if (trialDateRangeStart || trialDateRangeEnd) {
      const start = trialDateRangeStart ? new Date(trialDateRangeStart).getTime() : 0;
      const end = trialDateRangeEnd ? new Date(trialDateRangeEnd).getTime() : Infinity;
      filtered = filtered.filter((user) => {
        const userDate = new Date(user.submittedAt).getTime();
        return userDate >= start && userDate <= end;
      });
    }
    
    return filtered;
  }

  const deleteTrialUser = async (rowIndex: number) => {
    if (!confirm("Are you sure you want to delete this trial user?")) return;
    if (isRowDeleting("Trial Users", rowIndex)) return;

    markRowDeleting("Trial Users", rowIndex);
    
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          sheetName: "Trial Users",
          rowIndex,
        }),
      });
      
      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }
      if (result?.ok) {
        setTrialUsers((prev) => prev.filter((user) => Number(user?.rowIndex) !== Number(rowIndex)));
        setStatusMessage("Trial user deleted.");
      } else {
        setStatusMessage(result?.message || "Failed to delete user.");
      }
    } catch (error) {
      setStatusMessage("Error deleting user.");
    } finally {
      clearRowDeleting("Trial Users", rowIndex);
    }
  };

  // ==================== PAYMENT USERS ====================
  const fetchPaymentUsers = async () => {
    setPaymentLoading(true);
    setStatusMessage("");
    
    try {
      const response = await fetch("/api/admin/payment-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }
      
      const result = await response.json();
      if (result?.ok && result?.data?.users) {
        setPaymentUsers(result.data.users);
        setStatusMessage(`Loaded ${result.data.users.length} payment users.`);
      } else {
        setStatusMessage(result?.message || "Failed to load payment users.");
      }
    } catch (error) {
      setStatusMessage("Failed to fetch payment users.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchPtUsers = async () => {
    setPtLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/admin/personal-training-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      const result = await response.json();
      if (result?.ok && result?.data?.users) {
        setPtUsers(result.data.users);
        setStatusMessage(`Loaded ${result.data.users.length} PT leads.`);
      } else {
        setStatusMessage(result?.message || "Failed to load PT leads.");
      }
    } catch {
      setStatusMessage("Failed to fetch PT leads.");
    } finally {
      setPtLoading(false);
    }
  };

  const deletePtUser = async (rowIndex: number) => {
    if (!confirm("Are you sure you want to delete this PT lead?")) return;
    if (isRowDeleting("Personal Training", rowIndex)) return;

    markRowDeleting("Personal Training", rowIndex);

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          sheetName: "Personal Training",
          rowIndex,
        }),
      });

      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }
      if (result?.ok) {
        setPtUsers((prev) => prev.filter((user) => Number(user?.rowIndex) !== Number(rowIndex)));
        setStatusMessage("PT lead deleted.");
      } else {
        setStatusMessage(result?.message || "Failed to delete PT lead.");
      }
    } catch {
      setStatusMessage("Error deleting PT lead.");
    } finally {
      clearRowDeleting("Personal Training", rowIndex);
    }
  };

  const applyManualTemplatePreset = () => {
    const presets: Record<"trial" | "plan_enquiry" | "lap", { subject: string; text: string; html: string }> = {
      trial: {
        subject: "Your 2-Day Trial Booking Confirmation - Wani's Club Level Up",
        text: "Hi {{name}}, your 2-Day Trial is confirmed. Batch: {{batch}}. We are excited to welcome you!",
        html: "<div style=\"font-family:Arial,sans-serif;padding:16px\"><h2>Hi {{name}}, your 2-Day Trial is confirmed</h2><p><b>Batch:</b> {{batch}}</p><p>See you at Wani's Club Level Up.</p></div>",
      },
      plan_enquiry: {
        subject: "Membership Enquiry Received - {{planName}}",
        text: "Hi {{name}}, we received your enquiry for {{planName}} ({{planPrice}}). Our team will contact you shortly with payment details.",
        html: "<div style=\"font-family:Arial,sans-serif;padding:16px\"><h2>Thanks {{name}}</h2><p>We received your enquiry for <b>{{planName}}</b> ({{planPrice}}).</p><p>We will send payment details shortly.</p></div>",
      },
      lap: {
        subject: "LAP Registration Update - {{planName}}",
        text: "Hi {{name}}, your LAP registration for {{planName}} is received. Start date: {{submittedAt}}. We will share onboarding steps on WhatsApp.",
        html: "<div style=\"font-family:Arial,sans-serif;padding:16px\"><h2>LAP Registration Received</h2><p>Hi {{name}}, we have received your registration for <b>{{planName}}</b>.</p><p>Our coach will share onboarding steps shortly.</p></div>",
      },
    };

    const selected = presets[selectedManualTemplatePreset];
    setEmailSubject(selected.subject);
    setEmailBody(selected.text);
    setEmailHtmlBody(selected.html);
    setStatusMessage(`Applied ${selectedManualTemplatePreset.toUpperCase()} starter template.`);
  };

  const TEST_EMAIL_SUBJECT = "\u2705 SMTP Test \u2014 Wani's Club Level Up";
  const TEST_EMAIL_HTML = `<div style="font-family:Arial,sans-serif;background:#0a0a0a;padding:24px"><div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden"><div style="padding:16px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700;font-size:15px">Wani's Club Level Up \u2014 SMTP Test</div><div style="padding:20px;color:#e4e4e7"><h2 style="margin:0 0 12px 0;color:#fff">\u2705 SMTP is working!</h2><p style="margin:0 0 10px 0">This is a test email sent from your gym admin panel.</p><p style="margin:0 0 10px 0">Your SMTP configuration is set up correctly. Automated emails will be delivered successfully.</p><p style="margin:0;color:#a1a1aa;font-size:12px">Sent from Wani's Club Level Up Admin Panel</p></div></div></div>`;
  const TEST_EMAIL_TEXT = "This is a test email from your gym admin panel. If you received this, your SMTP configuration is working correctly.";

  const runSmtpTest = async () => {
    if (!smtpTestEmail.trim()) {
      setStatusMessage("Enter a recipient email for SMTP test.");
      return;
    }

    setSmtpTestLoading(true);
    setSmtpTestResult(null);
    setStatusMessage("");

    try {
      const response = await fetch("/api/admin/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          toEmail: smtpTestEmail.trim(),
          smtp: cmsData.emailSettings,
          subject: TEST_EMAIL_SUBJECT,
          text: TEST_EMAIL_TEXT,
          html: TEST_EMAIL_HTML,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok) {
        setSmtpTestResult({
          ok: false,
          message: result?.message || "SMTP test failed.",
          suggestion: result?.suggestion,
          technical: result?.technical,
          details: result?.diagnostics,
        });
        return;
      }

      setSmtpTestResult({
        ok: true,
        message: `Email delivered to ${smtpTestEmail.trim()}`,
        details: result?.diagnostics,
      });
    } catch {
      setSmtpTestResult({
        ok: false,
        message: "SMTP test failed due to a network error.",
        suggestion: "Check your internet connection and try again.",
      });
    } finally {
      setSmtpTestLoading(false);
    }
  };

  function filterPaymentUsers() {
    let filtered = paymentUsers;
    
    if (paymentDateRangeStart || paymentDateRangeEnd) {
      const start = paymentDateRangeStart ? new Date(paymentDateRangeStart).getTime() : 0;
      const end = paymentDateRangeEnd ? new Date(paymentDateRangeEnd).getTime() : Infinity;
      filtered = filtered.filter((user) => {
        const userDate = new Date(user.submittedAt).getTime();
        return userDate >= start && userDate <= end;
      });
    }
    
    return filtered;
  }

  const deletePaymentUser = async (rowIndex: number) => {
    if (!confirm("Are you sure you want to delete this payment user?")) return;
    if (isRowDeleting("Submissions", rowIndex)) return;

    markRowDeleting("Submissions", rowIndex);
    
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          sheetName: "Submissions",
          rowIndex,
        }),
      });
      
      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }
      if (result?.ok) {
        setPaymentUsers((prev) => prev.filter((user) => Number(user?.rowIndex) !== Number(rowIndex)));
        setRegistrations((prev) => prev.filter((user) => Number(user?.rowIndex) !== Number(rowIndex)));
        setExpandedLapRows((prev) => prev.filter((value) => value !== Number(rowIndex)));
        setStatusMessage("Payment user deleted.");
      } else {
        setStatusMessage(result?.message || "Failed to delete user.");
      }
    } catch (error) {
      setStatusMessage("Error deleting user.");
    } finally {
      clearRowDeleting("Submissions", rowIndex);
    }
  };

  const deleteLapRegistration = async (rowIndex: number) => {
    if (!confirm("Are you sure you want to delete this LAP registration record?")) return;
    if (isRowDeleting("Submissions", rowIndex)) return;

    markRowDeleting("Submissions", rowIndex);

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          sheetName: "Submissions",
          rowIndex,
        }),
      });

      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      if (result?.ok) {
        setRegistrations((prev) => prev.filter((row) => Number(row?.rowIndex) !== Number(rowIndex)));
        setPaymentUsers((prev) => prev.filter((row) => Number(row?.rowIndex) !== Number(rowIndex)));
        setExpandedLapRows((prev) => prev.filter((value) => value !== Number(rowIndex)));
        setStatusMessage("LAP registration deleted.");
      } else {
        setStatusMessage(result?.message || "Failed to delete LAP registration.");
      }
    } catch {
      setStatusMessage("Error deleting LAP registration.");
    } finally {
      clearRowDeleting("Submissions", rowIndex);
    }
  };

  const updateRegistrationPaidStatus = async (rowIndex: number, paidStatus: "PAID" | "UNPAID") => {
    setStatusUpdatingRow(rowIndex);
    try {
      const response = await fetch("/api/admin/payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rowIndex,
          paidStatus,
        }),
      });

      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      if (!result?.ok) {
        setStatusMessage(result?.message || "Failed to update payment status.");
        return;
      }

      setRegistrations((prev) =>
        prev.map((row) =>
          Number(row?.rowIndex) === Number(rowIndex)
            ? { ...row, paidStatus }
            : row
        )
      );

      setPaymentUsers((prev) =>
        prev.map((row) =>
          Number(row?.rowIndex) === Number(rowIndex)
            ? { ...row, paidStatus }
            : row
        )
      );

      setStatusMessage(`Registration marked as ${paidStatus}.`);
    } catch {
      setStatusMessage("Failed to update payment status.");
    } finally {
      setStatusUpdatingRow(null);
    }
  };

  const sendUnpaidLapReminders = async () => {
    const unpaidUsers = getLapRegistrations().filter((row) => String(row?.paidStatus || "UNPAID") !== "PAID");
    const recipientEmails = Array.from(new Set(unpaidUsers.map((row) => String(row?.email || "").trim()).filter(Boolean)));

    if (recipientEmails.length === 0) {
      setStatusMessage("No unpaid LAP users with valid email found.");
      return;
    }

    setIsSendingUnpaidReminders(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          audienceSource: "payment",
          recipientEmails,
          subject: "Payment Reminder - Wani's Club Level Up",
          message:
            "This is a gentle reminder that your LAP payment is still pending. Please complete your fee payment to continue smoothly. If you already paid, please ignore this message.",
          html:
            "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up</div><div style=\"padding:20px;color:#e4e4e7\"><h2 style=\"margin:0 0 10px 0;color:#fff\">Payment Reminder</h2><p style=\"margin:0 0 8px 0\">Your LAP fee is showing as pending in our records.</p><p style=\"margin:0 0 8px 0\">Please complete your payment at the earliest. If already paid, kindly ignore this reminder.</p><p style=\"margin:0;color:#a1a1aa\">Team Wani's Club Level Up</p></div></div></div>",
        }),
      });

      const result = await response.json();
      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      if (!result?.ok) {
        setStatusMessage(result?.message || "Failed to send unpaid reminders.");
        return;
      }

      setStatusMessage(`Reminder email sent to ${recipientEmails.length} unpaid users.`);
    } catch {
      setStatusMessage("Failed to send unpaid reminders.");
    } finally {
      setIsSendingUnpaidReminders(false);
    }
  };

  // ==================== EXCEL EXPORT ====================
  const exportToExcel = async (data: any[], fileName: string) => {
    try {
      const response = await fetch("/api/admin/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          data,
          fileName,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.csv`;
      a.click();
      setStatusMessage("Excel downloaded successfully.");
    } catch (error) {
      setStatusMessage("Failed to export Excel.");
    }
  };

  if (isAuthChecking) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white">Checking authorization...</p>
      </main>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <main className="admin-high-contrast min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl uppercase tracking-wide text-brand-orange">Website Control Panel</h1>
              <p className="mt-2 text-sm text-zinc-300">
                Manage pricing, timings, users, communications, and reports.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <input
                type={showAdminKey ? "text" : "password"}
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-brand-orange"
              />
              <button
                type="button"
                onClick={() => setShowAdminKey((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                aria-label={showAdminKey ? "Hide admin key" : "Show admin key"}
              >
                {showAdminKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="button"
              onClick={loadCms}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-700 disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isLoading ? "Loading..." : "Reload"}
            </button>

            <button
              type="button"
              onClick={() => saveCms()}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? "Saving..." : cmsUsingDefaults ? "Seed CMS Sheet" : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={initializeLapTabs}
              disabled={isInitializingLapTabs}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-orange/70 bg-transparent px-4 py-2.5 text-sm font-semibold text-brand-orange transition hover:bg-brand-orange/10 disabled:opacity-70"
            >
              {isInitializingLapTabs ? <Loader2 size={16} className="animate-spin" /> : null}
              {isInitializingLapTabs ? "Initializing..." : "Initialize LAP Tabs"}
            </button>
          </div>

          {cmsUsingDefaults ? (
            <p className="mt-3 text-xs text-amber-300">
              The website is currently using built-in CMS defaults from code. The Google Sheet CMS tab will stay empty until you enter the admin key and click `Seed CMS Sheet`.
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-sm font-semibold text-zinc-200">Admin Login Credentials (Google Sheet)</p>
            <p className="mt-1 text-xs text-zinc-400">Update username/password stored in Admin Credentials sheet.</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="New username"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
              />
              <div className="relative">
                <input
                  type={showAdminCredentialsPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-brand-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminCredentialsPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  aria-label={showAdminCredentialsPassword ? "Hide password" : "Show password"}
                >
                  {showAdminCredentialsPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showAdminCredentialsPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-brand-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminCredentialsPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  aria-label={showAdminCredentialsPassword ? "Hide password" : "Show password"}
                >
                  {showAdminCredentialsPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={saveAdminCredentials}
              disabled={isSavingCredentials}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-70"
            >
              {isSavingCredentials ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSavingCredentials ? "Saving credentials..." : "Save Admin Credentials"}
            </button>
          </div>

          {activeAsyncLabel ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-sm text-brand-orange animate-pulse">
              <Loader2 size={16} className="animate-spin" /> {activeAsyncLabel}
            </div>
          ) : null}

          {statusMessage ? <p className="mt-3 text-sm text-zinc-300">{statusMessage}</p> : null}
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-800 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("cms")}
            className={`px-4 py-3 font-semibold text-sm uppercase whitespace-nowrap transition ${
              activeTab === "cms"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Website CMS
          </button>
          <button
            onClick={() => {
              setActiveTab("trial");
              if (trialUsers.length === 0) fetchTrialUsers();
            }}
            className={`inline-flex items-center gap-2 px-4 py-3 font-semibold text-sm uppercase whitespace-nowrap transition ${
              activeTab === "trial"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 size={16} /> Trial Users
          </button>
          <button
            onClick={() => {
              setActiveTab("payment");
              if (paymentUsers.length === 0) fetchPaymentUsers();
            }}
            className={`inline-flex items-center gap-2 px-4 py-3 font-semibold text-sm uppercase whitespace-nowrap transition ${
              activeTab === "payment"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 size={16} /> Payment Users
          </button>
          <button
            onClick={() => {
              setActiveTab("pt");
              if (ptUsers.length === 0) fetchPtUsers();
            }}
            className={`inline-flex items-center gap-2 px-4 py-3 font-semibold text-sm uppercase whitespace-nowrap transition ${
              activeTab === "pt"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 size={16} /> PT Leads
          </button>
          <button
            onClick={() => {
              setActiveTab("reports");
              if (registrations.length === 0) fetchRegistrations();
            }}
            className={`inline-flex items-center gap-2 px-4 py-3 font-semibold text-sm uppercase whitespace-nowrap transition ${
              activeTab === "reports"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 size={16} /> Reports
          </button>
          <button
            onClick={() => {
              setActiveTab("lapReports");
              if (registrations.length === 0) fetchRegistrations();
            }}
            className={`inline-flex items-center gap-2 px-4 py-3 font-semibold text-sm uppercase whitespace-nowrap transition ${
              activeTab === "lapReports"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 size={16} /> LAP Reports
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`inline-flex items-center gap-2 px-4 py-3 font-semibold text-sm uppercase whitespace-nowrap transition ${
              activeTab === "email"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Mail size={16} /> Email
          </button>
        </div>

        {/* CMS Tab */}
        {activeTab === "cms" && (
          <div className="space-y-8">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase tracking-wide">Batch Timings</h2>
            <button
              type="button"
              onClick={() => saveCms("batchTimings")}
              disabled={isSaving || !hasUnsavedSection("batchTimings")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? "Saving..." : "Save Timings"}
            </button>
          </div>
          {hasUnsavedSection("batchTimings") ? <p className="mt-2 text-xs text-amber-300">Unsaved changes in Batch Timings.</p> : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-zinc-400">Morning Timings (comma separated)</label>
              <input
                value={cmsData.batchTimings.morning.join(", ")}
                onChange={(e) =>
                  setCmsData((prev) => ({
                    ...prev,
                    batchTimings: {
                      ...prev.batchTimings,
                      morning: e.target.value.split(","),
                    },
                  }))
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-zinc-400">Evening Timings (comma separated)</label>
              <input
                value={cmsData.batchTimings.evening.join(", ")}
                onChange={(e) =>
                  setCmsData((prev) => ({
                    ...prev,
                    batchTimings: {
                      ...prev.batchTimings,
                      evening: e.target.value.split(","),
                    },
                  }))
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-zinc-400">Timings Note</label>
            <input
              value={cmsData.batchTimings.note}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  batchTimings: {
                    ...prev.batchTimings,
                    note: e.target.value,
                  },
                }))
              }
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-700 bg-black/40 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.08em] text-zinc-400">Morning Timing Visibility</p>
              <div className="space-y-2">
                {cmsData.batchTimings.morning.map((timing, index) => {
                  const live = isTimingLive("morning", index);
                  return (
                    <div key={`morning-${index}`} className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-2">
                      <span className="text-sm text-zinc-200">{timing}</span>
                      <button
                        type="button"
                        onClick={() => toggleTimingLive("morning", index)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${
                          live ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {live ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} {live ? "Live" : "Off"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-700 bg-black/40 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.08em] text-zinc-400">Evening Timing Visibility</p>
              <div className="space-y-2">
                {cmsData.batchTimings.evening.map((timing, index) => {
                  const live = isTimingLive("evening", index);
                  return (
                    <div key={`evening-${index}`} className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-2">
                      <span className="text-sm text-zinc-200">{timing}</span>
                      <button
                        type="button"
                        onClick={() => toggleTimingLive("evening", index)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${
                          live ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {live ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} {live ? "Live" : "Off"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase tracking-wide">Pricing Plans</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveCms("pricingPlans")}
                disabled={isSaving || !hasUnsavedSection("pricingPlans")}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? "Saving..." : "Save Plans"}
              </button>
              <button
                type="button"
                onClick={addPlan}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-700"
              >
                <Plus size={16} /> Add Plan
              </button>
            </div>
          </div>
          {hasUnsavedSection("pricingPlans") ? <p className="mt-2 text-xs text-amber-300">Unsaved changes in Pricing Plans.</p> : null}

          <div className="mt-4 space-y-4">
            {cmsData.pricingPlans.map((plan, index) => (
              <article key={`plan-${index}`} className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <input
                    value={plan.name}
                    onChange={(e) => updatePlan(index, { name: e.target.value })}
                    placeholder="Plan Name"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    value={plan.price}
                    onChange={(e) => updatePlan(index, { price: e.target.value })}
                    placeholder="Price"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    value={plan.attendance}
                    onChange={(e) => updatePlan(index, { attendance: e.target.value })}
                    placeholder="Attendance Type"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(plan.highlight)}
                      onChange={(e) => updatePlan(index, { highlight: e.target.checked })}
                    />
                    Highlight
                  </label>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => togglePlanLive(index)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${
                      plan.inactive ? "bg-zinc-700 text-zinc-300" : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {plan.inactive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />} {plan.inactive ? "Off" : "Live"}
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={`${index}-${featureIndex}`} className="flex items-center gap-2">
                      <input
                        value={feature}
                        onChange={(e) => updateFeature(index, featureIndex, e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index, featureIndex)}
                        className="rounded-xl bg-zinc-800 p-2 text-zinc-300 transition hover:bg-zinc-700"
                        aria-label="Remove feature"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addFeature(index)}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-700"
                  >
                    <Plus size={14} /> Add Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => removePlan(index)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    <Trash2 size={14} /> Remove Plan
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase tracking-wide">LAP Sessions</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveCms("lapPlans")}
                disabled={isSaving || !hasUnsavedSection("lapPlans")}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? "Saving..." : "Save LAP"}
              </button>
              <button
                type="button"
                onClick={addLapPlan}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-700"
              >
                <Plus size={16} /> Add LAP Session
              </button>
            </div>
          </div>
          {hasUnsavedSection("lapPlans") ? <p className="mt-2 text-xs text-amber-300">Unsaved changes in LAP Sessions.</p> : null}

          <p className="mt-2 text-xs text-zinc-400">
            Configure LAP start/end date, number of days, LAP and shake charges, combo/separate pricing, and daily activity details.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(cmsData.lapPlans || []).map((plan, index) => (
              <article key={`${plan.title}-${index}`} className="h-full rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <input
                    value={plan.title}
                    onChange={(e) => updateLapPlan(index, { title: e.target.value })}
                    placeholder="LAP Session Title"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    type="number"
                    min={1}
                    value={String(plan.numberOfDays ?? 1)}
                    onChange={(e) => updateLapNumberOfDays(index, Number(e.target.value || 1))}
                    placeholder="No. of Days"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    type="date"
                    value={plan.startDate}
                    onChange={(e) => updateLapStartDate(index, e.target.value)}
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    type="date"
                    value={plan.endDate}
                    readOnly
                    className="rounded-xl border border-zinc-700 bg-zinc-900/30 px-3 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <input
                    value={plan.lapCharges}
                    onChange={(e) => updateLapPlan(index, { lapCharges: e.target.value })}
                    placeholder="LAP Charges"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    value={plan.shakeCharges}
                    onChange={(e) => updateLapPlan(index, { shakeCharges: e.target.value })}
                    placeholder="Shake Charges"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    value={plan.comboPrice}
                    onChange={(e) => updateLapPlan(index, { comboPrice: e.target.value })}
                    placeholder="Combo Price"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    type="number"
                    min={1}
                    value={String(plan.registrationCutoffHours ?? 6)}
                    onChange={(e) =>
                      updateLapPlan(index, {
                        registrationCutoffHours: Math.max(1, Number(e.target.value || 6)),
                      })
                    }
                    placeholder="Cutoff Hours"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <select
                    value={plan.pricingMode}
                    onChange={(e) => updateLapPlan(index, { pricingMode: e.target.value === "combo" ? "combo" : "separate" })}
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  >
                    <option value="separate">Show Separate (LAP + Shake)</option>
                    <option value="combo">Show Combo Option</option>
                  </select>

                  <select
                    value={plan.status}
                    onChange={(e) => updateLapPlan(index, { status: e.target.value === "live" ? "live" : "upcoming" })}
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  >
                    <option value="live">Live</option>
                    <option value="upcoming">Upcoming</option>
                  </select>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(plan.registrationFormEnabled)}
                      onChange={(e) => updateLapPlan(index, { registrationFormEnabled: e.target.checked })}
                    />
                    Registration Form Enabled
                  </label>
                </div>

                <p className="mt-2 text-xs text-zinc-400">
                  Registrations close {String(plan.registrationCutoffHours ?? 6)} hours before start date.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <textarea
                    rows={4}
                    value={plan.description}
                    onChange={(e) => updateLapPlan(index, { description: e.target.value })}
                    placeholder="Description"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <textarea
                    rows={4}
                    value={(plan.activities || []).join("\n")}
                    onChange={(e) =>
                      updateLapPlan(index, {
                        activities: e.target.value.split("\n"),
                      })
                    }
                    placeholder="Activities (one per line)"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <textarea
                    rows={4}
                    value={(plan.dailyChecklist || []).join("\n")}
                    onChange={(e) =>
                      updateLapPlan(index, {
                        dailyChecklist: e.target.value.split("\n"),
                      })
                    }
                    placeholder="Daily checklist (one per line)"
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLapPlan(index)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      <Trash2 size={14} /> Remove LAP Session
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase tracking-wide">Personal Training Section</h2>
            <button
              type="button"
              onClick={() => saveCms("personalTraining")}
              disabled={isSaving || !hasUnsavedSection("personalTraining")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? "Saving..." : "Save PT"}
            </button>
          </div>
          {hasUnsavedSection("personalTraining") ? <p className="mt-2 text-xs text-amber-300">Unsaved changes in Personal Training.</p> : null}
          <p className="mt-2 text-xs text-zinc-400">
            Configure the Personal Training card content shown on homepage and lead form defaults.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={Boolean(cmsData.personalTraining.enabled)}
                onChange={(e) =>
                  setCmsData((prev) => ({
                    ...prev,
                    personalTraining: {
                      ...prev.personalTraining,
                      enabled: e.target.checked,
                    },
                  }))
                }
              />
              PT Card Enabled
            </label>
            <input
              value={cmsData.personalTraining.price}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  personalTraining: {
                    ...prev.personalTraining,
                    price: e.target.value,
                  },
                }))
              }
              placeholder="Price (e.g. 8000)"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={cmsData.personalTraining.title}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  personalTraining: {
                    ...prev.personalTraining,
                    title: e.target.value,
                  },
                }))
              }
              placeholder="PT Title"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <input
              value={cmsData.personalTraining.ctaText}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  personalTraining: {
                    ...prev.personalTraining,
                    ctaText: e.target.value,
                  },
                }))
              }
              placeholder="CTA Text"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="mt-3 space-y-3">
            <input
              value={cmsData.personalTraining.imageUrl}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  personalTraining: {
                    ...prev.personalTraining,
                    imageUrl: e.target.value,
                  },
                }))
              }
              placeholder="Demo Image URL"
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <textarea
              rows={3}
              value={cmsData.personalTraining.description}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  personalTraining: {
                    ...prev.personalTraining,
                    description: e.target.value,
                  },
                }))
              }
              placeholder="PT description"
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
            <textarea
              rows={4}
              value={(cmsData.personalTraining.features || []).join("\n")}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  personalTraining: {
                    ...prev.personalTraining,
                    features: e.target.value.split("\n"),
                  },
                }))
              }
              placeholder="Features (one per line)"
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase tracking-wide">Featured Event</h2>
            <button
              type="button"
              onClick={() => saveCms("featuredEvent")}
              disabled={isSaving || !hasUnsavedSection("featuredEvent")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? "Saving..." : "Save Event"}
            </button>
          </div>
          {hasUnsavedSection("featuredEvent") ? <p className="mt-2 text-xs text-amber-300">Unsaved changes in Featured Event.</p> : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={cmsData.featuredEvent.enabled}
                onChange={(e) =>
                  setCmsData((prev) => ({
                    ...prev,
                    featuredEvent: {
                      ...prev.featuredEvent,
                      enabled: e.target.checked,
                    },
                  }))
                }
              />
              Event Enabled (popup + announcement)
            </label>

            <input
              value={cmsData.featuredEvent.ctaText}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  featuredEvent: {
                    ...prev.featuredEvent,
                    ctaText: e.target.value,
                  },
                }))
              }
              placeholder="CTA Text"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={cmsData.featuredEvent.title}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  featuredEvent: {
                    ...prev.featuredEvent,
                    title: e.target.value,
                  },
                }))
              }
              placeholder="Event Title"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />

            <input
              value={cmsData.featuredEvent.subtitle}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  featuredEvent: {
                    ...prev.featuredEvent,
                    subtitle: e.target.value,
                  },
                }))
              }
              placeholder="Event Subtitle"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <textarea
              rows={4}
              value={cmsData.featuredEvent.offerings.join("\n")}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  featuredEvent: {
                    ...prev.featuredEvent,
                    offerings: e.target.value.split("\n"),
                  },
                }))
              }
              placeholder="Offerings (one per line)"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />

            <textarea
              rows={4}
              value={cmsData.featuredEvent.products.join("\n")}
              onChange={(e) =>
                setCmsData((prev) => ({
                  ...prev,
                  featuredEvent: {
                    ...prev.featuredEvent,
                    products: e.target.value.split("\n"),
                  },
                }))
              }
              placeholder="Product features (one per line)"
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />
          </div>
        </section>
          </div>
        )}

        {/* Trial Users Tab */}
        {activeTab === "trial" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl uppercase tracking-wide">Trial Users (2-Day Offer)</h2>
                <button
                  onClick={() => exportToExcel(filterTrialUsers(), "trial-users")}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
                >
                  <Download size={16} /> Export Excel
                </button>
              </div>

              {/* Filters */}
              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300 mb-4">Filters</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">From Date</label>
                    <input
                      type="date"
                      value={trialDateRangeStart}
                      onChange={(e) => setTrialDateRangeStart(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">To Date</label>
                    <input
                      type="date"
                      value={trialDateRangeEnd}
                      onChange={(e) => setTrialDateRangeEnd(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid gap-3 sm:grid-cols-2 mb-6">
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Total Trial Users</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">{filterTrialUsers().length}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Date Range</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {trialDateRangeStart || trialDateRangeEnd ? `${trialDateRangeStart || "Any"} to ${trialDateRangeEnd || "Any"}` : "All"}
                  </p>
                </div>
              </div>

              {/* Trial Users Table */}
              <div className="overflow-x-auto rounded-lg border border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-700 bg-black/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Age</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Interests</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {trialLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                          <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading...</span>
                        </td>
                      </tr>
                    ) : filterTrialUsers().length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                          {trialUsers.length === 0 ? "No trial users yet. Load to see data." : "No users match the filter."}
                        </td>
                      </tr>
                    ) : (
                      filterTrialUsers().map((user, idx) => {
                        const trialRowIndex = Number(user?.rowIndex ?? -1);
                        const isDeleting = isRowDeleting("Trial Users", trialRowIndex);

                        return (
                        <tr
                          key={`trial-${String(user?.rowIndex ?? idx)}`}
                          className={`transition ${isDeleting ? "animate-pulse bg-red-500/5 opacity-60" : "hover:bg-black/30"}`}
                        >
                          <td className="px-4 py-3 text-zinc-300">{new Date(user.submittedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.name}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.email}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.phone}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.age}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.interests}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteTrialUser(user.rowIndex)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Payment Users Tab */}
        {activeTab === "payment" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl uppercase tracking-wide">Payment Users</h2>
                <button
                  onClick={() => exportToExcel(filterPaymentUsers(), "payment-users")}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
                >
                  <Download size={16} /> Export Excel
                </button>
              </div>

              {/* Filters */}
              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300 mb-4">Filters</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">From Date</label>
                    <input
                      type="date"
                      value={paymentDateRangeStart}
                      onChange={(e) => setPaymentDateRangeStart(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">To Date</label>
                    <input
                      type="date"
                      value={paymentDateRangeEnd}
                      onChange={(e) => setPaymentDateRangeEnd(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid gap-3 sm:grid-cols-2 mb-6">
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Total Payment Users</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">{filterPaymentUsers().length}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">
                    ₹{filterPaymentUsers().reduce((sum, u) => sum + (parseInt(u.planPrice) || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment Users Table */}
              <div className="overflow-x-auto rounded-lg border border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-700 bg-black/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Plan</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Payment</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {paymentLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-zinc-400">
                          <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading...</span>
                        </td>
                      </tr>
                    ) : filterPaymentUsers().length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-zinc-400">
                          {paymentUsers.length === 0 ? "No payment users yet. Load to see data." : "No users match the filter."}
                        </td>
                      </tr>
                    ) : (
                      filterPaymentUsers().map((user, idx) => {
                        const paymentRowIndex = Number(user?.rowIndex ?? -1);
                        const isDeleting = isRowDeleting("Submissions", paymentRowIndex);

                        return (
                        <tr
                          key={`payment-${String(user?.rowIndex ?? idx)}`}
                          className={`transition ${isDeleting ? "animate-pulse bg-red-500/5 opacity-60" : "hover:bg-black/30"}`}
                        >
                          <td className="px-4 py-3 text-zinc-300">{new Date(user.submittedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.name}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.email}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.phone}</td>
                          <td className="px-4 py-3 text-brand-orange font-semibold">{user.planName || user.program}</td>
                          <td className="px-4 py-3 text-zinc-300">₹{user.planPrice}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  String(user.paidStatus || "UNPAID") === "PAID"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {String(user.paidStatus || "UNPAID")}
                              </span>
                              {String(user.paidStatus || "UNPAID") === "PAID" ? (
                                <button
                                  type="button"
                                  disabled={statusUpdatingRow === Number(user.rowIndex) || isDeleting}
                                  onClick={() => updateRegistrationPaidStatus(Number(user.rowIndex), "UNPAID")}
                                  className="text-[11px] text-amber-300 hover:text-amber-200 disabled:opacity-70"
                                >
                                  Mark Unpaid
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={statusUpdatingRow === Number(user.rowIndex) || isDeleting}
                                  onClick={() => updateRegistrationPaidStatus(Number(user.rowIndex), "PAID")}
                                  className="text-[11px] text-emerald-300 hover:text-emerald-200 disabled:opacity-70"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deletePaymentUser(user.rowIndex)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* PT Leads Tab */}
        {activeTab === "pt" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl uppercase tracking-wide">Personal Training Leads</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fetchPtUsers}
                    disabled={ptLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-700 disabled:opacity-70"
                  >
                    {ptLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} {ptLoading ? "Loading..." : "Reload"}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportToExcel(ptUsers, "personal_training_leads")}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-orange/50 px-4 py-2 text-sm font-semibold text-brand-orange transition hover:bg-brand-orange/10"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-700 bg-black/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Preferred Slot</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Goal</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {ptLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400"><span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading PT leads...</span></td>
                      </tr>
                    ) : ptUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">No PT leads yet. Click reload to fetch data.</td>
                      </tr>
                    ) : (
                      ptUsers.map((user, idx) => {
                        const ptRowIndex = Number(user?.rowIndex ?? -1);
                        const isDeleting = isRowDeleting("Personal Training", ptRowIndex);

                        return (
                        <tr
                          key={`pt-${String(user?.rowIndex ?? idx)}`}
                          className={`transition ${isDeleting ? "animate-pulse bg-red-500/5 opacity-60" : "hover:bg-black/30"}`}
                        >
                          <td className="px-4 py-3 text-zinc-300">{new Date(user.submittedAt || user.timestamp).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.name}</td>
                          <td className="px-4 py-3 text-zinc-300 break-words max-w-xs">{user.email}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.phone}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.preferredSlot || "-"}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.goal || "-"}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deletePtUser(user.rowIndex)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="font-display text-2xl uppercase tracking-wide mb-6">Registration Reports</h2>

              {/* Filters */}
              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300 mb-4">Filters</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">From Date</label>
                    <input
                      type="date"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">To Date</label>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Program</label>
                    <select
                      value={programFilter}
                      onChange={(e) => setProgramFilter(e.target.value as any)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    >
                      <option>All</option>
                      <option>LAP 7 Days</option>
                      <option>LAP 10 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid gap-3 sm:grid-cols-3 mb-6">
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Total Registrations</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">{filteredRegistrations.length}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">LAP 7 Days</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">
                    {filteredRegistrations.filter((r) => r.planName?.includes("7")).length}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">LAP 10 Days</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">
                    {filteredRegistrations.filter((r) => r.planName?.includes("10")).length}
                  </p>
                </div>
              </div>

              {/* Registrations Table */}
              <div className="overflow-x-auto rounded-lg border border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-700 bg-black/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Program</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Plan Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Goal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {registrationsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                          <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading registrations...</span>
                        </td>
                      </tr>
                    ) : filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                          {registrations.length === 0 ? "No registrations loaded. Fetch to view." : "No registrations match the selected filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-black/30 transition">
                          <td className="px-4 py-3 text-zinc-300">{new Date(reg.submittedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-zinc-300">{reg.name}</td>
                          <td className="px-4 py-3 text-zinc-300 break-words max-w-xs">{reg.email}</td>
                          <td className="px-4 py-3 text-zinc-300">{reg.phone}</td>
                          <td className="px-4 py-3 text-brand-orange font-semibold">{reg.planName || reg.program}</td>
                          <td className="px-4 py-3 text-zinc-300">₹{reg.planPrice}</td>
                          <td className="px-4 py-3 text-zinc-300">{reg.goal}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* LAP Reports Tab */}
        {activeTab === "lapReports" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl uppercase tracking-wide">LAP Wise Registrations</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={sendUnpaidLapReminders}
                    disabled={isSendingUnpaidReminders}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-70"
                  >
                    {isSendingUnpaidReminders ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} {isSendingUnpaidReminders ? "Sending..." : "Send Unpaid Reminders"}
                  </button>
                  <button
                    type="button"
                    onClick={fetchRegistrations}
                    disabled={registrationsLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-700 disabled:opacity-70"
                  >
                    {registrationsLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} {registrationsLoading ? "Loading..." : "Reload"}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportToExcel(getVisibleLapRegistrations(), "lap-registrations")}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-orange/50 px-4 py-2 text-sm font-semibold text-brand-orange transition hover:bg-brand-orange/10"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300 mb-4">Filters</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">From Date</label>
                    <input
                      type="date"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">To Date</label>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-zinc-400">Payment Status</span>
                  {([
                    ["ALL", "All"],
                    ["PAID", "Paid"],
                    ["UNPAID", "Unpaid"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLapPaymentFilter(value)}
                      className={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                        lapPaymentFilter === value
                          ? "border-brand-orange bg-brand-orange/15 text-brand-orange"
                          : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-400">
                  Every registration is kept as an independent row (same user can register for multiple LAP sessions).
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 mb-6">
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Total LAP Registrations</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">{getVisibleLapRegistrations().length}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">LAP Sessions</p>
                  <p className="mt-2 text-2xl font-bold text-brand-orange">{Object.keys(groupLapRegistrations()).length}</p>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Date Range</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {dateRangeStart || dateRangeEnd ? `${dateRangeStart || "Any"} to ${dateRangeEnd || "Any"}` : "All"}
                  </p>
                </div>
              </div>

              {registrationsLoading ? (
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-6 text-center text-zinc-400"><span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading LAP registrations...</span></div>
              ) : getVisibleLapRegistrations().length === 0 ? (
                <div className="rounded-lg border border-zinc-700 bg-black/40 p-6 text-center text-zinc-400">
                  {registrations.length === 0 ? "No registrations loaded. Click reload to fetch data." : "No LAP registrations found for selected filters."}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupLapRegistrations()).map(([eventName, users]) => (
                    <div key={eventName} className="rounded-xl border border-zinc-700 bg-black/30 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700 pb-3">
                        <h3 className="text-lg font-bold text-brand-orange">{eventName}</h3>
                        <span className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-300">
                          {users.length} registrations
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-zinc-700">
                        <table className="w-full text-sm">
                          <thead className="border-b border-zinc-700 bg-black/40">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Date</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Name</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Email</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Phone</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Program</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Goal</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Weight</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Payment</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Details</th>
                              <th className="px-4 py-3 text-left font-semibold text-zinc-300">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-700">
                            {users.map((user, idx) => {
                              const rowIndex = Number(user?.rowIndex ?? -1);
                              const canDelete = Number.isFinite(rowIndex) && rowIndex >= 0;
                              const isExpanded = canDelete && expandedLapRows.includes(rowIndex);
                              const isDeleting = canDelete && isRowDeleting("Submissions", rowIndex);

                              return (
                                <Fragment key={`${eventName}-${rowIndex}-${idx}`}>
                                  <tr className={`transition ${isDeleting ? "animate-pulse bg-red-500/5 opacity-60" : "hover:bg-black/30"}`}>
                                    <td className="px-4 py-3 text-zinc-300">{new Date(user.submittedAt || user.timestamp).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-zinc-300">{user.name || "-"}</td>
                                    <td className="px-4 py-3 text-zinc-300 break-words max-w-xs">{user.email || "-"}</td>
                                    <td className="px-4 py-3 text-zinc-300">{user.phone || "-"}</td>
                                    <td className="px-4 py-3 text-zinc-300">{user.program || user.planName || "-"}</td>
                                    <td className="px-4 py-3 text-zinc-300">{user.goal || "-"}</td>
                                    <td className="px-4 py-3 text-zinc-300">
                                      {user.currentWeight || user.targetWeight
                                        ? `${user.currentWeight || "?"} -> ${user.targetWeight || "?"} kg`
                                        : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-1">
                                        <span
                                          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            String(user.paidStatus || "UNPAID") === "PAID"
                                              ? "bg-emerald-500/20 text-emerald-300"
                                              : "bg-amber-500/20 text-amber-300"
                                          }`}
                                        >
                                          {String(user.paidStatus || "UNPAID")}
                                        </span>
                                        {String(user.paidStatus || "UNPAID") === "PAID" ? (
                                          <button
                                            type="button"
                                            disabled={statusUpdatingRow === rowIndex || isDeleting}
                                            onClick={() => updateRegistrationPaidStatus(rowIndex, "UNPAID")}
                                            className="text-[11px] text-amber-300 hover:text-amber-200 disabled:opacity-70"
                                          >
                                            Mark Unpaid
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled={statusUpdatingRow === rowIndex || isDeleting}
                                            onClick={() => updateRegistrationPaidStatus(rowIndex, "PAID")}
                                            className="text-[11px] text-emerald-300 hover:text-emerald-200 disabled:opacity-70"
                                          >
                                            Mark Paid
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      {canDelete ? (
                                        <button
                                          type="button"
                                          disabled={isDeleting}
                                          onClick={() => toggleLapDetails(rowIndex)}
                                          className="text-brand-orange hover:text-orange-300 transition text-sm font-semibold disabled:opacity-50"
                                        >
                                          {isExpanded ? "Hide" : "Expand"}
                                        </button>
                                      ) : (
                                        <span className="text-xs text-zinc-500">Unavailable</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {canDelete ? (
                                        <button
                                          type="button"
                                          onClick={() => deleteLapRegistration(rowIndex)}
                                          disabled={isDeleting}
                                          className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
                                          {isDeleting ? "Deleting..." : "Delete"}
                                        </button>
                                      ) : (
                                        <span className="text-xs text-zinc-500">No rowIndex</span>
                                      )}
                                    </td>
                                  </tr>

                                  {isExpanded ? (
                                    <tr>
                                      <td colSpan={10} className="px-4 py-3 bg-black/50">
                                        <p className="mb-3 text-xs uppercase tracking-[0.08em] text-zinc-400">Full Form Details</p>
                                        <div className="rounded-lg border border-zinc-700 bg-black p-3">
                                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {[
                                              ["Name", user.name],
                                              ["Email", user.email],
                                              ["Phone", user.phone],
                                              ["Program", user.program],
                                              ["LAP Session", user.planName],
                                              ["Plan Price", user.planPrice ? `₹${user.planPrice}` : ""],
                                              ["Goal", user.goal],
                                              ["Batch", user.batch],
                                              ["Age", user.age],
                                              ["Current Weight", user.currentWeight],
                                              ["Target Weight", user.targetWeight],
                                              ["Gender", user.gender],
                                              ["Strength Level", user.strengthLevel],
                                              ["Preferred Slot", user.preferredSlot],
                                              ["Start Date", user.startDate],
                                              ["End Date", user.endDate],
                                              ["Submitted At", user.submittedAt],
                                              ["Row Index", user.rowIndex],
                                              ["Payment Status", user.paidStatus],
                                            ]
                                              .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
                                              .map(([label, value]) => (
                                              <div key={String(label)} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
                                                <p className="text-[10px] uppercase tracking-[0.08em] text-zinc-500">{label}</p>
                                                <p className="mt-1 break-words text-xs text-zinc-200">{String(value)}</p>
                                              </div>
                                            ))}
                                          </div>

                                          {user.notes ? (
                                            <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
                                              <p className="text-[10px] uppercase tracking-[0.08em] text-zinc-500">Notes</p>
                                              <p className="mt-1 whitespace-pre-wrap break-words text-xs text-zinc-200">
                                                {String(user.notes)}
                                              </p>
                                            </div>
                                          ) : null}
                                        </div>
                                      </td>
                                    </tr>
                                  ) : null}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="font-display text-2xl uppercase tracking-wide mb-6">SMTP Setup & Email Campaigns</h2>

              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300">SMTP Configuration</h3>
                  <button
                    type="button"
                    onClick={() => saveCms("emailSettings")}
                    disabled={isSaving || !hasUnsavedSection("emailSettings")}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-3 py-2 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {isSaving ? "Saving..." : "Save SMTP"}
                  </button>
                </div>
                {hasUnsavedSection("emailSettings") ? <p className="mb-3 text-xs text-amber-300">Unsaved changes in SMTP settings.</p> : null}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={Boolean(cmsData.emailSettings.enabled)}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          emailSettings: {
                            ...prev.emailSettings,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    Enable SMTP Email Delivery
                  </label>

                  <select
                    value={cmsData.emailSettings.provider}
                    onChange={(e) => applySmtpProviderDefaults(e.target.value as "gmail" | "zoho" | "stackmail" | "yahoo" | "titan" | "custom")}
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  >
                    <option value="gmail">Gmail (App Password)</option>
                    <option value="zoho">Zoho</option>
                    <option value="stackmail">Stackmail</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="titan">Titan</option>
                    <option value="custom">Custom SMTP</option>
                  </select>

                  <input
                    value={cmsData.emailSettings.host}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailSettings: {
                          ...prev.emailSettings,
                          host: e.target.value,
                        },
                      }))
                    }
                    placeholder="SMTP Host"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />

                  <input
                    type="number"
                    value={String(cmsData.emailSettings.port || 587)}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailSettings: {
                          ...prev.emailSettings,
                          port: Number(e.target.value || 587),
                        },
                      }))
                    }
                    placeholder="Port"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />

                  <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={Boolean(cmsData.emailSettings.secure)}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          emailSettings: {
                            ...prev.emailSettings,
                            secure: e.target.checked,
                          },
                        }))
                      }
                    />
                    Use SSL/TLS (Secure)
                  </label>

                  <input
                    value={cmsData.emailSettings.user}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailSettings: {
                          ...prev.emailSettings,
                          user: e.target.value,
                        },
                      }))
                    }
                    placeholder="SMTP Username"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />

                  <div className="relative">
                    <input
                      type={showSmtpPassword ? "text" : "password"}
                      value={cmsData.emailSettings.password}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          emailSettings: {
                            ...prev.emailSettings,
                            password: e.target.value,
                          },
                        }))
                      }
                      placeholder="SMTP Password / App Password"
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 pr-10 text-sm text-white outline-none focus:border-brand-orange"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      aria-label={showSmtpPassword ? "Hide SMTP password" : "Show SMTP password"}
                    >
                      {showSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <input
                    value={cmsData.emailSettings.fromName}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailSettings: {
                          ...prev.emailSettings,
                          fromName: e.target.value,
                        },
                      }))
                    }
                    placeholder="From Name"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />

                  <input
                    value={cmsData.emailSettings.fromEmail}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailSettings: {
                          ...prev.emailSettings,
                          fromEmail: e.target.value,
                        },
                      }))
                    }
                    placeholder="From Email"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />

                  <input
                    value={(cmsData.emailSettings.adminNotifyEmails || []).join(", ")}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailSettings: {
                          ...prev.emailSettings,
                          adminNotifyEmails: e.target.value.split(","),
                        },
                      }))
                    }
                    placeholder="Admin notify emails (comma separated)"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange lg:col-span-2"
                  />
                </div>

                <p className="mt-3 text-xs text-zinc-400">
                  Provider quick-setup included for Gmail, Zoho, Stackmail, Yahoo, Titan and custom SMTP. Save changes after update.
                </p>

                <div className="mt-4 rounded-lg border border-zinc-700 bg-black/50 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400 mb-3">Send Test Email</p>
                  {/* Pre-formatted email preview */}
                  <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-1">
                    <p className="text-xs text-zinc-500">Subject: <span className="text-zinc-300">✅ SMTP Test — Wani&apos;s Club Level Up</span></p>
                    <p className="text-xs text-zinc-500">Body: <span className="text-zinc-300">Branded HTML email confirming SMTP is working correctly.</span></p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="email"
                      value={smtpTestEmail}
                      onChange={(e) => setSmtpTestEmail(e.target.value)}
                      placeholder="Enter recipient email to test"
                      className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                    <button
                      type="button"
                      onClick={runSmtpTest}
                      disabled={smtpTestLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-70"
                    >
                      {smtpTestLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                      {smtpTestLoading ? "Sending..." : "Send Test Email"}
                    </button>
                  </div>
                  {smtpTestResult ? (
                    <div className={`mt-3 rounded-lg border p-3 ${
                      smtpTestResult.ok
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-red-500/40 bg-red-500/10"
                    }`}>
                      <p className={`text-sm font-semibold ${
                        smtpTestResult.ok ? "text-emerald-300" : "text-red-300"
                      }`}>
                        {smtpTestResult.ok ? "✅ " : "❌ "}{smtpTestResult.message}
                      </p>
                      {smtpTestResult.suggestion ? (
                        <p className="mt-2 text-xs text-amber-300">
                          💡 <span className="font-semibold">Fix:</span> {smtpTestResult.suggestion}
                        </p>
                      ) : null}
                      {smtpTestResult.technical ? (
                        <p className="mt-1 text-xs text-zinc-500">Technical detail: {smtpTestResult.technical}</p>
                      ) : null}
                      {smtpTestResult.ok && smtpTestResult.details ? (
                        <div className="mt-2 space-y-0.5 text-xs text-zinc-400">
                          <p>From: {String((smtpTestResult.details as Record<string, unknown>).from ?? "")}</p>
                          <p>Via: {String((smtpTestResult.details as Record<string, unknown>).host ?? (smtpTestResult.details as Record<string, unknown>).provider ?? "")}:{String((smtpTestResult.details as Record<string, unknown>).port ?? "")}</p>
                          {(smtpTestResult.details as Record<string, unknown>).messageId ? (
                            <p>Message ID: {String((smtpTestResult.details as Record<string, unknown>).messageId)}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300">Default Auto-Email Templates (used on form submission)</h3>
                  <button
                    type="button"
                    onClick={() => saveCms("emailTemplates")}
                    disabled={isSaving || !hasUnsavedSection("emailTemplates")}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-3 py-2 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {isSaving ? "Saving..." : "Save Templates"}
                  </button>
                </div>
                {hasUnsavedSection("emailTemplates") ? <p className="mb-3 text-xs text-amber-300">Unsaved changes in Email templates.</p> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    value={cmsData.emailTemplates.userSubject}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailTemplates: {
                          ...prev.emailTemplates,
                          userSubject: e.target.value,
                        },
                      }))
                    }
                    placeholder="User Email Subject"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <input
                    type="text"
                    value={cmsData.emailTemplates.adminSubject}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailTemplates: {
                          ...prev.emailTemplates,
                          adminSubject: e.target.value,
                        },
                      }))
                    }
                    placeholder="Admin Email Subject"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <textarea
                    rows={6}
                    value={cmsData.emailTemplates.userHtml}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailTemplates: {
                          ...prev.emailTemplates,
                          userHtml: e.target.value,
                        },
                      }))
                    }
                    placeholder="User HTML template"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <textarea
                    rows={6}
                    value={cmsData.emailTemplates.adminHtml}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailTemplates: {
                          ...prev.emailTemplates,
                          adminHtml: e.target.value,
                        },
                      }))
                    }
                    placeholder="Admin HTML template"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <textarea
                    rows={4}
                    value={cmsData.emailTemplates.userText}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailTemplates: {
                          ...prev.emailTemplates,
                          userText: e.target.value,
                        },
                      }))
                    }
                    placeholder="User plain-text (word) template"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                  <textarea
                    rows={4}
                    value={cmsData.emailTemplates.adminText}
                    onChange={(e) =>
                      setCmsData((prev) => ({
                        ...prev,
                        emailTemplates: {
                          ...prev.emailTemplates,
                          adminText: e.target.value,
                        },
                      }))
                    }
                    placeholder="Admin plain-text (word) template"
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <p className="mt-3 text-xs text-zinc-400">
                  {"Placeholders supported: {{name}}, {{email}}, {{phone}}, {{program}}, {{planName}}, {{planPrice}}, {{goal}}, {{formType}}, {{submittedAt}}"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300 mb-4">Manual Campaign Editor (HTML + Word/Text)</h3>
                <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    value={selectedManualTemplatePreset}
                    onChange={(e) => setSelectedManualTemplatePreset(e.target.value as "trial" | "plan_enquiry" | "lap")}
                    className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  >
                    <option value="trial">Starter Template: Trial</option>
                    <option value="plan_enquiry">Starter Template: Plan Enquiry</option>
                    <option value="lap">Starter Template: LAP</option>
                  </select>
                  <button
                    type="button"
                    onClick={applyManualTemplatePreset}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-700"
                  >
                    Apply Starter Template
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Email Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g., Special Offer for LAP Program"
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Message Body (Text / Word style)</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Enter your email message here..."
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Message Body (HTML)</label>
                  <textarea
                    rows={8}
                    value={emailHtmlBody}
                    onChange={(e) => setEmailHtmlBody(e.target.value)}
                    placeholder="Enter full HTML email body for branded card-style messages..."
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Recipient Selection */}
              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
                <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Audience Source</label>
                    <select
                      value={emailAudienceSource}
                      onChange={(e) => setEmailAudienceSource(e.target.value as "trial" | "payment" | "all")}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    >
                      <option value="all">All Users (Trial + Payment)</option>
                      <option value="trial">Only Trial Users</option>
                      <option value="payment">Only Payment Users</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={loadAudienceUsers}
                    disabled={trialLoading || paymentLoading}
                    className="inline-flex h-fit items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-700 disabled:opacity-70"
                  >
                    {trialLoading || paymentLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} {trialLoading || paymentLoading ? "Loading..." : "Load Audience"}
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-300">Recipients</h3>
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={emailAllSelected}
                      onChange={(e) => toggleAllRecipients(e.target.checked)}
                      className="rounded"
                    />
                    Select All
                  </label>
                </div>

                {emailAudienceUsers.length === 0 ? (
                  <p className="text-sm text-zinc-400">No recipients loaded for this audience. Click &quot;Load Audience&quot;.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {emailAudienceUsers.map((user, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-black/40 p-3 cursor-pointer hover:bg-black/60 transition"
                      >
                        <input
                          type="checkbox"
                          checked={emailRecipients.includes(user.email)}
                          onChange={(e) => handleEmailRecipientToggle(user.email, e.target.checked)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{user.name}</p>
                          <p className="text-xs text-zinc-400">{user.email}</p>
                        </div>
                        <span className="text-xs text-zinc-400">{user.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-zinc-400">
                  {emailRecipients.length} recipient{emailRecipients.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              {/* Send Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={emailSending || emailRecipients.length === 0 || !emailSubject.trim() || (!emailBody.trim() && !emailHtmlBody.trim())}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  {emailSending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} {emailSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
