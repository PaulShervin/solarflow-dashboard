import { useSyncExternalStore } from "react";
import { db } from "@/lib/db";

export function useSolarDB() {
  const leads = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getLeads(),
    () => db.getLeads(),
  );

  const conversations = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getConversations(),
    () => db.getConversations(),
  );

  const proposals = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getProposals(),
    () => db.getProposals(),
  );

  const campaigns = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getCampaigns(),
    () => db.getCampaigns(),
  );

  const calls = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getCalls(),
    () => db.getCalls(),
  );

  const appointments = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getAppointments(),
    () => db.getAppointments(),
  );

  const auditLogs = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getAuditLogs(),
    () => db.getAuditLogs(),
  );

  const portalProject = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getPortalProject(),
    () => db.getPortalProject(),
  );

  const portalMilestones = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getPortalMilestones(),
    () => db.getPortalMilestones(),
  );

  const portalMessages = useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getPortalMessages(),
    () => db.getPortalMessages(),
  );

  return {
    leads,
    conversations,
    proposals,
    campaigns,
    calls,
    appointments,
    auditLogs,
    portalProject,
    portalMilestones,
    portalMessages,
    db,
  };
}
