"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function safeText(value?: string) {
  return (value || "").trim();
}

function normalizeEmail(value?: string) {
  return safeText(value).toLowerCase();
}

function isValidEmail(email: string) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(value?: string) {
  return safeText(value).replace(/\s+/g, " ");
}

function digitsOnlyPhone(value?: string) {
  return safeText(value).replace(/[^\d+]/g, "");
}

function isValidPhone(phone: string) {
  const compact = digitsOnlyPhone(phone);
  const digits = compact.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function isStrongPassword(password: string) {
  if (!password) return false;

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasMinLength && hasUpper && hasLower && hasNumber;
}

function getFirebaseErrorMessage(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in or use a different email.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts detected. Please wait a little and try again.";
    default:
      return "Failed to create your customer account. Please try again.";
  }
}

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  consent: boolean;
  website: string;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  consent: false,
  website: "",
};

export default function CustomerSignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  function showError(message: string) {
    setMsgType("error");
    setMsg(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearMessage() {
    if (msg) {
      setMsg("");
      setMsgType("");
    }
  }

  function setField(name: keyof FormState, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearMessage();
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setField(name as keyof FormState, checked);
      return;
    }

    setField(name as keyof FormState, value);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    const cleanFullName = safeText(form.fullName);
    const cleanPhone = normalizePhone(form.phone);
    const cleanPhoneDigits = digitsOnlyPhone(form.phone);
    const cleanEmail = normalizeEmail(form.email);
    const cleanPassword = form.password;
    const cleanConfirmPassword = form.confirmPassword;
    const cleanWebsiteTrap = safeText(form.website);

    if (cleanWebsiteTrap) {
      showError("Unable to submit application. Please try again.");
      return;
    }

    if (cleanFullName.length < 2) {
      showError("Full name must be at least 2 characters.");
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      showError("Please enter a valid phone number.");
      return;
    }

    if (!cleanEmail) {
      showError("Email address is required.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      showError("Please enter a valid email address.");
      return;
    }

    if (!cleanPassword) {
      showError("Password is required.");
      return;
    }

    if (!isStrongPassword(cleanPassword)) {
      showError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      showError("Password and confirm password do not match.");
      return;
    }

    if (!form.consent) {
      showError("Please confirm that you agree to account communication.");
      return;
    }

    setSubmitting(true);
    setMsg("");
    setMsgType("");

    let createdAuthUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );

      createdAuthUser = userCredential.user;
      const uid = userCredential.user.uid;
      const now = serverTimestamp();

      await setDoc(
        doc(db, "customer_signups", uid),
        {
          uid,
          authUid: uid,
          role: "customer",
          signupType: "customer_signup",

          fullName: cleanFullName,
          fullNameLower: cleanFullName.toLowerCase(),
          displayName: cleanFullName,
          displayNameLower: cleanFullName.toLowerCase(),

          phone: cleanPhone,
          phoneDigits: cleanPhoneDigits,

          email: cleanEmail,
          emailLower: cleanEmail,

          status: "active",
          source: "customer_signup_page",

          reviewed: false,
          onboardingStarted: false,
          onboardingCompleted: false,
          accountCreated: true,
          consentToContact: true,
          emailVerified: false,
          phoneVerified: false,

          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          authUid: uid,
          role: "customer",
          signupType: "customer_signup",

          email: cleanEmail,
          emailLower: cleanEmail,

          phone: cleanPhone,
          phoneDigits: cleanPhoneDigits,

          displayName: cleanFullName,
          displayNameLower: cleanFullName.toLowerCase(),

          fullName: cleanFullName,
          fullNameLower: cleanFullName.toLowerCase(),

          consentToContact: true,

          status: "active",
          source: "customer_signup_page",
          emailVerified: false,
          phoneVerified: false,

          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      setForm(INITIAL_FORM);
      router.push("/signup/customer/success");
    } catch (error: any) {
      console.error("Failed to submit customer signup:", error);

      if (createdAuthUser && error?.code !== "auth/email-already-in-use") {
        try {
          await deleteUser(createdAuthUser);
        } catch (rollbackError) {
          console.warn("Customer signup rollback failed:", rollbackError);
        }
      }

      showError(getFirebaseErrorMessage(error?.code || ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-900">
            Customer Signup
          </div>

          <Link
            href="/signup"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to signup
          </Link>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Create your SmartServeUK customer account
        </h1>

        <p className="mt-3 text-neutral-600">
          Sign up to prepare for future food ordering, account access, and a
          smoother SmartServeUK customer experience.
        </p>

        {msg ? (
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm ${
              msgType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Full Name
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              maxLength={100}
              autoComplete="name"
              placeholder="e.g. Md Rahman"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                inputMode="tel"
                autoComplete="tel"
                maxLength={25}
                placeholder="e.g. +44 7..."
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                maxLength={120}
                placeholder="e.g. hello@example.com"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                placeholder="Create a secure password"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Use at least 8 characters with uppercase, lowercase, and a
                number.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                placeholder="Re-enter your password"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={handleChange}
            />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            By submitting this form, you are creating a SmartServeUK customer
            account for future ordering and account access.
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <span>
              I confirm that the information provided is accurate and I agree
              that SmartServeUK may contact me regarding my account, order
              updates, and service-related information.
            </span>
          </label>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-800">
              Ready to create your customer account?
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Create Customer Account"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}