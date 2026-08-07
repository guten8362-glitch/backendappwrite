import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { UserCheck, LogOut, ShieldAlert } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, user, realUser, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!isImpersonating || !user) {
    return null;
  }

  const handleExit = () => {
    stopImpersonation();
    navigate({ to: "/super-admin" });
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
            <UserCheck className="size-4 animate-pulse text-white" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-xs sm:text-sm min-w-0">
            <span className="font-semibold tracking-wide flex items-center gap-1.5 truncate">
              <span className="rounded bg-black/20 px-1.5 py-0.5 text-[0.7rem] uppercase font-bold tracking-wider">
                Impersonating
              </span>
              <span className="underline decoration-white/50 underline-offset-2">
                {user.name || user.email}
              </span>
            </span>

            <span className="text-white/80 hidden md:inline">•</span>

            <span className="text-white/90 text-[0.75rem] sm:text-xs truncate">
              Role: <strong className="capitalize">{user.role}</strong> ({user.institution})
            </span>

            <span className="text-white/80 hidden lg:inline">•</span>

            <span className="text-white/70 text-[0.7rem] sm:text-xs hidden lg:inline truncate">
              Logged in as Super Admin ({realUser?.name || realUser?.email})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExit}
          className="press shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-orange-700 hover:shadow-md"
        >
          <LogOut className="size-3.5" />
          <span>Exit Impersonation</span>
        </button>
      </div>
    </div>
  );
}
