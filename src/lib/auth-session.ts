export interface AuthUser {
  email: string;
  role: "admin" | "client";
  clientId?: string;
  name?: string;
}

const STORAGE_KEY = "wppx_session";
const LEGACY_STORAGE_KEY = "zynex_session";

export function getStoredSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === "string") {
      return parsed;
    }
  } catch (err) {
    console.error("Failed to parse auth session", err);
  }
  return null;
}

export function saveStoredSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("Failed to save auth session", err);
  }
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear auth session", err);
  }
}

export function isSuperAdmin(user?: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.email.toLowerCase() === "admin@zynex.lk";
}
