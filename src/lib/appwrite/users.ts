import { ID, Query } from 'appwrite';
import { account, databases } from './client';
import { APPWRITE_CONFIG } from './constants';
import type { UserRole, User } from '../auth';

export const addUserToDatabase = async (newUser: {
  email: string;
  password?: string;
  name: string;
  institution: string;
  role: UserRole;
}) => {
  try {
    const userDoc = {
      mail_id: newUser.email,
      name: newUser.name,
      institution: newUser.institution,
      role: newUser.role,
    };
    
    await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      ID.unique(),
      userDoc
    );
    return true;
  } catch (error) {
    console.error('Appwrite: Error adding user to database', error);
    return false;
  }
};

export const getAllUsersFromDatabase = async (): Promise<User[]> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users
    );
    return response.documents.map((doc: any) => ({
      email: doc.mail_id || doc.email || '',
      name: doc.name || '',
      institution: doc.institution || 'MVIT',
      role: doc.role || 'user',
      $id: doc.user_id || doc.userId || doc.auth_id || doc.$id
    }));
  } catch (error) {
    console.warn('Appwrite: Error fetching users, attempting session recovery:', error);
    try {
      await account.createAnonymousSession();
      const retryResponse = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users
      );
      return retryResponse.documents.map((doc: any) => ({
        email: doc.mail_id || doc.email || '',
        name: doc.name || '',
        institution: doc.institution || 'MVIT',
        role: doc.role || 'user',
        $id: doc.user_id || doc.userId || doc.auth_id || doc.$id
      }));
    } catch (retryErr) {
      console.error('Appwrite: Error fetching users after recovery:', retryErr);
      return [];
    }
  }
};

export const registerPushTargetServerSide = async (userId: string, token: string) => {
  const apiKey = import.meta.env.VITE_APPWRITE_API_KEY || '';
  if (!apiKey || !userId || !token) return false;

  try {
    const listRes = await fetch(`${APPWRITE_CONFIG.endpoint}/users/${userId}/targets`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
        'X-Appwrite-Key': apiKey,
      },
    });

    if (listRes.ok) {
      const listData = await listRes.json();
      const existing = listData.targets || [];
      const alreadyHas = existing.some((t: any) => t.identifier === token);
      if (alreadyHas) return true;
    }

    // Register push target with the verified Provider ID "6a6c0163000e309089af"
    const createRes = await fetch(`${APPWRITE_CONFIG.endpoint}/users/${userId}/targets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
        'X-Appwrite-Key': apiKey,
      },
      body: JSON.stringify({
        targetId: ID.unique(),
        providerType: 'push',
        identifier: token,
        providerId: '6a6c0163000e309089af',
      }),
    });

    if (createRes.ok) {
      console.log('Appwrite: Successfully registered Push Target via Server REST API!');
      return true;
    } else {
      console.error('Appwrite: Server Push Target creation error:', await createRes.text());
    }
  } catch (err) {
    console.error('Appwrite: Exception registering Push Target on Server:', err);
  }
  return false;
};

export const updateUserFCMToken = async (email: string, token: string, userAuthId?: string) => {
  try {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) return false;

    // 1. Search user in database
    let list = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      [Query.equal('mail_id', normalizedEmail)]
    );

    if (list.documents.length === 0) {
      list = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        [Query.equal('email', normalizedEmail)]
      );
    }
    
    let targetUser = list.documents[0];
    if (!targetUser) {
      const allList = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.users, [Query.limit(100)]);
      targetUser = allList.documents.find((u: any) => 
         (u.mail_id || '').toLowerCase().trim() === normalizedEmail ||
         (u.email || '').toLowerCase().trim() === normalizedEmail
      );
    }

    if (targetUser) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          targetUser.$id,
          { fcm_token: token }
        );
        console.log('Successfully saved FCM token to user DB');
      } catch (dbErr) {
        console.warn('Could not update fcm_token attribute on user DB document:', dbErr);
      }

      const authId = userAuthId || targetUser.user_id || targetUser.userId || targetUser.auth_id || targetUser.$id;
      if (authId) {
        await registerPushTargetServerSide(authId, token);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Appwrite: Error updating FCM token', error);
    return false;
  }
};
