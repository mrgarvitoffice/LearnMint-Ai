
// For AI Generated Content
export interface QuizQuestion {
  question: string;
  options?: string[]; 
  answer: string;
  type: 'multiple-choice' | 'short-answer'; 
  explanation?: string; 
  userAnswer?: string; 
  isCorrect?: boolean; 
}

export interface Flashcard {
  term: string;
  definition: string; 
}

// Input/Output types for AI flows (matching Zod schemas in flows)
export type GenerateStudyNotesInput = { 
  topic: string;
  image?: string; 
};
export type GenerateStudyNotesOutput = { notes: string };

export type GenerateQuizQuestionsInput = { 
  topic: string, 
  numQuestions: number, 
  difficulty?: 'easy' | 'medium' | 'hard',
  image?: string;
};
export type GenerateQuizQuestionsOutput = { questions: QuizQuestion[] };

export type GenerateFlashcardsInput = { 
  topic: string; 
  numFlashcards: number;
  image?: string; 
};
export type GenerateFlashcardsOutput = { flashcards: Flashcard[] };

// For Quiz Generation from Notes
export type GenerateQuizFromNotesInput = {
  notesContent: string;
  numQuestions: number;
};
// Output type uses GenerateQuizQuestionsOutput as the structure is the same.

// For Flashcard Generation from Notes
export type GenerateFlashcardsFromNotesInput = {
  notesContent: string;
  numFlashcards: number;
};
// Output type uses GenerateFlashcardsOutput as the structure is the same.


// For Audio Flashcard Generation
export type GenerateAudioFlashcardsInput = { 
  topic: string; 
  numFlashcards: number;
};
export type GenerateAudioFlashcardsOutput = {
  flashcards: Flashcard[];
  audioDataUri?: string;
};

// For News API
export interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  keywords: string[] | null;
  creator: string[] | null;
  video_url: string | null;
  description: string | null;
  content?: string; 
  pubDate: string;
  image_url: string | null;
  source_id: string;
  source_priority: number;
  country: string[];
  category: string[];
  language: string;
  ai_tag?: string;
  sentiment?: string;
  sentiment_stats?: object;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage?: string;
}

// For Math Fact API
export interface MathFact {
  text: string;
  number?: number; 
  found?: boolean; 
  type?: string; 
}

// For Calculator
export type CalculatorButtonType = 
  | 'digit' 
  | 'operator' 
  | 'action' 
  | 'equals'
  | 'decimal'
  | 'memory' 
  | 'scientific';

export interface CalculatorButtonConfig {
  value: string;
  label: string; 
  type: CalculatorButtonType;
  className?: string; 
  action?: string; 
}

export type UnitCategory = 'Length' | 'Temperature' | 'Weight/Mass' | 'Volume' | 'Area' | 'Speed';

export interface Unit {
  name: string;
  symbol: string;
  factor: number; 
  offset?: number; 
}

export interface UnitConverterState {
  fromUnit: string;
  toUnit: string;
  inputValue: string;
  outputValue: string;
  category: UnitCategory;
}

// For Chatbot
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; 
  timestamp: Date;
  type?: 'typing_indicator';
}

// For Custom Test
export interface TestSettings {
  topics: string[];
  notes?: string;
  sourceType?: 'topic' | 'notes' | 'recent';
  selectedRecentTopics?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  timer?: number; 
  perQuestionTimer?: number;
}


// For Definition Challenge Game in /arcade
export interface DefinitionChallengeWord {
  term: string;
  definition: string;
  hint: string; 
}

// For YouTube Search Flow
export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelTitle?: string;
  publishedAt?: string; // Added publish date
}
export interface YoutubeSearchInput {
  query: string;
  maxResults?: number;
}
export interface YoutubeSearchOutput {
  videos: YoutubeVideoItem[];
}

// For Google Books Search Flow
export interface GoogleBookItem {
  bookId: string;
  title: string;
  authors?: string[];
  description?: string;
  thumbnailUrl?: string;
  publishedDate?: string;
  pageCount?: number;
  infoLink?: string;
  embeddable: boolean; // Can the book be viewed in an embedded viewer?
  previewLink?: string; // Link to a web preview (often same as infoLink or more specific)
  webReaderLink?: string; // Specific link for web reader if available
}
export interface GoogleBooksSearchInput {
  query: string;
  maxResults?: number;
  country?: string; // Added country parameter
}
export interface GoogleBooksSearchOutput {
  books: GoogleBookItem[];
}

// Generic type for TanStack Query useQuery error (can be more specific if needed)
export type QueryError = Error & { cause?: any; errors?: {message: string}[] };
