import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Row, Surface } from "@/components/ui-kit";
import { useBookings } from "@/lib/booking-store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Central Hall Booking" },
      {
        name: "description",
        content: "Your coordinator profile and booking activity on the campus booking system.",
      },
      { property: "og:title", content: "Profile" },
      { property: "og:description", content: "Your coordinator profile and booking activity." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { bookings } = useBookings();
  const { user } = useAuth();
  const name = user?.name || "Campus User";
  const institution = user?.institution || "—";
  const roleDisplay = user?.role === "admin" ? "System Administrator" : user?.role === "coordinator" ? "Authorised Coordinator" : "User / Applicant";

  return (
    <AppShell>
      <PageTitle title="Profile" />

      <Surface>
        <div className="mb-6 flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-[1.1rem] font-semibold text-primary-foreground">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-[1.05rem] font-semibold">{name}</p>
            <p className="text-[0.85rem] text-muted-foreground">{roleDisplay}</p>
          </div>
        </div>
        <Row label="Institution" value={institution} />
        <Row label="Total bookings" value={bookings.length} />
      </Surface>
    </AppShell>
  );
}
