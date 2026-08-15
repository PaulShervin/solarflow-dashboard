import { serverDb } from "./dbStore";
import { crmAdapter } from "./crmAdapter";
import { instantResponseAgent } from "./agents/instantResponseAgent";
import { preDesignAgent } from "./agents/preDesignAgent";
import { nurtureAgent } from "./agents/nurtureAgent";
import { postSaleAgent } from "./agents/postSaleAgent";
import { callCoachingAgent } from "./agents/callCoachingAgent";

export async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = url.pathname;

  const jsonResponse = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

  if (method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  try {
    if (path === "/api/webhooks/lead" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const result = await instantResponseAgent.processInboundWebhook(body);
      return jsonResponse({ success: true, ...result });
    }

    if (path === "/api/agent/qualify" && method === "POST") {
      const body = await request.json();
      const lead = await instantResponseAgent.qualifyLead(body.leadId, body.answers);
      return jsonResponse({ success: true, lead });
    }

    if (path === "/api/agent/book-appointment" && method === "POST") {
      const body = await request.json();
      const appt = await instantResponseAgent.bookAppointment(body.leadId, body.rep, body.date, body.time);
      return jsonResponse({ success: true, appointment: appt });
    }

    if (path === "/api/agent/pre-design" && method === "POST") {
      const body = await request.json();
      const result = await preDesignAgent.generatePreDesignProposal(body);
      return jsonResponse({ success: true, ...result });
    }

    if (path.startsWith("/api/proposals/") && path.endsWith("/pdf") && method === "GET") {
      const propId = path.split("/")[3] || "";
      const html = preDesignAgent.generateProposalPdfHtml(propId);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/api/agent/nurture/run-rules" && method === "POST") {
      const result = await nurtureAgent.evaluateTriggerRules();
      return jsonResponse({ success: true, ...result });
    }

    if (path === "/api/agent/nurture/preview" && method === "POST") {
      const body = await request.json();
      const lead = serverDb.getLeadById(body.leadId) || serverDb.getLeads()[0];
      const compiled = nurtureAgent.compilePersonalizedTemplate(body.template, lead);
      return jsonResponse({ success: true, compiled, lead });
    }

    if (path === "/api/agent/status/advance" && method === "POST") {
      const body = await request.json();
      const result = await postSaleAgent.advanceMilestoneStage(body.stepIndex, body.detail);
      return jsonResponse({ success: true, ...result });
    }

    if (path === "/api/agent/call-coaching/ingest" && method === "POST") {
      const body = await request.json();
      const call = await callCoachingAgent.processCallRecording(
        body.rep || "Dana Ruiz",
        body.customer || "Robert Vance",
        body.duration || "05:30",
        body.outcome || "Closed Deal",
        body.rawTranscript,
      );
      return jsonResponse({ success: true, call });
    }

    if (path === "/api/crm/settings" && method === "GET") {
      return jsonResponse({ success: true, settings: serverDb.getCrmSettings() });
    }

    if (path === "/api/crm/settings" && method === "POST") {
      const body = await request.json();
      const updated = serverDb.updateCrmSettings(body);
      return jsonResponse({ success: true, settings: updated });
    }

    if (path === "/api/db/all" && method === "GET") {
      return jsonResponse({ success: true, data: serverDb.getAllData() });
    }

    if (path === "/api/db/reset" && method === "POST") {
      const resetData = serverDb.resetToDefaults();
      return jsonResponse({ success: true, data: resetData });
    }

    return jsonResponse({ error: "API Endpoint not found", path }, 404);
  } catch (err: any) {
    console.error("API Router Error:", err);
    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
}
