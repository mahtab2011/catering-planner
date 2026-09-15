"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { canAccess, getCurrentAccount } from "@/lib/authGuard";

/**
 * Client-side admin gate used by /admin/* pages. This is a UX guard,
 * not a security boundary — see docs/SECURITY-FOLLOWUP.md. Real
 * enforcement must come from Firestore security rules restricting
 * writes to these collections to admin accounts.
 */
export function useAdminGate() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async () => {
      const account = await getCurrentAccount();
      setAllowed(canAccess(account, ["admin"]));
      setChecking(false);
    });
    return () => unsub();
  }, []);

  return { checking, allowed };
}
