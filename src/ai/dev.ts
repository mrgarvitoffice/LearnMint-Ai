
import { config } from 'dotenv';
config(); // Load .env variables

import './genkit'; // Ensures genkit is configured via genkit() call

// Import all your flows here so the Genkit dev UI can discover them
import '@/ai/flows/generate-study-notes';
import '@/ai/flows/generate-quiz-questions'; 
import '@/ai/flows/generate-flashcards';   
import '@/ai/flows/ai-chatbot'; 

// These are for "generate from notes" features, if they exist.
// Based on your document, primary generation is topic-based, redirecting to /study.
// If you have specific flows for generating quizzes/flashcards *from existing notes content*,
// ensure they are correctly implemented and imported.
// Example: import '@/ai/flows/generate-quiz-from-notes';
// Example: import '@/ai/flows/generate-flashcards-from-notes';

// Flows for custom test creation, if different from generate-quiz-questions
// Example: import '@/ai/flows/generate-test-questions';

// Flows for library page (YouTube, Google Books search)
import '@/ai/flows/search-youtube-videos';
import '@/ai/flows/search-google-books';


// The Genkit dev server will pick up flows defined with ai.defineFlow(...)
// Just importing the files that contain ai.defineFlow is sufficient for the dev UI.
// Remove or comment out imports for flows that don't exist or are not yet implemented.
// For example, your document mentioned 'chat-flow', 'generate-test-questions', 'summarize-news-article-flow'
// but these specific file names might not exactly match what you have or intend.
// Ensure the paths here match your actual flow file locations.
