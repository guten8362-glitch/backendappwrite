export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
  collections: {
    users: import.meta.env.VITE_USERS_COLLECTION_ID || 'users',
    halls: import.meta.env.VITE_HALLS_COLLECTION_ID || 'halls',
    bookings: import.meta.env.VITE_BOOKINGS_COLLECTION_ID || 'bookings',
    notifications: import.meta.env.VITE_NOTIFICATIONS_COLLECTION_ID || 'notifications',
  },
  bucketId: import.meta.env.VITE_STORAGE_BUCKET_ID || '',
  notificationFunctionId: import.meta.env.VITE_APPWRITE_NOTIFICATION_FUNCTION_ID || '',
};

