import { useState, useMemo, useRef, useEffect } from "react";
import { Clock, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface IOSTimePickerProps {
  title?: string;
  value: string; // "HH:MM" 24h format e.g. "09:00" or "14:30"
  onChange: (time: string) => void;
  onClose: () => void;
}

const HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const PERIODS = ["AM", "PM"];

export function IOSTimePickerModal({ title = "Select Time", value, onChange, onClose }: IOSTimePickerProps) {
  // Parse initial 24h value "14:30" into 12h "02", "30", "PM"
  const parsed = useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour: "09", minute: "00", period: "AM" };
    }
    const [hStr, mStr] = value.split(":");
    let h = parseInt(hStr, 10);
    const minuteVal = parseInt(mStr, 10);
    // Find closest 5-minute increment
    const closestMin = Math.round(minuteVal / 5) * 5;
    const minute = String(closestMin >= 60 ? 55 : closestMin).padStart(2, "0");

    let period = "AM";
    if (h >= 12) {
      period = "PM";
      if (h > 12) h -= 12;
    }
    if (h === 0) h = 12;
    const hour = String(h).padStart(2, "0");

    return { hour, minute, period };
  }, [value]);

  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Auto scroll centered
  useEffect(() => {
    if (hourRef.current) {
      const idx = HOURS.indexOf(selectedHour);
      if (idx !== -1) {
        hourRef.current.scrollTop = idx * 44;
      }
    }
    if (minuteRef.current) {
      const idx = MINUTES.indexOf(selectedMinute);
      if (idx !== -1) {
        minuteRef.current.scrollTop = idx * 44;
      }
    }
  }, []);

  const handleConfirm = () => {
    let h = parseInt(selectedHour, 10);
    if (selectedPeriod === "PM" && h < 12) h += 12;
    if (selectedPeriod === "AM" && h === 12) h = 0;

    const formatted24h = `${String(h).padStart(2, "0")}:${selectedMinute}`;
    onChange(formatted24h);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-card p-5 shadow-2xl backdrop-blur-2xl transition-all animate-scale-in">
        {/* Modal Title Bar */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-[1.05rem] text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Time Display Pill */}
        <div className="mb-4 text-center py-2 px-4 rounded-2xl bg-muted/60 border border-border/40">
          <span className="font-mono text-2xl font-bold tracking-widest text-primary">
            {selectedHour}:{selectedMinute} {selectedPeriod}
          </span>
        </div>

        {/* iOS 3D Wheel Container */}
        <div className="relative h-48 my-2 flex items-center justify-center overflow-hidden rounded-2xl bg-muted/30 border border-border/50 select-none">
          {/* Central Highlight Selection Strip */}
          <div className="absolute inset-x-3 h-11 rounded-xl bg-primary/10 border-y border-primary/40 pointer-events-none z-10 flex items-center justify-between px-6 shadow-inner" />

          {/* Top and Bottom 3D Cylinder Fade Gradients */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-card via-card/80 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none z-20" />

          {/* Wheel 1: Hours */}
          <div
            ref={hourRef}
            className="h-full w-1/3 overflow-y-auto py-18 text-center scrollbar-none snap-y snap-mandatory z-0 scroll-smooth"
          >
            {HOURS.map((h) => {
              const active = selectedHour === h;
              return (
                <div
                  key={h}
                  onClick={() => setSelectedHour(h)}
                  className={cn(
                    "h-11 flex items-center justify-center snap-center cursor-pointer font-mono text-lg transition-all duration-200",
                    active
                      ? "font-extrabold text-primary scale-115 text-xl"
                      : "text-muted-foreground/60 hover:text-foreground text-base scale-90 opacity-60"
                  )}
                >
                  {h}
                </div>
              );
            })}
          </div>

          {/* Colon Divider */}
          <div className="z-10 font-bold text-xl text-primary font-mono select-none px-1">:</div>

          {/* Wheel 2: Minutes */}
          <div
            ref={minuteRef}
            className="h-full w-1/3 overflow-y-auto py-18 text-center scrollbar-none snap-y snap-mandatory z-0 scroll-smooth"
          >
            {MINUTES.map((m) => {
              const active = selectedMinute === m;
              return (
                <div
                  key={m}
                  onClick={() => setSelectedMinute(m)}
                  className={cn(
                    "h-11 flex items-center justify-center snap-center cursor-pointer font-mono text-lg transition-all duration-200",
                    active
                      ? "font-extrabold text-primary scale-115 text-xl"
                      : "text-muted-foreground/60 hover:text-foreground text-base scale-90 opacity-60"
                  )}
                >
                  {m}
                </div>
              );
            })}
          </div>

          {/* Wheel 3: AM / PM */}
          <div className="h-full w-1/3 overflow-y-auto py-18 text-center scrollbar-none snap-y snap-mandatory z-0">
            {PERIODS.map((p) => {
              const active = selectedPeriod === p;
              return (
                <div
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={cn(
                    "h-11 flex items-center justify-center snap-center cursor-pointer text-sm font-bold transition-all duration-200",
                    active
                      ? "font-extrabold text-primary scale-115 text-base"
                      : "text-muted-foreground/60 hover:text-foreground scale-90 opacity-60"
                  )}
                >
                  {p}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-5 border-t border-border/50 pt-3 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border bg-card text-[0.88rem] font-medium text-foreground hover:bg-muted transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary text-[0.88rem] font-semibold text-primary-foreground shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Set Time
          </button>
        </div>
      </div>
    </div>
  );
}
