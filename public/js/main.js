// PopChoice MVP - Main Application Logic
// ES6 Classes implementation for front-end only movie recommendation app

/**
 * UIManager Class - Handles all DOM manipulations and UI updates
 */
class UIManager {
    constructor() {
        // Cache all important DOM elements
        this.elements = {
            // Main views
            welcome: document.getElementById('welcome'),
            questionnaire: document.getElementById('questionnaire'),
            loadingSpinner: document.getElementById('loading-spinner'),
            resultsScreen: document.getElementById('results-screen'),
            
            // Buttons
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            finishBtn: document.getElementById('finish-btn'),
            
            // Progress
            progressFill: document.querySelector('.progress-fill'),
            progressText: document.querySelector('.progress-text'),
            
            // Results
            resultsContainer: document.getElementById('results-container'),
            
            // Modal
            modal: document.getElementById('movie-detail-modal'),
            modalPoster: document.getElementById('modal-poster'),
            modalTitle: document.getElementById('modal-title'),
            modalYear: document.getElementById('modal-year'),
            modalRating: document.getElementById('modal-rating'),
            modalGenres: document.getElementById('modal-genres'),
            modalPlot: document.getElementById('modal-plot'),
            modalCast: document.getElementById('modal-cast'),
            closeModal: document.querySelector('.close-modal')
        };
        
        // Cache all question cards and navigation buttons
        this.questionCards = [];
        this.nextButtons = [];
        this.prevButtons = [];
        
        for (let i = 1; i <= 7; i++) {
            this.questionCards.push(document.getElementById(`question-${i}`));
            this.nextButtons.push(document.getElementById(`next-btn-${i}`));
            if (i > 1) {
                this.prevButtons.push(document.getElementById(`prev-btn-${i}`));
            }
        }
        
        this.setupModalEvents();
    }
    
    /**
     * Show a specific view and hide all others
     * @param {string} viewId - The ID of the view to show
     */
    showView(viewId) {
        // Hide all main views first
        this.elements.welcome.style.display = 'none';
        this.elements.questionnaire.style.display = 'none';
        this.elements.loadingSpinner.style.display = 'none';
        this.elements.resultsScreen.style.display = 'none';
        
        // Hide all question cards
        this.questionCards.forEach(card => {
            if (card) card.style.display = 'none';
        });
        
        // Show the requested view
        const targetElement = document.getElementById(viewId);
        if (targetElement) {
            targetElement.style.display = 'flex';
            
            // If showing questionnaire, also show the first question
            if (viewId === 'questionnaire') {
                this.showQuestionCard(1);
            }
        }
    }
    
    /**
     * Show a specific question card
     * @param {number} questionNumber - The question number to show (1-7)
     */
    showQuestionCard(questionNumber) {
        // Hide all question cards
        this.questionCards.forEach(card => {
            if (card) card.style.display = 'none';
        });
        
        // Show the specific question card
        const questionCard = this.questionCards[questionNumber - 1];
        if (questionCard) {
            questionCard.style.display = 'block';
        }
    }
    
    /**
     * Update the progress bar
     * @param {number} step - Current step (1-7)
     * @param {number} totalSteps - Total number of steps (7)
     */
    updateProgress(step, totalSteps) {
        const percentage = (step / totalSteps) * 100;
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `Step ${step} of ${totalSteps}`;
    }
    
    /**
     * Enable or disable a next button
     * @param {number} questionNumber - Question number (1-7)
     * @param {boolean} enabled - Whether to enable the button
     */
    setNextButtonState(questionNumber, enabled) {
        const button = questionNumber === 7 ? 
            this.elements.finishBtn : 
            this.nextButtons[questionNumber - 1];
        
        if (button) {
            button.disabled = !enabled;
        }
    }
    
    /**
     * Toggle selection state of an option card
     * @param {HTMLElement} card - The option card element
     * @param {boolean} isMultiSelect - Whether this question allows multiple selections
     */
    toggleCardSelection(card, isMultiSelect = false) {
        if (!isMultiSelect) {
            // For single select, remove selection from all cards in the same question
            const allCards = card.parentElement.querySelectorAll('.option-card');
            allCards.forEach(c => c.classList.remove('selected'));
        }
        
        // Toggle the clicked card
        card.classList.toggle('selected');
    }
    
    /**
     * Get selected values for a question
     * @param {number} questionNumber - Question number (1-7)
     * @returns {Array<string>} Array of selected values
     */
    getSelectedValues(questionNumber) {
        const questionCard = this.questionCards[questionNumber - 1];
        if (!questionCard) return [];
        
        const selectedCards = questionCard.querySelectorAll('.option-card.selected');
        return Array.from(selectedCards).map(card => card.dataset.value);
    }
    
    /**
     * Render movie results on the results screen
     * @param {Array<Object>} movies - Array of movie objects to display
     */
    renderResults(movies) {
        this.elements.resultsContainer.innerHTML = '';
        
        if (movies.length === 0) {
            this.elements.resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No movies found matching your preferences</h3>
                    <p>Try adjusting your selections for more results</p>
                </div>
            `;
            return;
        }
        
        movies.forEach(movie => {
            const movieCard = this.createMovieCard(movie);
            this.elements.resultsContainer.appendChild(movieCard);
        });
    }
    
    /**
     * Create a movie card element
     * @param {Object} movie - Movie object
     * @returns {HTMLElement} Movie card element
     */
    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.movieId = movie.id;
        
        // Create genre tags
        const genreTags = movie.genres && movie.genres.length > 0 ? 
            movie.genres.map(genre => 
                `<span class="genre-tag">${genre.charAt(0).toUpperCase() + genre.slice(1)}</span>`
            ).join('') : '';
        
        // Create reasoning section if available
        const reasoningSection = movie.reasoning ? 
            `<div class="movie-reasoning">
                <strong>Why this recommendation:</strong>
                <p>${movie.reasoning}</p>
            </div>` : '';
        
        card.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.poster_path}" alt="${movie.title}" loading="lazy">
            </div>
            <div class="movie-details">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.release_year || 'N/A'}</span>
                    <span class="movie-rating">⭐ ${movie.imdb_rating ? movie.imdb_rating.toFixed(1) : 'N/A'}</span>
                </div>
                <div class="movie-genres">${genreTags}</div>
                <p class="movie-plot">${movie.plot || movie.overview || 'No description available'}</p>
                ${reasoningSection}
            </div>
        `;
        
        // Add click event to show movie details
        card.addEventListener('click', () => this.showMovieDetails(movie));
        
        return card;
    }
    
    /**
     * Show movie details in a modal
     * @param {Object} movie - Movie object to display
     */
    showMovieDetails(movie) {
        // Populate modal with movie data
        this.elements.modalPoster.src = movie.poster_path;
        this.elements.modalPoster.alt = movie.title;
        this.elements.modalTitle.textContent = movie.title;
        this.elements.modalYear.textContent = movie.release_year || 'N/A';
        this.elements.modalRating.textContent = `⭐ ${movie.imdb_rating ? movie.imdb_rating.toFixed(1) : 'N/A'}`;
        this.elements.modalPlot.textContent = movie.plot || movie.overview || 'No description available';
        this.elements.modalCast.textContent = movie.cast && movie.cast.length > 0 ? 
            movie.cast.join(', ') : 'Cast information not available';
        
        // Create genre tags
        const genreTags = movie.genres && movie.genres.length > 0 ? 
            movie.genres.map(genre => 
                `<span class="genre-tag">${genre.charAt(0).toUpperCase() + genre.slice(1)}</span>`
            ).join('') : '<span class="genre-tag">No genres available</span>';
        this.elements.modalGenres.innerHTML = genreTags;
        
        // Show modal
        this.elements.modal.style.display = 'block';
    }
    
    /**
     * Hide the movie details modal
     */
    hideMovieDetails() {
        this.elements.modal.style.display = 'none';
    }
    
    /**
     * Setup modal event listeners
     */
    setupModalEvents() {
        // Close modal when clicking the X
        this.elements.closeModal.addEventListener('click', () => this.hideMovieDetails());
        
        // Close modal when clicking outside the modal content
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.hideMovieDetails();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal.style.display === 'block') {
                this.hideMovieDetails();
            }
        });
    }
    
    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.elements.resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Something went wrong</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="primary-btn">Try Again</button>
            </div>
        `;
        this.showView('results-screen');
    }
}

/**
 * PopChoiceApp Class - Main application controller
 */
class PopChoiceApp {
    constructor() {
        this.ui = new UIManager();
        this.state = {
            currentStep: 1,
            totalSteps: 7,
            userSelections: {
                genres: [],
                era: null,
                mood: null,
                runtime: null,
                context: null,
                rating: null,
                themes: []
            }
        };
        
        this.setupEventListeners();
        this.initializeApp();
    }
    
    /**
     * Initialize the application
     */
    initializeApp() {
        // Ensure welcome screen is visible initially
        this.ui.showView('welcome');
        console.log('PopChoice App initialized successfully!');
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Start button
        this.ui.elements.startBtn.addEventListener('click', () => this.startQuestionnaire());
        
        // Restart button
        this.ui.elements.restartBtn.addEventListener('click', () => this.restartApp());
        
        // Finish button
        this.ui.elements.finishBtn.addEventListener('click', () => this.finishQuestionnaire());
        
        // Next buttons for each question
        this.ui.nextButtons.forEach((button, index) => {
            if (button) {
                button.addEventListener('click', () => this.nextQuestion(index + 1));
            }
        });
        
        // Previous buttons for each question
        this.ui.prevButtons.forEach((button, index) => {
            if (button) {
                button.addEventListener('click', () => this.previousQuestion(index + 2));
            }
        });
        
        // Option card selections
        this.setupOptionCardListeners();
    }
    
    /**
     * Setup event listeners for option cards
     */
    setupOptionCardListeners() {
        // Question 1: Genres (multi-select)
        this.setupQuestionListeners(1, 'genres', true);
        
        // Question 2: Era (single-select)
        this.setupQuestionListeners(2, 'era', false);
        
        // Question 3: Mood (single-select)
        this.setupQuestionListeners(3, 'mood', false);
        
        // Question 4: Runtime (single-select)
        this.setupQuestionListeners(4, 'runtime', false);
        
        // Question 5: Context (single-select)
        this.setupQuestionListeners(5, 'context', false);
        
        // Question 6: Rating (single-select)
        this.setupQuestionListeners(6, 'rating', false);
        
        // Question 7: Themes (multi-select)
        this.setupQuestionListeners(7, 'themes', true);
    }
    
    /**
     * Setup listeners for a specific question
     * @param {number} questionNumber - Question number (1-7)
     * @param {string} stateKey - Key in the state object
     * @param {boolean} isMultiSelect - Whether multiple selections are allowed
     */
    setupQuestionListeners(questionNumber, stateKey, isMultiSelect) {
        const questionCard = this.ui.questionCards[questionNumber - 1];
        if (!questionCard) return;
        
        const optionCards = questionCard.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.addEventListener('click', () => {
                this.ui.toggleCardSelection(card, isMultiSelect);
                this.updateSelectionState(questionNumber, stateKey, isMultiSelect);
            });
        });
    }
    
    /**
     * Update the selection state for a question
     * @param {number} questionNumber - Question number (1-7)
     * @param {string} stateKey - Key in the state object
     * @param {boolean} isMultiSelect - Whether multiple selections are allowed
     */
    updateSelectionState(questionNumber, stateKey, isMultiSelect) {
        const selectedValues = this.ui.getSelectedValues(questionNumber);
        
        if (isMultiSelect) {
            this.state.userSelections[stateKey] = selectedValues;
        } else {
            this.state.userSelections[stateKey] = selectedValues[0] || null;
        }
        
        // Enable/disable next button based on selection
        const hasSelection = isMultiSelect ? selectedValues.length > 0 : selectedValues.length === 1;
        this.ui.setNextButtonState(questionNumber, hasSelection);
        
        console.log(`Updated ${stateKey}:`, this.state.userSelections[stateKey]);
    }
    
    /**
     * Start the questionnaire
     */
    startQuestionnaire() {
        this.state.currentStep = 1;
        this.ui.showView('questionnaire');
        this.ui.updateProgress(this.state.currentStep, this.state.totalSteps);
        console.log('Questionnaire started');
    }
    
    /**
     * Go to the next question
     * @param {number} currentQuestion - Current question number
     */
    nextQuestion(currentQuestion) {
        if (currentQuestion < this.state.totalSteps) {
            this.state.currentStep = currentQuestion + 1;
            this.ui.showQuestionCard(this.state.currentStep);
            this.ui.updateProgress(this.state.currentStep, this.state.totalSteps);
            console.log(`Moved to question ${this.state.currentStep}`);
        }
    }
    
    /**
     * Go to the previous question
     * @param {number} currentQuestion - Current question number
     */
    previousQuestion(currentQuestion) {
        if (currentQuestion > 1) {
            this.state.currentStep = currentQuestion - 1;
            this.ui.showQuestionCard(this.state.currentStep);
            this.ui.updateProgress(this.state.currentStep, this.state.totalSteps);
            console.log(`Moved to question ${this.state.currentStep}`);
        }
    }
    
    /**
     * Finish the questionnaire and show recommendations
     */
    async finishQuestionnaire() {
        console.log('Final user selections:', this.state.userSelections);
        
        // Show loading screen
        this.ui.showView('loading-spinner');
        
        try {
            // Get recommendations from the backend API
            const recommendations = await this.getRecommendationsFromAPI();
            this.ui.renderResults(recommendations);
            this.ui.showView('results-screen');
            console.log('Recommendations received:', recommendations);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            // Show error message to user
            this.ui.showError('Failed to get recommendations. Please try again.');
        }
    }
    
    /**
     * Get movie recommendations from the backend API
     * @returns {Promise<Array<Object>>} Array of recommended movies
     */
    async getRecommendationsFromAPI() {
        try {
            const response = await fetch('http://localhost:3000/api/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.state.userSelections)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const recommendations = await response.json();
            
            // Transform API response to match expected format
            return recommendations.map(movie => ({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                release_year: movie.release_year,
                imdb_rating: movie.imdb_rating || movie.vote_average,
                plot: movie.overview,
                reasoning: movie.reasoning,
                genres: this.getGenreNamesFromIds(movie.genre_ids) || [],
                cast: movie.cast || [] // TMDB doesn't return cast in discovery, but we'll keep the structure
            }));
            
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    /**
     * Get genre names from TMDB genre IDs
     * @param {Array<number>} genreIds - Array of TMDB genre IDs
     * @returns {Array<string>} Array of genre names
     */
    getGenreNamesFromIds(genreIds) {
        const genreMap = {
            28: 'action',
            12: 'adventure', 
            16: 'animation',
            35: 'comedy',
            80: 'crime',
            99: 'documentary',
            18: 'drama',
            10751: 'family',
            14: 'fantasy',
            36: 'history',
            27: 'horror',
            10402: 'music',
            9648: 'mystery',
            10749: 'romance',
            878: 'sci-fi',
            10770: 'tv-movie',
            53: 'thriller',
            10752: 'war',
            37: 'western'
        };
        
        if (!genreIds || !Array.isArray(genreIds)) {
            return [];
        }
        
        return genreIds.map(id => genreMap[id]).filter(genre => genre);
    }
    
    /**
     * Restart the application
     */
    restartApp() {
        // Reset state
        this.state = {
            currentStep: 1,
            totalSteps: 7,
            userSelections: {
                genres: [],
                era: null,
                mood: null,
                runtime: null,
                context: null,
                rating: null,
                themes: []
            }
        };
        
        // Clear all selections
        document.querySelectorAll('.option-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Disable all next buttons
        for (let i = 1; i <= 7; i++) {
            this.ui.setNextButtonState(i, false);
        }
        
        // Reset progress
        this.ui.updateProgress(1, 7);
        
        // Show welcome screen
        this.ui.showView('welcome');
        
        console.log('App restarted');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PopChoice App...');
    
    // Initialize the main application
    new PopChoiceApp();
});
