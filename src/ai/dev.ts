
import { config } from 'dotenv';
config(); // Load .env variables

import './genkit'; // Ensures genkit is configured via genkit() call

// Import all your flows here so the Genkit dev UI can discover them
import '@/ai/flows/generate-study-notes';
import '@/ai/flows/generate-quiz-questions';
import '@/ai/flows/generate-flashcards';
import '@/ai/flows/ai-chatbot'; 
import '@/ai/flows/holo-chatbot';
import '@/ai/flows/megumin-chatbot';
import '@/ai/flows/generate-quiz-from-notes';
import '@/ai/flows/generate-flashcards-from-notes';
import '@/ai/flows/search-youtube-videos';
import '@/ai/flows/search-google-books';
import '@/ai/flows/generate-image-from-prompt';
// import '@/ai/flows/text-to-speech'; // DEPRECATED: Replaced with browser-based TTS.
import '@/ai/flows/generate-audio-flashcards';
import '@/ai/flows/generate-audio-summary';
import '@/ai/flows/generate-discussion-audio';


// The Genkit dev server will pick up flows defined with ai.defineFlow(...)
// Just importing the files that contain ai.defineFlow is sufficient for the dev UI.
// Ensure each flow file correctly defines its flows and any related prompts or tools.

    
