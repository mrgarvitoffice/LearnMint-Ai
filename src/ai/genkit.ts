
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Retrieve the primary API key from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// A robust helper to check if a key is a known placeholder or simply missing.
const isApiKeyPlaceholder = (keyToCheck?: string, keyName?: string) => {
  if (!keyToCheck || keyToCheck.trim() === "") {
    if (keyName === 'GOOGLE_API_KEY (Main)') {
        console.error(`CRITICAL WARNING: ${keyName} is MISSING. All AI features will fail.`);
    }
    return true;
  }
  return false;
};

// --- UNIFIED AI CLIENT ---
// All features will now use this single Genkit instance.
// This simplifies configuration and debugging. To get the app working,
// you only need to ensure this one GOOGLE_API_KEY is associated with a
// Google Cloud project that has the "Generative Language API" and billing enabled.

isApiKeyPlaceholder(GOOGLE_API_KEY, 'GOOGLE_API_KEY (Main)');
export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_API_KEY })],
  enableTracingAndMetrics: true,
});

// For simplicity and clarity, the specific AI clients have been consolidated.
// If you successfully configure multiple keys in the future, we can re-introduce them.
export const aiForNotes = ai;
export const aiForChatbot = ai;
export const aiForImages = ai;
export const aiForQuizzes = ai;
