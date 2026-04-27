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

const SUPPLIER_TYPES = [
  "Fish Supplier",
  "Meat Supplier",
  "Grocery Supplier",
  "Vegetable Supplier",
  "Rice & Dry Goods Supplier",
  "Packaging Supplier",
  "Frozen Food Supplier",
  "Spice Supplier",
  "Beverage Supplier",
  "Mixed Supplier",
  "Cash & Carry",
  "Wholesaler",
];

const SERVICE_AREAS = [
  "Brick Lane",
  "Green Street",
  "Stratford",
  "East Ham",
  "Ilford",
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(value?: string) {
  return safeText(value).replace(/\s+/g, " ");
}

function digitsOnlyPhone(value?: string) {
  return safeText(value).replace(/[^\d+]/g, "");
}

function isValidPhone(phone: string) {
  const digits = digitsOnlyPhone(phone).replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
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
      return "Failed to submit your supplier signup. Please try again.";
  }
}

type FormState = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  supplierType: string;
  serviceAreas: string[];
  address: string;
  postcode: string;
  openingHours: string;
  availability: string;
  productsText: string;
  productPhotoUrls: string;
  shortVideoUrl: string;
  promotionTitle: string;
  promotionDetails: string;
  discountText: string;
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
  supplierType: "",
  serviceAreas: [],
  address: "",
  postcode: "",
  openingHours: "",
  availability: "",
  productsText: "",
  productPhotoUrls: "",
  shortVideoUrl: "",
  promotionTitle: "",
  promotionDetails: "",
  discountText: "",
  notes: "",
  consent: false,
  website: "",
};

export default function SupplierSignupPage() {
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
    setForm((prev) => ({ ...prev, [name]: value }));
    clearMessage();
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setField(name as keyof FormState, (e.target as HTMLInputElement).checked);
      return;
    }

    setField(name as keyof FormState, value);
  }

  function toggleServiceArea(value: string) {
    setForm((prev) => {
      const exists = prev.serviceAreas.includes(value);

      return {
        ...prev,
        serviceAreas: exists
          ? prev.serviceAreas.filter((item) => item !== value)
          : [...prev.serviceAreas, value],
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
    const cleanSupplierType = safeText(form.supplierType);
    const cleanServiceAreas = form.serviceAreas.map(safeText).filter(Boolean);
    const cleanAddress = safeText(form.address);
    const cleanPostcode = safeText(form.postcode).toUpperCase();
    const cleanOpeningHours = safeText(form.openingHours);
    const cleanAvailability = safeText(form.availability);
    const cleanProducts = splitLines(form.productsText);
    const cleanPhotoUrls = splitLines(form.productPhotoUrls);
    const cleanShortVideoUrl = safeText(form.shortVideoUrl);
    const cleanPromotionTitle = safeText(form.promotionTitle);
    const cleanPromotionDetails = safeText(form.promotionDetails);
    const cleanDiscountText = safeText(form.discountText);
    const cleanNotes = safeText(form.notes);
    const cleanWebsiteTrap = safeText(form.website);

    if (cleanWebsiteTrap) return showError("Unable to submit application. Please try again.");
    if (cleanBusinessName.length < 2) return showError("Business name must be at least 2 characters.");
    if (cleanContactName.length < 2) return showError("Contact name must be at least 2 characters.");
    if (!isValidPhone(cleanPhone)) return showError("Please enter a valid phone number.");
    if (!isValidEmail(cleanEmail)) return showError("Please enter a valid email address.");
    if (!isStrongPassword(cleanPassword)) {
      return showError("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
    }
    if (cleanPassword !== cleanConfirmPassword) return showError("Password and confirm password do not match.");
    if (!cleanSupplierType) return showError("Please select a supplier type.");
    if (cleanServiceAreas.length === 0) return showError("Please select at least one service area.");
    if (!cleanAddress) return showError("Please enter business address.");
    if (!cleanPostcode) return showError("Please enter postcode.");
    if (!cleanOpeningHours) return showError("Please enter opening hours.");
    if (!cleanAvailability) return showError("Please enter availability.");
    if (cleanProducts.length === 0) return showError("Please add at least one product or service.");
    if (!form.consent) return showError("Please confirm that SmartServeUK may contact you.");

    setSubmitting(true);
    setMsg("");
    setMsgType("");

    let createdAuthUser: any = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );

      createdAuthUser = userCredential.user;
      const uid = userCredential.user.uid;
      const now = serverTimestamp();

      const supplierPayload = {
        uid,
        authUid: uid,
        role: "supplier",
        signupType: "supplier_application",

        businessName: cleanBusinessName,
        businessNameLower: cleanBusinessName.toLowerCase(),
        name: cleanBusinessName,
        category: cleanSupplierType,

        contactName: cleanContactName,
        contactNameLower: cleanContactName.toLowerCase(),

        phone: cleanPhone,
        phoneDigits: cleanPhoneDigits,

        email: cleanEmail,
        emailLower: cleanEmail,

        supplierType: cleanSupplierType,
        serviceAreas: cleanServiceAreas,

        address: cleanAddress,
        postcode: cleanPostcode,
        openingHours: cleanOpeningHours,
        availability: cleanAvailability,

        products: cleanProducts,
        productPhotoUrls: cleanPhotoUrls,
        shortVideoUrl: cleanShortVideoUrl,

        promotionEnabled: Boolean(cleanPromotionTitle || cleanPromotionDetails || cleanDiscountText),
        promotionTitle: cleanPromotionTitle,
        promotionDetails: cleanPromotionDetails,
        discountText: cleanDiscountText,
        paidPromotionRequested: Boolean(cleanPromotionTitle || cleanPromotionDetails),

        notes: cleanNotes,

        status: "active",
        listingStatus: "pending_review",
        source: "supplier_signup_page",

        reviewed: false,
        onboardingStarted: false,
        onboardingCompleted: false,
        accountCreated: true,
        consentToContact: true,
        emailVerified: false,
        phoneVerified: false,

        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "supplier_signups", uid), supplierPayload, { merge: true });
      await setDoc(doc(db, "suppliers", uid), supplierPayload, { merge: true });

      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          authUid: uid,
          role: "supplier",
          signupType: "supplier_application",
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
          supplierType: cleanSupplierType,
          serviceAreas: cleanServiceAreas,
          status: "active",
          source: "supplier_signup_page",
          consentToContact: true,
          emailVerified: false,
          phoneVerified: false,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      setForm(INITIAL_FORM);
      router.push("/signup/supplier/success");
    } catch (error: any) {
      console.error("Failed to submit supplier signup:", error);

      if (createdAuthUser && error?.code !== "auth/email-already-in-use") {
        try {
          await deleteUser(createdAuthUser);
        } catch (rollbackError) {
          console.warn("Supplier signup rollback failed:", rollbackError);
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
          <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
            Supplier Signup
          </div>

          <Link
            href="/signup"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to signup
          </Link>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Join SmartServeUK as a Supplier
        </h1>

        <p className="mt-3 text-neutral-600">
          Create your supplier account, list your products, service area, opening times, photos, videos, and promotions.
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
          <input
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            required
            placeholder="Business Name"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <input
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
            required
            placeholder="Contact Name"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="Phone Number"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3"
            />

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Email"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Password"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3"
            />

            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm Password"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3"
            />
          </div>

          <select
            name="supplierType"
            value={form.supplierType}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          >
            <option value="">Select Supplier Type</option>
            {SUPPLIER_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Service Areas
            </label>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {SERVICE_AREAS.map((area) => {
                const checked = form.serviceAreas.includes(area);

                return (
                  <label
                    key={area}
                    className={`flex gap-3 rounded-2xl border p-4 text-sm ${
                      checked
                        ? "border-sky-300 bg-sky-50 text-sky-900"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleServiceArea(area)}
                    />
                    {area}
                  </label>
                );
              })}
            </div>
          </div>

          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Business Address"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <input
            name="postcode"
            value={form.postcode}
            onChange={handleChange}
            required
            placeholder="Postcode"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <input
            name="openingHours"
            value={form.openingHours}
            onChange={handleChange}
            required
            placeholder="Opening Hours e.g. Mon-Sat 8am-7pm"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <input
            name="availability"
            value={form.availability}
            onChange={handleChange}
            required
            placeholder="Availability e.g. Same day delivery / Collection only"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <textarea
            name="productsText"
            value={form.productsText}
            onChange={handleChange}
            required
            rows={5}
            placeholder={"Products / Services, one per line\nChicken\nRice\nVegetables\nPackaging"}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <textarea
            name="productPhotoUrls"
            value={form.productPhotoUrls}
            onChange={handleChange}
            rows={4}
            placeholder={"Product photo URLs, one per line\nLater we can replace this with direct upload."}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <input
            name="shortVideoUrl"
            value={form.shortVideoUrl}
            onChange={handleChange}
            placeholder="Short video URL, max 30 sec recommended"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-sm font-bold text-amber-900">
              Paid Promotion / Special Offer
            </div>

            <div className="mt-4 space-y-4">
              <input
                name="promotionTitle"
                value={form.promotionTitle}
                onChange={handleChange}
                placeholder="Promotion title e.g. 10% off bulk rice orders"
                className="w-full rounded-xl border border-amber-300 px-4 py-3"
              />

              <textarea
                name="promotionDetails"
                value={form.promotionDetails}
                onChange={handleChange}
                rows={3}
                placeholder="Promotion details"
                className="w-full rounded-xl border border-amber-300 px-4 py-3"
              />

              <input
                name="discountText"
                value={form.discountText}
                onChange={handleChange}
                placeholder="Discount e.g. 10% off / Free delivery over £100"
                className="w-full rounded-xl border border-amber-300 px-4 py-3"
              />
            </div>
          </div>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Extra notes"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />

          <div className="hidden" aria-hidden="true">
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={handleChange}
            />
          </div>

          <label className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
            />
            <span>
              I confirm that the information provided is accurate and SmartServeUK may contact me regarding supplier onboarding, listing, promotions, and account use.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 font-semibold"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Create Supplier Account"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}