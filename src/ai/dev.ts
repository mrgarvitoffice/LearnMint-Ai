
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-quiz.ts';
import '@/ai/flows/generate-study-notes.ts';
import '@/ai/flows/ai-chatbot.ts';
import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/generate-quiz-from-notes.ts';
import '@/ai/flows/generate-flashcards-from-notes.ts';
import '@/ai/flows/search-youtube-videos.ts'; // Added new flow
import '@/ai/flows/search-google-books.ts'; // Added new flow
