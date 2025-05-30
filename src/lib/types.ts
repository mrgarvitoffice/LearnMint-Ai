
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  keywords: string[] | null;
  creator: string[] | null;
  video_url: string | null;
  description: string | null;
  content?: string; // Optional, might not always be full
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
  number?: number; // Optional, depending on API
  found?: boolean; // Optional
  type?: string; // Optional
}

// For Calculator
export type CalculatorButtonType = 
  | 'digit' 
  | 'operator' 
  | 'action' // (AC, +/-, %)
  | 'equals'
  | 'decimal'
  | 'memory' // (MC, MR, M+, M-) - for future
  | 'scientific'; // (sin, cos, log, etc.)

export interface CalculatorButtonConfig {
  value: string;
  label: string; // What's displayed on the button
  type: CalculatorButtonType;
  className?: string; // For specific styling
  action?: string; // For scientific functions like 'sin', 'cos', etc. or actions like 'clear', 'toggleSign'
}

export type UnitCategory = 'Length' | 'Temperature' | 'Weight/Mass' | 'Volume' | 'Area' | 'Speed';

export interface Unit {
  name: string;
  symbol: string;
  factor: number; // Factor relative to a base unit within the category
  offset?: number; // For units like Celsius/Fahrenheit
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
  image?: string; // Base64 data URI for user images
  timestamp: Date;
  type?: 'typing_indicator'; // Added for typing indicator
}

// For Custom Test
export interface TestSettings {
  topics: string[];
  notes?: string;
  sourceType?: 'topic' | 'notes' | 'recent';
  selectedRecentTopics?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  timer?: number; // in minutes, 0 for no timer
  perQuestionTimer?: number; // in seconds, 0 for no timer per question
}

export interface TestQuestion extends QuizQuestion {
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface TestResult {
  questions: TestQuestion[];
  score: number;
  totalQuestions: number;
  timeTaken?: number; // in seconds
}

// For Definition Challenge Game
export interface DefinitionChallengeWord {
  term: string;
  definition: string;
  hint: string;
}
