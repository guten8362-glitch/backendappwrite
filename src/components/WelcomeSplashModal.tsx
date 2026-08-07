import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Sparkles } from "lucide-react";

export function WelcomeSplashModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    const hasShown = sessionStorage.getItem("hasShownSplashModal");
    return justLoggedIn === "true" || hasShown !== "true";
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user || !visible) return;

    sessionStorage.removeItem("justLoggedIn");
    sessionStorage.setItem("hasShownSplashModal", "true");

    const duration = 4000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
    }, 30);

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [user, visible]);

  if (!visible || !user) return null;

  const userName = user.name ? user.name.split(" ")[0] : "User";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md transition-all duration-500 animate-fade-in select-none">
      {/* Central Booking App Themed Glassmorphic Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 bg-card/95 p-7 text-center shadow-2xl backdrop-blur-2xl transition-all animate-scale-in">
        {/* Soft Ambient Background Glow in App Primary Colors */}
        <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* MVIT Seal Logo */}
        <div className="relative mx-auto mb-4 flex size-20 items-center justify-center">
          <span className="absolute inset-0 rounded-2xl bg-primary-soft blur-lg animate-pulse" />
          <div className="relative overflow-hidden rounded-2xl bg-white p-2 shadow-lg border border-border/80">
            <img
              src="/logos/logo4.jpg"
              alt="Manakula Vinayagar Institute of Technology"
              className="h-13 w-13 object-contain"
            />
          </div>
        </div>

        {/* Network Tag */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-primary mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Developed by MVIT
        </div>

        {/* Personalized Welcome Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">
          Hey <span className="text-primary">{user.name || userName}</span>,
        </h2>

        {/* Welcome Message */}
        <p className="text-[0.95rem] font-medium text-muted-foreground leading-relaxed mb-6">
          Welcome to booking app developed by <span className="font-bold text-foreground underline decoration-primary/60 underline-offset-4">MVIT</span>
        </p>

        {/* 4-Second Smooth Progress Bar (No buttons on this popup) */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-75 ease-linear shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[0.72rem] font-semibold text-muted-foreground uppercase tracking-wider">
            Loading Venues...
          </span>
        </div>
      </div>
    </div>
  );
}
