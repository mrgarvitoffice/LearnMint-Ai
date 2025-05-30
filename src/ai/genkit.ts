
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Main GOOGLE_API_KEY and its warning
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_KEY_NOTES = process.env.GOOGLE_API_KEY_NOTES;
const GOOGLE_API_KEY_CHATBOT = process.env.GOOGLE_API_KEY_CHATBOT;

const knownDemoKeys = [
  "YOUR_GOOGLE_AI_API_KEY_HERE", // Generic placeholder from original README
  "YOUR_GOOGLE_API_KEY_HERE", // Another generic placeholder
  "AIzaSy*********************************", // Common pattern for placeholders
  "AIzaSyBL51Y-qaVLKSl9gwgbgsPSN1MMxh6gv5M", // User provided as main
  "AIzaSyBo2s_bm0B68CypK1pOhtO0Kz2dCAqIi9A", // User provided for notes
  "AIzaSyDAH1-lAsVrUg9omTzsT3HXWMjzteTMVKg", // User provided for chatbot
  "AIzaSyD0LVemqManYsFHV_k7c5mOsUVklcnvWCo" // Previous example key
];

const isApiKeyPlaceholder = (keyToCheck?: string, keyName?: string) => {
  if (!keyToCheck || keyToCheck.trim() === "") {
    console.warn(
      `\n****************************************************************************************\n` +
      `CRITICAL WARNING: ${keyName || 'An API key'} in .env is MISSING or EMPTY.\n` +
      `AI features relying on this key WILL LIKELY FAIL.\n\n` +
      `ACTION REQUIRED:\n` +
      `1. Obtain a valid API key from Google AI Studio (https://aistudio.google.com/app/apikey).\n` +
      `2. Ensure the "Generative Language API" (Gemini API) is enabled in the associated Google Cloud Project.\n` +
      `3. Ensure BILLING is enabled for that Google Cloud Project.\n` +
      `4. Add this key to .env as ${keyName || 'THE_CORRECT_VARIABLE_NAME'}="YOUR_VALID_API_KEY"\n` +
      `5. RESTART your development server.\n` +
      `****************************************************************************************\n`
    );
    return true;
  }
  const isKnownDemo = knownDemoKeys.some(demoKey => {
    if (demoKey.includes('*')) {
      return keyToCheck.startsWith(demoKey.substring(0, demoKey.indexOf('*')));
    }
    return keyToCheck === demoKey;
  });
  if (isKnownDemo) {
     console.warn(
      `\n****************************************************************************************\n` +
      `CRITICAL WARNING: ${keyName || 'An API key'} in .env is a KNOWN DEMO KEY: "${keyToCheck}".\n` +
      `AI features relying on this key WILL LIKELY FAIL or use unexpected quotas.\n` +
      `Please replace it with your actual valid API key.\n` +
      `****************************************************************************************\n`
    );
    return true;
  }
  return false;
};

isApiKeyPlaceholder(GOOGLE_API_KEY, 'GOOGLE_API_KEY');


export const ai = genkit({
  plugins: [
    googleAI({ apiKey: GOOGLE_API_KEY }), 
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
let aiForNotesInstance;
if (GOOGLE_API_KEY_NOTES && GOOGLE_API_KEY_NOTES.trim() !== '' && GOOGLE_API_KEY_NOTES !== GOOGLE_API_KEY) {
  console.log(`INFO: Using separate GOOGLE_API_KEY_NOTES for study notes generation.`);
  isApiKeyPlaceholder(GOOGLE_API_KEY_NOTES, 'GOOGLE_API_KEY_NOTES');
  aiForNotesInstance = genkit({
    plugins: [googleAI({ apiKey: GOOGLE_API_KEY_NOTES })],
    model: 'googleai/gemini-1.5-flash-latest',
    enableTracingAndMetrics: true,
    defaultModelConfig: { /* Can have its own specific config */ },
  });
} else {
  if (GOOGLE_API_KEY_NOTES && GOOGLE_API_KEY_NOTES === GOOGLE_API_KEY) {
    console.log("INFO: GOOGLE_API_KEY_NOTES is set but is the same as GOOGLE_API_KEY. Notes will use the main AI configuration.");
  } else if (!GOOGLE_API_KEY_NOTES || GOOGLE_API_KEY_NOTES.trim() === '') {
    console.log("INFO: GOOGLE_API_KEY_NOTES is not set. Notes will use the main AI configuration.");
  }
  aiForNotesInstance = ai; 
}
export const aiForNotes = aiForNotesInstance;

// Specific API key and Genkit instance for AI Chatbot
let aiForChatbotInstance;
if (GOOGLE_API_KEY_CHATBOT && GOOGLE_API_KEY_CHATBOT.trim() !== '' && GOOGLE_API_KEY_CHATBOT !== GOOGLE_API_KEY) {
  console.log(`INFO: Using separate GOOGLE_API_KEY_CHATBOT for AI Chatbot.`);
  isApiKeyPlaceholder(GOOGLE_API_KEY_CHATBOT, 'GOOGLE_API_KEY_CHATBOT');
  aiForChatbotInstance = genkit({
    plugins: [googleAI({ apiKey: GOOGLE_API_KEY_CHATBOT })],
    model: 'googleai/gemini-1.5-flash-latest',
    enableTracingAndMetrics: true,
    defaultModelConfig: { /* Can have its own specific config */ },
  });
} else {
   if (GOOGLE_API_KEY_CHATBOT && GOOGLE_API_KEY_CHATBOT === GOOGLE_API_KEY) {
    console.log("INFO: GOOGLE_API_KEY_CHATBOT is set but is the same as GOOGLE_API_KEY. Chatbot will use the main AI configuration.");
  } else if (!GOOGLE_API_KEY_CHATBOT || GOOGLE_API_KEY_CHATBOT.trim() === '') {
    console.log("INFO: GOOGLE_API_KEY_CHATBOT is not set. Chatbot will use the main AI configuration.");
  }
  aiForChatbotInstance = ai; 
}
export const aiForChatbot = aiForChatbotInstance;
