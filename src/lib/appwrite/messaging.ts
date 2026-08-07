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

// Removed resolveAuthUserIdsByEmailOrId as it incorrectly mapped emails to DB document IDs.
// The Serverless Function correctly maps emails to Auth User IDs natively.
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

export const sendPushNotification = async (userIds: string[], title: string, body: string, data?: any, institution?: string) => {
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

  const targetUserIds = await filterUsersWithTargets(userIds);
  console.log("✅ Validated Recipients with Active Targets:", targetUserIds);

  if (targetUserIds.length === 0) {
    console.warn("⚠️ Recipient Validation Warning: Specified user IDs have 0 registered Push Targets. Skipping API dispatch to prevent Appwrite No Recipient error.");
    console.groupEnd();
    return null;
  }

  // Determine dynamic icon based on institution
  let iconUrl = window.location.origin + '/logos/logo4.jpg'; // default (MVIT)
  if (institution) {
    const instStr = institution.toLowerCase();
    if (instStr.includes('kns')) {
      iconUrl = window.location.origin + '/logos/logo1.jpg';
    } else if (instStr.includes('someother')) { // add more mappings as needed
      iconUrl = window.location.origin + '/logos/logo2.jpg';
    }
    // You can easily add more mappings here!
  }

  // Determine badge (small status bar icon, must be transparent/monochrome PNG)
  const badgeUrl = window.location.origin + '/logo192.png'; // Using generic PWA logo for the badge

  // Option 1: Appwrite Serverless Function (if function ID configured)
  if (APPWRITE_CONFIG.notificationFunctionId) {
    try {
      const payload = {
        action: 'push',
        users: targetUserIds,
        title,
        body,
        data,
        icon: iconUrl,
        badge: badgeUrl,
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
      icon: iconUrl,
      badge: badgeUrl,
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

