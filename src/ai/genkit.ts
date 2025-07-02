
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Retrieve all the dedicated API keys from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Main fallback key
const GOOGLE_API_KEY_NOTES = process.env.GOOGLE_API_KEY_NOTES;
const GOOGLE_API_KEY_CHATBOT = process.env.GOOGLE_API_KEY_CHATBOT;
const GOOGLE_API_KEY_IMAGES = process.env.GOOGLE_API_KEY_IMAGES;
const GOOGLE_API_KEY_QUIZZES = process.env.GOOGLE_API_KEY_QUIZZES;

// A robust helper to check if a key is a known placeholder or simply missing.
const isApiKeyPlaceholder = (keyToCheck?: string, keyName?: string) => {
  const knownDemoKeys = [
    "YOUR_GOOGLE_AI_API_KEY_HERE", "YOUR_GOOGLE_API_KEY_HERE",
    "AIzaSyC9acF8uyEJssqF9ZaMOMvJNLag8EffJlo", "AIzaSyDEbQvjLG_Lb_OtDK-ka3CdcrU19dl72OY",
    "AIzaSyC3ZI8F99RYeMxkE5OYewSsE0o5GLHvMRs", "AIzaSyAYMVP1amZ6fow3WMJ2XspN_8CfkJXpohc",
    "AIzaSyBL51Y-qaVLKSl9gwgbgsPSN1MMxh6gv5M", "AIzaSyBr8XVh63sOjfPYA_FQf-44fkkAzpwX0EA",
  ];
  if (!keyToCheck || keyToCheck.trim() === "") {
    // This warning is silent if the key is just not set, allowing fallback.
    // It becomes critical only for the main GOOGLE_API_KEY.
    if (keyName === 'GOOGLE_API_KEY (Main Fallback)') {
        console.error(`CRITICAL WARNING: ${keyName} is MISSING. All AI features will fail.`);
    }
    return true;
  }
  const isKnownDemo = knownDemoKeys.some(demoKey => keyToCheck === demoKey);
  if (isKnownDemo) {
     console.warn(`WARNING: ${keyName} is a KNOWN DEMO KEY. It may have limited access or fail.`);
    return true;
  }
  return false;
};

// --- ISOLATED AI CLIENTS ---
// Each client uses a dedicated key and falls back to the main GOOGLE_API_KEY if its specific key is invalid.

// 1. Main Genkit instance (for general tools like search and as a final fallback)
isApiKeyPlaceholder(GOOGLE_API_KEY, 'GOOGLE_API_KEY (Main Fallback)');
export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_API_KEY })],
  enableTracingAndMetrics: true,
  model: 'gemini-1.5-flash-latest',
});

// 2. Genkit instance for Study Notes
const notesInstanceKey = !isApiKeyPlaceholder(GOOGLE_API_KEY_NOTES, 'GOOGLE_API_KEY_NOTES')
  ? GOOGLE_API_KEY_NOTES
  : GOOGLE_API_KEY;
if (notesInstanceKey === GOOGLE_API_KEY_NOTES) console.log(`INFO: Using dedicated GOOGLE_API_KEY_NOTES for study notes.`);
else console.log("INFO: Notes generation will use the main GOOGLE_API_KEY as a fallback.");
export const aiForNotes = genkit({
  plugins: [googleAI({ apiKey: notesInstanceKey })],
  model: 'gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
});

// 3. Genkit instance for AI Chatbot
const chatbotInstanceKey = !isApiKeyPlaceholder(GOOGLE_API_KEY_CHATBOT, 'GOOGLE_API_KEY_CHATBOT')
  ? GOOGLE_API_KEY_CHATBOT
  : GOOGLE_API_KEY;
if (chatbotInstanceKey === GOOGLE_API_KEY_CHATBOT) console.log(`INFO: Using dedicated GOOGLE_API_KEY_CHATBOT for AI Chatbot.`);
else console.log("INFO: Chatbot will use the main GOOGLE_API_KEY as a fallback.");
export const aiForChatbot = genkit({
  plugins: [googleAI({ apiKey: chatbotInstanceKey })],
  model: 'gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
});

// 4. Genkit instance for Image-related text generation
const imageTextInstanceKey = !isApiKeyPlaceholder(GOOGLE_API_KEY_IMAGES, 'GOOGLE_API_KEY_IMAGES')
  ? GOOGLE_API_KEY_IMAGES
  : GOOGLE_API_KEY;
if (imageTextInstanceKey === GOOGLE_API_KEY_IMAGES) console.log(`INFO: Using dedicated GOOGLE_API_KEY_IMAGES for image description/link generation.`);
else console.log("INFO: Image description generation will use the main GOOGLE_API_KEY as a fallback.");
export const aiForImages = genkit({
  plugins: [googleAI({ apiKey: imageTextInstanceKey })],
  model: 'gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
});

// 5. Genkit instance for Quizzes, Flashcards, and Custom Tests
const quizInstanceKey = !isApiKeyPlaceholder(GOOGLE_API_KEY_QUIZZES, 'GOOGLE_API_KEY_QUIZZES')
  ? GOOGLE_API_KEY_QUIZZES
  : GOOGLE_API_KEY;
if (quizInstanceKey === GOOGLE_API_KEY_QUIZZES) console.log(`INFO: Using dedicated GOOGLE_API_KEY_QUIZZES for Quizzes/Flashcards/Tests.`);
else console.log("INFO: Quizzes/Tests will use the main GOOGLE_API_KEY as a fallback.");
export const aiForQuizzes = genkit({
  plugins: [googleAI({ apiKey: quizInstanceKey })],
  model: 'gemini-1.5-flash-latest',
  enableTracingAndMetrics: true,
});
