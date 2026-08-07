import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, getDefaultRouteForUser } from "@/lib/auth";
import { Sparkles, Building2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  component: WelcomeSplash,
});

function WelcomeSplash() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress bar animation over 5 seconds (5000ms)
    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 50);

    // 5-second timer to navigate automatically to target page
    const timer = setTimeout(() => {
      const target = getDefaultRouteForUser(user);
      navigate({ to: target, replace: true });
    }, 5000);


    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [user, navigate]);

  const userName = user?.name ? user.name.split(" ")[0] : "User";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white select-none">
      {/* Ambient Animated Glowing Orbs in Background */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-red-600/20 blur-[130px] animate-pulse" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-600/20 blur-[130px] animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Main Glassmorphic Splash Card */}
      <div className="relative z-10 mx-4 max-w-lg w-full rounded-3xl border border-white/15 bg-white/10 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-2xl animate-scale-in">
        {/* MVIT Seal Logo Badge */}
        <div className="relative mx-auto mb-6 flex size-24 items-center justify-center">
          <span className="absolute inset-0 rounded-3xl bg-emerald-500/30 blur-xl animate-pulse" />
          <div className="relative overflow-hidden rounded-2xl bg-white p-2.5 shadow-xl border border-white/60">
            <img
              src="/logos/logo4.jpg"
              alt="Manakula Vinayagar Institute of Technology"
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>

        {/* Institution Network Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[0.78rem] font-bold uppercase tracking-wider text-emerald-400 mb-4">
          <Sparkles className="h-3.5 w-3.5" /> Developed by MVIT
        </div>

        {/* Personal Greeting */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Hey <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400">{user?.name || userName}</span>,
        </h1>

        {/* Welcome Message */}
        <p className="text-lg sm:text-xl font-medium text-slate-200 leading-relaxed mb-8">
          Welcome to booking app developed by <span className="font-bold text-white underline decoration-emerald-500/60 decoration-2 underline-offset-4">MVIT</span>
        </p>

        {/* 5-Second Automatic Progress Indicator (No buttons on page) */}
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-75 ease-linear shadow-[0_0_12px_rgba(34,197,94,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[0.75rem] font-medium text-slate-400 tracking-wide uppercase">
            Entering Booking Portal...
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-center text-[0.78rem] text-slate-400/70 font-medium">
        Sri Manakula Vinayagar Group of Institutions · MVIT Campus
      </div>
    </div>
  );
}
