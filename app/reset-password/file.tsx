"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const oobCode = params.get("oobCode");

  const [password, setPassword] = useState("");
  const [valid, setValid] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!oobCode) return;

    verifyPasswordResetCode(auth, oobCode)
      .then(() => setValid(true))
      .catch(() => setMsg("Invalid or expired link"));
  }, [oobCode]);

  const handleReset = async () => {
    try {
      await confirmPasswordReset(auth, oobCode!, password);
      setMsg("Password reset successful. You can login now.");
    } catch (err) {
      console.error(err);
      setMsg("Reset failed");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-lg font-bold mb-4">Reset Password</h1>

      {!valid ? (
        <p>{msg || "Checking link..."}</p>
      ) : (
        <>
          <input
            type="password"
            placeholder="New password"
            className="border p-2 w-full mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleReset}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Reset Password
          </button>

          {msg && <p className="mt-3 text-sm">{msg}</p>}
        </>
      )}
    </div>
  );
}