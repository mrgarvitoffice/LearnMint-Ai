
# LearnMint - AI Powered Learning

LearnMint is a Next.js application designed to be an AI-powered learning assistant. It focuses on generating study materials like notes, quizzes, and flashcards. It also includes a custom test creation feature, a scientific calculator with a unit converter, an interactive AI chatbot (Kazuma), a Daily News Digest feature, and placeholders for future library and game features.

**Firebase Authentication is used for user management (sign-up, sign-in, sign-out).** Firebase is also available for future database and storage needs.

To get started, take a look at `src/app/(app)/page.tsx`.

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
    *   `AuthProvider` for Firebase Authentication state management.
    *   `ReactQueryProvider` for data fetching and caching with TanStack Query.
    *   `AppHeader` (consistent across all pages).
    *   A main content area with responsive padding.
    *   `Toaster` for displaying notifications.

## Core Features

*   **User Authentication**: Sign up, sign in (Email/Password, Google, Anonymous), and sign out using Firebase Authentication.
*   **AI Content Generation**: Create comprehensive study notes, multiple-choice quizzes, and flashcards for any topic using AI (powered by Genkit and Google Gemini models).
*   **Custom Test Creation**: Build tests based on specific topics (single or multiple recent), difficulty levels, number of questions, optional custom notes, and timer settings.
*   **Interactive AI Chatbot (Kazuma)**: Engage with "Kazuma," a witty AI assistant, for small talk, questions, and even "singing" (text-based). Supports voice input and user image uploads.
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
*   **Firebase Authentication (Email/Password, Google, Anonymous)**
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
*   A Firebase Project (create one at [firebase.google.com](https://firebase.google.com/)).
    *   Go to **Authentication** (under Build in the Firebase console) -> **Sign-in method** tab.
    *   Enable **Email/Password**, **Google**, and **Anonymous** sign-in providers. For Google, you may need to provide your project support email.

### 2. CRITICAL: Set up Environment Variables

Create a file named `.env` in the **root of your project**. Add the following content, replacing placeholder values with your actual Firebase project configuration and API keys:

```env
# Firebase Project Configuration (Get these from your Firebase project settings)
# Go to Project Settings > General tab > Your apps > Web app SDK snippet
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyYOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com # CRITICAL for Firebase Auth
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-sender-id:web:your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID # Optional: For Firebase Analytics. Can be left blank or omitted if not used.

# For Genkit AI Features (Notes, Quizzes, Flashcards, Chatbot AI)
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
# Ensure the associated Google Cloud project has the "Generative Language API" enabled and billing configured.
GOOGLE_API_KEY=AIzaSyBL51Y-qaVLKSl9gwgbgsPSN1MMxh6gv5M

# OPTIONAL: Separate API Key for Study Notes Generation
# If you want to use a different Gemini API key specifically for generating study notes,
# set it here. If left blank, notes generation will use the main GOOGLE_API_KEY above.
GOOGLE_API_KEY_NOTES=AIzaSyBo2s_bm0B68CypK1pOhtO0Kz2dCAqIi9A

# OPTIONAL: Separate API Key for AI Chatbot (Kazuma)
# If you want to use a different Gemini API key specifically for the chatbot,
# set it here. If left blank, the chatbot will use the main GOOGLE_API_KEY above.
GOOGLE_API_KEY_CHATBOT=AIzaSyDAH1-lAsVrUg9omTzsT3HXWMjzteTMVKg

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
*   Ensure there are **no extra spaces or quotes** around the variable names or their values in your `.env` file.
*   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is optional. If you don't use Firebase Analytics, you can omit this line or leave the value blank.
*   `OPENROUTER_API_KEY` is noted but **not currently used** by the application.

### 3. Install Dependencies
```bash
npm install
# or
yarn install
```

### 4. CRITICAL: Restart Your Development Server
After creating or modifying your `.env` file, you **MUST stop and restart your Next.js development server** for the environment variables to be loaded.
```bash
# Stop your server (usually Ctrl+C in the terminal)
# Then restart it:
npm run dev -- --port 9002
# or
yarn dev --port 9002
```

**Troubleshooting Firebase Errors (e.g., `auth/invalid-api-key`, `auth/auth-domain-config-required`):**
If you encounter Firebase errors, it means the Firebase configuration your application is trying to use is incorrect or not being loaded.
1.  **Verify `.env` File:**
    *   Double-check that the `.env` file is in the project root.
    *   Ensure `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` are spelled correctly and their values are accurately copied from your Firebase project settings (General tab -> Your apps -> SDK setup and configuration).
    *   Ensure no extra spaces or quotes around the variable names or values.
2.  **Check Server Logs:** After restarting your server, look at the terminal output. The `src/lib/firebase/config.ts` file now includes lines like:
    *   `Firebase Config: Attempting to use API Key: YOUR_API_KEY_VALUE_OR_UNDEFINED`
    *   `Firebase Config: Attempting to use Auth Domain: YOUR_AUTH_DOMAIN_VALUE_OR_UNDEFINED`
    *   If either says `undefined` or shows an obviously incorrect value, your `.env` file is not being read correctly, the variable is missing/misspelled, or you haven't restarted the server. Review step 1 and ensure you restarted.
    *   If the logs show `CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is UNDEFINED...` or `CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is UNDEFINED...`, this directly confirms the .env variable is not being loaded.
3.  **Firebase Project Settings:**
    *   Ensure the "Email/Password", "Google", and "Anonymous" sign-in providers are enabled in your Firebase project's Authentication settings.
    *   Double-check the API key and Auth Domain in your Firebase project settings.

### 5. CRITICAL: Add Required Static Assets
*   **PWA Icons**:
    *   Create a folder `public/icons`.
    *   Add `icon-192x192.png` (192x192 pixels) and `icon-512x512.png` (512x512 pixels) to this folder. These are referenced in `public/manifest.json`.
*   **Sound Effects**:
    *   Create a folder `public/sounds`.
    *   Add `ting.mp3` (for general UI clicks).
    *   Add `custom-sound-2.mp3` (used for page transitions and major actions).
    *   For correct/incorrect answer feedback in quizzes/tests, place `correct-answer.mp3` and `incorrect-answer.mp3` in this folder.
    *   If you use different filenames, you may need to update paths in the components where sounds are played.
*   **Chatbot Avatar**:
    *   Create a folder `public/images`.
    *   Add `kazuma-dp.jpg` for the chatbot avatar (or update path in `src/components/features/chatbot/ChatMessage.tsx`).

### 6. Run the Development Server
```bash
npm run dev -- --port 9002
# or
yarn dev --port 9002
```
The application will typically be available at `http://localhost:9002`.

### 7. Run Genkit Dev Server (Optional but Recommended for AI Flow Debugging)
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
    *   Before building, ensure your local `.env` file is populated with your **valid production** API keys (Firebase config, Google AI, Newsdata.io, YouTube, Google Books).
    *   Use `GOOGLE_API_KEY_NOTES` and `GOOGLE_API_KEY_CHATBOT` if you have configured separate keys for those features.
    *   Without these, the deployed app's features will not work.

2.  **CRITICAL: Add PWA Icons (Required for PWA):**
    *   Create a folder `public/icons`.
    *   Add `icon-192x192.png` and `icon-512x512.png` to this folder.

3.  **CRITICAL: Add Sound Effects & Images (Required for functionality):**
    *   Create a folder `public/sounds` and add `ting.mp3`, `custom-sound-2.mp3`, `correct-answer.mp3`, and `incorrect-answer.mp3`.
    *   Create `public/images` and add `kazuma-dp.jpg`.

4.  **Build your Next.js application for production:**
    ```bash
    npm run build
    ```

5.  **Deploy to Firebase:**
    ```bash
    firebase deploy
    ```

6.  After deployment, the Firebase CLI will provide you with the **Hosting URL**.

7.  **CRITICAL: Environment Variables for Deployed App (App Hosting)**:
    When Firebase builds your Next.js app for App Hosting, it **does not automatically use your local `.env` file for the running backend functions.** You need to set up environment variables for your deployed application in the Google Cloud Console.
    *   Go to your Firebase project in the Google Cloud Console: `https://console.cloud.google.com/run?project=YOUR_PROJECT_ID` (replace `YOUR_PROJECT_ID` with your Firebase project ID).
    *   Find your App Hosting service.
    *   Edit the service configuration (usually "Edit & Deploy New Revision").
    *   Navigate to the "Variables & Secrets" or "Environment Variables" section.
    *   Add ALL your required production environment variables:
        *   `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
        *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
        *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
        *   `NEXT_PUBLIC_FIREBASE_APP_ID`
        *   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (if you use it - it's optional)
        *   `GOOGLE_API_KEY`
        *   `NEWSDATA_API_KEY`
        *   `YOUTUBE_API_KEY`
        *   `GOOGLE_BOOKS_API_KEY`
        *   (If used) `GOOGLE_API_KEY_NOTES`, `GOOGLE_API_KEY_CHATBOT`
    *   Deploy the new revision with these environment variables. This step is crucial for Firebase Authentication, Genkit AI features, and other API-dependent features to work in the deployed environment.

## Customization

*   **Styling**: Modify `src/app/globals.css` and Tailwind configuration in `tailwind.config.ts`. ShadCN components can be customized as per their documentation.
*   **AI Prompts**: Adjust the prompts in `src/ai/flows/` to change the style, content, or structure of the generated materials.
*   **Sound Effects**: Replace sound files in `/public/sounds/` and update paths in components if necessary.

## Future Enhancements (Potential Ideas)

*   **Advanced PWA Features**: Implement a service worker for offline caching of assets and basic content.
*   **Full Library Content Integration**: Fully integrate YouTube video search & embedding, and Google Books search & display.
*   **Multilingual Support**:
    *   UI Internationalization: Add support for multiple languages in the application's interface.
    *   AI Content Localization: Update Genkit prompts to accept a target language.
*   **Educational Games (Tetris, Dino Runner)**: Develop the planned "LearnMint Arcade" Tetris and Dino Runner games.
*   **User Progress Tracking (Requires Backend Database)**:
    *   Integrate a backend database (e.g., Firebase Firestore) to store user profiles, test scores, and learning progress (linked to user IDs).
    *   Develop profile pages with features like progress charts, performance analysis, notification settings, etc.
*   **Enhanced Test Features**: More detailed result breakdowns and answer explanations.
*   **Direct AI Image Generation in Notes**: Replace visual prompt placeholders in notes with actual AI-generated images.

---
Made by MrGarvit

