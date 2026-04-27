"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getPasswordError } from "@/lib/passwordRules";
import PasswordField from "@/components/PasswordField";

const VEHICLE_TYPES = [
  "Bicycle",
  "Motorbike",
  "Car",
  "Van",
  "Mixed / Flexible",
];

const SERVICE_ZONES = [
  "Brick Lane",
  "Green Street",
  "Stratford",
  "Croydon",
  "East London",
  "North London",
  "South London",
  "West London",
  "All London",
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
      return "Failed to submit your rider application. Please try again.";
  }
}

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  vehicleType: string;
  serviceZones: string[];
  address: string;
  postcode: string;
  availability: string;
  workingHours: string;
  deliveryRadius: string;
  experience: string;
  profilePhotoUrl: string;
  shortVideoUrl: string;
  notes: string;
  consent: boolean;
  website: string;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  vehicleType: "",
  serviceZones: [],
  address: "",
  postcode: "",
  availability: "",
  workingHours: "",
  deliveryRadius: "",
  experience: "",
  profilePhotoUrl: "",
  shortVideoUrl: "",
  notes: "",
  consent: false,
  website: "",
};

export default function RiderSignupPage() {
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setField(name as keyof FormState, (e.target as HTMLInputElement).checked);
      return;
    }

    setField(name as keyof FormState, value);
  }

  function toggleServiceZone(value: string) {
    setForm((prev) => {
      const exists = prev.serviceZones.includes(value);

      return {
        ...prev,
        serviceZones: exists
          ? prev.serviceZones.filter((item) => item !== value)
          : [...prev.serviceZones, value],
      };
    });

    clearMessage();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting) return;

    const cleanFullName = safeText(form.fullName);
    const cleanPhone = normalizePhone(form.phone);
    const cleanPhoneDigits = digitsOnlyPhone(form.phone);
    const cleanEmail = normalizeEmail(form.email);
    const cleanPassword = form.password;
    const cleanConfirmPassword = form.confirmPassword;
    const cleanVehicleType = safeText(form.vehicleType);
    const cleanServiceZones = form.serviceZones.map(safeText).filter(Boolean);

    const cleanAddress = safeText(form.address);
    const cleanPostcode = safeText(form.postcode).toUpperCase();
    const cleanAvailability = safeText(form.availability);
    const cleanWorkingHours = safeText(form.workingHours);
    const cleanDeliveryRadius = safeText(form.deliveryRadius);
    const cleanExperience = safeText(form.experience);
    const cleanProfilePhotoUrl = safeText(form.profilePhotoUrl);
    const cleanShortVideoUrl = safeText(form.shortVideoUrl);
    const cleanNotes = safeText(form.notes);
    const cleanWebsiteTrap = safeText(form.website);

    const passwordError = getPasswordError(cleanPassword);
    if (passwordError) {
      showError(passwordError);
      return;
    }

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

    if (cleanPassword !== cleanConfirmPassword) {
      showError("Password and confirm password do not match.");
      return;
    }

    if (!cleanVehicleType) {
      showError("Please select a vehicle type.");
      return;
    }

    if (cleanServiceZones.length === 0) {
      showError("Please select at least one service zone.");
      return;
    }

    if (!cleanAddress) {
      showError("Please enter your address or base location.");
      return;
    }

    if (!cleanPostcode) {
      showError("Please enter your postcode.");
      return;
    }

    if (!cleanAvailability) {
      showError("Please enter your availability.");
      return;
    }

    if (!cleanWorkingHours) {
      showError("Please enter your working hours.");
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
      const authUid = userCredential.user.uid;
      const now = serverTimestamp();

      const riderPayload = {
        role: "rider",
        signupType: "rider_application",
        authUid,

        fullName: cleanFullName,
        fullNameLower: cleanFullName.toLowerCase(),
        displayName: cleanFullName,
        displayNameLower: cleanFullName.toLowerCase(),
        name: cleanFullName,

        phone: cleanPhone,
        phoneDigits: cleanPhoneDigits,
        email: cleanEmail,
        emailLower: cleanEmail,

        vehicleType: cleanVehicleType,
        serviceZones: cleanServiceZones,

        address: cleanAddress,
        postcode: cleanPostcode,
        availability: cleanAvailability,
        workingHours: cleanWorkingHours,
        deliveryRadius: cleanDeliveryRadius,
        experience: cleanExperience,
        profilePhotoUrl: cleanProfilePhotoUrl,
        shortVideoUrl: cleanShortVideoUrl,
        notes: cleanNotes,

        status: "pending_review",
        source: "rider_signup_page",

        reviewed: false,
        onboardingStarted: false,
        accountCreated: true,
        riderProfileCreated: false,
        activatedForOperations: false,

        consentToContact: true,
        emailVerified: false,
        phoneVerified: false,

        createdAt: now,
        updatedAt: now,
      };

      await addDoc(collection(db, "rider_signups"), riderPayload);

      await setDoc(
        doc(db, "users", authUid),
        {
          uid: authUid,
          ...riderPayload,
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "riders", authUid),
        {
          uid: authUid,
          ...riderPayload,
        },
        { merge: true }
      );

      setForm(INITIAL_FORM);
      router.push("/signup/rider/success");
    } catch (error: any) {
      console.error("Failed to submit rider signup:", error);

      if (createdAuthUser && error?.code !== "auth/email-already-in-use") {
        try {
          await deleteUser(createdAuthUser);
        } catch (rollbackError) {
          console.warn("Rider signup rollback failed:", rollbackError);
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
          <div className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-900">
            Rider Signup
          </div>

          <Link
            href="/signup"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to signup
          </Link>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Apply to join SmartServeUK as a rider
        </h1>

        <p className="mt-3 text-neutral-600">
          Create your rider account and submit your details for delivery-side
          review and activation.
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
              placeholder="e.g. Rahim Uddin"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
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
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
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
                placeholder="e.g. rider@email.com"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PasswordField
              id="password"
              name="password"
              label="Password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a secure password"
              autoComplete="new-password"
              required
              helperText="Use at least 8 characters with uppercase, lowercase, and a number."
            />

            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Vehicle Type
            </label>
            <select
              name="vehicleType"
              value={form.vehicleType}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
            >
              <option value="">Select vehicle type</option>
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Address / Base Location
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              required
              placeholder="e.g. East Ham, London"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Postcode
              </label>
              <input
                name="postcode"
                value={form.postcode}
                onChange={handleChange}
                required
                placeholder="e.g. E6 1AA"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Delivery Radius
              </label>
              <input
                name="deliveryRadius"
                value={form.deliveryRadius}
                onChange={handleChange}
                placeholder="e.g. 3 miles / 5 miles / All East London"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Availability
              </label>
              <input
                name="availability"
                value={form.availability}
                onChange={handleChange}
                required
                placeholder="e.g. Available today / Weekends / Evenings"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Working Hours
              </label>
              <input
                name="workingHours"
                value={form.workingHours}
                onChange={handleChange}
                required
                placeholder="e.g. Mon-Sun 12pm-11pm"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Service Zones
            </label>

            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICE_ZONES.map((zone) => {
                const checked = form.serviceZones.includes(zone);

                return (
                  <label
                    key={zone}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-sm transition ${
                      checked
                        ? "border-yellow-300 bg-yellow-50 text-yellow-900"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleServiceZone(zone)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300"
                    />
                    <span>{zone}</span>
                  </label>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              Select one or more service zones.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Delivery Experience
            </label>
            <textarea
              name="experience"
              value={form.experience}
              onChange={handleChange}
              rows={3}
              placeholder="Optional: restaurant delivery, grocery delivery, local area knowledge"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Profile Photo URL
              </label>
              <input
                name="profilePhotoUrl"
                value={form.profilePhotoUrl}
                onChange={handleChange}
                placeholder="Optional photo URL"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Short Video URL
              </label>
              <input
                name="shortVideoUrl"
                value={form.shortVideoUrl}
                onChange={handleChange}
                placeholder="Optional short video URL, max 30 sec recommended"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>
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
              placeholder="Optional: tell us more about your rider service"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-yellow-500"
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
            By submitting this form, you are applying to join SmartServeUK rider
            operations.
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
              that SmartServeUK may contact me regarding rider onboarding,
              account review, and activation.
            </span>
          </label>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
            Account will be created now, but rider delivery access should only
            become active after review and rider profile setup.
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-800">
              Ready to submit your rider application?
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
                {submitting ? "Submitting..." : "Submit Rider Application"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}