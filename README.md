
# LearnMint 🌱 - Your AI-Powered Study Revolution!

Welcome to **LearnMint**, the ultimate Next.js application engineered by **MrGarvit** to transform your study sessions into a dynamic and productive experience! Wave goodbye to tedious material preparation and hello to AI-driven learning that's tailored, engaging, and lightning-fast.

With LearnMint, you're not just studying; you're minting knowledge with cutting-edge AI, crafted with passion by MrGarvit.

## Core Philosophy & Design ✨

*   **Sleek & Modern UI**: A beautiful dark theme (with a light mode toggle!) ensures comfortable study sessions, day or night. Powered by `next-themes`.
*   **Vibrant Color Scheme**: Crafted with HSL CSS variables (`src/app/globals.css`), featuring a sophisticated dark teal primary and an electric lime accent that pops!
*   **Typography Excellence**: Utilizes `GeistSans` for crisp readability and `GeistMono` for that clean, technical look where needed.
*   **Iconography**: `lucide-react` icons provide a consistent and modern visual language throughout the app.
*   **Built with the Best**: Tailwind CSS for utility-first styling, perfectly harmonized with ShadCN UI components for a polished, professional feel.
*   **Responsive & Accessible**: Designed to look and work great on all devices, from mobile to desktop, with accessibility in mind.

## 🔥 Igniting Your Learning: Key Features 🔥

*   **User Authentication**: Secure and easy sign-up (Email/Password, Google) and sign-in (Email/Password, Anonymous). Your learning journey, personalized and protected by Firebase.
*   **🧠 AI Content Generation Suite**:
    *   **Topper Notes**: Generate comprehensive, engaging, and well-structured study notes on *any* topic. Think top-student quality, complete with Markdown formatting, emojis, and visual prompt placeholders.
    *   **AI Quiz Creator**: Instantly create multiple-choice and short-answer quizzes on demand, with varying difficulty levels and detailed explanations.
    *   **AI Flashcard Factory**: Quickly produce sets of flashcards for rapid review and memorization.
*   **🔬 Custom Test Creation Lab**: Take control! Build tailored tests based on single or multiple topics (including recent studies), set difficulty, number of questions, custom notes, and even timers (overall and per-question).
*   **🤖 Interactive AI Chatbot - "Kazuma"**: Your witty, sometimes reluctant, but always helpful AI companion. Ask Kazuma anything, engage in small talk, or even request a (text-based) song! Supports voice input and user image uploads for interactive fun.
*   **📐 Precision Toolkit - Calculator & Converter**: A powerful scientific calculator for all your mathematical needs, plus a comprehensive unit converter (Length, Temperature, Weight/Mass, Volume, Area, Speed) with calculation history.
*   **📰 Daily News Digest**: Stay informed with the latest news from around the globe. Filter by country, state/region, city, and general categories, powered by Newsdata.io.
*   **📚 Resource Library**:
    *   Explore a curated catalog of OpenStax textbooks (links to external site).
    *   Seamlessly search Google Books and YouTube for more in-depth resources.
    *   Enjoy a "Math Fact of the Day" to keep your brain sharp!
*   **🎮 LearnMint Arcade**: Sharpen your mind while having fun!
    *   **Definition Challenge**: Test your vocabulary by guessing terms from their definitions, with hints and streak scoring.
    *   Links to external classics like **Dino Runner** and **Chess.com** for more gaming breaks.
*   **🎨 Theme Toggle**: Effortlessly switch between light and dark modes to suit your preference.
*   **🔊 Auditory Feedback**: Engaging click sounds and optional vocal announcements for a more immersive experience.

## 🛠️ Tech Stack Powerhouse

*   **Next.js 15+** (App Router)
*   **React 18+**
*   **TypeScript**
*   **Tailwind CSS**
*   **ShadCN UI Components**
*   **Firebase Authentication** (Email/Password, Google, Anonymous)
*   **Genkit** (AI flows powered by Google Gemini models)
*   **Lucide Icons**
*   `@tanstack/react-query` (for robust data fetching)
*   Newsdata.io (for live news - **requires user API key**)
*   `date-fns` (for elegant date formatting)
*   `next-themes` (for seamless theme switching)
*   `framer-motion` (for subtle, delightful animations)

## 🚀 Getting Started with LearnMint

Embark on your AI-enhanced learning adventure!

### 1. Prerequisites
*   Node.js (LTS version recommended)
*   npm or yarn
*   A Firebase Project (create one at [firebase.google.com](https://firebase.google.com/)).
    *   Go to **Authentication** (under Build in the Firebase console) -> **Sign-in method** tab.
    *   Enable **Email/Password**, **Google**, and **Anonymous** sign-in providers. For Google, ensure your project support email is configured.

### 2. CRITICAL: Set up Environment Variables using a `.env` file

Create a file named `.env` in the **root of your project**. Populate it with your actual Firebase project configuration and API keys. **This step is absolutely essential for the app to function.**

```env
# Firebase Project Configuration (Get these from your Firebase project settings)
# Go to Project Settings > General tab > Your apps > Web app SDK snippet
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyYOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com # CRITICAL for Firebase Auth
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-sender-id:web:your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID # Optional for Firebase Analytics

# For Genkit AI Features (Notes, Quizzes, Flashcards, Chatbot AI)
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
# Ensure the associated Google Cloud project has the "Generative Language API" enabled and billing configured.
GOOGLE_API_KEY=AIzaSyYOUR_GEMINI_API_KEY

# OPTIONAL: Separate API Key for Study Notes Generation
# If blank, notes generation will use the main GOOGLE_API_KEY above.
GOOGLE_API_KEY_NOTES=
# OPTIONAL: Separate API Key for AI Chatbot (Kazuma)
# If blank, the chatbot will use the main GOOGLE_API_KEY above.
GOOGLE_API_KEY_CHATBOT=

# For Daily News Digest Feature
# Get your free key from Newsdata.io: https://newsdata.io
NEWSDATA_API_KEY=pub_YOUR_NEWSDATA_API_KEY

# For YouTube Search Integration (Genkit flow)
# Get your key from Google Cloud Console: https://console.cloud.google.com/apis/library/youtube.googleapis.com
YOUTUBE_API_KEY=AIzaSyYOUR_YOUTUBE_API_KEY

# For Google Books Search Integration (Genkit flow)
# Get your key from Google Cloud Console: https://console.cloud.google.com/apis/library/books.googleapis.com
GOOGLE_BOOKS_API_KEY=AIzaSyYOUR_GOOGLE_BOOKS_API_KEY
```

*   **Valid API Keys are Mandatory!** The example keys above will not work.
*   Ensure **no extra spaces or quotes** around variable names or values.
*   **CRITICAL:** `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` are **essential** for Firebase Authentication.
*   The `console.log` statements in `src/lib/firebase/config.ts` will show you in the **server terminal** if `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, or `NEXT_PUBLIC_FIREBASE_PROJECT_ID` are `undefined`. This is your primary clue if your `.env` file isn't being read correctly.

### 3. Install Dependencies
```bash
npm install
# or
yarn install
```

### 4. CRITICAL: Restart Your Development Server
After creating or modifying your `.env` file, **YOU MUST STOP AND RESTART** your Next.js development server:
```bash
# Stop your server (usually Ctrl+C in the terminal)
# Then restart it:
npm run dev -- --port 9002
# or
yarn dev --port 9002
```

### 5. CRITICAL: Add Required Static Assets
*   **PWA Icons**: Create `public/icons` and add `icon-192x192.png` & `icon-512x512.png`.
*   **Sound Effects**: Create `public/sounds` and add `ting.mp3`, `custom-sound-2.mp3`, `correct-answer.mp3`, `incorrect-answer.mp3`.
*   **Chatbot Avatar**: Create `public/images` and add `kazuma-dp.jpg`.

### 6. Run the Development Server
```bash
npm run dev -- --port 9002
# or
yarn dev --port 9002
```
Access at `http://localhost:9002`.

### 7. Run Genkit Dev Server (Optional but Recommended)
For debugging AI flows (notes, quizzes, chatbot):
```bash
npm run genkit:dev
# or
npm run genkit:watch
```
Access Genkit UI at `http://localhost:4000`.

## 🚀 Deployment to Firebase Hosting

LearnMint is configured for Firebase Hosting using `frameworksBackend` for Next.js.

**Prerequisites:**
*   `firebase-tools` installed: `npm install -g firebase-tools`.
*   Logged into Firebase: `firebase login`.
*   `.firebaserc` correctly specifies your Firebase project ID.

**Deployment Steps:**

1.  **CRITICAL: Local `.env` for Build:** Ensure your local `.env` has **valid production** API keys.
2.  **CRITICAL: Add Static Assets:** As per step 5 in "Getting Started".
3.  **Build for Production:** `npm run build`
4.  **Deploy:** `firebase deploy`
5.  **CRITICAL: Set Environment Variables in Google Cloud for Deployed App (App Hosting):**
    Firebase App Hosting **does not automatically use your local `.env` for the deployed backend functions.** You MUST set them in the Google Cloud Console:
    *   Go to `https://console.cloud.google.com/run?project=YOUR_PROJECT_ID`.
    *   Find your App Hosting service.
    *   Edit configuration -> "Variables & Secrets".
    *   Add **ALL** required production environment variables (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`, `GOOGLE_API_KEY`, `NEWSDATA_API_KEY`, etc.).
    *   Deploy the new revision with these variables. **This is crucial for deployed features to work.**

## 🎨 Customization

*   **Styling**: Modify `src/app/globals.css` and `tailwind.config.ts`.
*   **AI Prompts**: Tweak prompts in `src/ai/flows/` to alter AI-generated content.
*   **Sound Effects**: Replace files in `public/sounds/`.

## 🚀 Future Vision

LearnMint aims to continuously evolve and empower learners. Here's a glimpse of what **MrGarvit** envisions for the future:

*   🌟 **Advanced Test Series & Analytics**: Introduce comprehensive test series with detailed performance analytics, personalized feedback, and adaptive difficulty to help students pinpoint strengths and weaknesses.
*   🌍 **Making Quality Education Affordable & Accessible**: Strive to keep LearnMint's core tools widely accessible, exploring options for free tiers and affordable premium features, ensuring that high-quality AI learning support reaches as many students as possible.
*   🤝 **Community & Collaboration Features**: Enable users to share study materials, create study groups, and engage in peer-to-peer learning within the platform.
*   🧩 **More Interactive Learning Modules**: Expand the "LearnMint Arcade" with more engaging educational games and interactive simulations covering a wider range of subjects.
*   📚 **Deeper Content Integration**: Seamlessly integrate resources from platforms like YouTube and Google Books directly within the app, providing a richer, more contextual learning experience.
*   📱 **Enhanced PWA Features**: Implement robust offline capabilities for notes, flashcards, and quizzes, allowing students to study anytime, anywhere, even without an internet connection.
*   🎯 **Personalized Learning Paths**: Leverage AI to suggest personalized study plans and resources based on individual learning styles, progress, and goals.
*   🖼️ **Direct AI Image Generation**: Integrate AI image generation to replace `[VISUAL_PROMPT]` placeholders in notes with actual, relevant visuals, further enhancing the learning material.

---
Made with 🧠 and ✨ by **MrGarvit**
