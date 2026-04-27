import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type RegisterRole =
  | "restaurant"
  | "supplier"
  | "customer"
  | "rider"
  | "catering_house"
  | "blackcab"
  | "blackcab_driver"
  | "staff";

const UK_RESET_URL = "https://smartserveuk.com/login";

function cleanEmail(value: string) {
  return (value || "").trim().toLowerCase();
}

function cleanPassword(value: string) {
  return value ?? "";
}

function createFirebaseStyleError(code: string, message: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function getCollectionName(role: RegisterRole) {
  switch (role) {
    case "restaurant":
      return "restaurants";
    case "supplier":
      return "suppliers";
    case "customer":
      return "customers";
    case "rider":
      return "riders";
    case "catering_house":
      return "catering_houses";
    case "blackcab":
      return "blackcabs";
    case "blackcab_driver":
      return "blackcab_drivers";
    case "staff":
      return "staff";
    default:
      return "customers";
  }
}

export async function registerUser({
  email,
  password,
  role,
  profileData,
  useSharedDevice = false,
}: {
  email: string;
  password: string;
  role: RegisterRole;
  profileData?: Record<string, any>;
  useSharedDevice?: boolean;
}) {
  const normalizedEmail = cleanEmail(email);
  const safePassword = cleanPassword(password);

  if (!normalizedEmail) {
    throw createFirebaseStyleError("auth/invalid-email", "Email is required.");
  }

  if (!safePassword) {
    throw createFirebaseStyleError(
      "auth/missing-password",
      "Password is required."
    );
  }

  await setPersistence(
    auth,
    useSharedDevice ? browserSessionPersistence : browserLocalPersistence
  );

  const userCred = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    safePassword
  );

  const user = userCred.user;
  const uid = user.uid;
  const collectionName = getCollectionName(role);

  const baseProfile = {
    uid,
    email: normalizedEmail,
    role,
    signupType: role,
    status: profileData?.status || "active",
    ...profileData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, collectionName, uid), baseProfile);

    await setDoc(
      doc(db, "users", uid),
      {
        uid,
        email: normalizedEmail,
        role,
        signupType: role,
        status: profileData?.status || "active",
        source: collectionName,
        otpRequired: Boolean(profileData?.otpRequired),
        otpVerified: Boolean(profileData?.otpVerified),
        emailVerified: Boolean(profileData?.emailVerified),
        phoneVerified: Boolean(profileData?.phoneVerified),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const savedRoleDoc = await getDoc(doc(db, collectionName, uid));

    if (!savedRoleDoc.exists()) {
      throw new Error("Profile document was not saved.");
    }

    return user;
  } catch (error) {
    try {
      await user.delete();
    } catch (deleteError) {
      console.error("Cleanup failed:", deleteError);
    }

    throw error;
  }
}

export async function loginUser({
  email,
  password,
  useSharedDevice = false,
}: {
  email: string;
  password: string;
  useSharedDevice?: boolean;
}) {
  const normalizedEmail = cleanEmail(email);
  const safePassword = cleanPassword(password);

  if (!normalizedEmail) {
    throw createFirebaseStyleError("auth/invalid-email", "Email is required.");
  }

  if (!safePassword) {
    throw createFirebaseStyleError(
      "auth/missing-password",
      "Password is required."
    );
  }

  await setPersistence(
    auth,
    useSharedDevice ? browserSessionPersistence : browserLocalPersistence
  );

  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      safePassword
    );

    return userCred.user;
  } catch (error: any) {
    console.error("Login failed:", error?.code, error?.message);

    if (
      error?.code === "auth/invalid-credential" ||
      error?.code === "auth/user-not-found" ||
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/invalid-login-credentials"
    ) {
      throw createFirebaseStyleError(
        "auth/invalid-credential",
        "Invalid email or password."
      );
    }

    throw error;
  }
}

/**
 * Sends Firebase password reset email.
 * Reset link will return to:
 * https://smartserveuk.com/login?mode=resetPassword&oobCode=...
 */
export async function resetPassword(email: string) {
  const normalizedEmail = cleanEmail(email);

  if (!normalizedEmail) {
    throw createFirebaseStyleError("auth/invalid-email", "Email is required.");
  }

  await sendPasswordResetEmail(auth, normalizedEmail, {
  url: "https://smartserveuk.com/login?mode=resetPassword",
  handleCodeInApp: false,
});

  return true;
}

/**
 * Alias for forgot-password flow.
 * Use this if your login page imports sendResetPasswordEmail.
 */
export async function sendResetPasswordEmail(email: string) {
  return resetPassword(email);
}

/**
 * Verifies Firebase reset link oobCode.
 * Use this when login page opens with mode=resetPassword&oobCode=...
 */
export async function verifyResetCode(oobCode: string) {
  if (!oobCode) {
    throw createFirebaseStyleError(
      "auth/invalid-action-code",
      "Reset code is missing."
    );
  }

  return verifyPasswordResetCode(auth, oobCode);
}

/**
 * Completes password reset using oobCode and new password.
 */
export async function confirmNewPassword({
  oobCode,
  newPassword,
}: {
  oobCode: string;
  newPassword: string;
}) {
  const safeNewPassword = cleanPassword(newPassword);

  if (!oobCode) {
    throw createFirebaseStyleError(
      "auth/invalid-action-code",
      "Reset code is missing."
    );
  }

  if (!safeNewPassword) {
    throw createFirebaseStyleError(
      "auth/missing-password",
      "New password is required."
    );
  }

  if (safeNewPassword.length < 6) {
    throw createFirebaseStyleError(
      "auth/weak-password",
      "Password must be at least 6 characters."
    );
  }

  await confirmPasswordReset(auth, oobCode, safeNewPassword);

  return true;
}

export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("User not authenticated.");
  }

  const safeCurrentPassword = cleanPassword(currentPassword);
  const safeNewPassword = cleanPassword(newPassword);

  if (!safeCurrentPassword) {
    throw createFirebaseStyleError(
      "auth/missing-password",
      "Current password is required."
    );
  }

  if (!safeNewPassword) {
    throw createFirebaseStyleError(
      "auth/missing-password",
      "New password is required."
    );
  }

  const credential = EmailAuthProvider.credential(
    user.email,
    safeCurrentPassword
  );

  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, safeNewPassword);

  try {
    const collections = [
      "users",
      "restaurants",
      "suppliers",
      "customers",
      "riders",
      "catering_houses",
      "blackcabs",
      "blackcab_drivers",
      "staff",
    ];

    for (const col of collections) {
      const ref = doc(db, col, user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        await updateDoc(ref, {
          passwordUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn("Password timestamp update failed:", err);
  }

  return true;
}

export async function logoutUser() {
  await signOut(auth);
}

export function getRecommendedSessionMessage(useSharedDevice: boolean) {
  if (useSharedDevice) {
    return "Shared or public device selected. You should log out after use.";
  }

  return "Private device selected. You can stay signed in on this device.";
}