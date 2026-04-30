import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const apiUrl = process.env.GEMINI_API_URL;

async function testCurrentConfig() {
    console.log(`Testing API URL: ${apiUrl}`);
    if (!apiUrl) {
        console.error("GEMINI_API_URL is missing in .env");
        return;
    }

    try {
        const res = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: "Hello, who are you?" }] }]
        }, { timeout: 10000 });

        console.log("Success!");
        console.log("Response Status:", res.status);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("Error testing current config:");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Message:", e.message);
        }
    }
}

testCurrentConfig();
