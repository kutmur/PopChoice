// Quick test for OpenAI reasoning
const axios = require('axios');

async function testReasoningFix() {
    try {
        console.log('🧪 Testing OpenAI reasoning fix...');
        
        const testData = {
            genres: ['action', 'sci-fi'],
            era: 'recent',
            mood: 'thrilling',
            runtime: 'any-length',
            context: 'solo-evening',
            rating: 'highly-rated',
            themes: ['adventure', 'mystery']
        };
        
        console.log('📤 Sending test request...');
        
        const response = await axios.post('http://localhost:3000/api/recommendations', testData);
        
        console.log(`\n✅ Received ${response.data.length} recommendations`);
        
        response.data.forEach((movie, index) => {
            console.log(`\n🎬 ${index + 1}. ${movie.title} (${movie.release_year})`);
            console.log(`   Rating: ${movie.vote_average}/10`);
            console.log(`   💡 Reasoning: "${movie.reasoning}"`);
            console.log(`   🎯 Is reasoning AI-generated? ${movie.reasoning.includes('matches your selected criteria') ? '❌ No (fallback)' : '✅ Yes!'}`);
        });
        
        const hasAIReasoning = response.data.some(movie => 
            !movie.reasoning.includes('matches your selected criteria') &&
            !movie.reasoning.includes('Highly rated movie')
        );
        
        console.log(`\n🎯 Overall Result: ${hasAIReasoning ? '✅ AI reasoning is working!' : '❌ Still using fallback reasoning'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testReasoningFix();
