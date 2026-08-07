import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ID } from "appwrite";
import { getCurrentUser, logoutUser, loginWithEmail } from "./appwrite/account";
import { updateUserFCMToken } from "./appwrite/users";
import { account } from "./appwrite/client";
import { requestFCMToken } from "./firebase";
import {
  getStoredImpersonatedUser,
  setStoredImpersonatedUser,
  logImpersonationStart,
  logImpersonationStop,
} from "./services/impersonation";

export type UserRole = "user" | "admin" | "coordinator" | "organizer" | "super_admin";

export interface User {
  email: string;
  phone?: string;
  role: UserRole;
  name?: string;
  institution: string;
  team?: string;
  $id?: string;
}

interface AuthContextType {
  user: User | null; // Active user (impersonatedUser if active, else realUser)
  realUser: User | null; // True logged-in Appwrite user
  impersonatedUser: User | null;
  isImpersonating: boolean;
  startImpersonation: (targetUser: User) => void;
  stopImpersonation: () => void;
  ready: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper to synchronize FCM tokens with a single Appwrite Push Target per device
const syncPushTarget = async (token: string) => {
  try {
    const currentUser = await account.get();
    
    // Clean up existing push targets to avoid expired tokens accumulating
    if (currentUser.targets && currentUser.targets.length > 0) {
      for (const t of currentUser.targets) {
        if (t.providerType === 'push') {
          try {
            await account.deletePushTarget(t.$id);
            console.log(`🧹 Deleted old push target to avoid expiry issues: ${t.$id}`);
          } catch (delErr) {
            console.warn(`Failed to delete old push target: ${t.$id}`, delErr);
          }
        }
      }
    }

    const targetId = ID.unique();
    try {
      await account.createPushTarget(targetId, token, "6a6c0163000e309089af");
      console.log("✅ Appwrite Push Target created with provider ID!");
    } catch (pErr) {
      try {
        await account.createPushTarget(targetId, token);
        console.log("✅ Appwrite Push Target created successfully (fallback)!");
      } catch (pErr2) {
        console.warn("❌ Appwrite Push Target creation failed:", pErr2);
      }
    }
  } catch (err) {
    console.error("Failed to sync push targets:", err);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(() => getStoredImpersonatedUser());
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setRealUser(currentUser as User);
          localStorage.setItem("bms_user", JSON.stringify(currentUser));
          
          // Request browser notification permissions automatically
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
          }

          // Always fetch and sync the latest FCM token for the active logged-in device
          try {
            const token = await requestFCMToken();
            if (token) {
              await updateUserFCMToken(currentUser.email, token, currentUser.$id);
              await syncPushTarget(token);
              localStorage.setItem("fcm_token", token);
            }
          } catch (e) {
            console.error("FCM Token fetch failed on checkSession:", e);
          }
        } else {
          setRealUser(null);
          setImpersonatedUser(null);
          setStoredImpersonatedUser(null);
          localStorage.removeItem("bms_user");
          localStorage.removeItem("fcm_registered");
        }
      } catch (error) {
        setRealUser(null);
        setImpersonatedUser(null);
        setStoredImpersonatedUser(null);
        localStorage.removeItem("bms_user");
        localStorage.removeItem("fcm_registered");
      } finally {
        setReady(true);
      }
    };
    
    checkSession();
  }, []);

  const startImpersonation = (targetUser: User) => {
    if (!realUser) return;
    logImpersonationStart(realUser, targetUser);
    setImpersonatedUser(targetUser);
    setStoredImpersonatedUser(targetUser);
  };

  const stopImpersonation = () => {
    if (realUser) {
      logImpersonationStop(realUser, impersonatedUser);
    }
    setImpersonatedUser(null);
    setStoredImpersonatedUser(null);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await loginWithEmail(email, password);
      const currentUser = await getCurrentUser();
      
      try {
        const token = await requestFCMToken();
        if (token) {
          await updateUserFCMToken(email, token);
          await syncPushTarget(token);
        }
      } catch (err) {
        console.error("FCM Token Registration failed", err);
      }
      
      if (!currentUser) throw new Error("Not authorized in database");
      
      setRealUser(currentUser as User);
      localStorage.setItem("bms_user", JSON.stringify(currentUser));
      setAuthError(null);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    stopImpersonation();
    try {
      const currentUser = await account.get();
      // Clean up push targets before logging out
      if (currentUser?.targets && currentUser.targets.length > 0) {
        for (const t of currentUser.targets) {
          if (t.providerType === 'push') {
            try {
              await account.deletePushTarget(t.$id);
            } catch (delErr) {
              console.warn(`Failed to delete push target on logout: ${t.$id}`, delErr);
            }
          }
        }
      }
      await logoutUser();
    } catch (e) {
      console.error("Logout error", e);
    }
    setRealUser(null);
    localStorage.removeItem("bms_user");
    localStorage.removeItem("fcm_registered");
  };

  const activeUser = impersonatedUser || realUser;

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        realUser,
        impersonatedUser,
        isImpersonating: !!impersonatedUser,
        startImpersonation,
        stopImpersonation,
        ready,
        login,
        logout,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const isCoordinatorUser = (user: User | null) => user?.role === "coordinator" || user?.role === "admin" || user?.role === "super_admin";
export const isAdminUser = (user: User | null) => user?.role === "admin" || user?.role === "super_admin";
export const isOrganizerUser = (user: User | null) => user?.role === "organizer";
export const isSuperAdminUser = (user: User | null) => user?.role === "super_admin";


export const getDefaultRouteForUser = (user: User | null): string => {
  if (!user) return "/login";
  if (user.role === "super_admin") return "/super-admin";
  if (user.role === "admin") return "/admin";
  if (user.role === "coordinator") return "/coordinator";
  if (user.role === "organizer") return "/organizer";
  return "/auditoriums";
};


