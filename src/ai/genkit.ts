
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_KEY_NOTES = process.env.GOOGLE_API_KEY_NOTES;
const GOOGLE_API_KEY_CHATBOT = process.env.GOOGLE_API_KEY_CHATBOT;
const GOOGLE_API_KEY_IMAGES = process.env.GOOGLE_API_KEY_IMAGES;
const GOOGLE_API_KEY_QUIZZES = process.env.GEMINI_API_KEY; // Assign GEMINI_API_KEY for quizzes


const knownDemoKeys = [
  "YOUR_GOOGLE_AI_API_KEY_HERE",
  "YOUR_GOOGLE_API_KEY_HERE",
  "AIzaSy*********************************",
  "AIzaSyBL51Y-qaVLKSl9gwgbgsPSN1MMxh6gv5M",
  "AIzaSyBo2s_bm0B68CypK1pOhtO0Kz2dCAqIi9A",
  "AIzaSyDAH1-lAsVrUg9omTzsT3HXWMjzteTMVKg",
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
      `CRITICAL WARNING: ${keyName || 'An API key'} in .env is a KNOWN DEMO or PLACEHOLDER KEY: "${keyToCheck}".\n` +
      `AI features relying on this key WILL LIKELY FAIL or use unexpected quotas/permissions.\n` +
      `Please replace it with your actual valid API key.\n` +
      `****************************************************************************************\n`
    );
    return true;
  }
  return false;
};

// Validate the main key first. If this one is bad, all fallbacks will be bad.
isApiKeyPlaceholder(GOOGLE_API_KEY, 'GOOGLE_API_KEY (Main Fallback)');


// Main Genkit instance (used for non-specific AI tasks like search tools)
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

// Genkit instance for Study Notes (text part)
let notesInstanceKey = GOOGLE_API_KEY; 
if (GOOGLE_API_KEY_NOTES && GOOGLE_API_KEY_NOTES.trim() !== '' && GOOGLE_API_KEY_NOTES !== GOOGLE_API_KEY) {
  console.log(`INFO: Using separate GOOGLE_API_KEY_NOTES for study notes text generation.`);
  isApiKeyPlaceholder(GOOGLE_API_KEY_NOTES, 'GOOGLE_API_KEY_NOTES');
  notesInstanceKey = GOOGLE_API_KEY_NOTES; 
} else {
  console.log("INFO: GOOGLE_API_KEY_NOTES is not set or is same as main key. Notes text will use the main AI configuration.");
}
export const aiForNotes = genkit({
  plugins: [googleAI({ apiKey: notesInstanceKey })],
  model: 'googleai/gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
  defaultModelConfig: { /* Can have its own specific config if needed */ },
});


// Genkit instance for AI Chatbot
let chatbotInstanceKey = GOOGLE_API_KEY; 
if (GOOGLE_API_KEY_CHATBOT && GOOGLE_API_KEY_CHATBOT.trim() !== '' && GOOGLE_API_KEY_CHATBOT !== GOOGLE_API_KEY) {
  console.log(`INFO: Using separate GOOGLE_API_KEY_CHATBOT for AI Chatbot.`);
  isApiKeyPlaceholder(GOOGLE_API_KEY_CHATBOT, 'GOOGLE_API_KEY_CHATBOT');
  chatbotInstanceKey = GOOGLE_API_KEY_CHATBOT; 
} else {
  console.log("INFO: GOOGLE_API_KEY_CHATBOT is not set or is same as main key. Chatbot will use the main AI configuration.");
}
export const aiForChatbot = genkit({
  plugins: [googleAI({ apiKey: chatbotInstanceKey })],
  model: 'googleai/gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
  defaultModelConfig: { /* Can have its own specific config if needed */ },
});

// Genkit instance for "Image" (Text Description/Link) Generation
let imageTextInstanceKey = GOOGLE_API_KEY; 
if (GOOGLE_API_KEY_IMAGES && GOOGLE_API_KEY_IMAGES.trim() !== '') {
  console.log(`INFO: Using GOOGLE_API_KEY_IMAGES for image description/link generation.`);
  isApiKeyPlaceholder(GOOGLE_API_KEY_IMAGES, 'GOOGLE_API_KEY_IMAGES');
  imageTextInstanceKey = GOOGLE_API_KEY_IMAGES; 
} else if (GOOGLE_API_KEY_NOTES && GOOGLE_API_KEY_NOTES.trim() !== '') {
  console.log(`INFO: GOOGLE_API_KEY_IMAGES not set. Image description/link generation will fallback to GOOGLE_API_KEY_NOTES.`);
  isApiKeyPlaceholder(GOOGLE_API_KEY_NOTES, 'GOOGLE_API_KEY_NOTES (as fallback for image description/link)');
  imageTextInstanceKey = GOOGLE_API_KEY_NOTES; 
} else {
  console.log(`INFO: GOOGLE_API_KEY_IMAGES and GOOGLE_API_KEY_NOTES not set. Image description/link generation will use main GOOGLE_API_KEY.`);
}

export const aiForImages = genkit({ 
  plugins: [googleAI({ apiKey: imageTextInstanceKey })],
  model: 'googleai/gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
  defaultModelConfig: { 
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

// NEW: Genkit instance for Quizzes, Flashcards, and Custom Tests
let quizInstanceKey = GOOGLE_API_KEY; 
if (GOOGLE_API_KEY_QUIZZES && GOOGLE_API_KEY_QUIZZES.trim() !== '' && GOOGLE_API_KEY_QUIZZES !== GOOGLE_API_KEY) {
    console.log(`INFO: Using separate GEMINI_API_KEY (as GOOGLE_API_KEY_QUIZZES) for Quizzes/Flashcards/Tests.`);
    isApiKeyPlaceholder(GOOGLE_API_KEY_QUIZZES, 'GEMINI_API_KEY (for Quizzes)');
    quizInstanceKey = GOOGLE_API_KEY_QUIZZES;
} else {
    console.log("INFO: GEMINI_API_KEY is not set or is same as main key. Quizzes/Tests will use the main AI configuration.");
}
export const aiForQuizzes = genkit({
    plugins: [googleAI({ apiKey: quizInstanceKey })],
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
