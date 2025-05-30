
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
    `Many AI features will LIKELY FAIL or use other specific keys if they are set.\n\n` +
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
  const isNotesApiKeyPlaceholder = knownDemoKeys.some(key => GOOGLE_API_KEY_NOTES.startsWith(key.substring(0, key.indexOf('*')) || key));
  if (isNotesApiKeyPlaceholder) {
    console.warn(
      `\nWARNING: GOOGLE_API_KEY_NOTES in .env appears to be a PLACEHOLDER or DEMO key: "${GOOGLE_API_KEY_NOTES}". Notes generation might fail or use main key quotas.\n`
    );
  }
  aiForNotesInstance = genkit({
    plugins: [googleAI({ apiKey: GOOGLE_API_KEY_NOTES })],
    model: 'googleai/gemini-1.5-flash-latest',
    enableTracingAndMetrics: true,
    defaultModelConfig: { /* Can have its own specific config */ },
  });
} else {
  aiForNotesInstance = ai; // Fallback to the main 'ai' instance
}
export const aiForNotes = aiForNotesInstance;

// Specific API key and Genkit instance for AI Chatbot
const GOOGLE_API_KEY_CHATBOT = process.env.GOOGLE_API_KEY_CHATBOT;
let aiForChatbotInstance;

if (GOOGLE_API_KEY_CHATBOT && GOOGLE_API_KEY_CHATBOT.trim() !== '' && GOOGLE_API_KEY_CHATBOT !== GOOGLE_API_KEY) {
  console.log(`INFO: Using separate GOOGLE_API_KEY_CHATBOT for AI Chatbot.`);
  const isChatbotApiKeyPlaceholder = knownDemoKeys.some(key => GOOGLE_API_KEY_CHATBOT.startsWith(key.substring(0, key.indexOf('*')) || key));
   if (isChatbotApiKeyPlaceholder) {
    console.warn(
      `\nWARNING: GOOGLE_API_KEY_CHATBOT in .env appears to be a PLACEHOLDER or DEMO key: "${GOOGLE_API_KEY_CHATBOT}". Chatbot might fail or use main key quotas.\n`
    );
  }
  aiForChatbotInstance = genkit({
    plugins: [googleAI({ apiKey: GOOGLE_API_KEY_CHATBOT })],
    model: 'googleai/gemini-1.5-flash-latest',
    enableTracingAndMetrics: true,
    defaultModelConfig: { /* Can have its own specific config */ },
  });
} else {
  aiForChatbotInstance = ai; // Fallback to the main 'ai' instance
}
export const aiForChatbot = aiForChatbotInstance;
