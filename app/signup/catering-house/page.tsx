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

const BUSINESS_TYPES = [
  "Catering House",
  "Event Caterer",
  "Wedding Caterer",
  "Corporate Caterer",
  "Community Catering Service",
  "Mixed Catering Business",
];

const EVENT_SPECIALITIES = [
  "Wedding",
  "Walima",
  "Birthday",
  "Corporate Event",
  "Community Event",
  "Private Party",
  "Mixed Events",
];

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
      return "This email is already registered. Please sign in or use a different email.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts detected. Please wait a little and try again.";
    default:
      return "Failed to create your catering house account. Please try again.";
  }
}

type FormState = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessType: string;
  eventSpecialities: string[];
  notes: string;
  consent: boolean;
  website: string;
};

const INITIAL_FORM: FormState = {
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  businessType: "",
  eventSpecialities: [],
  notes: "",
  consent: false,
  website: "",
};

export default function CateringHouseSignupPage() {
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

  function setField(name: keyof FormState, value: string | boolean | string[]) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearMessage();
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setField(name as keyof FormState, checked);
      return;
    }

    setField(name as keyof FormState, value);
  }

  function toggleEventSpeciality(value: string) {
    setForm((prev) => {
      const exists = prev.eventSpecialities.includes(value);

      return {
        ...prev,
        eventSpecialities: exists
          ? prev.eventSpecialities.filter((item) => item !== value)
          : [...prev.eventSpecialities, value],
      };
    });

    clearMessage();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    const cleanBusinessName = safeText(form.businessName);
    const cleanContactName = safeText(form.contactName);
    const cleanPhone = normalizePhone(form.phone);
    const cleanPhoneDigits = digitsOnlyPhone(form.phone);
    const cleanEmail = normalizeEmail(form.email);
    const cleanPassword = form.password;
    const cleanConfirmPassword = form.confirmPassword;
    const cleanBusinessType = safeText(form.businessType);
    const cleanEventSpecialities = form.eventSpecialities.map(safeText).filter(Boolean);
    const cleanNotes = safeText(form.notes);
    const cleanWebsiteTrap = safeText(form.website);

    if (cleanWebsiteTrap) {
      showError("Unable to submit application. Please try again.");
      return;
    }

    if (cleanBusinessName.length < 2) {
      showError("Business name must be at least 2 characters.");
      return;
    }

    if (cleanContactName.length < 2) {
      showError("Contact name must be at least 2 characters.");
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

    if (!cleanBusinessType) {
      showError("Please select a business type.");
      return;
    }

    if (cleanEventSpecialities.length === 0) {
      showError("Please select at least one event speciality.");
      return;
    }

    if (!form.consent) {
      showError("Please confirm that SmartServeUK may contact you.");
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
        doc(db, "catering_house_signups", uid),
        {
          uid,
          authUid: uid,
          role: "catering_house",
          signupType: "catering_house_signup",

          businessName: cleanBusinessName,
          businessNameLower: cleanBusinessName.toLowerCase(),

          contactName: cleanContactName,
          contactNameLower: cleanContactName.toLowerCase(),

          phone: cleanPhone,
          phoneDigits: cleanPhoneDigits,

          email: cleanEmail,
          emailLower: cleanEmail,

          businessType: cleanBusinessType,
          eventSpecialities: cleanEventSpecialities,
          notes: cleanNotes,

          status: "active",
          source: "catering_house_signup_page",

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
          role: "catering_house",
          signupType: "catering_house_signup",

          email: cleanEmail,
          emailLower: cleanEmail,

          phone: cleanPhone,
          phoneDigits: cleanPhoneDigits,

          displayName: cleanContactName,
          displayNameLower: cleanContactName.toLowerCase(),

          contactName: cleanContactName,
          contactNameLower: cleanContactName.toLowerCase(),

          businessName: cleanBusinessName,
          businessNameLower: cleanBusinessName.toLowerCase(),

          businessType: cleanBusinessType,
          eventSpecialities: cleanEventSpecialities,
          consentToContact: true,

          status: "active",
          source: "catering_house_signup_page",
          emailVerified: false,
          phoneVerified: false,

          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      setForm(INITIAL_FORM);
      router.push("/signup/catering-house/success");
    } catch (error: any) {
      console.warn("Failed to submit catering house signup:", error);

      if (createdAuthUser && error?.code !== "auth/email-already-in-use") {
        try {
          await deleteUser(createdAuthUser);
        } catch (rollbackError) {
          console.warn("Catering house signup rollback failed:", rollbackError);
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
          <div className="inline-flex rounded-full bg-violet-100 px-4 py-1 text-sm font-semibold text-violet-900">
            Catering House Signup
          </div>

          <Link
            href="/signup"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to signup
          </Link>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Join SmartServeUK as a catering business
        </h1>

        <p className="mt-3 text-neutral-600">
          Create your catering house account to access events, planning,
          supplier coordination, and future catering workflows.
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
              Business Name
            </label>
            <input
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              required
              maxLength={120}
              placeholder="e.g. Royal Event Catering"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Contact Name
            </label>
            <input
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="e.g. Abdul Kader"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
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
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
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
                placeholder="e.g. hello@cateringhouse.com"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
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
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
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
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Business Type
            </label>
            <select
              name="businessType"
              value={form.businessType}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
            >
              <option value="">Select business type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Event Specialities
            </label>

            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EVENT_SPECIALITIES.map((item) => {
                const checked = form.eventSpecialities.includes(item);

                return (
                  <label
                    key={item}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-sm transition ${
                      checked
                        ? "border-violet-300 bg-violet-50 text-violet-900"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEventSpeciality(item)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              Select one or more event specialities.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              placeholder="Optional: tell us about your services, event scale, or operational strengths"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-violet-500"
            />
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
            By submitting this form, you are creating a SmartServeUK catering
            business account.
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
              that SmartServeUK may contact me regarding catering account use,
              onboarding, and service updates.
            </span>
          </label>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-800">
              Ready to create your catering house account?
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
                {submitting ? "Submitting..." : "Create Catering House Account"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}