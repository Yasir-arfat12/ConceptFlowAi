const { evaluateCheckpoint } = require('../src/services/geminiService');

const testEvaluation = async () => {
  try {
    const question = "What is the time complexity of binary search?";
    const answer = "It's O(log n)";
    const context = "Binary search is an efficient algorithm with a time complexity of O(log n).";
    
    console.log('Testing evaluateCheckpoint...');
    const result = await evaluateCheckpoint(question, answer, context);
    console.log('Result:\n', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test Failed:', error);
  }
};

testEvaluation();
