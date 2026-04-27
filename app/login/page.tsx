"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  confirmPasswordReset,
  onAuthStateChanged,
  verifyPasswordResetCode,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  getRecommendedSessionMessage,
  loginUser,
  resetPassword,
  verifyResetCode,
  confirmNewPassword as applyNewPasswordReset,
} from "@/lib/auth";
import {
  clearSessionRecord,
  getSessionPolicyText,
  isSessionExpired,
  saveSessionRecord,
} from "@/lib/session";
import { doc, getDoc } from "firebase/firestore";

function normalizeEmail(value?: string) {
  return (value || "").trim().toLowerCase();
}

function normalizePassword(value?: string) {
  return (value || "").trim();
}

type UserProfile = {
  uid?: string;
  role?: string;
  signupType?: string;
  status?: string;
  otpRequired?: boolean;
  otpVerified?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  source?: string;
};

type AccountLookupResult = {
  role: string | null;
  status: string | null;
  sourceCollection: string | null;
  profile: UserProfile | null;
};

async function getLegacyRole(uid: string) {
  const collections = [
    "restaurants",
    "suppliers",
    "customers",
    "riders",
    "catering_houses",
    "blackcabs",
    "staff",
  ];

  for (const col of collections) {
    try {
      const ref = doc(db, col, uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        console.log("LEGACY ROLE MATCH FOUND IN:", col, "UID:", uid);

        switch (col) {
          case "restaurants":
            return { role: "restaurant", status: "active", sourceCollection: col };
          case "suppliers":
            return { role: "supplier", status: "active", sourceCollection: col };
          case "customers":
            return { role: "customer", status: "active", sourceCollection: col };
          case "riders":
            return { role: "rider", status: "active", sourceCollection: col };
          case "catering_houses":
            return {
              role: "catering_house",
              status: "active",
              sourceCollection: col,
            };
          case "blackcabs":
            return {
              role: "blackcab_partner",
              status: "active",
              sourceCollection: col,
            };
          case "staff":
            return { role: "staff", status: "active", sourceCollection: col };
          default:
            return { role: null, status: null, sourceCollection: col };
        }
      }
    } catch (error) {
      console.error(`LEGACY ROLE CHECK FAILED IN ${col}:`, error);
    }
  }

  return null;
}

async function getUserAccountProfile(uid: string): Promise<AccountLookupResult> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const profile = userSnap.data() as UserProfile;

      console.log("USERS PROFILE FOUND:", profile);

      return {
        role: profile.role || profile.signupType || null,
        status: profile.status || null,
        sourceCollection: "users",
        profile,
      };
    }
  } catch (error) {
    console.error("USERS PROFILE CHECK FAILED:", error);
  }

  console.log("NO USERS PROFILE FOUND. TRYING LEGACY COLLECTIONS...");

  const legacy = await getLegacyRole(uid);

  if (legacy) {
    return {
      role: legacy.role,
      status: legacy.status,
      sourceCollection: legacy.sourceCollection,
      profile: null,
    };
  }

  console.log("NO ROLE DOCUMENT FOUND FOR UID:", uid);

  return {
    role: null,
    status: null,
    sourceCollection: null,
    profile: null,
  };
}

function getRedirectPath(account: AccountLookupResult) {
  const role = account.role;
  const status = account.status;

  if (!role) return "/create-account";

  if (role === "restaurant") {
    if (
      status === "pending_review" ||
      status === "new" ||
      status === "reviewing" ||
      status === "contacted"
    ) {
      return "/signup/restaurant/pending";
    }

    return "/";
  }

  if (role === "blackcab_partner" || role === "blackcab") {
    if (
      status === "pending_review" ||
      status === "new" ||
      status === "reviewing" ||
      status === "contacted"
    ) {
      return "/signup/blackcab/pending";
    }

    return "/blackcab";
  }

  if (role === "supplier") {
    return "/";
  }

  if (role === "customer") {
    return "/";
  }

  if (role === "rider") {
    return "/rider";
  }

  if (role === "catering_house") {
    return "/events";
  }

  if (role === "staff") {
    return "/";
  }

  return "/";
}

function getLoginErrorMessage(error: any) {
  const code = error?.code || "";
  const message = String(error?.message || "").toLowerCase();

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found" ||
    code === "auth/invalid-login-credentials" ||
    message.includes("invalid email or password") ||
    message.includes("invalid credential")
  ) {
    return "Invalid email or password.";
  }

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many login attempts. Please wait a little and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    default:
      return "Login failed. Please try again.";
  }
}

function getForgotPasswordErrorMessage(error: any) {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address first.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a little and try again.";
    case "auth/unauthorized-continue-uri":
      return "Password reset redirect is not configured correctly.";
    default:
      return "Could not send password reset email. Please try again.";
  }
}

function getResetCodeErrorMessage(error: any) {
  const code = error?.code || "";

  switch (code) {
    case "auth/expired-action-code":
      return "This password reset link has expired. Please request a new one.";
    case "auth/invalid-action-code":
      return "This password reset link is invalid or has already been used.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account was found for this password reset link.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    default:
      return "Unable to reset password. Please request a new reset link.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const authCheckHandledRef = useRef(false);
  const redirectingRef = useRef(false);
  const mountedRef = useRef(true);

  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";
  const isResetMode = mode === "resetPassword" && Boolean(oobCode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [useSharedDevice, setUseSharedDevice] = useState(false);
  const [rememberFor7Days, setRememberFor7Days] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [validatingResetCode, setValidatingResetCode] = useState(false);
  const [resetCodeValid, setResetCodeValid] = useState(false);
  const [applyingReset, setApplyingReset] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  const sessionMessage = useMemo(
    () => getRecommendedSessionMessage(useSharedDevice),
    [useSharedDevice]
  );

  const policyText = useMemo(
    () => getSessionPolicyText(rememberFor7Days),
    [rememberFor7Days]
  );

  function clearMessage() {
    if (msg) {
      setMsg("");
      setMsgType("");
    }
  }

  function goTo(path: string) {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    router.replace(path);
  }

  useEffect(() => {
    mountedRef.current = true;

    if (isResetMode) {
  authCheckHandledRef.current = true;

  if (oobCode) {
    verifyResetCode(oobCode)
      .then(() => {
        console.log("Reset code valid");
      })
      .catch(() => {
        console.error("Invalid or expired reset link");
      });
  }

  if (mountedRef.current) {
    setCheckingAuth(false);
  }

  return () => {
    mountedRef.current = false;
  };
}

    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log("AUTH STATE CHANGED. USER UID:", user?.uid ?? null);

      if (authCheckHandledRef.current || redirectingRef.current || submitting) {
        return;
      }

      if (!user) {
        console.log("NO SIGNED-IN USER. SHOW LOGIN PAGE.");
        authCheckHandledRef.current = true;
        if (mountedRef.current) {
          setCheckingAuth(false);
        }
        return;
      }

      if (isSessionExpired()) {
        console.warn("SESSION EXPIRED. CLEARING AND RETURNING TO LOGIN.");
        try {
          await auth.signOut();
        } catch (error) {
          console.error("SIGN OUT AFTER SESSION EXPIRY FAILED:", error);
        }
        clearSessionRecord();
        authCheckHandledRef.current = true;
        if (mountedRef.current) {
          setCheckingAuth(false);
        }
        return;
      }

      try {
        const account = await getUserAccountProfile(user.uid);
        console.log("AUTH CHECK ACCOUNT:", account);

        authCheckHandledRef.current = true;

        if (!account.role) {
          console.warn("NO ROLE FOUND → redirecting to create account");
          goTo("/create-account");
          return;
        }

        const path = getRedirectPath(account);
        console.log(
          "AUTH CHECK REDIRECT PATH:",
          path,
          "| ROLE:",
          account.role,
          "| STATUS:",
          account.status
        );

        goTo(path);
      } catch (error) {
        console.error("AUTH CHECK FAILED:", error);
        authCheckHandledRef.current = true;
        if (mountedRef.current) {
          setCheckingAuth(false);
          setMsgType("error");
          setMsg("Unable to verify your account right now. Please try again.");
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [router, submitting, isResetMode]);

  useEffect(() => {
    if (!isResetMode || !oobCode) {
      setResetCodeValid(false);
      setResetEmail("");
      return;
    }

    let active = true;

    async function checkResetCode() {
      setValidatingResetCode(true);
      setMsg("");
      setMsgType("");

      try {
        const resolvedEmail = await verifyPasswordResetCode(auth, oobCode);

        if (!active || !mountedRef.current) return;

        setResetEmail(resolvedEmail || "");
        setResetCodeValid(true);
      } catch (error: any) {
        console.error("RESET CODE VERIFY FAILED:", error?.code, error?.message, error);

        if (!active || !mountedRef.current) return;

        setResetCodeValid(false);
        setMsgType("error");
        setMsg(getResetCodeErrorMessage(error));
      } finally {
        if (active && mountedRef.current) {
          setValidatingResetCode(false);
        }
      }
    }

    checkResetCode();

    return () => {
      active = false;
    };
  }, [isResetMode, oobCode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting || redirectingRef.current) return;

    const cleanEmail = normalizeEmail(email);
    const cleanPassword = normalizePassword(password);

    if (!cleanEmail) {
      setMsgType("error");
      setMsg("Please enter your email address.");
      return;
    }

    if (!cleanPassword) {
      setMsgType("error");
      setMsg("Please enter your password.");
      return;
    }

    setSubmitting(true);
    setMsg("");
    setMsgType("");

    try {
      const user = await loginUser({
        email: cleanEmail,
        password: cleanPassword,
        useSharedDevice,
      });

      console.log("LOGIN SUCCESS. USER UID:", user.uid);

      saveSessionRecord(rememberFor7Days);

      const account = await getUserAccountProfile(user.uid);
      const path = getRedirectPath(account);

      console.log("LOGIN ACCOUNT:", account);
      console.log(
        "LOGIN REDIRECT PATH:",
        path,
        "| ROLE:",
        account.role,
        "| STATUS:",
        account.status
      );

      if (!account.role) {
        setMsgType("error");
        setMsg("Your account exists, but profile setup is incomplete.");

        setTimeout(() => {
          goTo("/create-account");
        }, 800);
        return;
      }

      setMsgType("success");
      setMsg("Login successful. Redirecting...");

      setTimeout(() => {
        goTo(path);
      }, 500);
    } catch (error: any) {
      console.error("LOGIN FAILED:", error?.code, error?.message, error);
      setMsgType("error");
      setMsg(getLoginErrorMessage(error));
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }

  async function handleForgotPassword() {
    if (resettingPassword || submitting) return;

    clearMessage();

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      setMsgType("error");
      setMsg("Please enter your email address first, then click Forgot password.");
      return;
    }

    try {
      setResettingPassword(true);
      await resetPassword(cleanEmail);

      if (!mountedRef.current) return;

      setMsgType("success");
      setMsg("Password reset email sent. Please check your inbox and spam folder.");
    } catch (error: any) {
      console.error("PASSWORD RESET FAILED:", error?.code, error?.message, error);

      if (!mountedRef.current) return;

      setMsgType("error");
      setMsg(getForgotPasswordErrorMessage(error));
    } finally {
      if (mountedRef.current) {
        setResettingPassword(false);
      }
    }
  }

  async function handleApplyPasswordReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!oobCode || applyingReset) return;

    const cleanNewPassword = normalizePassword(newPassword);
    const cleanConfirmPassword = normalizePassword(confirmNewPassword);

    if (!cleanNewPassword) {
      setMsgType("error");
      setMsg("Please enter your new password.");
      return;
    }

    if (cleanNewPassword.length < 6) {
      setMsgType("error");
      setMsg("Password must be at least 6 characters.");
      return;
    }

    if (!cleanConfirmPassword) {
      setMsgType("error");
      setMsg("Please confirm your new password.");
      return;
    }

    if (cleanNewPassword !== cleanConfirmPassword) {
      setMsgType("error");
      setMsg("New password and confirm password do not match.");
      return;
    }

    setApplyingReset(true);
    setMsg("");
    setMsgType("");

    try {
      await applyNewPasswordReset({
  oobCode,
  newPassword: cleanNewPassword,
});

      if (!mountedRef.current) return;

      setMsgType("success");
      setMsg("Your password has been reset successfully. You can now sign in.");

      setNewPassword("");
      setConfirmNewPassword("");
      setResetCodeValid(false);

      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (error: any) {
      console.error("CONFIRM PASSWORD RESET FAILED:", error?.code, error?.message, error);

      if (!mountedRef.current) return;

      setMsgType("error");
      setMsg(getResetCodeErrorMessage(error));
    } finally {
      if (mountedRef.current) {
        setApplyingReset(false);
      }
    }
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="text-base font-semibold text-neutral-800">
            Checking login...
          </div>
        </div>
      </main>
    );
  }

  if (isResetMode) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
            Reset Password
          </div>

          <h1 className="mt-4 text-3xl font-bold text-neutral-900">
            Set a New Password
          </h1>

          <p className="mt-3 text-neutral-600">
            Choose a new password for your SmartServeUK account.
          </p>

          {resetEmail ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              Resetting password for <span className="font-semibold">{resetEmail}</span>
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

          {validatingResetCode ? (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              Verifying your password reset link...
            </div>
          ) : null}

          {!validatingResetCode && resetCodeValid ? (
            <form onSubmit={handleApplyPasswordReset} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-semibold text-neutral-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearMessage();
                  }}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    clearMessage();
                  }}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={applyingReset}
                className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-70"
              >
                {applyingReset ? "Updating Password..." : "Set New Password"}
              </button>
            </form>
          ) : null}

          <div className="mt-6 text-sm text-neutral-600">
            Back to{" "}
            <Link href="/login" className="font-semibold text-sky-700">
              login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
          Secure Login
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Sign in to SmartServeUK
        </h1>

        <p className="mt-3 text-neutral-600">
          Use your email and password to access your account securely.
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearMessage();
              }}
              autoComplete="email"
              placeholder="Enter your email"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-700">
                Password
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resettingPassword}
                className="text-sm font-semibold text-sky-700 hover:underline disabled:opacity-60"
              >
                {resettingPassword ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearMessage();
              }}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={useSharedDevice}
              onChange={(e) => {
                const checked = e.target.checked;
                setUseSharedDevice(checked);
                if (checked) {
                  setRememberFor7Days(false);
                }
              }}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <span>
              This is a shared or public device.
              <span className="mt-1 block text-neutral-500">
                {sessionMessage}
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <input
  type="checkbox"
  checked={rememberFor7Days}
  disabled={useSharedDevice}
  onChange={(e) => setRememberFor7Days(e.target.checked)}
  className="mt-1 h-4 w-4 cursor-pointer rounded border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
/>
            <span>
              Keep me logged in for 7 days on this device.
              <span className="mt-1 block text-neutral-500">
                {useSharedDevice
                  ? "Disabled because shared/public device is selected."
                  : policyText}
              </span>
            </span>
          </label>

          {!rememberFor7Days ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Without 7-day consent, you will be logged out automatically after
              10 minutes.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || resettingPassword}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-sm text-neutral-600">
          Don’t have an account?{" "}
          <Link href="/create-account" className="font-semibold text-sky-700">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}