import { Client, Messaging, Users, ID } from 'node-appwrite';

/**
 * Appwrite Serverless Function for Notification Service
 * Triggered by client-side createExecution() calls.
 * Uses node-appwrite Server SDK with API Key for secure dispatch.
 */
export default async ({ req, res, log, error }) => {
  log('Notification Function triggered');

  // Initialize Appwrite Server SDK using runtime environment variables
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY || '');

  const messaging = new Messaging(client);

  try {
    let payload = {};
    if (typeof req.bodyRaw === 'string' && req.bodyRaw) {
      payload = JSON.parse(req.bodyRaw);
    } else if (typeof req.body === 'string' && req.body) {
      payload = JSON.parse(req.body);
    } else if (typeof req.body === 'object' && req.body !== null) {
      payload = req.body;
    }

    const { action, users, title, body, subject, content, data, icon } = payload;

    if (action === 'push') {
      if (!users || !users.length) {
        return res.json({ success: false, message: 'No target users specified for push notification' }, 400);
      }

      log(`Sending Push Notification: "${title}" to raw targets: ${users.join(', ')}`);

      // Resolve emails to Auth User IDs
      const usersSdk = new Users(client);
      const resolvedTargetIds = new Set();

      for (const identifier of users) {
        if (!identifier) continue;
        try {
          if (identifier.includes('@')) {
            // It's an email, look up the Auth User
            const res = await usersSdk.list([`equal("email", ["${identifier}"])`]);
            if (res.total > 0) {
              resolvedTargetIds.add(res.users[0].$id);
            }
          }
        } catch (e) {
          log(`Error looking up user by email ${identifier}: ${e.message}`);
        }
      }

      // If we couldn't resolve any emails, fallback to any non-email IDs they sent
      if (resolvedTargetIds.size === 0) {
        users.forEach(u => {
          if (!u.includes('@')) resolvedTargetIds.add(u);
        });
      }

      const finalTargets = Array.from(resolvedTargetIds);
      log(`Resolved Push Targets to Auth IDs: ${finalTargets.join(', ')}`);

      if (finalTargets.length === 0) {
         return res.json({ success: false, message: 'No valid Auth users found for push notification' }, 400);
      }

      const message = await messaging.createPush(
        ID.unique(),
        title || 'Notification',
        body || '',
        [], // topics
        finalTargets, // resolved target users array
        [], // targets
        data || {},
        undefined, // action
        undefined, // image
        icon || undefined, // icon
        undefined, // sound
        undefined, // color
        undefined, // tag
        undefined, // badge
        false // draft
      );

      return res.json({ success: true, action: 'push', messageId: message.$id });
    }

    if (action === 'email') {
      if (!users || !users.length) {
        return res.json({ success: false, message: 'No target users specified for email notification' }, 400);
      }

      log(`Sending Email Notification: "${subject}" to users: ${users.join(', ')}`);

      const message = await messaging.createEmail(
        ID.unique(),
        subject || 'Notification',
        content || '',
        [], // topics
        users, // target users array
        [], // targets
        [] // cc/bcc
      );

      return res.json({ success: true, action: 'email', messageId: message.$id });
    }

    return res.json({ success: false, message: 'Invalid or missing action in payload' }, 400);
  } catch (err) {
    error(`Error executing Notification Function: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
