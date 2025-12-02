// Test script for PopChoice API
// Run with: node test-api.js

const axios = require('axios');

async function testAPI() {
    try {
        console.log('Testing PopChoice API...');
        
        // Test data similar to what the frontend would send
        const testData = {
            genres: ['action', 'sci-fi'],
            era: 'recent',
            mood: 'thrilling',
            runtime: 'any-length',
            context: 'solo-evening',
            rating: 'highly-rated',
            themes: ['adventure']
        };
        
        console.log('Sending request with test data:', testData);
        
        const response = await axios.post('http://localhost:3000/api/recommendations', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n✅ API Response received!');
        console.log(`📊 Number of recommendations: ${response.data.length}`);
        
        if (response.data.length > 0) {
            console.log('\n🎬 First recommendation:');
            console.log(`   Title: ${response.data[0].title}`);
            console.log(`   Year: ${response.data[0].release_year}`);
            console.log(`   Rating: ${response.data[0].vote_average}`);
            console.log(`   Reasoning: ${response.data[0].reasoning}`);
        }
        
        console.log('\n🎉 API test completed successfully!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.response?.data || error.message);
    }
}

testAPI();
