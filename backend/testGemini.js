import 'dotenv/config';
import geminiResponse from './gemini.js';

async function run() {
  console.log("Calling Gemini API...");
  try {
    const result = await geminiResponse("open youtube", "Jarvis", "User");
    console.log("Result:", result);
  } catch(e) {
    console.error("Script Error:", e.message);
  }
}

run();
