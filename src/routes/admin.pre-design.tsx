import { createFileRoute } from "@tanstack/react-router";
import { PreDesignEngineView } from "@/components/admin/PreDesignEngineView";

export const Route = createFileRoute("/admin/pre-design")({
  head: () => ({
    meta: [
      { title: "Auto Pre-Design Engine (Module 02) | SolarFlow" },
      { name: "description", content: "Parametric solar system sizing, PM Surya Ghar subsidy calculations, and instant proposal generator." },
    ],
  }),
  component: PreDesignEngineView,
});
