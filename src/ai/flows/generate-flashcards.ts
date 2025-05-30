'use server';

/**
 * @fileOverview Flashcard generation AI agent.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate flashcards.'),
  numFlashcards: z.number().describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

// Output schema is defined locally, not exported as an object
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
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert educator specializing in creating flashcards for students.

  Given the topic: {{{topic}}}, generate a list of {{numFlashcards}} flashcards with key terms and definitions.
  Each flashcard should have a term and its corresponding definition.
  The flashcards should be comprehensive and cover the most important aspects of the topic.

  Format the output as a JSON array of objects, where each object has a 'term' and a 'definition' field.
  `,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
     if (!output || !output.flashcards || !Array.isArray(output.flashcards) || output.flashcards.length === 0) {
        console.error("[AI Flow Error - Flashcards] AI returned empty or invalid flashcard data:", output);
        throw new Error("AI failed to generate flashcards in the expected format.");
    }
    return output!;
  }
);

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  console.log(`[Server Action] generateFlashcards called for topic: ${input.topic}, numFlashcards: ${input.numFlashcards}`);
  try {
    const result = await generateFlashcardsFlow(input);
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - generateFlashcards] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate flashcards. Please try again.";
    if (error.message && (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY"))) {
      clientErrorMessage = "Flashcard Generation: Failed due to an API key issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
