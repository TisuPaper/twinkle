import { validateLearnWordData, processToChapters } from './processor';

const singleWordData = {
    ageLevel: '4-5',
    difficulty: {
        easy: ['cat'],
        medium: ['apple'],
        hard: ['garden']
    }
};

console.log('--- Testing Single Word Per Level ---');
try {
    console.log('Input:', JSON.stringify(singleWordData, null, 2));
    const validated = validateLearnWordData(singleWordData);
    console.log('Validation successful');
    const chapters = processToChapters(validated);
    console.log('Chapters:', JSON.stringify(chapters, null, 2));
} catch (e) {
    console.error('Error:', e);
}
