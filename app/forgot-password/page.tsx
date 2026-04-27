"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";

function normalizeEmail(value?: string) {
  return (value || "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      setMsgType("error");
      setMsg("Please enter your email address.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMsgType("error");
      setMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setMsg("");
    setMsgType("");

    try {
      console.log("RESET: attempting password reset for:", cleanEmail);

      await resetPassword(cleanEmail);

      console.log(
        "RESET: Firebase accepted password reset request for:",
        cleanEmail
      );

      setMsgType("success");
      setMsg(
        "Password reset email sent. Please check your inbox and spam folder."
      );
      setEmail("");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      console.error("Forgot password error code:", error?.code);
      console.error("Forgot password error message:", error?.message);

      if (error?.code === "auth/invalid-email") {
        setMsgType("error");
        setMsg("Invalid email address.");
      } else if (error?.code === "auth/user-not-found") {
        setMsgType("error");
        setMsg("No account was found with this email address.");
      } else if (error?.code === "auth/too-many-requests") {
        setMsgType("error");
        setMsg("Too many attempts. Please wait a little and try again.");
      } else if (error?.code === "auth/network-request-failed") {
        setMsgType("error");
        setMsg(
          "Network error. Please check your internet connection and try again."
        );
      } else if (error?.code === "auth/unauthorized-continue-uri") {
        setMsgType("error");
        setMsg(
          "Password reset redirect is not configured correctly in Firebase."
        );
      } else {
        setMsgType("error");
        setMsg(error?.message || "Failed to send reset link. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">
          Reset Your Password
        </h1>

        <p className="mt-2 text-sm text-neutral-600">
          Enter your email and we will send you a password reset link.
        </p>

        {msg ? (
          <div
            className={`mt-4 rounded-xl border p-3 text-sm ${
              msgType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg}
          </div>
        ) : null}

        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            autoComplete="email"
            onChange={(e) => {
              setEmail(e.target.value);
              if (msg) {
                setMsg("");
                setMsgType("");
              }
            }}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-sm text-neutral-600">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-sky-700 hover:text-sky-800"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}