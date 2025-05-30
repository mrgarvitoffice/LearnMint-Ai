
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Main GOOGLE_API_KEY and its warning
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const knownDemoKeys = [
  "YOUR_GOOGLE_AI_API_KEY_HERE", 
  "YOUR_GOOGLE_API_KEY_HERE",    
  "AIzaSy*********************************", 
  "AIzaSyDm10sKA-u4Ivzy88KUlUIzV11akoz1XsQ", 
  "AIzaSyC4x6Mj70HoAGF1_wYZ80ZsjiKeljBewb4",
  "AIzaSyD0LVemqManYsFHV_k7c5mOsUVklcnvWCo", 
];
const isMainApiKeyPlaceholder = !GOOGLE_API_KEY || 
  knownDemoKeys.some(key => {
    if (key.includes('*')) {
      return GOOGLE_API_KEY?.startsWith(key.substring(0, key.indexOf('*')));
    }
    return GOOGLE_API_KEY === key;
  });

if (isMainApiKeyPlaceholder) {
  console.warn(
    `\n****************************************************************************************\n` +
    `CRITICAL WARNING: GOOGLE_API_KEY in .env is a PLACEHOLDER, a KNOWN DEMO KEY, or MISSING.\n` +
    `The current key is: "${GOOGLE_API_KEY || 'NOT SET'}"\n` +
    `Many AI features (Quiz, Flashcards, Chatbot) WILL LIKELY FAIL or use the notes-specific key if GOOGLE_API_KEY_NOTES is set and the main key is not.\n\n` +
    `ACTION REQUIRED (for main AI features):\n` +
    `1. Obtain a valid API key from Google AI Studio (https://aistudio.google.com/app/apikey).\n` +
    `2. Ensure the "Generative Language API" (Gemini API) is enabled in the associated Google Cloud Project.\n` +
    `3. Ensure BILLING is enabled for that Google Cloud Project.\n` +
    `4. Add this key to .env as GOOGLE_API_KEY="YOUR_VALID_MAIN_API_KEY"\n` +
    `5. RESTART your development server.\n` +
    `****************************************************************************************\n`
  );
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: GOOGLE_API_KEY }), // Uses main key by default
  ],
  model: 'googleai/gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
  defaultModelConfig: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

// Specific API key and Genkit instance for Study Notes Generation
const GOOGLE_API_KEY_NOTES = process.env.GOOGLE_API_KEY_NOTES;
let aiForNotesInstance;

if (GOOGLE_API_KEY_NOTES && GOOGLE_API_KEY_NOTES.trim() !== '' && GOOGLE_API_KEY_NOTES !== GOOGLE_API_KEY) {
  console.log(`INFO: Using separate GOOGLE_API_KEY_NOTES for study notes generation.`);
  const isNotesApiKeyPlaceholder = knownDemoKeys.some(key => {
    if (key.includes('*')) {
      return GOOGLE_API_KEY_NOTES?.startsWith(key.substring(0, key.indexOf('*')));
    }
    return GOOGLE_API_KEY_NOTES === key;
  });

  if (isNotesApiKeyPlaceholder) {
    console.warn(
      `\n****************************************************************************************\n` +
      `WARNING: GOOGLE_API_KEY_NOTES in .env is a PLACEHOLDER or a known demo key.\n` +
      `The current key is: "${GOOGLE_API_KEY_NOTES}"\n` +
      `Study notes generation might fail or use unexpected quotas.\n` +
      `Please provide a valid, distinct API key for GOOGLE_API_KEY_NOTES for separate billing/quotas.\n` +
      `****************************************************************************************\n`
    );
  }
  aiForNotesInstance = genkit({
    plugins: [
      googleAI({ apiKey: GOOGLE_API_KEY_NOTES }),
    ],
    model: 'googleai/gemini-1.5-flash-latest', // Or a specific model for notes
    enableTracingAndMetrics: true,
    defaultModelConfig: { // Can have its own specific config if needed
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    },
  });
} else {
  if (!GOOGLE_API_KEY_NOTES || GOOGLE_API_KEY_NOTES.trim() === '') {
    // console.log(`INFO: GOOGLE_API_KEY_NOTES is not set or is empty. Study notes generation will use the main GOOGLE_API_KEY configuration.`);
  } else if (GOOGLE_API_KEY_NOTES === GOOGLE_API_KEY) {
    // console.log(`INFO: GOOGLE_API_KEY_NOTES is the same as GOOGLE_API_KEY. Study notes generation will use the main GOOGLE_API_KEY configuration.`);
  }
  aiForNotesInstance = ai; // Fallback to the main 'ai' instance
}

export const aiForNotes = aiForNotesInstance;
