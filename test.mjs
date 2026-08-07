import fs from 'fs';

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
  console.log(data);
}
check();
