import axios from 'axios';

const key = ""PASTE_YOUR_KEY_HERE";

async function testAll() {
    try {
        console.log(`Listing available models...`);
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const listRes = await axios.get(listUrl);
        const models = listRes.data.models.map(m => m.name.replace('models/', ''));

        console.log(`Found ${models.length} models. Testing for generateContent...`);

        for (const model of models) {
            try {
                process.stdout.write(`Testing ${model}... `);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                const res = await axios.post(url, {
                    contents: [{ parts: [{ text: "echo 'ok'" }] }]
                }, { timeout: 5000 });

                if (res.status === 200) {
                    console.log("✅ WORKING!");
                    console.log(`\nCORE FIX: Use model "${model}" with v1beta`);
                    process.exit(0);
                }
            } catch (e) {
                console.log(`❌ ${e.response?.status || 'Error'}`);
            }
        }
    } catch (e) {
        console.log(`Failed to list: ${e.message}`);
    }
}

testAll();
