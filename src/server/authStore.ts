import crypto from "crypto";
import { serverDb } from "./dbStore";

export type UserRole = "admin" | "consultant" | "customer";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: string;
};

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

class AuthStore {
  private defaultUsers: AuthUser[] = [
    (() => {
      const salt = "solarflow_salt_admin_2026";
      return {
        id: "usr-admin-1",
        email: "admin@solarpeak.com",
        name: "Enterprise Administrator",
        role: "admin" as const,
        salt,
        passwordHash: hashPassword("SolarPeak2026!", salt),
        createdAt: new Date().toISOString(),
      };
    })(),
    (() => {
      const salt = "solarflow_salt_dana_2026";
      return {
        id: "usr-rep-1",
        email: "dana@solarpeak.com",
        name: "Dana Ruiz (Senior Consultant)",
        role: "consultant" as const,
        salt,
        passwordHash: hashPassword("SolarPeak2026!", salt),
        createdAt: new Date().toISOString(),
      };
    })(),
    (() => {
      const salt = "solarflow_salt_marcus_2026";
      return {
        id: "usr-cust-1",
        email: "marcus@solarpeak.com",
        name: "Marcus Whitfield",
        role: "customer" as const,
        salt,
        passwordHash: hashPassword("SolarPeak2026!", salt),
        createdAt: new Date().toISOString(),
      };
    })(),
  ];

  private sessions: Map<string, Session> = new Map();

  constructor() {
    this.ensureDefaultUsers();
  }

  private ensureDefaultUsers() {
    const data = serverDb.getAllData() as any;
    if (!data.users || data.users.length === 0) {
      data.users = this.defaultUsers;
      serverDb.saveLead({ ...serverDb.getLeads()[0] } as any); // trigger disk write
    }
  }

  public getUsers(): AuthUser[] {
    const data = serverDb.getAllData() as any;
    return data.users || this.defaultUsers;
  }

  public getUserByEmail(email: string): AuthUser | undefined {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public authenticate(email: string, passwordAttempt: string): { user?: AuthUser; session?: Session; error?: string } {
    const user = this.getUserByEmail(email);
    if (!user) {
      return { error: "Invalid email address or password" };
    }

    const computedHash = hashPassword(passwordAttempt, user.salt);
    if (computedHash !== user.passwordHash) {
      return { error: "Invalid email address or password" };
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

    const session: Session = {
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt,
    };

    this.sessions.set(token, session);

    serverDb.addAuditLog({
      category: "AI Bot",
      title: "User Authenticated",
      detail: `Industrial session issued for ${user.email} (${user.role.toUpperCase()})`,
      latencyMs: 35,
      status: "success",
    });

    return { user, session };
  }

  public validateSession(token: string): Session | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  public logout(token: string) {
    this.sessions.delete(token);
  }
}

export const authStore = new AuthStore();
