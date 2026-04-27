const SESSION_KEY = "smartserve_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

type SessionMode = "remember_7_days" | "temporary_10_minutes";

type StoredSession = {
  mode: SessionMode;
  loginAt: number;
  expiresAt: number;
};

function getNow() {
  return Date.now();
}

export function createSessionRecord(rememberFor7Days: boolean): StoredSession {
  const now = getNow();

  if (rememberFor7Days) {
    return {
      mode: "remember_7_days",
      loginAt: now,
      expiresAt: now + SEVEN_DAYS_MS,
    };
  }

  return {
    mode: "temporary_10_minutes",
    loginAt: now,
    expiresAt: now + TEN_MINUTES_MS,
  };
}

export function saveSessionRecord(rememberFor7Days: boolean) {
  if (typeof window === "undefined") return;

  const record = createSessionRecord(rememberFor7Days);
  localStorage.setItem(SESSION_KEY, JSON.stringify(record));
}

export function getSessionRecord(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;

    if (
      !parsed ||
      typeof parsed.loginAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      (parsed.mode !== "remember_7_days" &&
        parsed.mode !== "temporary_10_minutes")
    ) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSessionRecord() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isSessionExpired(): boolean {
  const record = getSessionRecord();
  if (!record) return true;

  return getNow() >= record.expiresAt;
}

export function getSessionRemainingMs(): number {
  const record = getSessionRecord();
  if (!record) return 0;

  return Math.max(record.expiresAt - getNow(), 0);
}

export function refreshTemporarySession() {
  if (typeof window === "undefined") return;

  const record = getSessionRecord();
  if (!record) return;

  if (record.mode !== "temporary_10_minutes") return;

  const refreshed: StoredSession = {
    ...record,
    expiresAt: getNow() + TEN_MINUTES_MS,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
}

export function getSessionPolicyText(rememberFor7Days: boolean) {
  if (rememberFor7Days) {
    return "You will stay signed in for up to 7 days on this device.";
  }

  return "You will be logged out automatically after 10 minutes for security.";
}