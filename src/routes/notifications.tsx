import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Surface } from "@/components/ui-kit";
import { getStageInfo, useBookings } from "@/lib/booking-store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Central Hall Booking" },
      {
        name: "description",
        content: "Updates on approvals, verifications and confirmations for your bookings.",
      },
      { property: "og:title", content: "Notifications" },
      { property: "og:description", content: "Updates on your hall bookings." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { bookings, ready, getAuditorium } = useBookings();
  const [clearedAlerts, setClearedAlerts] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cleared_alerts");
    if (saved) {
      try {
        setClearedAlerts(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  const activeAlerts = bookings.filter((b) => !clearedAlerts.includes(`${b.id}-${b.stage}`));

  const handleClearAll = () => {
    const newCleared = [
      ...clearedAlerts,
      ...activeAlerts.map(b => `${b.id}-${b.stage}`)
    ];
    setClearedAlerts(newCleared);
    localStorage.setItem("cleared_alerts", JSON.stringify(newCleared));
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageTitle title="Notifications" subtitle="Updates on your hall requests (Synced with live database)." />
        
        {activeAlerts.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
          >
            <CheckCheck className="size-4" /> Clear All Alerts
          </button>
        )}
      </div>

      {ready && activeAlerts.length === 0 && (
        <Surface className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Bell className="size-6" />
          </span>
          <p className="text-[0.95rem] text-muted-foreground">Nothing to catch up on.</p>
        </Surface>
      )}

      <div className="space-y-3">
        {activeAlerts.map((b, i) => (
          <Surface key={`${b.id}-${b.stage}`} className="p-5" delay={i * 60}>
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Bell className="size-4" />
              </span>
              <div>
                <p className="text-[0.93rem] font-medium">
                  {getStageInfo(b.stage).label} · {getAuditorium(b.auditoriumId)?.name ?? "Hall"}
                </p>
                <p className="mt-1 text-[0.82rem] text-muted-foreground">
                  Request {b.id} · {new Date(b.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </AppShell>
  );
}
