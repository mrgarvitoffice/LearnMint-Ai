
// This file defines constants used throughout the LearnMint application.
// It includes navigation items, application name, and static data for features like the library and news.

import type { LucideIcon } from 'lucide-react'; // Type for Lucide icons
// Importing all used Lucide icons for navigation and other UI elements
import {
  LayoutDashboard, // Icon for Dashboard
  FileText,        // Icon for Note Generator
  HelpCircle,      // Icon for Quiz Creator
  ListChecks,      // Icon for Flashcards
  Sparkles,        // Icon for AI Tools category and general AI features
  Calculator,      // Icon for Calculator
  MessageCircle,   // Generic message icon (not used directly in NAV_ITEMS but available)
  Newspaper,       // Icon for Daily News
  Library,         // Generic library icon (BookMarked is used for Library NAV_ITEM)
  Gamepad2,        // Icon for Arcade
  Settings,        // Icon for Settings (currently placeholder)
  BookOpen,        // Icon for OpenStax books or general reading
  Puzzle,          // Icon for Definition Challenge (generic puzzle icon)
  FlaskConical,    // Generic science icon
  Bot,             // Icon for AI Chatbot
  TestTubeDiagonal,// Icon for Custom Test
  BookMarked       // Specific icon used for the Library navigation item
} from 'lucide-react';

/**
 * @interface NavItem
 * Defines the structure for a navigation item in the application.
 * Used for rendering sidebar and header navigation links.
 */
export interface NavItem {
  title: string;         // The display text for the navigation item.
  href: string;          // The URL path for the navigation link.
  icon: LucideIcon;      // The Lucide icon component to display next to the title.
  label?: string;        // An optional label (e.g., "AI", "New") to highlight the item.
  disabled?: boolean;    // If true, the navigation item is disabled.
  external?: boolean;    // If true, the link is an external URL (opens in a new tab).
  children?: NavItem[];  // Optional array of sub-navigation items for dropdowns or nested menus.
}

// --- Main Navigation Items Configuration ---
// This array defines the structure and content of the primary navigation menu.
export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    title: 'AI Tools',     // Category for AI-powered features
    href: '#',             // '#' indicates a parent item, not a direct link
    icon: Sparkles,
    children: [            // Sub-menu items for AI Tools
      { title: 'Note Generator', href: '/notes', icon: FileText, label: 'AI' },
      { title: 'Quiz Creator', href: '/quiz', icon: HelpCircle, label: 'AI' },
      { title: 'Flashcards', href: '/flashcards', icon: ListChecks, label: 'AI' },
      { title: 'AI Chatbot (Kazuma)', href: '/chatbot', icon: Bot, label: 'AI' },
    ],
  },
  { title: 'Custom Test', href: '/custom-test', icon: TestTubeDiagonal },
  { title: 'Calculator', href: '/calculator', icon: Calculator },
  { title: 'Daily News', href: '/news', icon: Newspaper },
  { title: 'Library', href: '/library', icon: BookMarked }, // Uses BookMarked for specificity
  { title: 'Arcade', href: '/arcade', icon: Gamepad2 },
  // { title: 'Settings', href: '/settings', icon: Settings }, // Placeholder for future settings page
];

// --- Application Name ---
export const APP_NAME = "LearnMint";

// --- OpenStax Textbooks Data (for Library page) ---
// A curated list of sample OpenStax textbooks with links and subjects.
export const OPENSTAX_BOOKS = [
  { title: "College Physics 2e", url: "https://openstax.org/details/books/college-physics-2e", subject: "Physics", coverImage: "https://placehold.co/150x200.png?text=Physics+2e", dataAiHint: "textbook physics" },
  { title: "University Physics Volume 1", url: "https://openstax.org/details/books/university-physics-volume-1", subject: "Physics", coverImage: "https://placehold.co/150x200.png?text=Univ+Physics+1", dataAiHint: "textbook physics" },
  { title: "Biology 2e", url: "https://openstax.org/details/books/biology-2e", subject: "Biology", coverImage: "https://placehold.co/150x200.png?text=Biology+2e", dataAiHint: "textbook biology" },
  { title: "Chemistry 2e", url: "https://openstax.org/details/books/chemistry-2e", subject: "Chemistry", coverImage: "https://placehold.co/150x200.png?text=Chemistry+2e", dataAiHint: "textbook chemistry" },
  { title: "Calculus Volume 1", url: "https://openstax.org/details/books/calculus-volume-1", subject: "Mathematics", coverImage: "https://placehold.co/150x200.png?text=Calculus+Vol+1", dataAiHint: "textbook math" },
  { title: "Algebra and Trigonometry 2e", url: "https://openstax.org/details/books/algebra-and-trigonometry-2e", subject: "Mathematics", coverImage: "https://placehold.co/150x200.png?text=Algebra+Trig", dataAiHint: "textbook math" },
];

// --- Math Facts Fallback Data (for Library page) ---
// Used if the live Math Fact API fails.
export const MATH_FACTS_FALLBACK = [
  "The number 0 is the only number that cannot be represented by Roman numerals.",
  "Pi (π) is an irrational number, meaning its decimal representation never ends and never repeats.",
  "A 'googol' is 1 followed by 100 zeros.",
  "The Fibonacci sequence is found in many natural patterns, like the arrangement of seeds in a sunflower.",
  "The sum of angles in any triangle is always 180 degrees.",
  "Prime numbers are natural numbers greater than 1 that have no positive divisors other than 1 and themselves."
];

// --- News API Categories (for News page filters) ---
export const NEWS_CATEGORIES = [
  { value: "top", label: "Top Headlines" }, // 'top' is often a special category in news APIs
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
  // Note: Newsdata.io also supports 'politics', 'food', 'travel', 'entertainment', 'environment', 'world'
  // These can be added if desired.
];

// --- News API Countries (for News page filters) ---
// A selection of countries with their ISO 2-letter codes.
export const NEWS_COUNTRIES: { value: string; label: string }[] = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "in", label: "India" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  // More countries can be added from Newsdata.io's supported list.
];

// --- US States (for News page, State/Region filter when US is selected) ---
export const US_STATES: { value: string; label: string }[] = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

// --- Country-Specific Regions (for News page filters) ---
// Provides a structured way to offer specific region dropdowns for certain countries.
// Currently, only US states are defined. More can be added (e.g., Canadian provinces).
export const COUNTRY_SPECIFIC_REGIONS: Record<string, { value: string; label: string }[]> = {
  'us': US_STATES, // When 'us' (United States) is selected, the US_STATES list will be used for the region dropdown.
  // 'ca': [ {value: 'ON', label: 'Ontario'}, {value: 'QC', label: 'Quebec'}, ... ], // Example for Canada
};


// --- Definition Challenge Words (for Arcade page) ---
// A list of words with their definitions and hints for the Definition Challenge game.
export const DEFINITION_CHALLENGE_WORDS = [
  { term: "Photosynthesis", definition: "The process by which green plants use sunlight, water, and carbon dioxide to create their own food and release oxygen.", hint: "Starts with 'P', essential for plant life." },
  { term: "Gravity", definition: "The force that attracts a body toward the center of the earth, or toward any other physical body having mass.", hint: "Keeps us on the ground, related to apples and Newton." },
  { term: "Democracy", definition: "A system of government by the whole population or all the eligible members of a state, typically through elected representatives.", hint: "Rule by the people, ancient Greek origins." },
  { term: "Mitosis", definition: "A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.", hint: "Cellular reproduction, not meiosis." },
  { term: "Ecosystem", definition: "A biological community of interacting organisms and their physical environment.", hint: "Includes living and non-living components in an area." },
  { term: "Metaphor", definition: "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.", hint: "Comparing without 'like' or 'as'." },
  { term: "Algorithm", definition: "A process or set of rules to be followed in calculations or other problem-solving operations, especially by a computer.", hint: "Step-by-step instructions." },
  { term: "Renaissance", definition: "The revival of art and literature under the influence of classical models in the 14th–16th centuries.", hint: "French for 'rebirth'." },
  { term: "Evaporation", definition: "The process of turning from liquid into vapor.", hint: "Water cycle component." },
  { term: "Hypothesis", definition: "A supposition or proposed explanation made on the basis of limited evidence as a starting point for further investigation.", hint: "Educated guess in science." },
  { term: "Soliloquy", definition: "An act of speaking one's thoughts aloud when by oneself or regardless of any hearers, especially by a character in a play.", hint: "Dramatic speech, alone on stage." },
  { term: "Inflation", definition: "A general increase in prices and fall in the purchasing value of money.", hint: "Economic term, money buys less." },
];
```