
"use server";
import type { MathFact } from './types';
import { MATH_FACTS_FALLBACK } from './constants';

// Using Numbers API as a simple example. Could be swapped for another.
const MATH_FACT_API_URL = "http://numbersapi.com/random/math?json";

export async function fetchMathFact(): Promise<MathFact> {
  try {
    const response = await fetch(MATH_FACT_API_URL, { cache: 'no-store' }); // Prevent caching for random facts
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    // Numbers API returns data in a specific format, adapt if using a different API
    return {
      text: data.text || "A fascinating math fact!",
      number: data.number,
      found: data.found,
      type: data.type,
    };
  } catch (error) {
    console.warn("Failed to fetch live math fact, using fallback:", error);
    // Return a random fallback fact
    const randomIndex = Math.floor(Math.random() * MATH_FACTS_FALLBACK.length);
    return { text: MATH_FACTS_FALLBACK[randomIndex] };
  }
}
