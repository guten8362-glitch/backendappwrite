import { Client, Account, Databases, Storage, Teams, Functions } from 'appwrite';
import { APPWRITE_CONFIG } from './constants';

export const client = new Client();

client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);
export const functions = new Functions(client);

