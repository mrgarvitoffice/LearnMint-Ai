
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
  { value: "top", label: "Top Headlines" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
  { value: "politics", label: "Politics" },
  { value: "food", label: "Food" },
  { value: "travel", label: "Travel" },
  { value: "entertainment", label: "Entertainment" },
  { value: "environment", label: "Environment" },
  { value: "world", label: "World" },
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
  { value: "br", label: "Brazil" },
  { value: "cn", label: "China" },
  { value: "za", label: "South Africa" },
  { value: "eg", label: "Egypt" },
  { value: "ng", label: "Nigeria" },
  { value: "mx", label: "Mexico" },
  { value: "ru", label: "Russia" },
  { value: "ae", label: "United Arab Emirates" }, // Added UAE for Dubai
];

// --- US States (for News page, State/Region filter when US is selected) ---
export const US_STATES: { value: string; label: string }[] = [
  { value: "Alabama", label: "Alabama" }, { value: "Alaska", label: "Alaska" }, { value: "Arizona", label: "Arizona" },
  { value: "Arkansas", label: "Arkansas" }, { value: "California", label: "California" }, { value: "Colorado", label: "Colorado" },
  { value: "Connecticut", label: "Connecticut" }, { value: "Delaware", label: "Delaware" }, { value: "Florida", label: "Florida" },
  { value: "Georgia", label: "Georgia" }, { value: "Hawaii", label: "Hawaii" }, { value: "Idaho", label: "Idaho" },
  { value: "Illinois", label: "Illinois" }, { value: "Indiana", label: "Indiana" }, { value: "Iowa", label: "Iowa" },
  { value: "Kansas", label: "Kansas" }, { value: "Kentucky", label: "Kentucky" }, { value: "Louisiana", label: "Louisiana" },
  { value: "Maine", label: "Maine" }, { value: "Maryland", label: "Maryland" }, { value: "Massachusetts", label: "Massachusetts" },
  { value: "Michigan", label: "Michigan" }, { value: "Minnesota", label: "Minnesota" }, { value: "Mississippi", label: "Mississippi" },
  { value: "Missouri", label: "Missouri" }, { value: "Montana", label: "Montana" }, { value: "Nebraska", label: "Nebraska" },
  { value: "Nevada", label: "Nevada" }, { value: "New Hampshire", label: "New Hampshire" }, { value: "New Jersey", label: "New Jersey" },
  { value: "New Mexico", label: "New Mexico" }, { value: "New York", label: "New York" }, { value: "North Carolina", label: "North Carolina" },
  { value: "North Dakota", label: "North Dakota" }, { value: "Ohio", label: "Ohio" }, { value: "Oklahoma", label: "Oklahoma" },
  { value: "Oregon", label: "Oregon" }, { value: "Pennsylvania", label: "Pennsylvania" }, { value: "Rhode Island", label: "Rhode Island" },
  { value: "South Carolina", label: "South Carolina" }, { value: "South Dakota", label: "South Dakota" }, { value: "Tennessee", label: "Tennessee" },
  { value: "Texas", label: "Texas" }, { value: "Utah", label: "Utah" }, { value: "Vermont", label: "Vermont" },
  { value: "Virginia", label: "Virginia" }, { value: "Washington", label: "Washington" }, { value: "West Virginia", label: "West Virginia" },
  { value: "Wisconsin", label: "Wisconsin" }, { value: "Wyoming", label: "Wyoming" },
];

// --- Canadian Provinces and Territories ---
export const CA_PROVINCES_TERRITORIES: { value: string; label: string }[] = [
  { value: "Alberta", label: "Alberta" }, { value: "British Columbia", label: "British Columbia" }, { value: "Manitoba", label: "Manitoba" },
  { value: "New Brunswick", label: "New Brunswick" }, { value: "Newfoundland and Labrador", label: "Newfoundland and Labrador" },
  { value: "Nova Scotia", label: "Nova Scotia" }, { value: "Ontario", label: "Ontario" }, { value: "Prince Edward Island", label: "Prince Edward Island" },
  { value: "Quebec", label: "Quebec" }, { value: "Saskatchewan", label: "Saskatchewan" },
  { value: "Northwest Territories", label: "Northwest Territories" }, { value: "Nunavut", label: "Nunavut" }, { value: "Yukon", label: "Yukon" },
];

// --- Australian States and Territories ---
export const AU_STATES_TERRITORIES: { value: string; label: string }[] = [
  { value: "New South Wales", label: "New South Wales" }, { value: "Victoria", label: "Victoria" }, { value: "Queensland", label: "Queensland" },
  { value: "Western Australia", label: "Western Australia" }, { value: "South Australia", label: "South Australia" }, { value: "Tasmania", label: "Tasmania" },
  { value: "Australian Capital Territory", label: "Australian Capital Territory" }, { value: "Northern Territory", label: "Northern Territory" },
];

// --- Indian States and Union Territories (Expanded) ---
export const IN_STATES_UT: { value: string; label: string }[] = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" }, { value: "Arunachal Pradesh", label: "Arunachal Pradesh" }, { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" }, { value: "Chhattisgarh", label: "Chhattisgarh" }, { value: "Goa", label: "Goa" },
  { value: "Gujarat", label: "Gujarat" }, { value: "Haryana", label: "Haryana" }, { value: "Himachal Pradesh", label: "Himachal Pradesh" },
  { value: "Jharkhand", label: "Jharkhand" }, { value: "Karnataka", label: "Karnataka" }, { value: "Kerala", label: "Kerala" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" }, { value: "Maharashtra", label: "Maharashtra" }, { value: "Manipur", label: "Manipur" },
  { value: "Meghalaya", label: "Meghalaya" }, { value: "Mizoram", label: "Mizoram" }, { value: "Nagaland", label: "Nagaland" },
  { value: "Odisha", label: "Odisha" }, { value: "Punjab", label: "Punjab" }, { value: "Rajasthan", label: "Rajasthan" },
  { value: "Sikkim", label: "Sikkim" }, { value: "Tamil Nadu", label: "Tamil Nadu" }, { value: "Telangana", label: "Telangana" },
  { value: "Tripura", label: "Tripura" }, { value: "Uttarakhand", label: "Uttarakhand" }, { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "West Bengal", label: "West Bengal" }, { value: "Andaman and Nicobar Islands", label: "Andaman & Nicobar" },
  { value: "Chandigarh", label: "Chandigarh" }, { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra & Nagar Haveli, Daman & Diu" },
  { value: "Delhi", label: "Delhi" }, { value: "Jammu and Kashmir", label: "Jammu & Kashmir" }, { value: "Ladakh", label: "Ladakh" },
  { value: "Lakshadweep", label: "Lakshadweep" }, { value: "Puducherry", label: "Puducherry" },
];

// --- German States (Bundesländer) ---
export const DE_STATES: { value: string; label: string }[] = [
  { value: "Baden-Württemberg", label: "Baden-Württemberg" }, { value: "Bavaria", label: "Bavaria (Bayern)" }, { value: "Berlin", label: "Berlin" },
  { value: "Brandenburg", label: "Brandenburg" }, { value: "Bremen", label: "Bremen" }, { value: "Hamburg", label: "Hamburg" },
  { value: "Hesse", label: "Hesse (Hessen)" }, { value: "Lower Saxony", label: "Lower Saxony (Niedersachsen)" },
  { value: "Mecklenburg-Vorpommern", label: "Mecklenburg-Vorpommern" }, { value: "North Rhine-Westphalia", label: "North Rhine-Westphalia (Nordrhein-Westfalen)" },
  { value: "Rhineland-Palatinate", label: "Rhineland-Palatinate (Rheinland-Pfalz)" }, { value: "Saarland", label: "Saarland" },
  { value: "Saxony", label: "Saxony (Sachsen)" }, { value: "Saxony-Anhalt", label: "Saxony-Anhalt (Sachsen-Anhalt)" },
  { value: "Schleswig-Holstein", label: "Schleswig-Holstein" }, { value: "Thuringia", label: "Thuringia (Thüringen)" },
];

// --- French Regions (Expanded a bit) ---
export const FR_REGIONS: { value: string; label: string }[] = [
  { value: "Auvergne-Rhône-Alpes", label: "Auvergne-Rhône-Alpes" }, { value: "Bourgogne-Franche-Comté", label: "Bourgogne-Franche-Comté" },
  { value: "Brittany", label: "Brittany (Bretagne)" }, { value: "Centre-Val de Loire", label: "Centre-Val de Loire" },
  { value: "Corsica", label: "Corsica (Corse)" }, { value: "Grand Est", label: "Grand Est" },
  { value: "Hauts-de-France", label: "Hauts-de-France" }, { value: "Île-de-France", label: "Île-de-France" },
  { value: "Normandy", label: "Normandy (Normandie)" }, { value: "Nouvelle-Aquitaine", label: "Nouvelle-Aquitaine" },
  { value: "Occitanie", label: "Occitanie" }, { value: "Pays de la Loire", label: "Pays de la Loire" },
  { value: "Provence-Alpes-Côte d'Azur", label: "Provence-Alpes-Côte d'Azur" },
];

// --- Japanese Prefectures ---
export const JP_PREFECTURES: { value: string; label: string }[] = [
  { value: "Hokkaido", label: "Hokkaido" }, { value: "Aomori", label: "Aomori" }, { value: "Iwate", label: "Iwate" },
  { value: "Miyagi", label: "Miyagi" }, { value: "Akita", label: "Akita" }, { value: "Yamagata", label: "Yamagata" },
  { value: "Fukushima", label: "Fukushima" }, { value: "Ibaraki", label: "Ibaraki" }, { value: "Tochigi", label: "Tochigi" },
  { value: "Gunma", label: "Gunma" }, { value: "Saitama", label: "Saitama" }, { value: "Chiba", label: "Chiba" },
  { value: "Tokyo", label: "Tokyo" }, { value: "Kanagawa", label: "Kanagawa" }, { value: "Niigata", label: "Niigata" },
  { value: "Toyama", label: "Toyama" }, { value: "Ishikawa", label: "Ishikawa" }, { value: "Fukui", label: "Fukui" },
  { value: "Yamanashi", label: "Yamanashi" }, { value: "Nagano", label: "Nagano" }, { value: "Gifu", label: "Gifu" },
  { value: "Shizuoka", label: "Shizuoka" }, { value: "Aichi", label: "Aichi" }, { value: "Mie", label: "Mie" },
  { value: "Shiga", label: "Shiga" }, { value: "Kyoto", label: "Kyoto" }, { value: "Osaka", label: "Osaka" },
  { value: "Hyogo", label: "Hyogo" }, { value: "Nara", label: "Nara" }, { value: "Wakayama", label: "Wakayama" },
  { value: "Tottori", label: "Tottori" }, { value: "Shimane", label: "Shimane" }, { value: "Okayama", label: "Okayama" },
  { value: "Hiroshima", label: "Hiroshima" }, { value: "Yamaguchi", label: "Yamaguchi" }, { value: "Tokushima", label: "Tokushima" },
  { value: "Kagawa", label: "Kagawa" }, { value: "Ehime", label: "Ehime" }, { value: "Kochi", label: "Kochi" },
  { value: "Fukuoka", label: "Fukuoka" }, { value: "Saga", label: "Saga" }, { value: "Nagasaki", label: "Nagasaki" },
  { value: "Kumamoto", label: "Kumamoto" }, { value: "Oita", label: "Oita" }, { value: "Miyazaki", label: "Miyazaki" },
  { value: "Kagoshima", label: "Kagoshima" }, { value: "Okinawa", label: "Okinawa" },
];

// --- United Arab Emirates Emirates (for News page filters) ---
// Note: Newsdata.io might expect "Dubai" as city and "ae" as country,
// but providing Emirates for consistency if region filtering becomes more advanced.
// For now, selecting "ae" (UAE) and typing "Dubai" in city is the primary way.
export const AE_EMIRATES: { value: string; label: string }[] = [
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Ajman", label: "Ajman" },
  { value: "Dubai", label: "Dubai" },
  { value: "Fujairah", label: "Fujairah" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
];


// --- Country-Specific Regions (for News page filters) ---
// Provides a structured way to offer specific region dropdowns for certain countries.
export const COUNTRY_SPECIFIC_REGIONS: Record<string, { value: string; label: string }[]> = {
  'us': US_STATES,
  'ca': CA_PROVINCES_TERRITORIES,
  'au': AU_STATES_TERRITORIES,
  'in': IN_STATES_UT,
  'de': DE_STATES,
  'fr': FR_REGIONS,
  'jp': JP_PREFECTURES,
  'ae': AE_EMIRATES, // Added UAE Emirates
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
