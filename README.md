# 🌱 LearnMint: Your AI-Powered Study Revolution! 🚀
## Made by **MrGarvit**!

<p align="center">
  <img src="https://placehold.co/600x300.png?text=LearnMint+by+MrGarvit&font=raleway&bg=220_30_10&fc=190_80_85" alt="LearnMint Banner by MrGarvit" data-ai-hint="modern abstract">
</p>

**Welcome to LearnMint!** The ultimate Next.js application meticulously engineered by **MrGarvit** to transform your study sessions into a dynamic, productive, and engaging experience. Wave goodbye to tedious material preparation and say hello to AI-driven learning that's tailored, insightful, and lightning-fast.

With **LearnMint**, you're not just studying; you're minting knowledge with cutting-edge AI, all under the creative genius of **MrGarvit**.

---

## 🌟 Table of Contents

*   [Core Philosophy & Design](#-core-philosophy--design-)
*   [🔥 Igniting Your Learning: Key Features](#-igniting-your-learning-key-features-)
*   [🛠️ Tech Stack Powerhouse](#️-tech-stack-powerhouse-)
*   [🚀 Getting Started with LearnMint](#-getting-started-with-learnmint-)
    *   [Prerequisites](#1-prerequisites)
    *   [CRITICAL: Set up Environment Variables (.env)](#2-critical-set-up-environment-variables-using-a-env-file)
    *   [Install Dependencies](#3-install-dependencies)
    *   [CRITICAL: Restart Development Server](#4-critical-restart-your-development-server)
    *   [CRITICAL: Add Required Static Assets](#5-critical-add-required-static-assets)
    *   [Run Development Server](#6-run-the-development-server)
    *   [Run Genkit Dev Server](#7-run-genkit-dev-server-optional-but-recommended)
*   [☁️ Deployment to Firebase Hosting](#️-deployment-to-firebase-hosting)
*   [🎨 Customization](#-customization-)
*   [💖 Creator's Note](#️-creators-note)

---

## ✨ Core Philosophy & Design ✨

LearnMint is built on the principles of efficiency, engagement, and elegance, a testament to **MrGarvit's** design philosophy:

*   **Sleek & Modern UI**: Beautiful dark theme (with light mode toggle via `next-themes`) for comfortable study sessions.
*   **Vibrant Color Scheme**: Sophisticated dark teal primary and an electric lime accent, crafted with HSL CSS variables (`src/app/globals.css`).
*   **Typography Excellence**: `GeistSans` for crisp readability and `GeistMono` for clean, technical text.
*   **Iconography**: Consistent and modern visual language using `lucide-react` icons.
*   **Built with the Best**: Tailwind CSS and ShadCN UI components for a polished, professional feel.
*   **Responsive & Accessible**: Designed for all devices with accessibility in mind.

---

## 🔥 Igniting Your Learning: Key Features 🔥

**MrGarvit** has packed LearnMint with a suite of powerful, AI-driven tools:

*   **Authentication Ready**: The app's authentication system has been removed to allow for easy integration of your preferred provider (e.g., Clerk, Auth0).
*   **AI Content Generation Suite**:
    *   **Unified Material Generation**: Enter a topic for AI-generated:
        *   📝 **Comprehensive Notes**: Markdown formatted, emojis, and embedded AI-generated images.
        *   🎯 **30-Question Interactive Quiz**: Multiple-choice & short-answer questions with explanations.
        *   📚 **20 Engaging Flashcards**: For rapid review.
    *   **Dedicated Quiz Creator**: Instantly create separate quizzes.
    *   **Dedicated Flashcard Factory**: Quickly produce standalone flashcard sets.
*   **Custom Test Creation Lab**: Build tailored tests (single/multiple topics, recent studies, difficulty, question count, custom notes, timers).
*   **Interactive AI Chatbot - "Kazuma"**: Witty, helpful AI companion. Supports voice input & user image uploads. Conceptualized by **MrGarvit**.
*   **Precision Toolkit - Calculator & Converter**: Scientific calculator and comprehensive unit converter (Length, Temp, Weight/Mass, Volume, Area, Speed) with history.
*   **Daily News Digest**: Latest global news, filterable by location and category (Newsdata.io). Supports voice search.
*   **Resource Library**:
    *   Curated OpenStax textbook links.
    *   Google Books & YouTube search (voice input supported).
    *   "Math Fact of the Day".
*   **LearnMint Arcade**:
    *   **Definition Challenge**: Guess terms from definitions.
    *   Links to classics like **Dino Runner** and **Chess.com**.
*   **Theme Toggle**: Switch between light and dark modes.
*   **Auditory Feedback**: Click sounds and optional vocal announcements.

---

## 🛠️ Tech Stack Powerhouse 🛠️

LearnMint leverages a modern, robust tech stack, carefully selected by **MrGarvit**:

*   Next.js 15+ (App Router)
*   React 18+
*   TypeScript
*   Tailwind CSS
*   ShadCN UI Components
*   **Authentication**: Ready for your provider (e.g., Clerk)
*   Genkit (Google Gemini for AI text & image generation)
*   Lucide Icons
*   `@tanstack/react-query`
*   Newsdata.io (News - **requires user API key**)
*   `date-fns` (Date formatting)
*   `next-themes` (Theme switching)
*   `framer-motion` (Animations)

---

## 🚀 Getting Started with LearnMint 🚀

Embark on your AI-enhanced learning adventure, crafted by **MrGarvit**!

### 1. Prerequisites

*   Node.js (LTS version recommended)
*   `npm` or `yarn`

### 2. CRITICAL: Set up Environment Variables using a `.env` file

<details>
<summary><strong>⚠️ Click here for DETAILED `.env` Configuration Guide ⚠️</strong></summary>

Create `.env` in the **project root**. Populate with your API keys. **This is essential.**

**MrGarvit has provided Gemini API keys. Distribute as suggested or preferred.**
**Key `AIzaSyAYMVP1amZ6fow3WMJ2XspN_8CfkJXpohc` is CRITICAL for image generation.**

```env
# === Authentication ===
# Firebase authentication has been removed.
# Add your authentication provider's environment variables here (e.g., for Clerk).
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# CLERK_SECRET_KEY=

# === Genkit AI Features (Notes, Quizzes, Flashcards, Chatbot AI, Image Generation) ===
# Get keys from Google AI Studio: https://aistudio.google.com/app/apikey
# Ensure "Generative Language API" (or Vertex AI) is enabled & billing configured for the Google Cloud project.

# Main/Default Gemini API Key
# Suggestion from MrGarvit: AIzaSyC9acF8uyEJssqF9ZaMOMvJNLag8EffJlo
GOOGLE_API_KEY=AIzaSyC9acF8uyEJssqF9ZaMOMvJNLag8EffJlo

# Optional: Key for Study Notes (Text) & Derived Content (Quiz/Flashcards from Notes)
# Uses GOOGLE_API_KEY if blank.
# Suggestion from MrGarvit: AIzaSyDEbQvjLG_Lb_OtDK-ka3CdcrU19dl72OY
GOOGLE_API_KEY_NOTES=AIzaSyDEbQvjLG_Lb_OtDK-ka3CdcrU19dl72OY

# Optional: Key for AI Chatbot (Kazuma)
# Uses GOOGLE_API_KEY if blank.
# Suggestion from MrGarvit: AIzaSyC3ZI8F99RYeMxkE5OYewSsE0o5GLHvMRs
GOOGLE_API_KEY_CHATBOT=AIzaSyC3ZI8F99RYeMxkE5OYewSsE0o5GLHvMRs

# CRITICAL: Key for Image Generation in Notes (Gemini 2.0 Flash or equivalent)
# Falls back to GOOGLE_API_KEY_NOTES, then GOOGLE_API_KEY if blank. Recommended: Use dedicated key.
# Suggestion from MrGarvit: AIzaSyAYMVP1amZ6fow3WMJ2XspN_8CfkJXpohc
GOOGLE_API_KEY_IMAGES=AIzaSyAYMVP1amZ6fow3WMJ2XspN_8CfkJXpohc

# CRITICAL: Key for Text-to-Speech (TTS) voice generation
# Uses GOOGLE_API_KEY if blank.
# Use this key: AIzaSyD_8o9PtlwoqUbuV8Z2IZfe2m9B9UfckuE
GOOGLE_API_KEY_TTS=AIzaSyD_8o9PtlwoqUbuV8Z2IZfe2m9B9UfckuE

# === Other Service API Keys ===

# Daily News Digest (Newsdata.io - get free key)
NEWSDATA_API_KEY=pub_YOUR_NEWSDATA_API_KEY

# YouTube Search (Google Cloud Console - YouTube Data API v3)
YOUTUBE_API_KEY=AIzaSyYOUR_YOUTUBE_API_KEY

# Google Books Search (Google Cloud Console - Google Books API)
GOOGLE_BOOKS_API_KEY=AIzaSyYOUR_GOOGLE_BOOKS_API_KEY
```

**Important `.env` Notes:**
*   🛑 **Valid API Keys are Mandatory!** Use provided keys or your own.
*   ✅ No extra spaces/quotes around variable names/values.
*   🖼️ **CRITICAL for Image Gen:** Key for `GOOGLE_API_KEY_IMAGES` needs "Generative Language API" (Gemini API) enabled in its Google Cloud Project, billing enabled, and permissions for image models (e.g., `gemini-2.0-flash-exp`).

</details>

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. CRITICAL: Restart Your Development Server

After creating/modifying `.env`, **STOP AND RESTART** your Next.js server:
```bash
# Stop (Ctrl+C) then restart:
npm run dev -- --port 9002
# or
yarn dev --port 9002
```

### 5. CRITICAL: Add Required Static Assets

*   **PWA Icons**: `public/icons/icon-192x192.png` & `public/icons/icon-512x512.png`.
*   **Sound Effects**: `public/sounds/` (add `ting.mp3`, `custom-sound-2.mp3`, `correct-answer.mp3`, `incorrect-answer.mp3`).
*   **Chatbot Avatar**: `public/images/kazuma-dp.jpg` (and `public/images/megumin-dp.jpg`).

### 6. Run the Development Server

```bash
npm run dev -- --port 9002
# or
yarn dev --port 9002
```
Access LearnMint at `http://localhost:9002`.

### 7. Run Genkit Dev Server (Optional but Recommended)

For debugging AI flows:
```bash
npm run genkit:dev
# or
npm run genkit:watch
```
Access Genkit UI at `http://localhost:4000`.

---

## 🎨 Customization 🎨

*   **Styling**: Modify `src/app/globals.css` and `tailwind.config.ts`.
*   **AI Prompts**: Tweak prompts in `src/ai/flows/`.
*   **Sound Effects**: Replace files in `public/sounds/`.

---

## 💖 Creator's Note 💖

**LearnMint**, by **MrGarvit**, demonstrates cutting-edge AI in education and modern web development. !!!

Enjoy the LearnMint-Ai !!

---
Made by **MrGarvit**!
