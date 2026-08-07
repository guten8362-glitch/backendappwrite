import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
  const dbId = process.env.VITE_APPWRITE_DATABASE_ID;
  const url = endpoint + '/databases/' + dbId + '/collections/halls/documents';

  const res = await fetch(url, {
    headers: {
      'X-Appwrite-Project': projectId,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if(data.documents && data.documents.length > 0) {
     console.log('Sample Doc keys:', Object.keys(data.documents[0]));
     console.log('Sample image fields:', data.documents.map((d: any) => ({
         name: d.name,
         imagesURL: d.imagesURL,
         imageURL: d.imageURL,
         image: d.image,
         images: d.images
     })));
  } else {
     console.log(data);
  }
}
check();
