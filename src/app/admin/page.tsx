"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultBatchTimings, defaultFeaturedEvent, defaultPlans, type CmsData, type Plan } from "@/lib/cms";
import { Plus, Trash2, Save, RefreshCw, Mail, BarChart3, Download, LogOut, ToggleLeft, ToggleRight } from "lucide-react";

const defaultData: CmsData = {
  pricingPlans: defaultPlans,
  batchTimings: defaultBatchTimings,
  featuredEvent: defaultFeaturedEvent,
};

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [adminKey, setAdminKey] = useState("");
  const [cmsData, setCmsData] = useState<CmsData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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

  const loadCms = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/cms", { cache: "no-store" });
      const result = await response.json();

      if (result?.ok && result?.data) {
        setCmsData(result.data as CmsData);
        setStatusMessage("CMS loaded successfully.");
      } else {
        setStatusMessage(result?.message || "Unable to load CMS data. Using defaults.");
      }
    } catch {
      setStatusMessage("Unable to load CMS data. Using defaults.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCms();
  }, [loadCms]);

  const saveCms = async () => {
    if (!adminKey.trim()) {
      setStatusMessage("Enter admin key before saving.");
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
          data: cmsData,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        setStatusMessage(result?.message || "Save failed.");
        return;
      }

      setStatusMessage("Saved to Google Sheet via Apps Script.");
    } catch {
      setStatusMessage("Save failed due to network error.");
    } finally {
      setIsSaving(false);
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

  // Reports & Email State
  const [activeTab, setActiveTab] = useState<"cms" | "reports" | "trial" | "payment" | "email">("cms");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [programFilter, setProgramFilter] = useState<"All" | "LAP 7 Days" | "LAP 10 Days">("All");
  
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
  
  // Email State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailAllSelected, setEmailAllSelected] = useState(false);
  const [emailAudienceSource, setEmailAudienceSource] = useState<"trial" | "payment" | "all">("all");

  useEffect(() => {
    setEmailRecipients([]);
    setEmailAllSelected(false);
  }, [emailAudienceSource]);

  const fetchRegistrations = async () => {
    if (!adminKey.trim()) {
      setStatusMessage("Enter admin key to fetch registrations.");
      return;
    }
    
    setRegistrationsLoading(true);
    setStatusMessage("");
    
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });
      
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
    if (!emailSubject.trim() || !emailBody.trim()) {
      setStatusMessage("Enter subject and message body.");
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
        }),
      });
      
      const result = await response.json();
      if (result?.ok) {
        setStatusMessage(`Email sent to ${emailRecipients.length} recipients.`);
        setEmailSubject("");
        setEmailBody("");
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

  const filterTrialUsers = () => {
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
  };

  const deleteTrialUser = async (rowIndex: number) => {
    if (!confirm("Are you sure you want to delete this trial user?")) return;
    
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
      if (result?.ok) {
        setTrialUsers(trialUsers.filter((u) => u.rowIndex !== rowIndex));
        setStatusMessage("Trial user deleted.");
      } else {
        setStatusMessage("Failed to delete user.");
      }
    } catch (error) {
      setStatusMessage("Error deleting user.");
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

  const filterPaymentUsers = () => {
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
  };

  const deletePaymentUser = async (rowIndex: number) => {
    if (!confirm("Are you sure you want to delete this payment user?")) return;
    
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
      if (result?.ok) {
        setPaymentUsers(paymentUsers.filter((u) => u.rowIndex !== rowIndex));
        setStatusMessage("Payment user deleted.");
      } else {
        setStatusMessage("Failed to delete user.");
      }
    } catch (error) {
      setStatusMessage("Error deleting user.");
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
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
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

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange"
            />

            <button
              type="button"
              onClick={loadCms}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-700 disabled:opacity-70"
            >
              <RefreshCw size={16} /> {isLoading ? "Loading..." : "Reload"}
            </button>

            <button
              type="button"
              onClick={saveCms}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-70"
            >
              <Save size={16} /> {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

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
          <h2 className="font-display text-2xl uppercase tracking-wide">Batch Timings</h2>
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
                      morning: e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
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
                      evening: e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
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
            <button
              type="button"
              onClick={addPlan}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-bold text-black transition hover:brightness-110"
            >
              <Plus size={16} /> Add Plan
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {cmsData.pricingPlans.map((plan, index) => (
              <article key={`${plan.name}-${index}`} className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
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
          <h2 className="font-display text-2xl uppercase tracking-wide">Featured Event</h2>

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
                    offerings: e.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
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
                    products: e.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
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
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">To Date</label>
                    <input
                      type="date"
                      value={trialDateRangeEnd}
                      onChange={(e) => setTrialDateRangeEnd(e.target.value)}
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
                          Loading...
                        </td>
                      </tr>
                    ) : filterTrialUsers().length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                          {trialUsers.length === 0 ? "No trial users yet. Load to see data." : "No users match the filter."}
                        </td>
                      </tr>
                    ) : (
                      filterTrialUsers().map((user, idx) => (
                        <tr key={idx} className="hover:bg-black/30 transition">
                          <td className="px-4 py-3 text-zinc-300">{new Date(user.submittedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.name}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.email}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.phone}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.age}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.interests}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteTrialUser(user.rowIndex)}
                              className="text-red-400 hover:text-red-300 transition text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
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
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">To Date</label>
                    <input
                      type="date"
                      value={paymentDateRangeEnd}
                      onChange={(e) => setPaymentDateRangeEnd(e.target.value)}
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
                      <th className="px-4 py-3 text-left font-semibold text-zinc-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {paymentLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                          Loading...
                        </td>
                      </tr>
                    ) : filterPaymentUsers().length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                          {paymentUsers.length === 0 ? "No payment users yet. Load to see data." : "No users match the filter."}
                        </td>
                      </tr>
                    ) : (
                      filterPaymentUsers().map((user, idx) => (
                        <tr key={idx} className="hover:bg-black/30 transition">
                          <td className="px-4 py-3 text-zinc-300">{new Date(user.submittedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.name}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.email}</td>
                          <td className="px-4 py-3 text-zinc-300">{user.phone}</td>
                          <td className="px-4 py-3 text-brand-orange font-semibold">{user.planName || user.program}</td>
                          <td className="px-4 py-3 text-zinc-300">₹{user.planPrice}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deletePaymentUser(user.rowIndex)}
                              className="text-red-400 hover:text-red-300 transition text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
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
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">To Date</label>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
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
                          Loading registrations...
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

        {/* Email Tab */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="font-display text-2xl uppercase tracking-wide mb-6">Send Email to Users</h2>

              {/* Email Subject & Body */}
              <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 mb-6">
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
                  <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Message Body</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Enter your email message here..."
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
                    <RefreshCw size={14} /> {trialLoading || paymentLoading ? "Loading..." : "Load Audience"}
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
                  disabled={emailSending || emailRecipients.length === 0 || !emailSubject.trim() || !emailBody.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  <Mail size={16} /> {emailSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
