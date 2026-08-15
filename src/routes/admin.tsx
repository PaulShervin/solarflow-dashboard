import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

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
  component: AdminShell,
});
