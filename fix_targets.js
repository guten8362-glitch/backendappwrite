

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
    console.error("Missing Appwrite credentials in .env");
    process.exit(1);
}

const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
};

async function fixTargets() {
    try {
        console.log("Fetching all users...");
        const response = await fetch(`${endpoint}/users`, { method: 'GET', headers });
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        
        for (const user of data.users) {
            console.log(`Checking user: ${user.email} (${user.$id})`);
            
            // Check existing targets
            const targetRes = await fetch(`${endpoint}/users/${user.$id}/targets`, { method: 'GET', headers });
            const targetData = await targetRes.json();
            
            const hasEmailTarget = targetData.targets?.some(t => t.providerType === 'email');
            
            if (!hasEmailTarget) {
                console.log(`  -> No Email Target found. Creating one for ${user.email}...`);
                const createRes = await fetch(`${endpoint}/users/${user.$id}/targets`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        targetId: 'unique()',
                        providerType: 'email',
                        identifier: user.email
                    })
                });
                if (createRes.ok) {
                    console.log(`  -> Successfully created Email Target for ${user.email}!`);
                } else {
                    const errTxt = await createRes.text();
                    console.error(`  -> Failed to create target: ${errTxt}`);
                }
            } else {
                console.log(`  -> Already has Email Target.`);
            }
        }
        console.log("Finished fixing all user targets!");
    } catch (err) {
        console.error("Error fixing targets:", err);
    }
}

fixTargets();
