/**
 * Shared Lead Stages across SolarFlow platform.
 * Modules may extend, but core stages are standard.
 */
export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "APPOINTMENT_BOOKED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | "NURTURE"
  | "DO_NOT_CONTACT";

export const LEAD_STAGES: Record<LeadStage, LeadStage> = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  APPOINTMENT_BOOKED: "APPOINTMENT_BOOKED",
  PROPOSAL_SENT: "PROPOSAL_SENT",
  NEGOTIATION: "NEGOTIATION",
  WON: "WON",
  LOST: "LOST",
  NURTURE: "NURTURE",
  DO_NOT_CONTACT: "DO_NOT_CONTACT",
};
