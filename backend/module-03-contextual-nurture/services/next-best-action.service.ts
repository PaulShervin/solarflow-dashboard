import { NurtureRepository } from "../repositories/nurture.repository";
import { NurtureTaskModel, LeadModel } from "../models";
import { v4 as uuidv4 } from "uuid";

export class NextBestActionService {
  static generateForLead(lead: LeadModel, reason: string, priority: "Critical" | "High" | "Medium" | "Low" = "High"): NurtureTaskModel {
    const task: NurtureTaskModel = {
      id: `TK-NBA-${uuidv4().substring(0, 8)}`,
      leadId: lead.id,
      title: `Action Required for ${lead.firstName} ${lead.lastName}`,
      detail: `${reason} · Lead Stage: ${lead.leadStage} · Assigned to ${lead.assignedSalesRep}`,
      priority,
      owner: lead.assignedSalesRep,
      done: false,
      type: "Follow-up",
      createdAt: new Date().toISOString(),
    };

    NurtureRepository.saveTask(task);
    return task;
  }

  static getNextBestActions(leadId?: string): NurtureTaskModel[] {
    if (leadId) {
      return NurtureRepository.getTasksForLead(leadId);
    }
    // Return mock priority actions compatible with dashboard
    return [
      {
        id: "PA-1",
        leadId: "LD-JOHN-01",
        title: "Call John Smith back",
        detail: "Proposal sent 6 days ago · unread in 3 days · quote $23,400",
        priority: "Critical",
        owner: "Dana Ruiz",
        done: false,
        type: "Call",
        createdAt: new Date().toISOString(),
      },
      {
        id: "PA-2",
        leadId: "LD-SARAH-02",
        title: "Reschedule Sarah Johnson's appointment",
        detail: "Appointment missed 24 hrs ago · high bill ($280)",
        priority: "High",
        owner: "Dana Ruiz",
        done: false,
        type: "Follow-up",
        createdAt: new Date().toISOString(),
      },
      {
        id: "PA-3",
        leadId: "LD-MIKE-03",
        title: "Review Mike Davis's inbound SMS reply",
        detail: "Customer replied asking about battery backup option",
        priority: "High",
        owner: "Ben Okafor",
        done: false,
        type: "Email",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
