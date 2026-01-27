
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testChat() {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log("Testing with key ending in:", apiKey ? apiKey.slice(-4) : "None");

    if (!apiKey) {
        console.error("No API KEY");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-flash-latest";
    // trying gemini-1.5-flash directly if possible or check candidates

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
            history: [],
        });

        const msg = "Hello";
        console.log(`Sending: ${msg} to ${modelName}`);

        const result = await chat.sendMessage(msg);
        const response = await result.response;
        console.log("Full Response Object keys:", Object.keys(response));
        console.log("Candidates:", JSON.stringify(response.candidates, null, 2));
        console.log("Text:", response.text ? response.text() : "No text() method");
    } catch (error) {
        console.error("Chat Error:", error);
    }
}

testChat();
