
import { config } from 'dotenv';
config(); // Load .env variables

import './genkit'; // Ensures genkit is configured via genkit() call

// Import all your flows here so the Genkit dev UI can discover them
import '@/ai/flows/generate-study-notes';
import '@/ai/flows/generate-quiz-questions'; // As per your document
import '@/ai/flows/generate-flashcards';   // As per your document

// Existing flows that should be kept
import '@/ai/flows/ai-chatbot'; 
import '@/ai/flows/generate-quiz'; // For the dedicated /quiz page
import '@/ai/flows/generate-test-questions'; // For custom test from topic (if different from generate-quiz-questions)
import '@/ai/flows/generate-quiz-from-notes';
import '@/ai/flows/generate-flashcards-from-notes';
import '@/ai/flows/search-youtube-videos';
import '@/ai/flows/search-google-books';

// Flows mentioned in your document's example dev.ts that might be new or need checking:
// import '@/ai/flows/chat-flow'; // Covered by ai-chatbot.ts
// import '@/ai/flows/summarize-news-article-flow'; // Add if this flow exists

// The Genkit dev server will pick up flows defined with ai.defineFlow(...)
// Just importing the files that contain ai.defineFlow is sufficient for the dev UI.
