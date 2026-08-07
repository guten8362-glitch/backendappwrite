import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if(val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if(val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1].trim().replace('\r', '')] = val;
  }
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
  if (data.documents && data.documents.length > 0) {
     const doc = data.documents[0];
     console.log('--- EXACT IMAGES URL VALUE ---');
     console.log(doc.imagesURL);
     console.log('Type of imagesURL:', typeof doc.imagesURL);
     console.log('Is Array?', Array.isArray(doc.imagesURL));
  } else {
     console.log('Error or no docs:', data);
  }
}
check();
