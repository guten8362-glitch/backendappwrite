import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
  const dbId = process.env.VITE_APPWRITE_DATABASE_ID;
  const bucketId = process.env.VITE_STORAGE_BUCKET_ID;
  const url = endpoint + '/databases/' + dbId + '/collections/halls/documents';

  const res = await fetch(url, {
    headers: {
      'X-Appwrite-Project': projectId,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if(data.documents && data.documents.length > 0) {
     const doc = data.documents[0];
     const imgField = doc.imagesURL || doc.imageURL || doc.image || doc.images || "";
     console.log("Raw image field value:", imgField);

     let fileId = imgField;
     if (Array.isArray(imgField)) fileId = imgField[0];
     else if (typeof imgField === 'string') fileId = imgField.split(',')[0].trim();
     
     if (fileId && !fileId.startsWith('http')) {
        const fileUrl = endpoint + '/storage/buckets/' + bucketId + '/files/' + fileId + '/view?project=' + projectId;
        console.log("Fetching URL:", fileUrl);
        const imgRes = await fetch(fileUrl);
        console.log("Image Fetch Status:", imgRes.status);
        if(!imgRes.ok) console.log("Image Error Text:", await imgRes.text());
     }
  }
}
check();
