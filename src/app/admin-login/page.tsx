"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      router.push("/admin");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        setError(result?.message || "Login failed. Please check credentials.");
        setIsLoading(false);
        return;
      }

      // Store token
      localStorage.setItem("admin_token", result.token);
      
      // Redirect to admin
      router.push("/admin");
    } catch (err) {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl uppercase tracking-wide text-brand-orange">GYM Admin</h1>
          <p className="text-sm text-zinc-400">Control Panel Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className={`rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 ${isLoading ? "animate-pulse ring-2 ring-brand-orange/20" : ""}`}>
          <div>
            <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange transition"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.08em] text-zinc-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-brand-orange transition"
              disabled={isLoading}
            />
          </div>

          {error && <div className="rounded-lg bg-red-500/20 border border-red-500 px-3 py-2 text-sm text-red-300">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>


      </div>
    </main>
  );
}
