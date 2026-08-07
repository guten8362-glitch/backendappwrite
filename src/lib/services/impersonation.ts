import type { User } from "../auth";
import { recordAuditLog } from "./audit";

const IMPERSONATION_KEY = "bms_impersonated_user";

export const getStoredImpersonatedUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to parse impersonated user from storage", error);
    return null;
  }
};

export const setStoredImpersonatedUser = (user: User | null) => {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(IMPERSONATION_KEY);
    }
  } catch (error) {
    console.error("Failed to save impersonated user to storage", error);
  }
};

export const logImpersonationStart = (realUser: User, targetUser: User) => {
  recordAuditLog({
    performedBy: realUser.$id || realUser.email,
    performedByName: realUser.name || realUser.email,
    actingAs: targetUser.$id || targetUser.email,
    actingAsName: targetUser.name || targetUser.email,
    action: "START_IMPERSONATION",
    details: {
      targetRole: targetUser.role,
      targetInstitution: targetUser.institution,
    },
  });
};

export const logImpersonationStop = (realUser: User, targetUser: User | null) => {
  recordAuditLog({
    performedBy: realUser.$id || realUser.email,
    performedByName: realUser.name || realUser.email,
    actingAs: targetUser ? (targetUser.$id || targetUser.email) : "SELF",
    actingAsName: targetUser?.name || targetUser?.email || "SELF",
    action: "STOP_IMPERSONATION",
    details: {
      timestamp: new Date().toISOString(),
    },
  });
};
