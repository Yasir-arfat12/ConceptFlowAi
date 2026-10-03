const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function listModels() {
    try {
        const response = await ai.models.list();
        for (let model of response) {
            console.log(model.name);
        }
    } catch(e) {
        console.error(e);
    }
}
listModels();
