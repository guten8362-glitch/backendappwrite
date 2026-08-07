export interface AuditEntry {
  id: string;
  timestamp: string;
  performedBy: string; // Super Admin ID or Email
  performedByName?: string;
  actingAs: string; // Target User ID or Email
  actingAsName?: string;
  action: string;
  details?: Record<string, any> | string;
}

const AUDIT_STORAGE_KEY = "bms_audit_logs";

export const recordAuditLog = (logData: Omit<AuditEntry, "id" | "timestamp">) => {
  try {
    const entry: AuditEntry = {
      ...logData,
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };

    const existingLogsRaw = localStorage.getItem(AUDIT_STORAGE_KEY);
    const existingLogs: AuditEntry[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    
    // Keep most recent 500 logs
    const updatedLogs = [entry, ...existingLogs].slice(0, 500);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedLogs));

    console.log("[AUDIT LOG RECORDED]", entry);
    return entry;
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
};

export const getAuditLogs = (): AuditEntry[] => {
  try {
    const logsRaw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return logsRaw ? JSON.parse(logsRaw) : [];
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
};

export const clearAuditLogs = () => {
  try {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear audit logs:", error);
  }
};
