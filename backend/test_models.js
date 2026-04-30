import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const key = "AIzaSyChsQg-jWsorNE4HxrZJbW01zQmro4I-Vw";

async function testMultipleModels() {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite-preview-02-05"];

    for (const model of models) {
        console.log(`\nTesting model: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        try {
            const res = await axios.post(url, {
                contents: [{ parts: [{ text: "hi" }] }]
            }, { timeout: 10000 });

            console.log(`✅ ${model} is WORKING!`);
            console.log(`Response: ${res.data.candidates[0].content.parts[0].text.trim()}`);
        } catch (e) {
            console.log(`❌ ${model} FAILED: ${e.response?.status || e.message}`);
            if (e.response?.data?.error?.message) {
                console.log(`   Message: ${e.response.data.error.message.substring(0, 100)}...`);
            }
        }
    }
}

testMultipleModels();
