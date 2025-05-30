// src/ai/flows/generate-study-notes.ts
'use server';

/**
 * @fileOverview A study note generation AI agent.
 *
 * - generateStudyNotes - A function that handles the study note generation process.
 * - GenerateStudyNotesInput - The input type for the generateStudyNotes function.
 * - GenerateStudyNotesOutput - The return type for the generateStudyNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStudyNotesInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate study notes.'),
});
export type GenerateStudyNotesInput = z.infer<typeof GenerateStudyNotesInputSchema>;

const GenerateStudyNotesOutputSchema = z.object({
  notes: z.string().describe('The generated study notes in markdown format.'),
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  return generateStudyNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyNotesPrompt',
  input: {schema: GenerateStudyNotesInputSchema},
  output: {schema: GenerateStudyNotesOutputSchema},
  prompt: `You are an expert educator. Generate comprehensive study notes on the following topic, formatted in markdown:

Topic: {{{topic}}}`,
});

const generateStudyNotesFlow = ai.defineFlow(
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateStudyNotesInputSchema,
    outputSchema: GenerateStudyNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
