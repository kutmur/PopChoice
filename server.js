// PopChoice Backend Server
// Node.js Express server with TMDB and OpenAI integration

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Genre mapping for TMDB API
const GENRE_MAPPING = {
    'action': 28,
    'adventure': 12,
    'comedy': 35,
    'drama': 18,
    'horror': 27,
    'romance': 10749,
    'sci-fi': 878,
    'thriller': 53,
    'mystery': 9648,
    'fantasy': 14,
    'crime': 80,
    'family': 10751,
    'animation': 16,
    'documentary': 99,
    'history': 36,
    'music': 10402,
    'war': 10752,
    'western': 37
};

/**
 * Main recommendation endpoint
 * Combines TMDB discovery with OpenAI intelligent filtering
 */
app.post('/api/recommendations', async (req, res) => {
    try {
        console.log('Received recommendation request:', req.body);
        
        const userSelections = req.body;
        
        // Step 1: Get candidate movies from TMDB
        const candidateMovies = await getCandidateMoviesFromTMDB(userSelections);
        
        if (candidateMovies.length === 0) {
            return res.json([]);
        }
        
        // Step 2: Use OpenAI to intelligently filter and rank movies
        const recommendations = await getOpenAIRecommendations(candidateMovies, userSelections);
        
        console.log(`Returning ${recommendations.length} recommendations`);
        res.json(recommendations);
        
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ 
            error: 'Failed to generate recommendations',
            message: error.message 
        });
    }
});

/**
 * Get candidate movies from TMDB based on user selections
 */
async function getCandidateMoviesFromTMDB(userSelections) {
    try {
        // Build TMDB discover query parameters
        const params = {
            api_key: process.env.TMDB_API_KEY,
            sort_by: 'popularity.desc',
            page: 1,
            'vote_count.gte': 100, // Ensure movies have enough votes
            include_adult: false,
            include_video: false
        };
        
        // Add genre filtering if genres are selected
        if (userSelections.genres && userSelections.genres.length > 0) {
            const genreIds = userSelections.genres
                .map(genre => GENRE_MAPPING[genre.toLowerCase()])
                .filter(id => id)
                .join(',');
            
            if (genreIds) {
                params.with_genres = genreIds;
            }
        }
        
        // Add era filtering (release year)
        if (userSelections.era && userSelections.era !== 'any') {
            switch (userSelections.era) {
                case 'classic':
                    params['primary_release_date.gte'] = '1970-01-01';
                    params['primary_release_date.lte'] = '1999-12-31';
                    break;
                case 'modern':
                    params['primary_release_date.gte'] = '2000-01-01';
                    params['primary_release_date.lte'] = '2014-12-31';
                    break;
                case 'recent':
                    params['primary_release_date.gte'] = '2015-01-01';
                    params['primary_release_date.lte'] = new Date().toISOString().split('T')[0];
                    break;
            }
        }
        
        // Add runtime filtering
        if (userSelections.runtime && userSelections.runtime !== 'any-length') {
            switch (userSelections.runtime) {
                case 'short':
                    params['with_runtime.lte'] = 120;
                    break;
                case 'long':
                    params['with_runtime.gte'] = 120;
                    break;
            }
        }
        
        // Add rating filtering
        if (userSelections.rating && userSelections.rating !== 'any-rating') {
            switch (userSelections.rating) {
                case 'highly-rated':
                    params['vote_average.gte'] = 7.5;
                    break;
                case 'good-rated':
                    params['vote_average.gte'] = 6.0;
                    break;
            }
        }
        
        console.log('TMDB API params:', params);
        
        // Make request to TMDB
        const response = await axios.get('https://api.themoviedb.org/3/discover/movie', { params });
        
        console.log(`TMDB returned ${response.data.results.length} movies`);
        
        // Transform TMDB results to our format
        const movies = response.data.results.slice(0, 30).map(movie => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path ? 
                `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
                `https://placehold.co/400x600/666666/ffffff?text=${encodeURIComponent(movie.title)}`,
            overview: movie.overview,
            release_date: movie.release_date,
            release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            vote_average: movie.vote_average,
            genre_ids: movie.genre_ids,
            runtime: null // We'll need to fetch this separately if needed
        }));
        
        return movies;
        
    } catch (error) {
        console.error('TMDB API error:', error.response?.data || error.message);
        throw new Error('Failed to fetch movies from TMDB');
    }
}

/**
 * Use OpenAI to intelligently filter and rank movies based on mood and context
 */
async function getOpenAIRecommendations(candidateMovies, userSelections) {
    try {
        // Create a concise movie list for OpenAI
        const movieList = candidateMovies.map((movie, index) => 
            `${index + 1}. "${movie.title}" (${movie.release_year}) - ${movie.overview}`
        ).join('\n\n');
        
        // Build context description from user selections
        const contextParts = [];
        if (userSelections.mood) contextParts.push(`mood: ${userSelections.mood}`);
        if (userSelections.context) contextParts.push(`watching context: ${userSelections.context}`);
        if (userSelections.themes && userSelections.themes.length > 0) {
            contextParts.push(`preferred themes: ${userSelections.themes.join(', ')}`);
        }
        
        const userContext = contextParts.join(', ');
        
        // Create the OpenAI prompt
        const prompt = `You are a movie recommendation expert. I have a list of ${candidateMovies.length} movies that match the user's basic criteria (genre, era, rating). Now I need you to select the TOP 5 movies that best match their specific preferences: ${userContext}.

Here are the candidate movies:

${movieList}

Please select exactly 5 movies that best match the user's ${userContext}. For each selected movie, provide:
1. The movie number from the list
2. A brief reason (1-2 sentences) why this movie fits their preferences

Format your response as JSON:
{
  "recommendations": [
    {
      "movieNumber": 1,
      "reasoning": "Brief explanation of why this movie matches their preferences"
    }
  ]
}`;

        console.log('Sending prompt to OpenAI...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a movie recommendation expert. Always respond with valid JSON in the exact format requested."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });
        
        const responseText = completion.choices[0].message.content;
        console.log('OpenAI response:', responseText);
        
        // Parse OpenAI response
        let aiResponse;
        try {
            aiResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', parseError);
            // Fallback: return top 5 movies by rating
            return candidateMovies
                .sort((a, b) => b.vote_average - a.vote_average)
                .slice(0, 5)
                .map(movie => ({
                    ...movie,
                    reasoning: "Highly rated movie that matches your selected criteria."
                }));
        }
        
        // Map AI recommendations back to movie objects
        const recommendations = aiResponse.recommendations
            .filter(rec => rec.movieNumber >= 1 && rec.movieNumber <= candidateMovies.length)
            .map(rec => {
                const movie = candidateMovies[rec.movieNumber - 1];
                return {
                    ...movie,
                    reasoning: rec.reasoning,
                    imdb_rating: movie.vote_average // Use TMDB rating as IMDB rating approximation
                };
            })
            .slice(0, 5); // Ensure max 5 recommendations
        
        return recommendations;
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        // Fallback: return top-rated movies
        return candidateMovies
            .sort((a, b) => b.vote_average - a.vote_average)
            .slice(0, 5)
            .map(movie => ({
                ...movie,
                reasoning: "Highly rated movie that matches your selected criteria.",
                imdb_rating: movie.vote_average
            }));
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎬 PopChoice server running on http://localhost:${PORT}`);
    console.log('🔧 Environment variables loaded:');
    console.log(`   - TMDB API Key: ${process.env.TMDB_API_KEY ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing'}`);
});
