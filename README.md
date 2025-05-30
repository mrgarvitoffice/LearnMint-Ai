# LearnMint - AI Powered Learning

LearnMint is a Next.js application designed to be an AI-powered learning assistant. It focuses on generating study materials like notes, quizzes, and flashcards. It also includes a custom test creation feature, a scientific calculator with a unit converter, an interactive AI chatbot (Megumin), a Daily News Digest feature, and placeholders for future library and game features.

User accounts and server-side data persistence for test results have been removed to simplify the application for this version.

To get started, take a look at `src/app/page.tsx`.

## Features

*   **AI Content Generation**:
    *   Generate comprehensive study notes on any topic (with Markdown rendering and visual prompt placeholders linking to Google Images).
    *   Create quizzes with various question types based on a topic.
    *   Generate flashcards for quick review of key terms and definitions.
*   **Custom Test Creation**:
    *   Generate tests based on single topics, up to 3 recent topics, or user-provided notes.
    *   Selectable difficulty level and number of questions.
    *   Timer options for tests (UI only, full logic for enforcement is a future enhancement).
    *   Test scoring: +4 for correct, -1 for incorrect.
    *   Review answers after test completion.
*   **Scientific Calculator**:
    *   Standard scientific calculator functions.
    *   Unit converter for Length, Temperature, Weight/Mass, Volume, Area, and Speed.
    *   History of the last 3 calculations with options to reuse results or delete history items.
*   **Megumin AI Chatbot**:
    *   Interactive chatbot with a playful persona.
    *   Supports voice input and user image uploads (for the AI to acknowledge, not generate from).
    *   Can attempt to "sing" with text-based lyrics if requested.
*   **Daily News Digest**:
    *   Fetches and displays live news articles from Newsdata.io.
    *   Filterable by country, state/region (text input, enabled when a country is selected), city (text input, enabled when a country is selected), and general news categories (Top Headlines, Business, Technology, Sports, Science, Health).
*   **Interactive UI**:
    *   Responsive design for desktop and mobile.
    *   Theme toggle (Light/Dark mode).
    *   Click sound effects for key interactions.
    *   Text-to-Speech for reading generated notes (with Male/Female voice preference, using browser's capabilities).
    *   Voice input for topic generation and chatbot.
*   **Library (Placeholder & Samples)**:
    *   Displays a sample catalog of OpenStax textbooks with links to their website.
    *   Includes a "Math Fact of the Day" (uses a static fallback list if the live API fails).
    *   Includes a "Search Google Books" feature (Genkit flow for API search added; UI currently launches Google Books search results page).
    *   Includes a "Search YouTube" feature (Genkit flow for API search added; UI for search currently launches YouTube search results page).
    *   Lists other helpful resources.
*   **Game (LearnMint Arcade)**:
    *   **Word Game**: A "Definition Challenge" where users guess a term based on its definition, with hints and streak tracking.
    *   **Dino Runner (Coming Soon!)**: Placeholder for the classic infinite side-scrolling runner game.
    *   **Tetris (Coming Soon!)**: Placeholder for the classic block-stacking game.

## Tech Stack

*   Next.js (App Router)
*   React
*   TypeScript
*   Tailwind CSS
*   ShadCN UI Components
*   Genkit (for AI flows using Google Gemini models)
*   Lucide Icons
*   `@tanstack/react-query` (for fetching quotes, math facts, and news)
*   Newsdata.io (for live news - **requires user API key**)
*   YouTube Data API v3 (for video search - **requires user API key**)
*   Google Books API (for book search - **requires user API key**)
*   `date-fns` (for date formatting)
*   `next-themes` (for light/dark mode)

## Getting Started

### 1. Prerequisites
*   Node.js (LTS version recommended)
*   npm or yarn

### 2. CRITICAL: Set up Environment Variables

Create a file named `.env` in the root of your project. Add the following content. **It is strongly recommended to replace these example keys with your own personal API keys for full functionality and to avoid rate limits or suspension.**

```env
# For Genkit AI Features (Notes, Quizzes, Flashcards, Chatbot AI)
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
# Ensure the associated Google Cloud project has the "Generative Language API" enabled and billing configured.
GOOGLE_API_KEY=AIzaSyD0LVemqManYsFHV_k7c5mOsUVklcnvWCo

# For Daily News Digest Feature
# Get your free key from Newsdata.io: https://newsdata.io
NEWSDATA_API_KEY=pub_039b4b0247244a8e9f85a8f113e9d7f2

# For YouTube Search Integration (Genkit flow)
# Get your key from Google Cloud Console: https://console.cloud.google.com/apis/library/youtube.googleapis.com
YOUTUBE_API_KEY=AIzaSyBEnMGnZ_8vUA7SP8GzvOvPqFrsHyL-BJk

# For Google Books Search Integration (Genkit flow)
# Get your key from Google Cloud Console: https://console.cloud.google.com/apis/library/books.googleapis.com
GOOGLE_BOOKS_API_KEY=AIzaSyDCKxyoBNfq6mH3FcSeNq6DDgVBKihWhYw

# For future development with OpenRouter (currently unused by the application)
# Get your key from OpenRouter: https://openrouter.ai/keys
# OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE_EXAMPLE
```

*   You **MUST** use valid API keys for the respective services for associated features to work. The keys provided above are for example purposes.
*   `OPENROUTER_API_KEY` is noted but **not currently used** by the application.

### 3. Install Dependencies
```bash
npm install
# or
yarn install
```

### 4. CRITICAL: Add Required Static Assets
*   **PWA Icons**:
    *   Create a folder `public/icons`.
    *   Add `icon-192x192.png` (192x192 pixels) and `icon-512x512.png` (512x512 pixels) to this folder. These are referenced in `public/manifest.json`.
*   **Sound Effects**:
    *   Create a folder `public/sounds`.
    *   Add `ting.mp3` (or your preferred sound file, e.g., `pop.mp3`) to this folder. If you use a different filename, you may need to update paths in the components where sounds are played.

### 5. Run the Development Server
```bash
npm run dev -- --port 9002
# or
yarn dev --port 9002
```
The application will typically be available at `http://localhost:9002`.

### 6. Run Genkit Dev Server (Optional but Recommended for AI Flow Debugging)
In a separate terminal, run:
```bash
npm run genkit:dev
# or
npm run genkit:watch # for auto-reloading on changes
```
This starts the Genkit development UI, usually at `http://localhost:4000`, where you can inspect and test your AI flows.

## Pushing to GitHub (Optional but Recommended)

1.  **Create a New Repository on GitHub.com:**
    *   Go to [GitHub.com](https://github.com/) and create a new repository (e.g., `learnmint-app`). **Do NOT** initialize it with a README, .gitignore, or license if you're pushing an existing project (as this project has them).
2.  **Initialize Git Locally (if not already done):**
    *   Open a terminal in your project's root directory.
    *   Run `git init -b main`
3.  **Add and Commit Files:**
    ```bash
    git add .
    git commit -m "Initial commit of LearnMint project"
    ```
4.  **Connect to GitHub Repository:**
    *   Replace `YOUR_USERNAME` and `YOUR_REPOSITORY_NAME` in the command below with your details (from the GitHub repository page).
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
    ```
5.  **Push Your Code:**
    ```bash
    git push -u origin main
    ```

## Deployment to Firebase Hosting

This project is configured for deployment using Firebase Hosting with its `frameworksBackend` support for Next.js (which uses Firebase App Hosting capabilities).

**Prerequisites:**
*   Ensure you have `firebase-tools` installed globally: `npm install -g firebase-tools`.
*   Log in to Firebase: `firebase login`.
*   Your `.firebaserc` file should correctly specify your Firebase project ID (e.g., `learnmint`).

**Deployment Steps:**

1.  **CRITICAL: Set Environment Variables in `.env` for Build:**
    *   Before building, ensure your local `.env` file is populated with your **valid production** API keys (Google AI, Newsdata.io, YouTube, Google Books). Without these, the deployed app's features will not work.

2.  **CRITICAL: Add PWA Icons (Required for PWA):**
    *   Create a folder `public/icons`.
    *   Add `icon-192x192.png` and `icon-512x512.png` to this folder.

3.  **CRITICAL: Add Sound Effects (Required for functionality):**
    *   Create a folder `public/sounds`.
    *   Add `ting.mp3` (or your preferred sound files, updating paths in components if you use different filenames) to this folder.

4.  **Build your Next.js application for production:**
    ```bash
    npm run build
    ```

5.  **Deploy to Firebase:**
    ```bash
    firebase deploy
    ```
    *(Alternatively, `firebase deploy --only hosting` can also be used, though for Next.js `frameworksBackend`, `firebase deploy` is typically sufficient).*

6.  After deployment, the Firebase CLI will provide you with the **Hosting URL** (e.g., `https://your-project-id.web.app`) where your application is live.

7.  **CRITICAL: Environment Variables for Deployed App (App Hosting)**:
    When Firebase builds your Next.js app for App Hosting, it **does not automatically use your local `.env` file for the running backend functions.** You need to set up environment variables for your deployed application in the Google Cloud Console.
    *   Go to your Firebase project in the Google Cloud Console: `https://console.cloud.google.com/run?project=YOUR_PROJECT_ID` (replace `YOUR_PROJECT_ID` with your Firebase project ID, e.g., `learnmint`).
    *   Find your App Hosting service (it might be named `firebase-PROJECT_ID-REGION` or similar, often like `apphosting-PROJECT_ID-REGION`).
    *   Edit the service configuration (usually "Edit & Deploy New Revision" or similar).
    *   Navigate to the "Variables & Secrets" or "Environment Variables" section.
    *   Add `GOOGLE_API_KEY`, `NEWSDATA_API_KEY`, `YOUTUBE_API_KEY`, and `GOOGLE_BOOKS_API_KEY` with their production values.
    *   Deploy the new revision with these environment variables.
    *   This step is crucial for Genkit AI features and other API-dependent features to work in the deployed environment.

## Customization

*   **Styling**: Modify `src/app/globals.css` and Tailwind configuration in `tailwind.config.ts`. ShadCN components can be customized as per their documentation.
*   **AI Prompts**: Adjust the prompts in `src/ai/flows/` to change the style, content, or structure of the generated materials.
*   **Sound Effects**: To use different sounds, replace `/public/sounds/ting.mp3` with your desired audio files and update the paths in the relevant components.

## Future Enhancements (Potential Ideas)

*   **Advanced PWA Features**: Implement a service worker for offline caching of assets and basic content.
*   **Full Library Content Integration**: Fully integrate YouTube video search & embedding, and Google Books search & display using the newly added Genkit flows.
*   **Multilingual Support**:
    *   UI Internationalization: Add support for multiple languages in the application's interface using libraries like `next-intl` or `react-i18next`.
    *   AI Content Localization: Update Genkit prompts to accept a target language and generate notes, quizzes, and flashcards in different languages.
*   **Educational Games (Tetris, Dino Runner)**: Develop the planned "LearnMint Arcade" Tetris and Dino Runner games.
*   **User Accounts & Progress Tracking (Requires Backend)**:
    *   Integrate a full authentication system (e.g., Firebase Authentication with more providers, or other auth services).
    *   Implement a backend database (e.g., Firebase Firestore) to store user profiles, test scores, and learning progress.
    *   Develop profile pages with features like progress charts, performance analysis, notification settings, etc.
*   **Enhanced Test Features**:
    *   More detailed result breakdowns and answer explanations for tests.
    *   Fully functional timer enforcement.
*   **Direct AI Image Generation in Notes**: Replace visual prompt placeholders in notes with actual AI-generated images (this would require careful consideration of API costs and generation times).

---
Made by MrGarvit
