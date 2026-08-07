import { APPWRITE_CONFIG } from './src/lib/appwrite/constants.js';
import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

const databases = new Databases(client);

async function check() {
    try {
        const response = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.bookings
        );
        console.log("Documents:", JSON.stringify(response.documents[0], null, 2));
    } catch(e) {
        console.error(e);
    }
}
check();
