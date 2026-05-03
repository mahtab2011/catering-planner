"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

const HUB_OPTIONS = [
  { id: "brick-lane", label: "Brick Lane", area: "Brick Lane" },
  { id: "upmarket-brick-lane", label: "Upmarket Brick Lane", area: "Brick Lane" },
  { id: "green-street", label: "Green Street / Plashet Road", area: "Green Street" },
  {
    id: "plashet-road",
    label: "Plashet Road Food Hub",
    area: "Plashet Road",
  },
  { id: "westfield-stratford", label: "Westfield Stratford City", area: "Stratford" },
  { id: "stratford-centre", label: "Stratford Centre", area: "Stratford" },
  { id: "boxpark-croydon", label: "Boxpark Croydon", area: "Croydon" },
];

const CUISINE_OPTIONS = [
  "Bangladeshi",
  "Indian",
  "Pakistani",
  "Turkish",
  "Chinese",
  "Japanese",
  "Italian",
  "Global Street Food",
  "Middle Eastern",
  "Mixed / Fusion",
  "Pitha / Sweets",
  "Fuchka / Chotpoti",
  "Tea / Cafe",
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
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
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
      return "Failed to submit your application. Please try again.";
  }
}

type FormState = {
  name: string;
  owner: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  hubId: string;
  hubName: string;
  area: string;
  cuisines: string[];
  notes: string;
  consent: boolean;
  website: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  owner: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  hubId: "",
  hubName: "",
  area: "",
  cuisines: [],
  notes: "",
  consent: false,
  website: "",
};

export default function RestaurantSignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hubParam = params.get("hub");

    if (hubParam === "plashet-road") {
      const plashetHub = HUB_OPTIONS.find((hub) => hub.id === "plashet-road");

      if (plashetHub) {
        setForm((prev) => ({
          ...prev,
          hubId: plashetHub.id,
          hubName: plashetHub.label,
          area: plashetHub.area,
          notes:
            prev.notes ||
            "Plashet Road Founding Partner application - free lifetime listing.",
        }));
      }
    }
  }, []);

  const selectedHub = useMemo(
    () => HUB_OPTIONS.find((hub) => hub.id === form.hubId),
    [form.hubId]
  );

  const isPlashetFoundingPartner = form.hubId === "plashet-road";

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

    if (name === "hubId") {
      const found = HUB_OPTIONS.find((hub) => hub.id === value);

      setForm((prev) => ({
        ...prev,
        hubId: value,
        hubName: found?.label || "",
        area: found?.area || "",
      }));

      clearMessage();
      return;
    }

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setField(name as keyof FormState, checked);
      return;
    }

    setField(name as keyof FormState, value);
  }

  function toggleCuisine(value: string) {
    setForm((prev) => {
      const exists = prev.cuisines.includes(value);

      return {
        ...prev,
        cuisines: exists
          ? prev.cuisines.filter((item) => item !== value)
          : [...prev.cuisines, value],
      };
    });

    clearMessage();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    const cleanName = safeText(form.name);
    const cleanOwner = safeText(form.owner);
    const cleanPhone = normalizePhone(form.phone);
    const cleanPhoneDigits = digitsOnlyPhone(form.phone);
    const cleanEmail = normalizeEmail(form.email);
    const cleanPassword = form.password;
    const cleanConfirmPassword = form.confirmPassword;
    const cleanHubId = safeText(form.hubId);
    const cleanHubName = safeText(form.hubName);
    const cleanArea = safeText(form.area);
    const cleanCuisines = form.cuisines.map(safeText).filter(Boolean);
    const cleanNotes = safeText(form.notes);
    const cleanWebsiteTrap = safeText(form.website);

    const isPlashetSignup = cleanHubId === "plashet-road";

    if (cleanWebsiteTrap) {
      showError("Unable to submit application. Please try again.");
      return;
    }

    if (cleanName.length < 2) {
      showError("Restaurant name must be at least 2 characters.");
      return;
    }

    if (cleanOwner.length < 2) {
      showError("Owner name must be at least 2 characters.");
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      showError("Please enter a valid phone number.");
      return;
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      showError("Please enter a valid email address.");
      return;
    }

    if (!cleanPassword || !isStrongPassword(cleanPassword)) {
      showError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      showError("Password and confirm password do not match.");
      return;
    }

    if (!cleanHubId) {
      showError("Please select a food hub.");
      return;
    }

    if (cleanCuisines.length === 0) {
      showError("Please select at least one cuisine.");
      return;
    }

    if (!form.consent) {
      showError("Please confirm that SmartServeUK may contact you about onboarding.");
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

      const plashetPartnerFields = isPlashetSignup
        ? {
            isFoundingPartner: true,
            foundingPartnerHub: "plashet-road-food-hub",
            subscriptionStatus: "free_lifetime",
            subscriptionPriceAfterTrial: 0,
            normalFutureSubscriptionPrice: 11.98,
            photosLimit: 6,
            videosLimit: 3,
            videoMaxSeconds: 30,
            mediaApprovalRequired: true,
            approvalStatus: "pending",
            showOnHubPage: true,
            showOnRestaurantListing: true,
            hubPageSlug: "plashet-road-food-hub",
            hubPageUrl: "/plashet-road-food-hub",
          }
        : {
            isFoundingPartner: false,
            subscriptionStatus: "pending_review",
            approvalStatus: "pending",
            showOnHubPage: false,
            showOnRestaurantListing: true,
          };

      await setDoc(
        doc(db, "restaurant_signups", uid),
        {
          uid,
          authUid: uid,
          role: "restaurant",
          signupType: "restaurant_application",

          restaurantName: cleanName,
          restaurantNameLower: cleanName.toLowerCase(),
          ownerName: cleanOwner,
          ownerNameLower: cleanOwner.toLowerCase(),

          phone: cleanPhone,
          phoneDigits: cleanPhoneDigits,

          email: cleanEmail,
          emailLower: cleanEmail,

          hubId: cleanHubId,
          hubName: cleanHubName,
          area: cleanArea,
          cuisines: cleanCuisines,
          notes: cleanNotes,

          status: "new",
          source: isPlashetSignup
            ? "plashet_road_founding_partner_signup"
            : "restaurant_signup_page",

          reviewed: false,
          contactAttempted: false,
          onboardingStarted: false,
          accountCreated: true,

          otpRequired: true,
          otpVerified: false,
          emailVerified: false,
          phoneVerified: false,

          consentToContact: true,

          ...plashetPartnerFields,

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
          role: "restaurant",
          signupType: "restaurant_application",

          email: cleanEmail,
          emailLower: cleanEmail,
          phone: cleanPhone,
          phoneDigits: cleanPhoneDigits,
          displayName: cleanOwner,
          ownerName: cleanOwner,
          ownerNameLower: cleanOwner.toLowerCase(),
          restaurantName: cleanName,
          restaurantNameLower: cleanName.toLowerCase(),

          hubId: cleanHubId,
          hubName: cleanHubName,
          area: cleanArea,
          cuisines: cleanCuisines,

          status: "pending_review",
          otpRequired: true,
          otpVerified: false,
          emailVerified: false,
          phoneVerified: false,
          consentToContact: true,

          source: isPlashetSignup
            ? "plashet_road_founding_partner_signup"
            : "restaurant_signup_page",

          ...plashetPartnerFields,

          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      setForm(INITIAL_FORM);
      router.push("/signup/restaurant/pending");
    } catch (error: any) {
      console.error("Failed to submit restaurant signup:", error);

      if (createdAuthUser && error?.code !== "auth/email-already-in-use") {
        try {
          await deleteUser(createdAuthUser);
        } catch (rollbackError) {
          console.warn("Restaurant signup rollback failed:", rollbackError);
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
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            Restaurant Signup
          </div>

          <Link
            href="/restaurants"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to restaurants
          </Link>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          List Your Restaurant on SmartServeUK
        </h1>

        <p className="mt-3 text-neutral-600">
          Join SmartServeUK and showcase your restaurant to customers across
          London’s key food hubs. Submit your interest and our team will review
          your application.
        </p>

        {isPlashetFoundingPartner ? (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-900">
            <div className="text-base font-extrabold">
              🌟 Plashet Road Founding Partner Application
            </div>
            <p className="mt-2">
              Selected Plashet Road restaurants receive free lifetime listing on
              SmartServeUK, with up to 6 approved photos and 3 approved videos
              of up to 30 seconds each.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            Restaurant onboarding will include verification checks. OTP is planned
            for restaurant accounts only.
          </div>
        )}

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
              Restaurant Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="e.g. Plashet Family Grill"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Owner Name
            </label>
            <input
              name="owner"
              value={form.owner}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="e.g. Abdul Karim"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
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
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
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
                placeholder="e.g. hello@restaurant.com"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
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
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Use at least 8 characters with uppercase, lowercase, and a number.
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
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Food Hub
            </label>
            <select
              name="hubId"
              value={form.hubId}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
            >
              <option value="">Select hub</option>
              {HUB_OPTIONS.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.label}
                </option>
              ))}
            </select>
          </div>

          {selectedHub ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-neutral-700">
                  Hub Display Name
                </label>
                <input
                  value={form.hubName}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-600 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-700">
                  Area
                </label>
                <input
                  value={form.area}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-600 outline-none"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Cuisines
            </label>

            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CUISINE_OPTIONS.map((cuisine) => {
                const checked = form.cuisines.includes(cuisine);

                return (
                  <label
                    key={cuisine}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-sm transition ${
                      checked
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCuisine(cuisine)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300"
                    />
                    <span>{cuisine}</span>
                  </label>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              Select one or more cuisines.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Notes for our team
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              placeholder="Optional: tell us about your restaurant, stall, menu style, or preferred contact time"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
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
            By submitting this form, you are asking SmartServeUK to review your
            restaurant for listing and onboarding.
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
              that SmartServeUK may contact me by phone or email regarding
              restaurant onboarding, verification, and account setup.
            </span>
          </label>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-800">
              Ready to send your application?
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/restaurants"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}