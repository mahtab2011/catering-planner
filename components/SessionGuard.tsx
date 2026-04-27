"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { clearSessionRecord, isSessionExpired } from "@/lib/session";
import { logoutUser } from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/forgot-password",
  "/create-account",
  "/sign-up",
  "/signup",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (isPublicPath(pathname)) return;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      if (isSessionExpired()) {
        console.warn("SESSION GUARD: session expired, logging out.");

        try {
          await logoutUser();
        } catch (error) {
          console.error("SESSION GUARD logout failed:", error);
        }

        clearSessionRecord();
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [pathname, router]);

  useEffect(() => {
    if (!pathname) return;
    if (isPublicPath(pathname)) return;

    const interval = window.setInterval(async () => {
      if (!auth.currentUser) return;

      if (isSessionExpired()) {
        console.warn("SESSION GUARD INTERVAL: session expired, logging out.");

        try {
          await logoutUser();
        } catch (error) {
          console.error("SESSION GUARD interval logout failed:", error);
        }

        clearSessionRecord();
        router.replace("/login");
      }
    }, 30 * 1000);

    return () => window.clearInterval(interval);
  }, [pathname, router]);

  return null;
}