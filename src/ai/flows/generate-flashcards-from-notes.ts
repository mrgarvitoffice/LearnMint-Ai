
'use server';
/**
 * @fileOverview A flashcard generation AI agent that creates flashcards based on provided notes.
 *
 * - generateFlashcardsFromNotes - A function that handles the flashcard generation process from notes.
 * - GenerateFlashcardsFromNotesInput - The input type for this function.
 * - GenerateFlashcardsOutput - The return type (shared with generate-flashcards.ts).
 */

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateFlashcardsOutput } from './generate-flashcards'; // Reuse existing output type

// Define GenerateFlashcardsOutputSchema locally for this flow's prompt
const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z
    .array(
      z.object({
        term: z.string().describe('The term to be defined.'),
        definition: z.string().describe('The definition of the term.'),
      })
    )
    .describe('An array of flashcards, each with a term and its definition.'),
});

const GenerateFlashcardsFromNotesInputSchema = z.object({
  notesContent: z.string().describe('The study notes content in markdown format to base the flashcards on.'),
  numFlashcards: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsFromNotesInput = z.infer<typeof GenerateFlashcardsFromNotesInputSchema>;

export async function generateFlashcardsFromNotes(input: GenerateFlashcardsFromNotesInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFromNotesFlow(input);
}

const prompt = aiForQuizzes.definePrompt({
  name: 'generateFlashcardsFromNotesPrompt',
  model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
  input: {schema: GenerateFlashcardsFromNotesInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema}, // Use the locally defined output schema
  prompt: `You are an expert educator specializing in creating flashcards. Your task is to generate {{numFlashcards}} flashcards based *solely* on the provided study notes. Each flashcard should have a key term and its corresponding definition.

Study Notes Content:
---
{{{notesContent}}}
---

Please ensure all terms and definitions are derived directly from the information within the provided notes. Do not use any external knowledge.
The flashcards should cover the most important aspects of the notes.

Format the output as a JSON array of objects, where each object has a 'term' and a 'definition' field.
Example schema for output:
\n{{{outputSchema}}}
`,
});

const generateFlashcardsFromNotesFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateFlashcardsFromNotesFlow',
    inputSchema: GenerateFlashcardsFromNotesInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.flashcards || !Array.isArray(output.flashcards)) {
      console.error("[AI Flow Error - Flashcards From Notes] AI returned empty or invalid data:", output);
      return { flashcards: [] };
    }
    return output;
  }
);
