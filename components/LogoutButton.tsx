"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/auth";
import { clearSessionRecord } from "@/lib/session";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

export default function LogoutButton({
  className = "rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700",
  label = "Logout",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    try {
      setLoading(true);
      await logoutUser();
      clearSessionRecord();
      router.replace("/login");
    } catch (error) {
      console.error("LOGOUT FAILED:", error);
      clearSessionRecord();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? "Logging out..." : label}
    </button>
  );
}