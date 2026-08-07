import { ID } from 'appwrite';
import { storage } from './client';
import { APPWRITE_CONFIG } from './constants';

export const uploadFile = async (file: File) => {
  try {
    const uploadedFile = await storage.createFile(
      APPWRITE_CONFIG.bucketId,
      ID.unique(),
      file
    );
    return uploadedFile;
  } catch (error) {
    console.error('Appwrite: Error uploading file', error);
    throw error;
  }
};

export const getFileUrl = (fileId: string) => {
  if (!fileId) return '';
  return storage.getFileView(APPWRITE_CONFIG.bucketId, fileId).toString();
};

export const getFileDownloadUrl = (fileId: string) => {
  if (!fileId) return '';
  return storage.getFileDownload(APPWRITE_CONFIG.bucketId, fileId).toString();
};

export const deleteFile = async (fileId: string) => {
  try {
    await storage.deleteFile(APPWRITE_CONFIG.bucketId, fileId);
    return true;
  } catch (error) {
    console.error('Appwrite: Error deleting file', error);
    throw error;
  }
};
