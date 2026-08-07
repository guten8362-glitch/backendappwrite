import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, Image as ImageIcon, UploadCloud, X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useEffect, useState, useMemo, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Field, PageTitle, TextField } from "@/components/ui-kit";
import { fetchAuditorium, type Auditorium } from "@/lib/auditoriums";
import { listBookings } from "@/lib/appwrite/database";
import { useBookings, formatDate, emptyDraft, type BookingDraft } from "@/lib/booking-store";
import { useAuth, isCoordinatorUser } from "@/lib/auth";
import { CalendarPickerModal } from "@/components/CalendarPickerModal";
import { IOSTimeRangePickerModal } from "@/components/IOSTimeRangePickerModal";

const format12h = (time24: string) => {
  if (!time24 || !time24.includes(":")) return time24;
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${period}`;
};

export const Route = createFileRoute("/book/$id")({
  loader: async ({ params }) => {
    const auditorium = await fetchAuditorium(params.id);
    if (!auditorium) throw notFound();
    let confirmedBookings: any[] = [];
    try {
      const allBookings = await listBookings();
      confirmedBookings = allBookings.filter(b => b.hallId === params.id && (b.status === true || b.status === "confirm" || b.status === "confirmed"));
    } catch (err) {}
    return { auditorium, confirmedBookings };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Booking unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const title = `Booking form — ${loaderData.auditorium.name}`;
    const description = `Enter your event details to request ${loaderData.auditorium.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: BookingForm,
});

function BookingForm() {
  const { auditorium, confirmedBookings } = Route.useLoaderData() as { auditorium: Auditorium, confirmedBookings: any[] };
  const { draft, submitDraft } = useBookings();
  const navigate = useNavigate();
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<BookingDraft>(() => ({
    ...emptyDraft(auditorium.id),
    institution: user?.institution || "MVIT",
    coordinator: user?.name || "",
    fromDate: todayStr,
    toDate: todayStr,
    date: formatDate(todayStr),
    startTime: "09:00",
    endTime: "11:00",
  }));

  const blockedDates = useMemo(() => {
    const dates = new Set<string>();
    confirmedBookings.forEach(b => {
      let from = b.eventDate ? b.eventDate.split('T')[0] : "";
      let to = from;
      try {
        const remarks = JSON.parse(b.remarks || "{}");
        if (remarks.fromDate) from = remarks.fromDate;
        if (remarks.toDate) to = remarks.toDate;
      } catch {}

      if (from && to) {
        const d = new Date(from);
        const endD = new Date(to);
        let safety = 0;
        while (d <= endD && safety < 365) {
          dates.add(d.toISOString().split('T')[0]);
          d.setDate(d.getDate() + 1);
          safety++;
        }
      }
    });
    return Array.from(dates);
  }, [confirmedBookings]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);

  useEffect(() => {
    if (user && isCoordinatorUser(user)) {
      navigate({ to: "/coordinator", replace: true });
    }
  }, [user, navigate]);

  if (user && isCoordinatorUser(user)) {
    return null;
  }

  useEffect(() => {
    setForm((f) => ({
      ...draft,
      ...f,
      auditoriumId: auditorium.id,
      institution: f.institution || user?.institution || "MVIT",
      coordinator: f.coordinator || user?.name || "",
      fromDate: f.fromDate || draft.fromDate || todayStr,
      toDate: f.toDate || draft.toDate || todayStr,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditorium.id, user?.institution]);

  const set =
    (k: keyof BookingDraft) =>
    (value: string | { target: { value: string } }) => {
      setError("");
      const val = typeof value === "string" ? value : value.target.value;
      setForm((f) => ({ ...f, [k]: val }));
    };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.department.trim()) {
      setError("Please enter your Department.");
      return;
    }
    if (!form.coordinator.trim()) {
      setError("Please enter Coordinator Name.");
      return;
    }
    if (!form.eventName.trim()) {
      setError("Please enter Event Name.");
      return;
    }
    if (!form.purpose.trim()) {
      setError("Please enter Event Purpose.");
      return;
    }
    if (!form.fromDate || !form.toDate) {
      setError("Please select valid Event Dates (From – To).");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setError("Please specify Start and End Times.");
      return;
    }
    if (form.fromDate === form.toDate && form.startTime >= form.endTime) {
      setError("End Time must be after Start Time for same-day bookings.");
      return;
    }
    if (!form.participants || parseInt(form.participants) < 1) {
      setError("Please enter expected participants.");
      return;
    }

    const d = new Date(form.fromDate);
    const endD = new Date(form.toDate);
    let safety = 0;
    while (d <= endD && safety < 365) {
      if (blockedDates.includes(d.toISOString().split('T')[0])) {
        setError("One or more dates in your selected range is already booked by another event.");
        return;
      }
      d.setDate(d.getDate() + 1);
      safety++;
    }

    const formattedDateRange = formatDate(form.fromDate, form.toDate);
    const finalData = { ...form, date: formattedDateRange, auditoriumId: auditorium.id };
    
    setSubmitting(true);
    submitDraft(user?.role, user?.team, finalData, user?.$id)
      .then((booking) => {
        navigate({ to: "/submitted/$id", params: { id: booking.id } });
      })
      .catch((err) => {
        setError(err.message || "Failed to submit booking. Please try again.");
        setSubmitting(false);
      });
  };

  return (
    <AppShell>
      <Link
        to="/auditoriums/$id"
        params={{ id: auditorium.id }}
        className="mb-6 inline-flex items-center gap-1.5 text-[0.85rem] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {auditorium.name}
      </Link>

      <PageTitle
        eyebrow="Step 2 of 4"
        title="Booking details"
        subtitle="Fill in your event details to request this venue."
      />

      <form onSubmit={submit} className="surface rise space-y-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Institution / College"
            required
            value={form.institution}
            onChange={set("institution")}
            placeholder="e.g. Sir MVIT"
          />
          <Field
            label="Department"
            required
            value={form.department}
            onChange={set("department")}
            placeholder="e.g. Computer Science & Eng."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Authorised Coordinator"
            required
            value={form.coordinator}
            onChange={set("coordinator")}
            placeholder="Full name of staff coordinator"
          />
          <Field
            label="Event Name"
            required
            value={form.eventName}
            onChange={set("eventName")}
            placeholder="e.g. National Level Tech Symposium 2026"
          />
        </div>

        <TextField
          label="Purpose & Description"
          required
          value={form.purpose}
          onChange={set("purpose")}
          placeholder="Briefly describe the purpose, agenda and requirements for this booking..."
        />

        {/* Combined Calendar Date & Combined Start/End Time Button Row */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Event Date Range Picker Button */}
          <div>
            <span className="mb-2 block text-[0.8rem] font-medium text-muted-foreground">
              Event Dates (From – To)
            </span>
            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="h-12 w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 text-[0.92rem] font-medium outline-none transition-all hover:border-primary/50 hover:shadow-xs focus:ring-4 focus:ring-primary/10"
            >
              <span className="text-foreground">
                {form.fromDate
                  ? formatDate(form.fromDate, form.toDate)
                  : "Select Event Dates"}
              </span>
              <CalendarIcon className="h-4.5 w-4.5 text-primary shrink-0" />
            </button>
          </div>

          {/* Combined Start & End Time Slot Button */}
          <div>
            <span className="mb-2 block text-[0.8rem] font-medium text-muted-foreground">
              Event Time Slot (Start – End)
            </span>
            <button
              type="button"
              onClick={() => setShowTimeRangeModal(true)}
              className="h-12 w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 text-[0.92rem] font-medium outline-none transition-all hover:border-primary/50 hover:shadow-xs focus:ring-4 focus:ring-primary/10"
            >
              <span className="font-mono text-foreground">
                {format12h(form.startTime)} – {format12h(form.endTime)}
              </span>
              <Clock className="h-4.5 w-4.5 text-primary shrink-0" />
            </button>
          </div>
        </div>

        <Field
          label="Expected Participants"
          type="number"
          min={1}
          max={auditorium.capacity}
          required
          value={form.participants}
          onChange={set("participants")}
          placeholder={`Capacity: up to ${auditorium.capacity}`}
        />

        <TextField
          label="Additional Remarks / AV Requirements (Optional)"
          value={form.remarks}
          onChange={set("remarks")}
          placeholder="Specify any AV equipment, projector, audio setup or seating preferences..."
        />

        {/* Event Poster / Banner Image Field */}
        <div className="space-y-2">
          <label className="block text-[0.8rem] font-medium text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <ImageIcon className="h-4 w-4 text-primary" /> Event Poster / Banner Image (Optional)
            </span>
            <span className="text-[0.72rem] text-muted-foreground">JPG, PNG or WEBP</span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="relative flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-3 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all">
              <UploadCloud className="h-4 w-4 text-muted-foreground" />
              <span className="text-[0.85rem] font-medium text-muted-foreground">
                {form.eventImage ? "Change Image File" : "Choose Image File"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setForm((f) => ({ ...f, eventImage: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            <div className="flex-1">
              <input
                type="url"
                value={form.eventImage?.startsWith("data:") ? "" : form.eventImage || ""}
                onChange={(e) => setForm((f) => ({ ...f, eventImage: e.target.value }))}
                placeholder="Or paste image URL (https://...)"
                className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-[0.85rem] outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          {form.eventImage && (
            <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl border border-border bg-muted/40 p-2 flex items-center justify-center">
              <img
                src={form.eventImage}
                alt="Event Poster Preview"
                className="h-full max-h-full object-contain rounded-lg shadow-sm"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, eventImage: "" }))}
                className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1 text-white hover:bg-red-600 transition-colors"
                title="Remove Image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-[0.88rem] font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting Request..." : "Submit Booking Application"}
        </Button>
      </form>

      {/* Calendar Picker Modal */}
      {showCalendarModal && (
        <CalendarPickerModal
          fromDate={form.fromDate}
          toDate={form.toDate}
          minDate={todayStr}
          blockedDates={blockedDates}
          onChange={(newFrom, newTo) => {
            setError("");
            setForm((f) => ({
              ...f,
              fromDate: newFrom,
              toDate: newTo,
              date: formatDate(newFrom, newTo),
            }));
          }}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {/* iOS Time Range Picker Modal */}
      {showTimeRangeModal && (
        <IOSTimeRangePickerModal
          startTime={form.startTime}
          endTime={form.endTime}
          onChange={(newStart, newEnd) => {
            setError("");
            setForm((f) => ({
              ...f,
              startTime: newStart,
              endTime: newEnd,
            }));
          }}
          onClose={() => setShowTimeRangeModal(false)}
        />
      )}
    </AppShell>
  );
}
