import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarRangePickerProps {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  onChange: (fromDate: string, toDate: string) => void;
  minDate?: string;
  blockedDates?: string[];
  onClose?: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function CalendarPickerModal({ fromDate = "", toDate = "", onChange, minDate, blockedDates = [], onClose }: CalendarRangePickerProps) {
  const [mode, setMode] = useState<"single" | "multiple">(fromDate === toDate ? "single" : "multiple");
  const [clickStep, setClickStep] = useState<1 | 2>(1);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [selFromDate, setSelFromDate] = useState(() => fromDate || todayStr);
  const [selToDate, setSelToDate] = useState(() => toDate || fromDate || todayStr);

  const initialViewDate = useMemo(() => {
    return selFromDate ? new Date(selFromDate + "T00:00:00") : new Date();
  }, [selFromDate]);

  const [currentMonth, setCurrentMonth] = useState(() => initialViewDate.getMonth());
  const [currentYear, setCurrentYear] = useState(() => initialViewDate.getFullYear());

  const minDateObj = useMemo(() => {
    if (!minDate) return new Date();
    const d = new Date(minDate + "T00:00:00");
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Days matrix for current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const mm = String(currentMonth + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${currentYear}-${mm}-${dd}`;

      d.setHours(0, 0, 0, 0);
      const isPast = d < minDateObj;
      const isBlocked = blockedDates.includes(dateStr);
      const isDisabled = isPast || isBlocked;
      const isToday = dateStr === todayStr;

      const isStart = dateStr === selFromDate;
      const isEnd = dateStr === selToDate;
      const isRange = selFromDate && selToDate && dateStr >= selFromDate && dateStr <= selToDate;

      days.push({
        day,
        dateStr,
        isDisabled,
        isToday,
        isStart,
        isEnd,
        isRange,
      });
    }

    return { firstDayOfMonth, days };
  }, [currentYear, currentMonth, minDateObj, todayStr, selFromDate, selToDate, blockedDates]);

  const handleSelectDay = (dateStr: string) => {
    if (mode === "single") {
      setSelFromDate(dateStr);
      setSelToDate(dateStr);
    } else {
      if (clickStep === 1) {
        setSelFromDate(dateStr);
        setSelToDate(dateStr);
        setClickStep(2);
      } else {
        if (dateStr < selFromDate) {
          setSelFromDate(dateStr);
          setSelToDate(dateStr);
        } else {
          setSelToDate(dateStr);
          setClickStep(1);
        }
      }
    }
  };

  const handleModeChange = (newMode: "single" | "multiple") => {
    setMode(newMode);
    if (newMode === "single" && selFromDate !== selToDate) {
      setSelToDate(selFromDate);
    }
    if (newMode === "multiple") {
      setClickStep(1);
      setSelToDate(selFromDate);
    }
  };

  const handleConfirm = () => {
    const finalTo = selToDate >= selFromDate ? selToDate : selFromDate;
    onChange(selFromDate, finalTo);
    if (onClose) onClose();
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    try {
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl border border-white/40 dark:border-white/10 bg-card p-5 shadow-2xl backdrop-blur-2xl transition-all animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-[1.05rem] text-foreground">Select Event Dates</h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mb-2 text-[0.8rem] text-muted-foreground">
          {mode === "single" ? "Tap a day to select it." : "Tap start date, then tap end date."}
        </p>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex size-8 items-center justify-center rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-[0.92rem] text-foreground">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex size-8 items-center justify-center rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS_OF_WEEK.map((d) => (
            <span key={d} className="text-[0.7rem] font-bold text-muted-foreground uppercase">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: calendarDays.firstDayOfMonth }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {calendarDays.days.map((item) => {
            const isSelected = item.isStart || item.isEnd;

            return (
              <button
                key={item.dateStr}
                type="button"
                disabled={item.isDisabled}
                onClick={() => handleSelectDay(item.dateStr)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-xl text-[0.85rem] font-medium transition-all relative",
                  item.isDisabled && "opacity-30 cursor-not-allowed text-muted-foreground line-through",
                  !item.isDisabled && !isSelected && !item.isRange && "hover:bg-primary-soft hover:text-primary hover:scale-105 text-foreground",
                  item.isRange && !isSelected && "bg-primary-soft/80 text-primary font-semibold rounded-none first:rounded-l-xl last:rounded-r-xl",
                  item.isToday && !isSelected && "border border-primary/50 font-bold text-primary",
                  isSelected && "bg-primary text-primary-foreground font-bold shadow-md scale-105 z-10"
                )}
              >
                {item.day}
              </button>
            );
          })}
        </div>

        {/* Mode Toggle */}
        <div className="mt-4 flex rounded-2xl bg-muted/70 p-1">
          <button
            type="button"
            onClick={() => handleModeChange("single")}
            className={cn(
              "flex-1 py-2 rounded-xl text-[0.82rem] font-semibold transition-all",
              mode === "single"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Single Day
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("multiple")}
            className={cn(
              "flex-1 py-2 rounded-xl text-[0.82rem] font-semibold transition-all",
              mode === "multiple"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Multiple Days
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between">
          <span className="text-[0.76rem] font-medium text-foreground truncate max-w-[200px]">
            {selFromDate === selToDate
              ? formatDateDisplay(selFromDate)
              : `${formatDateDisplay(selFromDate)} – ${formatDateDisplay(selToDate)}`}
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-[0.82rem] font-semibold text-primary-foreground bg-primary rounded-xl shadow-xs hover:brightness-110 flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Apply Dates
          </button>
        </div>
      </div>
    </div>
  );
}
