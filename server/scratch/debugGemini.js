const { generateAssignment } = require('../src/services/geminiService');

const testGen = async () => {
  try {
    const res = await generateAssignment("Binary Search", "Concepts: Intro, Core Mechanics");
    console.log("Success:", res);
  } catch (err) {
    console.error("Failed:", err);
  }
};
testGen();
