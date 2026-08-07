import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, getDefaultRouteForUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (user) {
      const target = getDefaultRouteForUser(user);
      navigate({ to: target, replace: true });
    } else {
      navigate({ to: "/login", replace: true });
    }
  }, [user, ready, navigate]);

  return null;
}

