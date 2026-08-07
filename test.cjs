const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

async function check() {
  const endpoint = env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = env.VITE_APPWRITE_PROJECT_ID;
  const dbId = env.VITE_APPWRITE_DATABASE_ID;
  const url = endpoint + '/databases/' + dbId + '/collections/halls/documents';

  const res = await fetch(url, {
    headers: {
      'X-Appwrite-Project': projectId,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  console.log("Documents found:", data.documents?.length);
  if(data.documents && data.documents.length > 0) {
     const keys = Object.keys(data.documents[0]);
     const imageKeys = keys.filter(k => k.toLowerCase().includes('image'));
     console.log('Image fields available:', imageKeys);
     console.log('Sample image data:', data.documents.map(d => {
         const obj = { name: d.name };
         imageKeys.forEach(k => obj[k] = d[k]);
         return obj;
     }));
  }
}
check();
