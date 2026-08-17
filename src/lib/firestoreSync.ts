import { firestore } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type {
  Lead,
  Conversation,
  ConversationMessage,
  Proposal,
  Appointment,
  Task,
  PortalProject,
  PortalMilestone,
} from "@/types/solar";
import type { AuditLogEntry } from "./db";

// Firestore Collection Names
export const COLLECTIONS = {
  USERS: "users",
  LEADS: "solar_leads",
  CONVERSATIONS: "conversations",
  PROPOSALS: "proposals",
  APPOINTMENTS: "appointments",
  TASKS: "tasks",
  PROJECTS: "portal_projects",
  AUDIT_LOGS: "audit_logs",
} as const;

/* ----------------- LEADS ----------------- */

export async function syncLeadToFirestore(lead: Lead): Promise<void> {
  try {
    const leadRef = doc(firestore, COLLECTIONS.LEADS, lead.id);
    await setDoc(
      leadRef,
      {
        ...lead,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save lead to Firestore (offline/security rules fallback)", err);
  }
}

export function subscribeFirestoreLeads(onData: (leads: Lead[]) => void): Unsubscribe {
  try {
    const leadsRef = collection(firestore, COLLECTIONS.LEADS);
    return onSnapshot(
      leadsRef,
      (snapshot) => {
        const items: Lead[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Lead);
        });
        if (items.length > 0) {
          onData(items);
        }
      },
      (error) => {
        console.warn("Firestore leads snapshot listener notice:", error.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore leads listener", err);
    return () => {};
  }
}

/* ----------------- CONVERSATIONS ----------------- */

export async function syncConversationToFirestore(
  conversationId: string,
  message: ConversationMessage,
  meta?: Partial<Conversation>
): Promise<void> {
  try {
    const convRef = doc(firestore, COLLECTIONS.CONVERSATIONS, conversationId);
    const existingSnap = await getDoc(convRef);

    let messages: ConversationMessage[] = [];
    if (existingSnap.exists()) {
      const data = existingSnap.data() as Conversation;
      messages = data.messages || [];
    }

    // Append new message if not already present
    if (!messages.some((m) => m.id === message.id)) {
      messages.push(message);
    }

    const updatedConv: Partial<Conversation> = {
      id: conversationId,
      lastMessage: message.text,
      lastTime: message.time || message.at || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      updatedAt: new Date().toISOString(),
      messages,
      ...meta,
    };

    await setDoc(convRef, updatedConv, { merge: true });
  } catch (err) {
    console.warn("Could not sync conversation message to Firestore", err);
  }
}

export function subscribeFirestoreConversations(onData: (convs: Conversation[]) => void): Unsubscribe {
  try {
    const convRef = collection(firestore, COLLECTIONS.CONVERSATIONS);
    return onSnapshot(
      convRef,
      (snapshot) => {
        const items: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Conversation);
        });
        if (items.length > 0) {
          onData(items);
        }
      },
      (error) => {
        console.warn("Firestore conversations snapshot listener notice:", error.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore conversations listener", err);
    return () => {};
  }
}

/* ----------------- PROPOSALS ----------------- */

export async function syncProposalToFirestore(proposal: Proposal): Promise<void> {
  try {
    const propRef = doc(firestore, COLLECTIONS.PROPOSALS, proposal.id);
    await setDoc(
      propRef,
      {
        ...proposal,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not sync proposal to Firestore", err);
  }
}

export function subscribeFirestoreProposals(onData: (proposals: Proposal[]) => void): Unsubscribe {
  try {
    const propRef = collection(firestore, COLLECTIONS.PROPOSALS);
    return onSnapshot(
      propRef,
      (snapshot) => {
        const items: Proposal[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Proposal);
        });
        if (items.length > 0) {
          onData(items);
        }
      },
      (error) => {
        console.warn("Firestore proposals snapshot listener notice:", error.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore proposals listener", err);
    return () => {};
  }
}

/* ----------------- APPOINTMENTS ----------------- */

export async function syncAppointmentToFirestore(appointment: Appointment): Promise<void> {
  try {
    const apptRef = doc(firestore, COLLECTIONS.APPOINTMENTS, appointment.id);
    await setDoc(
      apptRef,
      {
        ...appointment,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not sync appointment to Firestore", err);
  }
}

export function subscribeFirestoreAppointments(onData: (appts: Appointment[]) => void): Unsubscribe {
  try {
    const apptRef = collection(firestore, COLLECTIONS.APPOINTMENTS);
    return onSnapshot(
      apptRef,
      (snapshot) => {
        const items: Appointment[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Appointment);
        });
        if (items.length > 0) {
          onData(items);
        }
      },
      (error) => {
        console.warn("Firestore appointments snapshot listener notice:", error.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore appointments listener", err);
    return () => {};
  }
}

/* ----------------- TASKS ----------------- */

export async function syncTaskToFirestore(task: Task): Promise<void> {
  try {
    const taskRef = doc(firestore, COLLECTIONS.TASKS, task.id);
    await setDoc(
      taskRef,
      {
        ...task,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not sync task to Firestore", err);
  }
}

export function subscribeFirestoreTasks(onData: (tasks: Task[]) => void): Unsubscribe {
  try {
    const taskRef = collection(firestore, COLLECTIONS.TASKS);
    return onSnapshot(
      taskRef,
      (snapshot) => {
        const items: Task[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Task);
        });
        if (items.length > 0) {
          onData(items);
        }
      },
      (error) => {
        console.warn("Firestore tasks snapshot listener notice:", error.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore tasks listener", err);
    return () => {};
  }
}

/* ----------------- AUDIT LOGS ----------------- */

export async function syncAuditLogToFirestore(log: AuditLogEntry): Promise<void> {
  try {
    const logRef = doc(firestore, COLLECTIONS.AUDIT_LOGS, log.id);
    await setDoc(
      logRef,
      {
        ...log,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not sync audit log to Firestore", err);
  }
}

export function subscribeFirestoreAuditLogs(onData: (logs: AuditLogEntry[]) => void): Unsubscribe {
  try {
    const logRef = collection(firestore, COLLECTIONS.AUDIT_LOGS);
    return onSnapshot(
      logRef,
      (snapshot) => {
        const items: AuditLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as AuditLogEntry);
        });
        if (items.length > 0) {
          // Sort by timestamp descending
          items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          onData(items);
        }
      },
      (error) => {
        console.warn("Firestore audit logs snapshot listener notice:", error.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore audit logs listener", err);
    return () => {};
  }
}
