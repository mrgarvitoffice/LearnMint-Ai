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

export const APP_NAME = "LearnFlow";

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

export const DEFINITION_CHALLENGE_WORDS = [
  { term: "Photosynthesis", definition: "The process by which green plants use sunlight, water, and carbon dioxide to create their own food and release oxygen.", hint: "Starts with 'P', essential for plant life." },
  { term: "Gravity", definition: "The force that attracts a body toward the center of the earth, or toward any other physical body having mass.", hint: "Keeps us on the ground, related to apples and Newton." },
  { term: "Democracy", definition: "A system of government by the whole population or all the eligible members of a state, typically through elected representatives.", hint: "Rule by the people, ancient Greek origins." },
  { term: "Mitosis", definition: "A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.", hint: "Cellular reproduction, not meiosis." },
  { term: "Ecosystem", definition: "A biological community of interacting organisms and their physical environment.", hint: "Includes living and non-living components in an area." },
];
