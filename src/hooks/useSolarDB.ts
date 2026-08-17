import { useSyncExternalStore } from "react";
import { db } from "@/lib/db";

const subscribe = (cb: () => void) => db.subscribe(cb);

export function useSolarDB() {
  const leads = useSyncExternalStore(subscribe, () => db.getLeads(), () => db.getLeads());
  const conversations = useSyncExternalStore(subscribe, () => db.getConversations(), () => db.getConversations());
  const proposals = useSyncExternalStore(subscribe, () => db.getProposals(), () => db.getProposals());
  const campaigns = useSyncExternalStore(subscribe, () => db.getCampaigns(), () => db.getCampaigns());
  const calls = useSyncExternalStore(subscribe, () => db.getCalls(), () => db.getCalls());
  const appointments = useSyncExternalStore(subscribe, () => db.getAppointments(), () => db.getAppointments());
  const tasks = useSyncExternalStore(subscribe, () => db.getTasks(), () => db.getTasks());
  const auditLogs = useSyncExternalStore(subscribe, () => db.getAuditLogs(), () => db.getAuditLogs());
  const portalProject = useSyncExternalStore(subscribe, () => db.getPortalProject(), () => db.getPortalProject());
  const portalMilestones = useSyncExternalStore(subscribe, () => db.getPortalMilestones(), () => db.getPortalMilestones());
  const portalMessages = useSyncExternalStore(subscribe, () => db.getPortalMessages(), () => db.getPortalMessages());

  return {
    leads,
    conversations,
    proposals,
    campaigns,
    calls,
    appointments,
    tasks,
    auditLogs,
    portalProject,
    portalMilestones,
    portalMessages,
    db,
  };
}
