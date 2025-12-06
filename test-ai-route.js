
async function testAiRoute() {
    try {
        const response = await fetch('http://localhost:3000/api/ai-processor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Teach my kid about farm animals' })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAiRoute();
