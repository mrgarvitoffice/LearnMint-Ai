
// Matches the more detailed QuizQuestionSchema from generate-quiz-questions.ts
export interface QuizQuestion {
  question: string;
  options?: string[]; // Optional: only for multiple-choice (e.g. 4 options)
  answer: string;
  type: 'multiple-choice' | 'short-answer'; // To distinguish question types
  explanation?: string;
  userAnswer?: string; // For Custom Test review
  isCorrect?: boolean; // For Custom Test review
}

// Matches FlashcardSchema from generate-flashcards.ts
export interface Flashcard {
  term: string;
  definition: string; // Can include bullet points or formulas
}

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

export interface MathFact {
  text: string;
  number?: number; 
  found?: boolean; 
  type?: string; 
}

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; 
  timestamp: Date;
  type?: 'typing_indicator';
}

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

// For the /study page, using types from the AI flows
export type { GenerateStudyNotesOutput, GenerateStudyNotesInput } from '@/ai/flows/generate-study-notes';
export type { GenerateQuizQuestionsOutput, GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';
export type { GenerateFlashcardsOutput, GenerateFlashcardsInput } from '@/ai/flows/generate-flashcards';


// For Definition Challenge Game in /arcade
export interface DefinitionChallengeWord {
  term: string;
  definition: string;
  hint: string; 
}

    