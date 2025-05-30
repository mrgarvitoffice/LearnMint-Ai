
import { config } from 'dotenv';
config(); // Load .env variables

import './genkit'; // Ensures genkit is configured via genkit() call

// Import all your flows here so the Genkit dev UI can discover them
import '@/ai/flows/generate-study-notes';
import '@/ai/flows/generate-quiz-questions'; 
import '@/ai/flows/generate-flashcards';   
import '@/ai/flows/ai-chatbot'; 
import '@/ai/flows/generate-quiz-from-notes';
import '@/ai/flows/generate-flashcards-from-notes';
import '@/ai/flows/search-youtube-videos';
import '@/ai/flows/search-google-books';

// Flows for custom test creation are typically covered by generate-quiz-questions
// If you have a distinct flow for "generate-test-questions", import it.
// e.g., import '@/ai/flows/generate-test-questions';

// A flow for summarizing news articles might be:
// import '@/ai/flows/summarize-news-article-flow';
// Ensure this file exists if uncommented.

// The Genkit dev server will pick up flows defined with ai.defineFlow(...)
// Just importing the files that contain ai.defineFlow is sufficient for the dev UI.
