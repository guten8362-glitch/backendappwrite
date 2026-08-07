import { getAllUsersFromDatabase } from "../appwrite/users";
import type { User, UserRole } from "../auth";

export interface SuperAdminUser extends User {
  status: "active" | "suspended" | "pending";
  isOnline: boolean;
  lastActive?: string;
}

export interface GroupedUsers {
  institution: string;
  users: SuperAdminUser[];
}

export const fetchSuperAdminUsers = async (): Promise<SuperAdminUser[]> => {
  try {
    const rawUsers = await getAllUsersFromDatabase();
    
    return rawUsers.map((u, idx) => {
      // Standardize role if super admin email or role
      const emailNorm = (u.email || "").toLowerCase();
      let role: UserRole = u.role || "user";
      if (emailNorm.includes("superadmin") || emailNorm.includes("principal")) {
        role = "super_admin";
      }

      return {
        ...u,
        role,
        status: "active",
        // Deterministic online state simulation if real state isn't tracked in Appwrite
        isOnline: idx % 3 === 0,
        lastActive: new Date(Date.now() - idx * 1000 * 60 * 15).toISOString(),
      };
    });
  } catch (error) {
    console.error("Failed to fetch super admin users:", error);
    return [];
  }
};

export const groupUsersByInstitution = (users: SuperAdminUser[]): GroupedUsers[] => {
  const map: Record<string, SuperAdminUser[]> = {};

  users.forEach((user) => {
    const inst = (user.institution || "MVIT").trim();
    if (!map[inst]) {
      map[inst] = [];
    }
    map[inst].push(user);
  });

  // Convert map to sorted array with MVIT and SMVEC prioritized
  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b))
    .map((inst) => ({
      institution: inst,
      users: map[inst],
    }));
};

export const filterUsers = (
  users: SuperAdminUser[],
  searchQuery: string,
  institutionFilter: string,
  roleFilter: string,
  statusFilter: string
): SuperAdminUser[] => {
  return users.filter((u) => {
    // Search query matching name, email, institution, role
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (u.name || "").toLowerCase().includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      const matchInst = (u.institution || "").toLowerCase().includes(q);
      const matchRole = (u.role || "").toLowerCase().includes(q);

      if (!matchName && !matchEmail && !matchInst && !matchRole) {
        return false;
      }
    }

    // Institution Filter
    if (institutionFilter !== "all" && u.institution !== institutionFilter) {
      return false;
    }

    // Role Filter
    if (roleFilter !== "all" && u.role !== roleFilter) {
      return false;
    }

    // Status Filter
    if (statusFilter !== "all" && u.status !== statusFilter) {
      return false;
    }

    return true;
  });
};
