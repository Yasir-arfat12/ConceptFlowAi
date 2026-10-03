const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelsToTest = [
  'gemini-2.5-computer-use-preview-10-2025',
  'deep-research-preview-04-2026',
  'aqa'
];
async function test() {
  for (let m of modelsToTest) {
    try {
      await ai.models.generateContent({
        model: m,
        contents: "Return JSON {\"test\": 1}",
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.OBJECT, properties: { test: { type: Type.INTEGER } } }
        }
      });
      console.log(m + " SUPPORTS JSON");
    } catch (e) {
      console.log(m + " FAILED: " + (e.message || e.toString()));
    }
  }
}
test();
