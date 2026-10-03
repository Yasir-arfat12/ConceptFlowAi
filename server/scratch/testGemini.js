const { generateLearningPath } = require('../src/services/geminiService');

const testGemini = async () => {
  try {
    console.log('Testing generateLearningPath for "Binary Search"...');
    const result1 = await generateLearningPath('Binary Search');
    console.log('Result for "Binary Search":\n', JSON.stringify(result1, null, 2));

    console.log('\nTesting generateLearningPath for "Photosynthesis"...');
    const result2 = await generateLearningPath('Photosynthesis');
    console.log('Result for "Photosynthesis":\n', JSON.stringify(result2, null, 2));
    
  } catch (error) {
    console.error('Test Failed:', error);
  }
};

testGemini();
