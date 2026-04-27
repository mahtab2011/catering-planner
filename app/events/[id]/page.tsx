"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

import EventClient from "./EventClient";
import { auth } from "@/lib/firebase";
import { canAccess, getCurrentAccount, isPending } from "@/lib/authGuard";

type GuardAccount = {
  role: string | null;
  status: string | null;
};

function getRedirectPath(account: GuardAccount | null) {
  if (!account?.role) return "/create-account";

  if (account.role === "restaurant") {
    if (isPending(account)) return "/signup/restaurant/pending";
    return "/restaurants";
  }

  if (account.role === "supplier") return "/suppliers";
  if (account.role === "customer") return "/";
  if (account.role === "rider") return "/rider";

  if (account.role === "catering_house") {
    if (isPending(account)) return "/signup/catering-house/success";
    return "/events";
  }

  if (account.role === "blackcab_partner") {
    if (isPending(account)) return "/signup/blackcab/pending";
    return "/blackcab";
  }

  if (account.role === "staff") return "/admin";

  return "/";
}

export default function Page() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setAllowed(false);
        setCheckingAccess(false);
        router.replace("/login");
        return;
      }

      try {
        const account = await getCurrentAccount();

        if (!account) {
          setAllowed(false);
          setCheckingAccess(false);
          router.replace("/create-account");
          return;
        }

        if (!canAccess(account, ["catering_house"])) {
          setAllowed(false);
          setCheckingAccess(false);
          router.replace(getRedirectPath(account));
          return;
        }

        if (isPending(account)) {
          setAllowed(false);
          setCheckingAccess(false);
          router.replace(getRedirectPath(account));
          return;
        }

        setAllowed(true);
        setCheckingAccess(false);
      } catch (error) {
        console.error("Access check failed on event detail page:", error);
        setAllowed(false);
        setCheckingAccess(false);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);

  if (checkingAccess) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Checking access...
        </div>
      </main>
    );
  }

  if (!user || !allowed) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          You do not have access to view this event.
        </div>
      </main>
    );
  }

  return <EventClient />;
}