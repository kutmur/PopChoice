// Test the improved narrative reasoning
const axios = require('axios');

async function testNarrativeReasoning() {
    try {
        console.log('📖 Testing improved narrative reasoning...');
        
        const testData = {
            genres: ['romance', 'comedy'],
            era: 'recent',
            mood: 'uplifting',
            runtime: 'any-length',
            context: 'date-night',
            rating: 'good-rated',
            themes: ['friendship', 'romance']
        };
        
        console.log('💕 Testing with romantic comedy preferences for date night...');
        
        const response = await axios.post('http://localhost:3000/api/recommendations', testData);
        
        console.log(`\n✅ Received ${response.data.length} recommendations\n`);
        
        console.log('🎬 Reasoning Analysis:');
        response.data.forEach((movie, index) => {
            const reasoning = movie.reasoning;
            
            // Check for robotic phrases (BAD)
            const hasRoboticPhrases = [
                'matches your preferences',
                'based on your selection', 
                'fits your criteria',
                'perfect for your',
                'matches your'
            ].some(phrase => reasoning.toLowerCase().includes(phrase));
            
            // Check for narrative elements (GOOD)
            const hasNarrativeElements = [
                'witty', 'heartwarming', 'story', 'characters', 'atmosphere',
                'dialogue', 'emotion', 'feeling', 'experience', 'adventure',
                'journey', 'touching', 'moving', 'compelling', 'engaging'
            ].some(word => reasoning.toLowerCase().includes(word));
            
            console.log(`\n${index + 1}. ${movie.title} (${movie.release_year})`);
            console.log(`   Rating: ${movie.vote_average}/10`);
            console.log(`   💡 Reasoning: "${reasoning}"`);
            console.log(`   📊 Analysis:`);
            console.log(`      ${hasRoboticPhrases ? '❌' : '✅'} Free of robotic phrases`);
            console.log(`      ${hasNarrativeElements ? '✅' : '❌'} Contains narrative elements`);
        });
        
        const allNarrative = response.data.every(movie => {
            const reasoning = movie.reasoning.toLowerCase();
            const noRobotic = !['matches your preferences', 'based on your selection', 'fits your criteria'].some(phrase => reasoning.includes(phrase));
            const hasNarrative = ['story', 'characters', 'atmosphere', 'dialogue', 'emotion', 'experience'].some(word => reasoning.includes(word));
            return noRobotic && hasNarrative;
        });
        
        console.log(`\n🎯 Overall Result: ${allNarrative ? '✅ Narrative reasoning is working!' : '⚠️ Some improvements still needed'}`);
        console.log('\n📈 Improvement Summary:');
        console.log('   - Charismatic movie expert persona');
        console.log('   - Focus on emotional storytelling');
        console.log('   - Higher temperature for creativity');
        console.log('   - Narrative fallback reasoning');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testNarrativeReasoning();
