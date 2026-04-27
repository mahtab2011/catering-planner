"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { registerUser } from "@/lib/auth";
import PasswordField from "@/components/PasswordField";

type RoleOption =
  | "restaurant"
  | "supplier"
  | "customer"
  | "rider"
  | "catering_house"
  | "blackcab"
  | "staff";

const ROLE_OPTIONS: { value: RoleOption; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "supplier", label: "Supplier" },
  { value: "customer", label: "Customer" },
  { value: "rider", label: "Rider" },
  { value: "catering_house", label: "Catering House" },
  { value: "blackcab", label: "Black Cab" },
  { value: "staff", label: "Staff" },
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

function hasUppercase(value: string) {
  return /[A-Z]/.test(value);
}

function hasLowercase(value: string) {
  return /[a-z]/.test(value);
}

function hasNumber(value: string) {
  return /\d/.test(value);
}

function hasSpecial(value: string) {
  return /[^A-Za-z0-9]/.test(value);
}

function getCollectionRole(role: RoleOption) {
  if (role === "catering_house") return "catering_house";
  if (role === "blackcab") return "blackcab";
  return role;
}

export default function CreateAccountPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUserExists, setCurrentUserExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "restaurant" as RoleOption,
    businessName: "",
    consent: false,
  });

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserExists(!!user);
      setCheckingAuth(false);
    });

    return () => unsub();
  }, []);

  function setField(name: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (msg) {
      setMsg("");
      setMsgType("");
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" && "checked" in e.target ? e.target.checked : false;

    if (type === "checkbox") {
      setField(name, checked);
      return;
    }

    setField(name, value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting) return;

    const fullName = safeText(form.fullName);
    const email = normalizeEmail(form.email);
    const phone = normalizePhone(form.phone);
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const role = form.role;
    const businessName = safeText(form.businessName);
    const consent = form.consent;

    if (fullName.length < 2) {
      setMsgType("error");
      setMsg("Full name must be at least 2 characters.");
      return;
    }

    if (!email) {
      setMsgType("error");
      setMsg("Email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setMsgType("error");
      setMsg("Please enter a valid email address.");
      return;
    }

    if (phone.length < 5) {
      setMsgType("error");
      setMsg("Please enter a valid phone number.");
      return;
    }

    if (role !== "customer" && businessName.length < 2) {
      setMsgType("error");
      setMsg("Please enter the business or display name.");
      return;
    }

    if (password.length < 8) {
      setMsgType("error");
      setMsg("Password must be at least 8 characters.");
      return;
    }

    if (!hasUppercase(password)) {
      setMsgType("error");
      setMsg("Password must include at least 1 uppercase letter.");
      return;
    }

    if (!hasLowercase(password)) {
      setMsgType("error");
      setMsg("Password must include at least 1 lowercase letter.");
      return;
    }

    if (!hasNumber(password)) {
      setMsgType("error");
      setMsg("Password must include at least 1 number.");
      return;
    }

    if (!hasSpecial(password)) {
      setMsgType("error");
      setMsg("Password must include at least 1 special character.");
      return;
    }

    if (password !== confirmPassword) {
      setMsgType("error");
      setMsg("Password and confirm password do not match.");
      return;
    }

    if (!consent) {
      setMsgType("error");
      setMsg("Please accept the account and contact consent.");
      return;
    }

    if (currentUserExists) {
      setMsgType("error");
      setMsg(
        "You are already logged in. Please sign out first or use an incognito window to create another account."
      );
      return;
    }

    setSubmitting(true);
    setMsg("");
    setMsgType("");

    try {
      await registerUser({
        email,
        password,
        role: getCollectionRole(role),
        profileData: {
          fullName,
          phone,
          businessName,
          status: "active",
          isActive: true,
          emailVerified: false,
          phoneVerified: false,
          otpRequired: role === "restaurant",
          otpVerified: false,
          onboardingStatus:
            role === "restaurant" ? "pending_verification" : "active",
        },
      });

      setMsgType("success");
      setMsg("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        router.replace("/login");
      }, 900);
    } catch (error: any) {
      console.error("Create account failed:", error);

      let friendlyMessage = "Failed to create account. Please try again.";

      if (error?.code === "auth/email-already-in-use") {
        friendlyMessage = "This email address is already in use.";
      } else if (error?.code === "auth/invalid-email") {
        friendlyMessage = "Invalid email address.";
      } else if (error?.code === "auth/weak-password") {
        friendlyMessage = "Password is too weak.";
      } else if (error?.code === "auth/admin-restricted-operation") {
        friendlyMessage =
          "This operation is restricted. Please check your Firebase Authentication settings.";
      } else if (error?.code === "auth/invalid-credential") {
        friendlyMessage =
          "Authentication configuration problem detected. Please check Firebase Authentication setup.";
      }

      setMsgType("error");
      setMsg(friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="text-base font-semibold text-neutral-800">
            Checking account status...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-900">
          Create Account
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Create your SmartServeUK account
        </h1>

        <p className="mt-3 text-neutral-600">
          Set up your secure account with email and password. Restaurant accounts
          can use OTP as an extra verification layer later.
        </p>

        {currentUserExists ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You are currently signed in. For testing a new account, please sign
            out first or open this page in an incognito/private window.
          </div>
        ) : null}

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Full Name
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Abdul Karim"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={(e) => setField("role", e.target.value as RoleOption)}
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
              >
                {ROLE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              {form.role === "customer"
                ? "Display Name"
                : "Business / Display Name"}
            </label>
            <input
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder={
                form.role === "customer"
                  ? "e.g. Mahtab"
                  : "e.g. Brick Lane Kacchi House"
              }
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="e.g. hello@smartserveuk.com"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Phone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="e.g. +44 7..."
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-emerald-500"
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
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
            />

            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Password must include at least 8 characters, 1 uppercase letter,
            1 lowercase letter, 1 number, and 1 special character.
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <input
              name="consent"
              type="checkbox"
              checked={form.consent}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <span>
              I confirm that my information is accurate and I agree to account
              setup, onboarding contact, and security verification where needed.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || currentUserExists}
            className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}