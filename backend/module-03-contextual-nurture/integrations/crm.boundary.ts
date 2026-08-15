import { NurtureRepository } from "../repositories/nurture.repository";
import { LeadModel, CustomerActivityModel, NurtureTaskModel } from "../models";

export interface CrmBoundaryInterface {
  getLead(id: string): Promise<LeadModel | null>;
  getLeadStage(id: string): Promise<string | null>;
  getRecentActivity(id: string): Promise<CustomerActivityModel[]>;
  createActivity(activity: Omit<CustomerActivityModel, "id">): Promise<void>;
  createTask(task: Omit<NurtureTaskModel, "id" | "createdAt">): Promise<NurtureTaskModel>;
  updateCommunicationStatus(leadId: string, status: string): Promise<void>;
}

export class DefaultCrmIntegration implements CrmBoundaryInterface {
  async getLead(id: string): Promise<LeadModel | null> {
    return NurtureRepository.getLeadById(id);
  }

  async getLeadStage(id: string): Promise<string | null> {
    const lead = NurtureRepository.getLeadById(id);
    return lead ? lead.leadStage : null;
  }

  async getRecentActivity(id: string): Promise<CustomerActivityModel[]> {
    return NurtureRepository.getRecentActivities(id);
  }

  async createActivity(activity: Omit<CustomerActivityModel, "id">): Promise<void> {
    const fullActivity: CustomerActivityModel = {
      ...activity,
      id: `ACT-${Date.now()}`,
    };
    NurtureRepository.logActivity(fullActivity);
  }

  async createTask(task: Omit<NurtureTaskModel, "id" | "createdAt">): Promise<NurtureTaskModel> {
    const newTask: NurtureTaskModel = {
      ...task,
      id: `TK-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    NurtureRepository.saveTask(newTask);
    return newTask;
  }

  async updateCommunicationStatus(leadId: string, status: string): Promise<void> {
    NurtureRepository.updateLeadStage(leadId, status);
  }
}
