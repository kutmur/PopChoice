// Test the final unique reasoning improvements
const axios = require('axios');

async function testUniqueReasoning() {
    try {
        console.log('🎯 Testing FINAL unique reasoning improvements...');
        
        const testData = {
            genres: ['action', 'adventure'],
            era: 'recent',
            mood: 'thrilling',
            runtime: 'any-length',
            context: 'solo-evening',
            rating: 'highly-rated',
            themes: ['adventure', 'mystery']
        };
        
        console.log('⚡ Testing with action/adventure preferences for thrilling solo evening...');
        
        const response = await axios.post('http://localhost:3000/api/recommendations', testData);
        
        console.log(`\n✅ Received ${response.data.length} recommendations\n`);
        
        // Analyze uniqueness of reasoning
        const reasoningTexts = response.data.map(movie => movie.reasoning);
        const uniqueReasonings = new Set(reasoningTexts);
        
        console.log('🔍 UNIQUENESS ANALYSIS:');
        console.log(`   📊 Total recommendations: ${response.data.length}`);
        console.log(`   🎯 Unique reasoning texts: ${uniqueReasonings.size}`);
        console.log(`   ${uniqueReasonings.size === response.data.length ? '✅' : '❌'} All reasonings are unique: ${uniqueReasonings.size === response.data.length}`);
        
        console.log('\n🎬 Individual Reasoning Analysis:');
        response.data.forEach((movie, index) => {
            const reasoning = movie.reasoning;
            
            // Check for movie-specific details
            const hasMovieTitle = reasoning.includes(movie.title);
            const hasSpecificYear = reasoning.includes(movie.release_year?.toString());
            const hasSpecificRating = reasoning.includes(movie.vote_average?.toString());
            
            // Check for generic phrases (should be avoided)
            const hasGenericPhrases = [
                'engaging storyline',
                'compelling characters', 
                'well-crafted film',
                'creates exactly the',
                'perfect blend'
            ].some(phrase => reasoning.toLowerCase().includes(phrase.toLowerCase()));
            
            console.log(`\n${index + 1}. ${movie.title} (${movie.release_year})`);
            console.log(`   Rating: ${movie.vote_average}/10`);
            console.log(`   💡 Reasoning: "${reasoning}"`);
            console.log(`   📊 Specificity Analysis:`);
            console.log(`      ${hasMovieTitle ? '✅' : '⚪'} Contains movie title`);
            console.log(`      ${hasSpecificYear ? '✅' : '⚪'} References release year`);
            console.log(`      ${hasSpecificRating ? '✅' : '⚪'} Mentions rating`);
            console.log(`      ${hasGenericPhrases ? '⚠️' : '✅'} ${hasGenericPhrases ? 'Contains generic phrases' : 'Avoids generic language'}`);
        });
        
        // Overall assessment
        const allUnique = uniqueReasonings.size === response.data.length;
        const mostlySpecific = response.data.filter(movie => 
            movie.reasoning.includes(movie.title) || 
            movie.reasoning.includes(movie.release_year?.toString())
        ).length >= 3;
        
        console.log('\n🎯 FINAL ASSESSMENT:');
        console.log(`   ${allUnique ? '✅' : '❌'} Reasoning Uniqueness: ${allUnique ? 'Perfect!' : 'Needs improvement'}`);
        console.log(`   ${mostlySpecific ? '✅' : '❌'} Specificity Level: ${mostlySpecific ? 'Good!' : 'Generic'}`);
        
        console.log('\n📈 Final Improvements Summary:');
        console.log('   🎯 3-step analysis process for AI');
        console.log('   🔍 Individual movie analysis required');
        console.log('   🚫 Anti-repetition rules enforced');
        console.log('   💡 Specific plot/character details mandated');
        console.log('   🎨 Maximum creativity temperature (0.95)');
        console.log('   📝 Diverse fallback reasoning templates');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testUniqueReasoning();
