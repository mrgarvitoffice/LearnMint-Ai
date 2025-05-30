
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  ListChecks,
  Sparkles,
  Calculator,
  MessageCircle,
  Newspaper,
  Library,
  Gamepad2,
  Settings,
  BookOpen,
  Puzzle,
  FlaskConical,
  Bot,
  TestTubeDiagonal,
  BookMarked
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    title: 'AI Tools',
    href: '#', // Parent item, not a direct link
    icon: Sparkles,
    children: [
      { title: 'Note Generator', href: '/notes', icon: FileText, label: 'AI' },
      { title: 'Quiz Creator', href: '/quiz', icon: HelpCircle, label: 'AI' },
      { title: 'Flashcards', href: '/flashcards', icon: ListChecks, label: 'AI' },
      { title: 'AI Chatbot (Megumin)', href: '/chatbot', icon: Bot, label: 'AI' },
    ],
  },
  { title: 'Custom Test', href: '/custom-test', icon: TestTubeDiagonal },
  { title: 'Calculator', href: '/calculator', icon: Calculator },
  { title: 'Daily News', href: '/news', icon: Newspaper },
  { title: 'Library', href: '/library', icon: BookMarked },
  { title: 'Arcade', href: '/arcade', icon: Gamepad2 },
  // { title: 'Settings', href: '/settings', icon: Settings }, // Placeholder for future settings
];

export const APP_NAME = "LearnMint";

export const OPENSTAX_BOOKS = [
  { title: "College Physics 2e", url: "https://openstax.org/details/books/college-physics-2e", subject: "Physics", coverImage: "https://placehold.co/150x200.png?text=Physics+2e", dataAiHint: "textbook physics" },
  { title: "University Physics Volume 1", url: "https://openstax.org/details/books/university-physics-volume-1", subject: "Physics", coverImage: "https://placehold.co/150x200.png?text=Univ+Physics+1", dataAiHint: "textbook physics" },
  { title: "Biology 2e", url: "https://openstax.org/details/books/biology-2e", subject: "Biology", coverImage: "https://placehold.co/150x200.png?text=Biology+2e", dataAiHint: "textbook biology" },
  { title: "Chemistry 2e", url: "https://openstax.org/details/books/chemistry-2e", subject: "Chemistry", coverImage: "https://placehold.co/150x200.png?text=Chemistry+2e", dataAiHint: "textbook chemistry" },
  { title: "Calculus Volume 1", url: "https://openstax.org/details/books/calculus-volume-1", subject: "Mathematics", coverImage: "https://placehold.co/150x200.png?text=Calculus+Vol+1", dataAiHint: "textbook math" },
  { title: "Algebra and Trigonometry 2e", url: "https://openstax.org/details/books/algebra-and-trigonometry-2e", subject: "Mathematics", coverImage: "https://placehold.co/150x200.png?text=Algebra+Trig", dataAiHint: "textbook math" },
];

export const MATH_FACTS_FALLBACK = [
  "The number 0 is the only number that cannot be represented by Roman numerals.",
  "Pi (π) is an irrational number, meaning its decimal representation never ends and never repeats.",
  "A 'googol' is 1 followed by 100 zeros.",
  "The Fibonacci sequence is found in many natural patterns, like the arrangement of seeds in a sunflower.",
  "The sum of angles in any triangle is always 180 degrees.",
  "Prime numbers are natural numbers greater than 1 that have no positive divisors other than 1 and themselves."
];

export const NEWS_CATEGORIES = [
  { value: "top", label: "Top Headlines" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
];

export const NEWS_COUNTRIES: { value: string; label: string }[] = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "in", label: "India" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
];

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

// Add more country-specific regions if needed
export const COUNTRY_SPECIFIC_REGIONS: Record<string, { value: string; label: string }[]> = {
  'us': US_STATES,
  // 'ca': [ {value: 'ON', label: 'Ontario'}, {value: 'QC', label: 'Quebec'}, ... ], // Example for Canada
};


export const DEFINITION_CHALLENGE_WORDS = [
  { term: "Photosynthesis", definition: "The process by which green plants use sunlight, water, and carbon dioxide to create their own food and release oxygen.", hint: "Starts with 'P', essential for plant life." },
  { term: "Gravity", definition: "The force that attracts a body toward the center of the earth, or toward any other physical body having mass.", hint: "Keeps us on the ground, related to apples and Newton." },
  { term: "Democracy", definition: "A system of government by the whole population or all the eligible members of a state, typically through elected representatives.", hint: "Rule by the people, ancient Greek origins." },
  { term: "Mitosis", definition: "A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.", hint: "Cellular reproduction, not meiosis." },
  { term: "Ecosystem", definition: "A biological community of interacting organisms and their physical environment.", hint: "Includes living and non-living components in an area." },
];

