import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { 
  Eye, 
  Search, 
  Calendar as CalendarIcon, 
  PackageCheck,
  FileText,
  ShieldAlert,
  Clock,
  BellRing,
  X
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Surface } from "@/components/ui-kit";
import { formatDate, formatTime, useBookings, getStageInfo, getInstitutionLogo, type Booking } from "@/lib/booking-store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/organizer")({
  head: () => ({
    meta: [
      { title: "Stores & Arrangements – Central Hall Booking" },
      { name: "description", content: "View confirmed bookings to arrange facilities." },
    ],
  }),
  component: OrganizerPortal,
});

export function OrganizerPortal() {
  const { user } = useAuth();
  const { bookings, getAuditorium, ready } = useBookings();
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Reminder alert state backed by localStorage
  const [reminders, setReminders] = useState<Record<string, { minutesBefore: number; label: string }>>(() => {
    try {
      const saved = localStorage.getItem("organizer_reminders");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [reminderModalBooking, setReminderModalBooking] = useState<Booking | null>(null);
  const [selectedOffsetMinutes, setSelectedOffsetMinutes] = useState<number>(120);
  const [customValue, setCustomValue] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const saveReminder = (bookingId: string) => {
    let minutes = selectedOffsetMinutes;
    let label = "";

    if (isCustom && customValue) {
      const val = parseInt(customValue) || 1;
      if (customUnit === "minutes") minutes = val;
      else if (customUnit === "hours") minutes = val * 60;
      else if (customUnit === "days") minutes = val * 1440;
      label = `${val} ${customUnit} before event`;
    } else {
      if (minutes === 15) label = "15 minutes before event";
      else if (minutes === 30) label = "30 minutes before event";
      else if (minutes === 60) label = "1 hour before event";
      else if (minutes === 120) label = "2 hours before event";
      else if (minutes === 360) label = "6 hours before event";
      else if (minutes === 1440) label = "1 day before event";
      else label = `${minutes} mins before event`;
    }

    const updated = { ...reminders, [bookingId]: { minutesBefore: minutes, label } };
    setReminders(updated);
    localStorage.setItem("organizer_reminders", JSON.stringify(updated));
    setReminderModalBooking(null);
  };

  const removeReminder = (bookingId: string) => {
    const updated = { ...reminders };
    delete updated[bookingId];
    setReminders(updated);
    localStorage.setItem("organizer_reminders", JSON.stringify(updated));
    setReminderModalBooking(null);
  };

  // Stores person only cares about confirmed bookings
  const confirmedBookings = useMemo(() => bookings.filter(b => b.stage === "confirmed"), [bookings]);

  const displayedBookings = useMemo(() => {
    if (!search.trim()) return confirmedBookings;

    const query = search.toLowerCase();
    return confirmedBookings.filter((b) => {
      const hall = getAuditorium(b.auditoriumId);
      return (
        (b?.id || "").toLowerCase().includes(query) ||
        (b?.institution || "").toLowerCase().includes(query) ||
        (b?.coordinator || "").toLowerCase().includes(query) ||
        (b?.eventName || "").toLowerCase().includes(query) ||
        (hall && (hall.name || "").toLowerCase().includes(query))
      );
    });
  }, [confirmedBookings, search, getAuditorium]);

  if (!ready) {
    return (
      <AppShell>
        <div className="shimmer h-64 rounded-2xl" />
      </AppShell>
    );
  }

  if (user?.role !== "organizer" && user?.role !== "admin") {
    return (
      <AppShell>
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600">
            <ShieldAlert className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This portal is restricted to Stores and Facilities Organizers.
          </p>
          <Link to="/auditoriums" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-xs hover:brightness-110">
            Return to Venue List
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-primary mb-2">
          <PackageCheck className="h-3.5 w-3.5" /> Facilities & Stores Dashboard
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Confirmed Venue Requirements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review upcoming confirmed events to prepare seating and arrangements.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-card text-foreground shadow-xs border border-border/50">
          <CalendarIcon className="h-4 w-4 text-primary" /> Confirmed Schedule
          <span className="rounded-full px-2 py-0.5 text-[0.7rem] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ml-2">
            {confirmedBookings.length}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search events or halls..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full sm:w-64 rounded-xl border border-border bg-card pl-9 pr-4 text-xs font-medium outline-none focus:border-primary" />
        </div>
      </div>

      <div className="space-y-5">
        {displayedBookings.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No upcoming confirmed requests</h3>
            <p className="text-xs text-muted-foreground mt-1">Check back later when an event is finalized.</p>
          </div>
        ) : (
          displayedBookings.map((b, i) => {
            const stageInfo = getStageInfo(b.stage);
            const hall = getAuditorium(b.auditoriumId);
            const currentReminder = reminders[b.id];
            return (
              <Surface key={b.id} delay={i * 50} className="p-6 sm:p-7 border-l-4 border-l-emerald-500">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {hall?.image && (
                       <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 shadow-sm bg-white">
                         <img 
                           src={Array.isArray(hall.image) ? hall.image[0] : hall.image} 
                           alt={hall.name}
                           className="h-full w-full object-cover" 
                         />
                       </div>
                    )}
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-tight">{hall?.name || b.auditoriumId || "Auditorium"}</h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-foreground/80"><CalendarIcon className="h-3.5 w-3.5 text-primary/70" /> {formatDate(b.fromDate || b.date, b.toDate)}</span>
                        <span className="flex items-center gap-1.5 text-foreground/80"><Clock className="h-3.5 w-3.5 text-primary/70" /> {formatTime(b.startTime)} — {formatTime(b.endTime)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={cn("rounded-full border px-3.5 py-1 text-xs font-bold shadow-xs", stageInfo.bg)}>{stageInfo.label}</span>
                </div>

                <div className="mb-5 grid gap-3 rounded-2xl bg-muted/30 p-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-0.5">
                    <span className="text-muted-foreground mb-1.5 sm:mb-0">Requested By:</span>
                    <div className="flex items-center gap-2 bg-card rounded-lg border border-border/60 px-2 py-1 shadow-sm">
                      <img src={getInstitutionLogo(b.institution)} alt={b.institution} className="h-5 w-5 rounded-md object-contain" />
                      <span className="font-bold text-foreground">{b.institution}</span>
                      <span className="text-muted-foreground font-normal mx-0.5">•</span>
                      <span className="font-medium text-foreground">{b.department}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-0.5"><span className="text-muted-foreground mb-0.5 sm:mb-0">Event & Purpose:</span><span className="font-semibold text-foreground text-right">{b.eventName} <span className="text-muted-foreground font-normal mx-1">•</span> {b.purpose}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Coordinator / Audience:</span><span className="font-semibold text-foreground">{b.coordinator} (<strong className="text-primary">{b.participants} attendees expected</strong>)</span></div>
                  {b.daisChairs && (
                     <div className="flex justify-between"><span className="text-muted-foreground">Chairs Required on Dais:</span><span className="font-bold text-foreground">{b.daisChairs}</span></div>
                  )}
                  {b.facilitiesRequired && b.facilitiesRequired.length > 0 && (
                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-0.5 mt-2 pt-2 border-t border-border/40"><span className="text-muted-foreground mb-0.5 sm:mb-0">Facilities Requested:</span><span className="font-bold text-primary text-right bg-primary/10 px-2 py-0.5 rounded-md">{b.facilitiesRequired.join(", ")}</span></div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <button onClick={() => setSelectedBooking(b)} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"><Eye className="h-4 w-4" /> Full Booking Details</button>

                  <button
                    type="button"
                    onClick={() => {
                      setReminderModalBooking(b);
                      if (reminders[b.id]) {
                        setSelectedOffsetMinutes(reminders[b.id].minutesBefore);
                        setIsCustom(false);
                      } else {
                        setSelectedOffsetMinutes(120);
                        setIsCustom(false);
                      }
                    }}
                    className={cn(
                      "press inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs",
                      currentReminder
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    )}
                  >
                    <BellRing className={cn("h-3.5 w-3.5", currentReminder ? "text-amber-500 animate-bounce" : "text-muted-foreground")} />
                    <span>{currentReminder ? `Alert: ${currentReminder.label}` : "Set Reminder Alert"}</span>
                  </button>
                </div>
              </Surface>
            );
          })
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg bg-card p-6 rounded-3xl border shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{selectedBooking.id}</span>
                <h2 className="text-lg font-bold">{getAuditorium(selectedBooking.auditoriumId)?.name}</h2>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            </div>
            <div className="space-y-2 text-xs bg-muted/40 p-4 rounded-2xl mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Institution:</span> <span className="font-semibold">{selectedBooking.institution}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department:</span> <span className="font-semibold">{selectedBooking.department}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coordinator:</span> <span className="font-semibold">{selectedBooking.coordinator}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Event:</span> <span className="font-semibold">{selectedBooking.eventName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dates:</span> <span className="font-semibold">{formatDate(selectedBooking.fromDate || selectedBooking.date, selectedBooking.toDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Participants:</span> <span className="font-bold text-primary">{selectedBooking.participants}</span></div>
              {selectedBooking.daisChairs && (
                <div className="flex justify-between"><span className="text-muted-foreground">Chairs on Dais:</span> <span className="font-bold text-foreground">{selectedBooking.daisChairs}</span></div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 rounded-xl bg-muted text-xs font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Alert Modal */}
      {reminderModalBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-card p-6 rounded-3xl border border-border shadow-2xl animate-scale-in">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <BellRing className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">Set Event Reminder Alert</h2>
                  <p className="text-xs text-muted-foreground">
                    {reminderModalBooking.eventName || getAuditorium(reminderModalBooking.auditoriumId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReminderModalBooking(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Select how long before the event start time you want to be alerted for venue arrangements:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { mins: 15, label: "15 Mins Before" },
                { mins: 30, label: "30 Mins Before" },
                { mins: 60, label: "1 Hour Before" },
                { mins: 120, label: "2 Hours Before" },
                { mins: 360, label: "6 Hours Before" },
                { mins: 1440, label: "1 Day Before" },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => {
                    setSelectedOffsetMinutes(opt.mins);
                    setIsCustom(false);
                  }}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-bold transition-all",
                    !isCustom && selectedOffsetMinutes === opt.mins
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Option */}
            <div className="mb-6 rounded-2xl border border-border/70 bg-muted/40 p-3">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="radio"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                  className="accent-primary"
                />
                <span className="text-xs font-bold text-foreground">Custom Reminder Time</span>
              </label>

              {isCustom && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="h-10 w-1/2 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as any)}
                    className="h-10 w-1/2 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border/50">
              {reminders[reminderModalBooking.id] && (
                <button
                  type="button"
                  onClick={() => removeReminder(reminderModalBooking.id)}
                  className="h-11 px-4 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => setReminderModalBooking(null)}
                className="flex-1 h-11 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveReminder(reminderModalBooking.id)}
                className="flex-1 h-11 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:brightness-110 shadow-xs"
              >
                Save Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
