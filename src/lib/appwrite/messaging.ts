import { ID } from 'appwrite';
import { APPWRITE_CONFIG } from './constants';
import { functions } from './client';

/**
 * Appwrite Messaging Wrapper for Client Side
 * Supports both Appwrite Serverless Functions AND direct Appwrite API Key messaging fallback.
 */

export const getUserIdByEmail = async (email: string) => {
  return null;
};

const sendAppwriteMessagingRequest = async (endpoint: string, payload: any) => {
  const apiKey = import.meta.env.VITE_APPWRITE_API_KEY || '';
  if (!apiKey) return null;

  try {
    const response = await fetch(`${APPWRITE_CONFIG.endpoint}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
        'X-Appwrite-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Appwrite Messaging REST API Error [${response.status}]:`, errText);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error('Appwrite Messaging REST API Exception:', err);
    return null;
  }
};

export const resolveAuthUserIdsByEmailOrId = async (inputIds: string[]): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_APPWRITE_API_KEY || '';
  if (!apiKey || !inputIds || inputIds.length === 0) return inputIds;

  try {
    // 1. Fetch all Auth Users
    const authRes = await fetch(`${APPWRITE_CONFIG.endpoint}/users`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
        'X-Appwrite-Key': apiKey,
      },
    });

    if (!authRes.ok) return inputIds;
    const authData = await authRes.json();
    const authUsers: any[] = authData.users || [];

    // 2. Fetch all DB Users for email lookup fallback
    let dbUsers: any[] = [];
    try {
      const dbRes = await fetch(`${APPWRITE_CONFIG.endpoint}/databases/${APPWRITE_CONFIG.databaseId}/collections/${APPWRITE_CONFIG.collections.users}/documents?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
          'X-Appwrite-Key': apiKey,
        },
      });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        dbUsers = dbData.documents || [];
      }
    } catch {}

    const resolvedAuthIds: string[] = [];

    for (const input of inputIds) {
      if (!input) continue;

      // Case A: Input is an email string
      if (input.includes('@')) {
        const matched = authUsers.find(a => (a.email || '').toLowerCase().trim() === input.toLowerCase().trim());
        if (matched?.$id) resolvedAuthIds.push(matched.$id);
        continue;
      }

      // Case B: Input is directly an Auth User $id
      const directAuth = authUsers.find(a => a.$id === input);
      if (directAuth) {
        resolvedAuthIds.push(directAuth.$id);
        continue;
      }

      // Case C: Input is a DB Document ID, match via DB user email to Auth User $id
      const dbUser = dbUsers.find(u => u.$id === input || u.user_id === input);
      if (dbUser) {
        const email = (dbUser.mail_id || dbUser.email || '').toLowerCase().trim();
        const matched = authUsers.find(a => (a.email || '').toLowerCase().trim() === email);
        if (matched?.$id) {
          resolvedAuthIds.push(matched.$id);
          continue;
        }
      }

      // Fallback: keep original input
      resolvedAuthIds.push(input);
    }

    return Array.from(new Set(resolvedAuthIds));
  } catch (err) {
    console.warn("Exception resolving Auth IDs:", err);
    return inputIds;
  }
};

export const filterUsersWithTargets = async (userIds: string[]): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_APPWRITE_API_KEY || '';
  if (!apiKey || !userIds || userIds.length === 0) return userIds;

  const validIds: string[] = [];
  for (const id of userIds) {
    try {
      const res = await fetch(`${APPWRITE_CONFIG.endpoint}/users/${id}/targets`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
          'X-Appwrite-Key': apiKey,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.targets && data.targets.length > 0) {
          validIds.push(id);
        }
      } else {
        // If query fails, include to attempt dispatch
        validIds.push(id);
      }
    } catch {
      validIds.push(id);
    }
  }
  return validIds;
};

export const sendPushNotification = async (userIds: string[], title: string, body: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.group(`[PUSH NOTIFICATION DIAGNOSTICS - ${timestamp}]`);
  console.log("📋 Request Title:", title);
  console.log("📋 Request Body:", body);
  console.log("👥 Input Target User IDs / Emails:", userIds);

  if (!userIds || userIds.length === 0) {
    console.warn("❌ Recipient Validation Failed: Empty target user IDs array.");
    console.groupEnd();
    return null;
  }

  const resolvedUserIds = await resolveAuthUserIdsByEmailOrId(userIds);
  console.log("🔑 Resolved Appwrite Auth User IDs:", resolvedUserIds);

  const targetUserIds = await filterUsersWithTargets(resolvedUserIds);
  console.log("✅ Validated Recipients with Active Targets:", targetUserIds);

  if (targetUserIds.length === 0) {
    console.warn("⚠️ Recipient Validation Warning: Specified user IDs have 0 registered Push Targets. Skipping API dispatch to prevent Appwrite No Recipient error.");
    console.groupEnd();
    return null;
  }

  // Option 1: Appwrite Serverless Function (if function ID configured)
  if (APPWRITE_CONFIG.notificationFunctionId) {
    try {
      const payload = {
        action: 'push',
        users: targetUserIds,
        title,
        body,
        data,
        icon: window.location.origin + '/logos/logo4.jpg',
      };
      const res = await functions.createExecution(
        APPWRITE_CONFIG.notificationFunctionId,
        JSON.stringify(payload),
        false // async
      );
      console.log("🚀 Serverless Push Function Triggered:", res);
      console.groupEnd();
      return res;
    } catch (err) {
      console.error('❌ Failed to trigger Push Notification Function:', err);
      console.groupEnd();
      return null;
    }
  }

  // Option 2: Direct Appwrite Messaging REST API (if VITE_APPWRITE_API_KEY configured)
  const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
  if (apiKey) {
    const payload = {
      messageId: ID.unique(),
      title,
      body,
      users: targetUserIds,
      icon: window.location.origin + '/logos/logo4.jpg',
      data,
    };
    const res = await sendAppwriteMessagingRequest('/messaging/messages/push', payload);
    console.log("🚀 Appwrite Messaging Push Response:", res);
    console.groupEnd();
    return res;
  }

  console.warn('⚠️ Neither VITE_APPWRITE_NOTIFICATION_FUNCTION_ID nor VITE_APPWRITE_API_KEY is configured for Push Notifications.');
  console.groupEnd();
  return null;
};

export const sendEmailNotification = async (users: string[], subject: string, content: string) => {
  if (!users || users.length === 0) return null;

  // Option 1: Appwrite Serverless Function (if function ID configured)
  if (APPWRITE_CONFIG.notificationFunctionId) {
    try {
      const payload = {
        action: 'email',
        users,
        subject,
        content,
      };
      return await functions.createExecution(
        APPWRITE_CONFIG.notificationFunctionId,
        JSON.stringify(payload),
        false // async
      );
    } catch (err) {
      console.error('Failed to trigger Email Notification Function:', err);
      return null;
    }
  }

  // Option 2: Direct Appwrite Messaging REST API (if VITE_APPWRITE_API_KEY configured)
  const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
  if (apiKey) {
    const payload = {
      messageId: ID.unique(),
      subject,
      content,
      users,
    };
    return await sendAppwriteMessagingRequest('/messaging/messages/email', payload);
  }

  console.warn('Neither VITE_APPWRITE_NOTIFICATION_FUNCTION_ID nor VITE_APPWRITE_API_KEY is configured for Email Notifications.');
  return null;
};

