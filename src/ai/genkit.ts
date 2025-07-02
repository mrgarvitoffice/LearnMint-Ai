
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Retrieve all potential API keys from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_KEY_NOTES = process.env.GOOGLE_API_KEY_NOTES;
const GOOGLE_API_KEY_CHATBOT = process.env.GOOGLE_API_KEY_CHATBOT;
const GOOGLE_API_KEY_IMAGES = process.env.GOOGLE_API_KEY_IMAGES;
const GOOGLE_API_KEY_QUIZZES = process.env.GOOGLE_API_KEY_QUIZZES;

// A robust helper to check if a key is a known placeholder or simply missing.
const isApiKeyMissingOrPlaceholder = (keyToCheck?: string, keyName?: string) => {
  if (!keyToCheck || keyToCheck.trim() === '') {
    if (keyName) {
      // Log a warning if a specific key is missing, but not if it's the main key (which gets a critical error)
      console.warn(
        `LearnMint AI Config: ${keyName} is not set. The feature will use the main GOOGLE_API_KEY as a fallback.`
      );
    }
    return true;
  }
  return false;
};

// --- Main AI Client (General Purpose & Fallback) ---
if (isApiKeyMissingOrPlaceholder(GOOGLE_API_KEY)) {
  console.error(
    '************************************************************************************'
  );
  console.error(
    'CRITICAL AI CONFIG ERROR: The main GOOGLE_API_KEY is MISSING in your .env file.'
  );
  console.error(
    'At least one primary key is required for AI features to function.'
  );
  console.error('Please ensure GOOGLE_API_KEY is set correctly.');
  console.error(
    '************************************************************************************'
  );
}
export const ai = genkit({
  plugins: [googleAI({apiKey: GOOGLE_API_KEY, model: 'googleai/gemini-2.5-flash-lite-preview-06-17'})],
  enableTracingAndMetrics: true,
});

// --- Notes-Specific AI Client ---
// Uses GOOGLE_API_KEY_NOTES if available, otherwise falls back to the main key.
const notesApiKey = !isApiKeyMissingOrPlaceholder(
  GOOGLE_API_KEY_NOTES,
  'GOOGLE_API_KEY_NOTES'
)
  ? GOOGLE_API_KEY_NOTES
  : GOOGLE_API_KEY;
export const aiForNotes = genkit({
  plugins: [googleAI({apiKey: notesApiKey, model: 'googleai/gemini-2.5-flash-lite-preview-06-17'})],
  enableTracingAndMetrics: true,
});

// --- Chatbot-Specific AI Client ---
// Uses GOOGLE_API_KEY_CHATBOT if available, otherwise falls back to the main key.
const chatbotApiKey = !isApiKeyMissingOrPlaceholder(
  GOOGLE_API_KEY_CHATBOT,
  'GOOGLE_API_KEY_CHATBOT'
)
  ? GOOGLE_API_KEY_CHATBOT
  : GOOGLE_API_KEY;
export const aiForChatbot = genkit({
  plugins: [googleAI({apiKey: chatbotApiKey, model: 'googleai/gemini-2.5-flash-lite-preview-06-17'})],
  enableTracingAndMetrics: true,
});

// --- Image Generation-Specific AI Client ---
// Uses GOOGLE_API_KEY_IMAGES if available, falls back to GOOGLE_API_KEY_NOTES, then to the main key.
let imageApiKey = GOOGLE_API_KEY_IMAGES;
if (isApiKeyMissingOrPlaceholder(imageApiKey, 'GOOGLE_API_KEY_IMAGES')) {
  imageApiKey = GOOGLE_API_KEY_NOTES;
  if (
    isApiKeyMissingOrPlaceholder(
      imageApiKey,
      'GOOGLE_API_KEY_NOTES (as fallback for images)'
    )
  ) {
    imageApiKey = GOOGLE_API_KEY;
  }
}
export const aiForImages = genkit({
  plugins: [googleAI({apiKey: imageApiKey, model: 'googleai/gemini-2.5-flash-lite-preview-06-17'})],
  enableTracingAndMetrics: true,
});

// --- Quizzes & Flashcards-Specific AI Client ---
// Uses GOOGLE_API_KEY_QUIZZES if available, otherwise falls back to the main key.
const quizzesApiKey = !isApiKeyMissingOrPlaceholder(
  GOOGLE_API_KEY_QUIZZES,
  'GOOGLE_API_KEY_QUIZZES'
)
  ? GOOGLE_API_KEY_QUIZZES
  : GOOGLE_API_KEY;
export const aiForQuizzes = genkit({
  plugins: [googleAI({apiKey: quizzesApiKey, model: 'googleai/gemini-2.5-flash-lite-preview-06-17'})],
  enableTracingAndMetrics: true,
});
