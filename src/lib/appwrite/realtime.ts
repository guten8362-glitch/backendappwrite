import { client } from './client';
import { APPWRITE_CONFIG } from './constants';

export const subscribeToBookings = (callback: (payload: any) => void) => {
  try {
    if (!APPWRITE_CONFIG.projectId || !APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.bookings) {
      return () => {};
    }
    const channel = `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.bookings}.documents`;
    
    return client.subscribe(channel, (response) => {
      callback(response);
    });
  } catch (err) {
    console.warn("Appwrite subscribeToBookings error:", err);
    return () => {};
  }
};

export const subscribeToNotifications = (callback: (payload: any) => void) => {
  try {
    if (!APPWRITE_CONFIG.projectId || !APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.notifications || APPWRITE_CONFIG.collections.notifications.includes('your_')) {
      return () => {};
    }
    const channel = `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.notifications}.documents`;
    
    return client.subscribe(channel, (response) => {
      callback(response);
    });
  } catch (err) {
    console.warn("Appwrite subscribeToNotifications error:", err);
    return () => {};
  }
};
