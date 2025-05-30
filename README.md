# LearnMint - AI Powered Learning

LearnMint is a Next.js application designed to be an AI-powered learning assistant. It focuses on generating study materials like notes, quizzes, and flashcards. It also includes a custom test creation feature, a scientific calculator with a unit converter, an interactive AI chatbot (Megumin), a Daily News Digest feature, and placeholders for future library and game features.

User accounts and server-side data persistence for test results have been removed to simplify the application for this version.

To get started, take a look at `src/app/page.tsx`.

## LearnMint UI and Frontend Overview

This section provides details about the application's user interface, frontend technologies, and key features from a UI/UX perspective.

### Overall Design Philosophy
*   **Theme**: Dark theme by default, with a user-toggleable Light theme. Theme switching is powered by `next-themes`.
*   **Color Scheme**: Uses HSL CSS variables defined in `src/app/globals.css`. The primary color is a dark teal, with an electric lime accent.
*   **Fonts**: Uses `GeistSans` for general text and `GeistMono` for monospaced text (like calculator displays), imported via `geist/font`.
*   **Icons**: Primarily uses `lucide-react` for a consistent and modern icon set.
*   **Styling**: Tailwind CSS is used for utility-first styling, along with ShadCN UI components.
*   **Responsiveness**: The application is designed to be responsive, adapting to various screen sizes from mobile to desktop.

### Core Layout (`src/app/layout.tsx`)
*   A global layout wraps all pages.
*   It includes:
    *   `ThemeProvider` for light/dark mode.
    *   `ReactQueryProvider` for data fetching and caching with TanStack Query.
    *   `AppHeader` (consistent across all pages).
    *   A main content area with responsive padding.
    *   `Toaster` for displaying notifications.

## Core Features

*   **AI Content Generation**: Create comprehensive study notes, multiple-choice quizzes, and flashcards for any topic using AI (powered by Genkit and Google AI).
*   **Custom Test Creation**: Build tests based on specific topics (single or multiple recent), difficulty levels, number of questions, optional custom notes, and timer settings.
*   **Interactive AI Chatbot (Megumin)**: Engage with "Megumin," a witty AI assistant, for small talk, questions, and even "singing" (text-based). Supports voice input and user image uploads.
*   **Scientific Calculator & Unit Converter**: Perform basic and scientific calculations. Includes a Unit Converter (Length, Temperature, Weight/Mass, Volume, Area, Speed) and a history of the last 3 calculations.
*   **Daily News Digest**: Browse news articles filtered by country, state/region (text input), city (text input), and general categories, powered by Newsdata.io.
*   **Resource Library**:
    *   Explore a sample catalog of OpenStax textbooks (links to external site).
    *   Search Google Books (redirects to Google Books search results for full reading).
    *   Search YouTube (redirects to YouTube search results page).
    *   View a "Math Fact of the Day" (from a static list after attempting live fetch).
*   **Educational Game**: Play "Word Game" (a definition/term guessing game with hints and streak scoring). Placeholders for "Dino Runner" and "Tetris" exist in the game hub.
*   **Theme Toggle**: Switch between light and dark modes.
*   **Responsive UI**: Designed to adapt to various screen sizes, including mobile (with drawer navigation).
*   **Auditory Feedback**: Click sounds and vocal announcements for a more engaging experience.

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
*   `date-fns` (for date formatting)
*   `next-themes` (for light/dark mode)

## Getting Started

### 1. Prerequisites
*   Node.js (LTS version recommended)
*   npm or yarn

### 2. CRITICAL: Set up Environment Variables

Create a file named `.env` in the root of your project. Add the following content:

```env
# For Genkit AI Features (Notes, Quizzes, Flashcards, Chatbot AI)
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
# Ensure the associated Google Cloud project has the "Generative Language API" enabled and billing configured.
GOOGLE_API_KEY=AIzaSyD0LVemqManYsFHV_k7c5mOsUVklcnvWCo

# OPTIONAL: Separate API Key for Study Notes Generation
# If you want to use a different Gemini API key specifically for generating study notes,
# set it here. If left blank, notes generation will use the main GOOGLE_API_KEY above.
GOOGLE_API_KEY_NOTES=

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
    *   Add `ting.mp3` (for general UI clicks).
    *   For correct/incorrect answer feedback in quizzes/tests, basic tones are generated by the app. If you prefer custom sounds, you can place `correct-answer.mp3` and `incorrect-answer.mp3` in this folder and modify the `useSound` calls in `src/app/(app)/quiz/page.tsx` and `src/app/(app)/custom-test/page.tsx` to use these file paths instead of `'correct'` and `'incorrect'`.
    *   If you use different filenames for `ting.mp3`, you may need to update paths in the components where sounds are played.

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
    *   Go to [GitHub.com](https://github.com/) and create a new repository (e.g., `learnmint`). **Do NOT** initialize it with a README, .gitignore, or license if you're pushing an existing project (as this project has them).
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
    *   Before building, ensure your local `.env` file is populated with your **valid production** API keys (Google AI, Newsdata.io, YouTube, Google Books). Use the `GOOGLE_API_KEY_NOTES` if you have configured a separate key for notes. Without these, the deployed app's features will not work.

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
    *   **If you use a separate key for notes, also add `GOOGLE_API_KEY_NOTES`.**
    *   Deploy the new revision with these environment variables.
    *   This step is crucial for Genkit AI features and other API-dependent features to work in the deployed environment.

## Customization

*   **Styling**: Modify `src/app/globals.css` and Tailwind configuration in `tailwind.config.ts`. ShadCN components can be customized as per their documentation.
*   **AI Prompts**: Adjust the prompts in `src/ai/flows/` to change the style, content, or structure of the generated materials.
*   **Sound Effects**: To use different sounds, replace sound files in `/public/sounds/` and update paths in the relevant components if necessary. Basic tones for correct/incorrect quiz answers are generated via Web Audio API; these can be overridden by providing `correct-answer.mp3` and `incorrect-answer.mp3` and modifying the `useSound` calls.

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
