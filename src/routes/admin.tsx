import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "SolarPeak Operations Console" },
      {
        name: "description",
        content: "Internal sales and operations console for SolarPeak: leads, appointments, proposals and performance.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProtectedAdminRoute,
});

function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground font-semibold">
        Validating enterprise credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AdminShell />;
}
