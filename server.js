// PopChoice Backend Server
// Node.js Express server with TMDB and OpenAI integration

// Only load dotenv in development (Render provides env vars directly)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client with error handling
let openai;
try {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} catch (error) {
    console.error('Failed to initialize OpenAI client:', error.message);
    process.exit(1);
}

// Rate limiting configuration to protect API keys from abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for health checks
    skip: (req, res) => req.path === '/api/health'
});

// Application Configuration
const RECOMMENDATION_COUNT = 6; // Number of movie recommendations to return

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://*.onrender.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

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
        console.log('🎬 Received recommendation request:', JSON.stringify(req.body, null, 2));
        
        const userSelections = req.body;
        
        // Step 1: Get candidate movies from TMDB
        const candidateMovies = await getCandidateMoviesFromTMDB(userSelections);
        
        if (candidateMovies.length === 0) {
            console.log('⚠️ No candidate movies found from TMDB');
            return res.json([]);
        }
        
        console.log(`✅ Found ${candidateMovies.length} candidate movies from TMDB`);
        
        // Step 2: Use OpenAI to intelligently filter and rank movies
        const recommendations = await getOpenAIRecommendations(candidateMovies, userSelections);
        
        console.log(`🎯 Returning ${recommendations.length} recommendations`);
        console.log('Sample reasoning:', recommendations[0]?.reasoning);
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
    // Build enhanced user context description (outside try block for scope)
    const contextParts = [];
    if (userSelections.context) contextParts.push(`viewing context: '${userSelections.context}'`);
    if (userSelections.mood) contextParts.push(`desired mood: '${userSelections.mood}'`);
    if (userSelections.era) contextParts.push(`preferred era: '${userSelections.era}'`);
    if (userSelections.themes && userSelections.themes.length > 0) {
        contextParts.push(`themes they enjoy: ${userSelections.themes.join(', ')}`);
    }
    
    const userContext = contextParts.join(', ');
    
    try {
        // Create movie candidates in JSON format for OpenAI
        const movieCandidates = candidateMovies.map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.release_year,
            overview: movie.overview || 'No description available',
            rating: movie.vote_average
        }));
        
        // Create the enhanced OpenAI prompt for unique, specific reasoning

        const prompt = `You are a brilliant and highly specific movie analyst. Your mission is to provide ${RECOMMENDATION_COUNT} completely unique and tailored recommendations for a user.

**User's Request:** ${userContext}

**Movie Candidates (JSON):**
${JSON.stringify(movieCandidates.map(m => ({ id: m.id, title: m.title, overview: m.overview })), null, 2)}

**YOUR TASK - A 3-STEP PROCESS:**

**Step 1: ANALYSIS (For EACH movie individually)**
For every single movie in the candidate list, you must perform a separate analysis. Ask yourself: "How does THIS SPECIFIC movie's plot, main characters, or unique tone connect to the user's desire for a '${userSelections.mood}' mood during their '${userSelections.context}'?"

**Step 2: SELECTION & REASONING (For EACH of the top ${RECOMMENDATION_COUNT})**
From your individual analyses, select the top ${RECOMMENDATION_COUNT} movies. Then, for EACH of the ${RECOMMENDATION_COUNT} selected movies, you MUST write a completely distinct and specific one-sentence reasoning. This reasoning must be unique to that movie and reference its specific elements.

**Step 3: FINAL OUTPUT (Strict JSON format)**
Combine your ${RECOMMENDATION_COUNT} unique reasonings into a single JSON array.

**CRITICAL RULES TO PREVENT REPETITION:**
• **NEVER** use the same reasoning sentence, or even a very similar sentence structure, for more than one movie.
• **Each reasoning MUST mention a specific detail from that movie's plot or character.** For example, instead of "its engaging storyline," say "the dynamic between the two rival magicians."
• **DO NOT** simply list the user's criteria. You must interpret and explain.

**You MUST respond with ONLY a valid JSON array of objects. No other text.**

**Example of the DIVERSE and SPECIFIC output I expect:**
[
  {
    "id": 787699,
    "reasoning": "The breathtaking race sequences and Sonic's unshakeable optimism deliver the high-energy 'fun' you're looking for, making it an exhilarating watch."
  },
  {
    "id": 940551,
    "reasoning": "This film's story of an unlikely friendship between a girl and her quirky alien 'dog' provides a heartwarming and humorous experience, perfect for a light-hearted evening."
  },
  {
    "id": 1011985,
    "reasoning": "The clever blend of monster-hunting action with the vibrant world of K-pop creates a uniquely fun and visually spectacular adventure."
  }
]`;

        console.log('Sending enhanced prompt to OpenAI...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a brilliant movie analyst specializing in unique, specific recommendations. Each movie you analyze must receive a completely different reasoning that mentions specific plot elements, characters, or unique aspects of that particular film. NEVER repeat reasoning patterns or use generic descriptions. Always respond with ONLY valid JSON arrays."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000, // Increased for more detailed unique reasoning
            temperature: 0.95 // Maximum creativity to ensure unique responses
        });
        
        const responseText = completion.choices[0].message.content.trim();
        console.log('Raw OpenAI response:', responseText);
        
        // Clean the response to ensure it's valid JSON
        let cleanedResponse = responseText;
        
        // Remove any markdown code block formatting if present
        // Remove any markdown code block formatting (e.g., ```json or ```)
        cleanedResponse = cleanedResponse.replace(/```(?:\w+)?\n?|```$/g, '');
        
        // Parse OpenAI response with robust Map-based processing
        let aiRecommendations;
        try {
            // 1. Parse the AI's response string into a JavaScript object
            aiRecommendations = JSON.parse(cleanedResponse);
            console.log('Successfully parsed AI recommendations:', aiRecommendations);
            
            // Validate that we have an array
            if (!Array.isArray(aiRecommendations)) {
                console.error('OpenAI response is not an array:', aiRecommendations);
                throw new Error('Invalid AI response format - expected array');
            }
            
            // 2. Create a Map for efficient lookup: { movieId => reasoning }
            const reasoningMap = new Map(
                aiRecommendations
                    .filter(rec => rec.id && rec.reasoning) // Only include valid entries
                    .map(rec => [rec.id, rec.reasoning])
            );
            
            console.log(`Created reasoning map with ${reasoningMap.size} entries`);
            
            // 3. Filter the original candidates and attach the new reasoning
            const finalRecommendations = candidateMovies
                .filter(movie => reasoningMap.has(movie.id)) // Keep only movies recommended by AI
                .map(movie => ({
                    ...movie,
                    // Get the specific reasoning from the map
                    reasoning: reasoningMap.get(movie.id),
                    imdb_rating: movie.vote_average
                }))
                .slice(0, RECOMMENDATION_COUNT); // Ensure we only send the specified number of results
            
            console.log(`Successfully generated ${finalRecommendations.length} final recommendations with AI reasoning`);
            return finalRecommendations;
            
        } catch (parseError) {
            console.error('Error parsing OpenAI response or mapping reasoning:', parseError);
            console.error('Response text was:', responseText);
            
            // If parsing fails, use the enhanced fallback logic
            return generateFallbackRecommendations(candidateMovies, userSelections);
        }
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        
        // Use the helper function for consistent fallback behavior
        return generateFallbackRecommendations(candidateMovies, userSelections);
    }
}

/**
 * Generate fallback recommendations when OpenAI is unavailable
 * @param {Array} candidateMovies - Movies from TMDB
 * @param {Object} userSelections - User's selections for personalized fallback
 * @returns {Array} Fallback recommendations with unique narrative reasoning
 */
function generateFallbackRecommendations(candidateMovies, userSelections) {
    const context = userSelections.context || 'viewing';
    const mood = userSelections.mood || 'entertaining';
    
    // Create diverse narrative reasons with specific movie details
    const createUniqueReason = (movie, index) => {
        const templates = [
            `This ${movie.release_year} film's compelling narrative and exceptional ${movie.vote_average}/10 rating make it an ideal choice for creating the ${mood} atmosphere you're seeking during your ${context}.`,
            `With its captivating storyline and stellar performances, "${movie.title}" delivers exactly the ${mood} experience that will make your ${context} truly memorable.`,
            `The film's unique blend of storytelling and cinematic artistry perfectly captures the ${mood} mood you're looking for, making it a standout choice for your ${context}.`,
            `"${movie.title}" offers an immersive cinematic journey that creates the perfect ${mood} ambiance for an unforgettable ${context} experience.`,
            `This highly-rated production combines exceptional filmmaking with an engaging plot that will deliver the ${mood} entertainment you're craving for your ${context}.`
        ];
        
        // Use different template for each movie to ensure uniqueness
        return templates[index % templates.length];
    };
        
    return [...candidateMovies]
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, RECOMMENDATION_COUNT)
        .map((movie, index) => ({
            ...movie,
            reasoning: createUniqueReason(movie, index),
            imdb_rating: movie.vote_average
        }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        apis: {
            tmdb: !!process.env.TMDB_API_KEY,
            openai: !!process.env.OPENAI_API_KEY
        }
    };
    res.json(healthCheck);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server with graceful shutdown handling
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 PopChoice server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🔧 Environment variables status:');
    console.log(`   - TMDB API Key: ${process.env.TMDB_API_KEY ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - TMDB Bearer Token: ${process.env.TMDB_BEARER_TOKEN ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});
