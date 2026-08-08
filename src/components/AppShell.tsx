import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Bell, CalendarCheck, CalendarDays, Home, LogOut, ShieldCheck, User, Building2, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth, isCoordinatorUser, isSuperAdminUser } from "@/lib/auth";
import { subscribeToNotifications } from "@/lib/appwrite/realtime";
import { WelcomeSplashModal } from "@/components/WelcomeSplashModal";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { NotificationBanner } from "@/components/NotificationBanner";

const navItems = [
  { to: "/auditoriums", label: "Book Venue", icon: Building2 },
  { to: "/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/coordinator", label: "Coordinator", icon: ShieldCheck, adminOnly: true },
  { to: "/admin", label: "Admin Panel", icon: ShieldCheck, adminOnly: true },
  { to: "/super-admin", label: "Super Admin", icon: ShieldAlert, superAdminOnly: true },
  { to: "/organizer", label: "Confirmed Venues", icon: CalendarCheck, adminOnly: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hovered, setHovered] = useState<string | null>(null);
  const { user, realUser, isImpersonating, ready } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Swipe gesture state for 1:1 Instagram-style tab switching
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
    setTouchDeltaX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy) * 1.1) {
      setTouchDeltaX(dx);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    setIsDragging(false);
    
    const duration = Date.now() - touchStart.time;
    const velocity = Math.abs(touchDeltaX) / Math.max(duration, 1);
    const minSwipeDistance = 45;
    const isFastSwipe = velocity > 0.3 && Math.abs(touchDeltaX) > 20;

    if (Math.abs(touchDeltaX) >= minSwipeDistance || isFastSwipe) {
      const activeIdx = visibleNavItems.findIndex((item) => pathname.startsWith(item.to));
      if (activeIdx !== -1) {
        if (touchDeltaX < 0 && activeIdx < visibleNavItems.length - 1) {
          navigate({ to: visibleNavItems[activeIdx + 1].to });
        } else if (touchDeltaX > 0 && activeIdx > 0) {
          navigate({ to: visibleNavItems[activeIdx - 1].to });
        }
      }
    }

    setTouchStart(null);
    setTouchDeltaX(0);
  };

  const showUserUI = mounted && user;

  return (
    <div className={cn("min-h-screen overflow-x-hidden", pathname === "/login" && "h-[100dvh] overflow-hidden flex flex-col justify-center")}>
      {/* Impersonation Banner at absolute top */}
      <ImpersonationBanner />

      {/* 4-Second Post-Login Blurred Background Splash Popup */}
      {showUserUI && pathname !== "/login" && <WelcomeSplashModal />}

      {/* Top Header Bar: Top Left Back Navigation & Top Right Logo */}
      {showUserUI && pathname !== "/login" && (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md print:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
            {/* Top Left Back Button */}
            <button
              type="button"
              onClick={() => window.history.back()}
              className="press group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-1.5 text-[0.82rem] font-semibold text-foreground shadow-xs transition-all hover:bg-muted hover:border-primary/40 hover:shadow-sm"
              title="Go back to previous page"
            >
              <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-1" />
              <span>Back</span>
            </button>

            {/* Top Right Logo & Title */}
            <div className="flex items-center gap-2.5">
              <span className="text-[0.88rem] font-bold text-foreground tracking-tight hidden sm:inline">
                Central Hall Booking
              </span>
              <img
                src="/logos/logo4.jpg"
                alt="MVIT Logo"
                className="h-8 w-8 rounded-lg object-contain border border-border/60 shadow-2xs"
              />
            </div>
          </div>
        </header>
      )}

      <main
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "mx-auto w-full touch-pan-y animate-fade-in",
          pathname === "/login" ? "max-w-md px-4 flex-1 flex flex-col justify-center py-2" : "max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10",
          showUserUI ? "pb-36 sm:pb-44" : "pb-10"
        )}
        style={{
          transform: touchDeltaX ? `translate3d(${touchDeltaX * 0.75}px, 0px, 0px)` : "none",
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          willChange: "transform",
        }}
      >
        <NotificationBanner />
        {children}
      </main>

      {showUserUI && (
        <nav
          className="fixed bottom-3 sm:bottom-6 left-1/2 z-50 -translate-x-1/2 w-[95%] max-w-lg sm:w-auto print:hidden"
          onMouseLeave={() => setHovered(null)}
        >
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 rounded-2xl sm:rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 px-2 py-2 sm:px-5 sm:py-3 shadow-2xl backdrop-blur-xl">
            {visibleNavItems.map((i) => {
              const active = pathname.startsWith(i.to);
              const isHovered = hovered === i.to;
              const Icon = i.icon;
              const isHighlight = active || isHovered;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  onMouseEnter={() => setHovered(i.to)}
                  className="relative flex flex-1 sm:flex-initial flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 sm:px-3 sm:py-1.5 transition-all duration-200 min-w-0"
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200",
                      isHighlight
                        ? "size-8 sm:size-10 bg-primary text-primary-foreground shadow-md"
                        : "size-8 sm:size-10 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "transition-all duration-200",
                        isHighlight ? "size-4 sm:size-5" : "size-4 sm:size-[0.95rem]",
                        active && "animate-spring-bounce",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "text-[0.6rem] sm:text-[0.7rem] font-medium transition-all duration-200 truncate max-w-full text-center leading-none",
                      active ? "text-primary font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {i.label}
                  </span>
                </Link>
              );
            })}

            <div className="mx-0.5 h-6 sm:h-8 w-px bg-border/70 shrink-0 sm:mx-1" />

            <button
              onClick={() => navigate({ to: "/logout" })}
              className="relative flex flex-1 sm:flex-initial flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 sm:px-3 sm:py-1.5 transition-all duration-200 min-w-0"
            >
              <span className="flex size-8 sm:size-10 items-center justify-center rounded-xl sm:rounded-2xl text-muted-foreground hover:text-foreground">
                <LogOut className="size-4 sm:size-[0.95rem]" />
              </span>
              <span className="text-[0.6rem] sm:text-[0.7rem] font-medium text-muted-foreground truncate max-w-full text-center leading-none">
                Logout
              </span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

