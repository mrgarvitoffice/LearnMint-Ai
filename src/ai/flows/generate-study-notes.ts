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
  notes: z
    .string()
    .describe(
      'The generated study notes in markdown format, including a summary, headings, point-wise details, and image placeholders.'
    ),
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  return generateStudyNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyNotesPrompt',
  input: {schema: GenerateStudyNotesInputSchema},
  output: {schema: GenerateStudyNotesOutputSchema},
  prompt: `You are an expert educator tasked with creating high-quality, comprehensive study notes similar to those a top student would prepare.

Topic: {{{topic}}}

Please generate study notes on this topic with the following characteristics:
1.  **Format:** Use Markdown.
2.  **Structure:**
    *   Start with a concise summary (2-3 sentences) of the entire topic.
    *   Use clear, big headings (e.g., ## Main Section, ### Sub-section) to organize the content logically.
    *   Under each heading, provide detailed information in a point-wise manner (using bullet points '-' or numbered lists '1.').
    *   Ensure the notes are comprehensive and cover key concepts, definitions, important facts, and examples where relevant.
3.  **Content Style:**
    *   Write in clear, easy-to-understand language.
    *   Be accurate and thorough.
4.  **Visuals (Placeholders):**
    *   Where a diagram, chart, or image would significantly enhance understanding, insert a placeholder in the format: [Image: descriptive query for the image]. For example: [Image: diagram of a plant cell] or [Image: timeline of World War 2 major events]. Do NOT generate actual images.

Aim for notes that are well-organized, informative, and easy to study from.
The entire output, including the summary, headings, points, and image placeholders, should be a single markdown string.
`,
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
