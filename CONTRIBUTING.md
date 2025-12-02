# Contributing to PopChoice

Thank you for your interest in contributing to PopChoice! This document provides guidelines for development and contribution.

## Development Setup

### Prerequisites
- Node.js v18.x or higher
- npm v9.x or higher
- TMDB API key ([Get one here](https://www.themoviedb.org/settings/api))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kutmur/PopChoice.git
   cd PopChoice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_key_here
   TMDB_API_KEY=your_tmdb_key_here
   TMDB_BEARER_TOKEN=your_tmdb_bearer_token_here
   PORT=3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   This uses `nodemon` for auto-reloading during development.

5. **Open the application**
   Navigate to `http://localhost:3000` in your browser

## Project Structure

```
PopChoice/
├── server.js              # Express server (main entry point)
├── index.html             # Frontend HTML (served by Express)
├── package.json           # Project dependencies and scripts
├── public/                # Static frontend assets
│   ├── css/style.css      # All application styles
│   └── js/main.js         # Frontend JavaScript logic
├── tests/                 # Test scripts (run manually)
│   ├── test-api.js        # API endpoint tests
│   ├── test-final.js      # Final reasoning tests
│   ├── test-map-logic.js  # Map-based logic tests
│   ├── test-mock-ai.js    # Mock AI response tests
│   ├── test-narrative.js  # Narrative reasoning tests
│   └── test-reasoning.js  # Reasoning logic tests
├── docs/                  # Documentation and demos
│   ├── demo-narrative.js  # Narrative demonstration
│   └── final-summary.js   # Project summary
├── screenshots/           # Application screenshots for README
└── render.yaml            # Render.com deployment config
```

## Development Workflow

### Running the Application

- **Production mode**: `npm start`
- **Development mode** (with auto-reload): `npm run dev`
- **Build**: `npm run build` (currently a no-op for this project)

### Running Tests

Tests are located in the `/tests` directory and must be run individually. **Important**: Ensure the server is running before executing tests.

```bash
# Start the server in one terminal
npm start

# Run tests in another terminal
npm run test:api          # Test API endpoints
npm run test:final        # Test unique reasoning
npm run test:map          # Test Map-based logic
npm run test:narrative    # Test narrative reasoning
npm run test:reasoning    # Quick reasoning tests
npm run test:mock         # Test with mock AI responses
```

Alternatively, run tests directly:
```bash
node tests/test-api.js
```

### Code Style Guidelines

1. **JavaScript**
   - Use ES6+ features (async/await, arrow functions, etc.)
   - Use meaningful variable and function names
   - Add comments for complex logic
   - Follow the existing code style

2. **HTML/CSS**
   - Use semantic HTML elements
   - Follow BEM naming convention for CSS classes where applicable
   - Maintain glass-morphism design consistency
   - Ensure responsive design for all screen sizes

3. **File Organization**
   - Backend code: `server.js`
   - Frontend HTML: `index.html`
   - Frontend JavaScript: `public/js/main.js`
   - Styles: `public/css/style.css`
   - Tests: `tests/` directory
   - Documentation: `docs/` directory

## Making Changes

### Before You Start

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make sure the application runs successfully:
   ```bash
   npm install
   npm start
   ```

### During Development

1. **Write clean, documented code**
   - Add comments explaining complex logic
   - Use descriptive variable names
   - Keep functions focused and modular

2. **Test your changes**
   - Manually test the UI in the browser
   - Run relevant test scripts
   - Verify no console errors

3. **Maintain backward compatibility**
   - Don't break existing API endpoints
   - Don't remove functionality without discussion
   - Update documentation if you change behavior

### Submitting Changes

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

2. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all tests pass

## Areas for Contribution

### Features
- User accounts and saved preferences
- Movie trailer integration
- Social sharing features
- Advanced filtering options
- Recommendation history
- Mobile app version

### Improvements
- Additional test coverage
- Performance optimizations
- Accessibility enhancements
- Error handling improvements
- UI/UX refinements

### Documentation
- Code comments
- API documentation
- User guides
- Tutorial videos

## Code Review Process

All submissions require review before merging:
1. At least one maintainer must approve
2. All tests must pass
3. Code must follow style guidelines
4. Documentation must be updated if needed

## Getting Help

- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Questions**: Use GitHub Discussions for general questions
- **Security**: Report security issues privately to maintainers

## License

By contributing to PopChoice, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PopChoice!** 🎬🍿
