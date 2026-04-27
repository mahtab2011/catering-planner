"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/auth";

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

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting) return;

    if (!currentPassword) {
      setMsgType("error");
      setMsg("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setMsgType("error");
      setMsg("New password must be at least 8 characters.");
      return;
    }

    if (!hasUppercase(newPassword)) {
      setMsgType("error");
      setMsg("Must include at least 1 uppercase letter.");
      return;
    }

    if (!hasLowercase(newPassword)) {
      setMsgType("error");
      setMsg("Must include at least 1 lowercase letter.");
      return;
    }

    if (!hasNumber(newPassword)) {
      setMsgType("error");
      setMsg("Must include at least 1 number.");
      return;
    }

    if (!hasSpecial(newPassword)) {
      setMsgType("error");
      setMsg("Must include at least 1 special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsgType("error");
      setMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setMsg("");
    setMsgType("");

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      setMsgType("success");
      setMsg(
        logoutOtherDevices
          ? "Password updated successfully. Sign out of other devices will be connected when backend session revocation is added."
          : "Password updated successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.back();
      }, 1400);
    } catch (error: any) {
      console.error("CHANGE PASSWORD ERROR:", error);

      let friendly = "Failed to update password.";

      if (error?.code === "auth/wrong-password") {
        friendly = "Current password is incorrect.";
      } else if (error?.code === "auth/too-many-requests") {
        friendly = "Too many attempts. Try again later.";
      } else if (error?.code === "auth/requires-recent-login") {
        friendly = "Please sign in again and then retry changing your password.";
      }

      setMsgType("error");
      setMsg(friendly);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
          Security
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Change Password
        </h1>

        <p className="mt-3 text-neutral-600">
          Update your password securely. You will remain signed in on this device.
        </p>

        {msg && (
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm ${
              msgType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={logoutOtherDevices}
              onChange={(e) => setLogoutOtherDevices(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <span>
              Sign out other devices after password change.
              <span className="mt-1 block text-neutral-500">
                Recommended for better account security, especially after a suspected compromise.
              </span>
            </span>
          </label>

          {logoutOtherDevices ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Full cross-device sign-out needs backend session revocation. The option
              is ready in the UI and should be connected next.
            </div>
          ) : null}

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Password must include at least 8 characters, 1 uppercase, 1 lowercase,
            1 number, and 1 special character.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-black px-4 py-3 text-white font-semibold hover:bg-neutral-800 disabled:opacity-70"
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}