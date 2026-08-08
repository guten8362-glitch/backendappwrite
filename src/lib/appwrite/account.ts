import { ID, OAuthProvider } from 'appwrite';
import { account, databases, teams } from './client';
import { APPWRITE_CONFIG } from './constants';

export const loginWithGoogle = () => {
  account.createOAuth2Session(
    OAuthProvider.Google,
    `${window.location.origin}/bookings`, // Success URL
    `${window.location.origin}/login?error=true` // Failure URL
  );
};

export const loginWithEmail = async (email: string, password?: string) => {
  const pass = password || "12345678";
  try {
    try {
      const activeSession = await account.getSession('current');
      if (activeSession) {
        await account.deleteSession('current');
      }
    } catch {
      // No active session to delete
    }
    const session = await account.createEmailPasswordSession(email, pass);
    return session;
  } catch (error: any) {
    console.error('Appwrite: Error logging in with email', error);
    if (error?.code === 401 || error?.type === 'user_invalid_credentials' || error?.type === 'user_not_found') {
      try {
        const userId = ID.unique();
        await account.create(userId, email, pass, email.split('@')[0] || 'User');
        const session = await account.createEmailPasswordSession(email, pass);
        return session;
      } catch (createErr) {
        console.error('Appwrite: Could not auto-create user', createErr);
      }
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession('current');
    return true;
  } catch (error) {
    console.error('Appwrite: Error logging out', error);
    return false;
  }
};

export const getCurrentSession = async () => {
  try {
    const session = await account.getSession('current');
    return session;
  } catch (error) {
    return null; // Not logged in
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    
    try {
      const list = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users
      );
      
      const userDoc = list.documents.find((d: any) => {
        const docEmail = (d.mail_id || d.email || '').toLowerCase().trim();
        const userEmail = (user.email || '').toLowerCase().trim();
        return docEmail === userEmail;
      });
      
      if (!userDoc) {
        console.warn(`User ${user.email} not found in the users database table. Access denied.`);
        await account.deleteSession('current');
        return null;
      }
      
      let teamName = "external_user";
      let userTeams: any = null;
      try {
        userTeams = await teams.list();
        if (userTeams.teams.some(t => t.name === 'mvit_user')) {
          teamName = "mvit_user";
        } else if (userTeams.teams.some(t => t.name === 'external_user')) {
          teamName = "external_user";
        }
      } catch (teamErr) {
        console.error("Error fetching teams:", teamErr);
      }

      let rawRole = (userDoc.role || 'user').toString().toLowerCase().trim();
      let role = rawRole;

      if (rawRole === 'coordinator' || teamName === 'coordinator' || (userTeams && userTeams.teams.some(t => t.name.toLowerCase() === 'coordinator'))) {
        role = 'coordinator';
      } else if (rawRole === 'admin') {
        role = 'admin';
      }

      return {
        email: user.email,
        name: userDoc.name || user.name || user.email.split('@')[0],
        role: role as "user" | "admin" | "coordinator" | "organizer",
        institution: userDoc.institution || 'MVIT',
        team: teamName,
        $id: user.$id
      };
    } catch (e) {
      console.error("Error reading users table:", e);
      await account.deleteSession('current');
      return null;
    }
  } catch (error) {
    return null;
  }
};
