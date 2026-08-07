import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/logout")({
  head: () => ({
    meta: [
      { title: "Sign out — Central Hall Booking" },
      {
        name: "description",
        content: "Sign out of your account.",
      },
    ],
  }),
  component: Logout,
});

function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate({ to: "/login", replace: true });
  }, [logout, navigate]);

  return null;
}