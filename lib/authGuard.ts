import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type Account = {
  role: string | null;
  status: string | null;
};

export async function getCurrentAccount(): Promise<Account | null> {
  const user = auth.currentUser;

  if (!user) return null;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();

  return {
    role: data.role || null,
    status: data.status || null,
  };
}

export function canAccess(
  account: Account | null,
  allowedRoles: string[]
) {
  if (!account) return false;

  return allowedRoles.includes(account.role || "");
}

export function isPending(account: Account | null) {
  if (!account) return false;

  return (
    account.status === "pending_review" ||
    account.status === "new" ||
    account.status === "reviewing" ||
    account.status === "contacted"
  );
}