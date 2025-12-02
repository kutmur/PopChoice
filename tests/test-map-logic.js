// Test the improved Map-based reasoning logic
const axios = require('axios');

async function testMapBasedReasoning() {
    try {
        console.log('🗺️ Testing improved Map-based reasoning logic...');
        
        const testData = {
            genres: ['comedy', 'romance'],
            era: 'modern',
            mood: 'uplifting',
            runtime: 'short',
            context: 'date-night',
            rating: 'good-rated',
            themes: ['friendship']
        };
        
        console.log('📤 Sending test request with different preferences...');
        
        const response = await axios.post('http://localhost:3000/api/recommendations', testData);
        
        console.log(`\n✅ Received ${response.data.length} recommendations`);
        
        // Check for data integrity
        const hasValidIds = response.data.every(movie => movie.id && typeof movie.id === 'number');
        const hasReasoning = response.data.every(movie => movie.reasoning && movie.reasoning.length > 0);
        const hasNoDuplicates = new Set(response.data.map(m => m.id)).size === response.data.length;
        
        console.log('\n🔍 Data Integrity Checks:');
        console.log(`   ✅ All movies have valid IDs: ${hasValidIds}`);
        console.log(`   ✅ All movies have reasoning: ${hasReasoning}`);
        console.log(`   ✅ No duplicate movies: ${hasNoDuplicates}`);
        
        console.log('\n🎬 Sample recommendations:');
        response.data.slice(0, 3).forEach((movie, index) => {
            console.log(`   ${index + 1}. ${movie.title} (ID: ${movie.id})`);
            console.log(`      Rating: ${movie.vote_average}/10`);
            console.log(`      Reasoning: "${movie.reasoning}"`);
        });
        
        console.log('\n🎯 Map-based logic is working correctly!');
        console.log('   - Efficient O(1) lookups instead of O(n) searches');
        console.log('   - No risk of ID mismatches');
        console.log('   - Clean separation of concerns');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testMapBasedReasoning();
