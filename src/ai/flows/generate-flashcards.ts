
'use server';
/**
 * @fileOverview Flashcard generation AI agent.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'zod';

const FlashcardSchema = z.object({
  term: z.string().describe('The key term, concept, or question for the flashcard front.'),
  definition: z.string().describe('A concise definition, explanation, or answer for the flashcard back. For complex topics, use 2-3 bullet points. Include formulas if relevant and concise enough for a flashcard.'),
});

// NOT EXPORTED as an object
const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate flashcards.'),
  numFlashcards: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

// NOT EXPORTED as an object
const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

const generateFlashcardsPrompt = aiForQuizzes.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert educator specializing in creating effective flashcards for students.
  Given the topic: {{{topic}}}, generate a list of {{numFlashcards}} flashcards.
  Each flashcard must have a key 'term' (for the front) and its corresponding 'definition' (for the back).
  The 'term' should be a specific keyword, concept, or a short question.
  The 'definition' should be concise and clear. For more complex definitions, use 2-3 bullet points to break down the information. If the term involves a formula crucial for quick recall, include it in the definition in a clear, simple format.
  The flashcards should cover the most important vocabulary, formulas, and core concepts of the topic suitable for quick recall and study.

  Format the output as a JSON object with a "flashcards" array, conforming to this schema:
  {{{outputSchema}}}
  `,
  config: {
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateFlashcardsFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Flashcards] Generating ${input.numFlashcards} flashcards for topic: ${input.topic}`);
    const { output } = await generateFlashcardsPrompt(input);
    if (!output || !output.flashcards || !Array.isArray(output.flashcards) || output.flashcards.length === 0) {
      console.error("[AI Flow Error - Flashcards] Invalid or empty output from LLM:", output);
      throw new Error('AI failed to generate flashcards in the expected format.');
    }
    console.log(`[AI Flow - Flashcards] Successfully generated ${output.flashcards.length} flashcards for topic: ${input.topic}`);
    return output;
  }
);

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  console.log(`[AI Wrapper] generateFlashcards called for topic: ${input.topic}, num: ${input.numFlashcards}`);
  try {
    return await generateFlashcardsFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateFlashcards] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate flashcards. Please try again.";
    if (error.message && (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Flashcard Generation: Failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
