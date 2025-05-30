
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// It's good practice to keep API keys out of source code.
// process.env.GOOGLE_API_KEY will be used by default by the googleAI plugin.
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const knownDemoKeys = [
  "YOUR_GOOGLE_AI_API_KEY_HERE", // From README
  "YOUR_GOOGLE_API_KEY_HERE",    // From your doc
  "AIzaSy*********************************", 
  "AIzaSyDm10sKA-u4Ivzy88KUlUIzV11akoz1XsQ", 
  "AIzaSyC4x6Mj70HoAGF1_wYZ80ZsjiKeljBewb4",
  "AIzaSyD0LVemqManYsFHV_k7c5mOsUVklcnvWCo", // This was one of the example keys you provided
];

const isApiKeyPlaceholder = !GOOGLE_API_KEY || 
  knownDemoKeys.some(key => {
    if (key.includes('*')) {
      return GOOGLE_API_KEY?.startsWith(key.substring(0, key.indexOf('*')));
    }
    return GOOGLE_API_KEY === key;
  });

if (isApiKeyPlaceholder) {
  console.warn(
    `\n****************************************************************************************\n` +
    `CRITICAL WARNING: GOOGLE_API_KEY in .env is a PLACEHOLDER, a KNOWN DEMO KEY, or MISSING.\n` +
    `The current key is: "${GOOGLE_API_KEY || 'NOT SET'}"\n` +
    `LearnMint AI features (Notes, Quiz, Flashcards, Chatbot) WILL LIKELY FAIL or be rate-limited.\n\n` +
    `ACTION REQUIRED:\n` +
    `1. Obtain a valid API key from Google AI Studio (https://aistudio.google.com/app/apikey).\n` +
    `2. Ensure the "Generative Language API" (Gemini API) is enabled in the associated Google Cloud Project.\n` +
    `3. Ensure BILLING is enabled for that Google Cloud Project.\n` +
    `4. Create a .env file in your project root if it doesn't exist.\n` +
    `5. Add your key to the .env file: GOOGLE_API_KEY="YOUR_ACTUAL_VALID_API_KEY_HERE"\n` +
    `6. RESTART your development server (e.g., npm run dev) for changes to take effect.\n` +
    `****************************************************************************************\n`
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      // apiKey: GOOGLE_API_KEY, // Not strictly needed here if GOOGLE_API_KEY is in env
      // apiVersion: 'v1beta' // Example: if you need a specific version
    }),
  ],
  // model: 'googleai/gemini-1.5-flash-latest', // Default model; can be overridden in prompts
  // For local dev, flowStateStore & traceStore might not be needed or can be 'memory' if plugins support it.
  // For production or persistent state, Firebase (genkitx-firebase) is an option.
  // flowStateStore: 'firebase', 
  // traceStore: 'firebase',
  // For simplicity in this setup, we'll omit them, relying on default Genkit behavior (often in-memory for dev).
  enableTracingAndMetrics: true, // Good for dev UI (http://localhost:4000)
  defaultModelConfig: { // Default safety settings
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
    // temperature: 0.5, // Example default temperature
  },
});
