const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelsToTest = [
  'gemini-3.8-flash',
  'gemini-3.7-flash'
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
      console.log(m + " SUPPORTS JSON and is Working!");
    } catch (e) {
      console.log(m + " FAILED: " + (e.message || e.toString()));
    }
  }
}
test();
