
'use server';
/**
 * @fileOverview A quiz generation AI agent that creates questions based on provided notes.
 *
 * - generateQuizFromNotes - A function that handles the quiz generation process from notes.
 * - GenerateQuizFromNotesInput - The input type for the generateQuizFromNotes function.
 * - GenerateQuizOutput - The return type (shared with generate-quiz.ts).
 */

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateQuizOutput } from './generate-quiz'; // Reuse existing output type

// Define GenerateQuizOutputSchema locally for this flow's prompt
const GenerateQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      answer: z.string().describe('The correct answer.'),
      explanation: z.string().optional().describe('A brief explanation for why the answer is correct.'),
    })
  ).describe('The generated quiz, including explanations for answers.'),
});

const GenerateQuizFromNotesInputSchema = z.object({
  notesContent: z.string().describe('The study notes content in markdown format to base the quiz on.'),
  numQuestions: z.number().min(1).max(50).describe('The number of questions to generate.'),
});
export type GenerateQuizFromNotesInput = z.infer<typeof GenerateQuizFromNotesInputSchema>;

export async function generateQuizFromNotes(input: GenerateQuizFromNotesInput): Promise<GenerateQuizOutput> {
  return generateQuizFromNotesFlow(input);
}

const prompt = aiForQuizzes.definePrompt({
  name: 'generateQuizFromNotesPrompt',
  model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
  input: {schema: GenerateQuizFromNotesInputSchema},
  output: {schema: GenerateQuizOutputSchema}, // Use the locally defined output schema
  prompt: `You are an expert quiz generator. Your task is to create a quiz with {{numQuestions}} multiple-choice questions based *solely* on the provided study notes. Each question must have several options, one correct answer, and a brief explanation for why the answer is correct.

Study Notes Content:
---
{{{notesContent}}}
---

Please ensure all questions, options, answers, and explanations are derived directly from the information within the provided notes. Do not use any external knowledge.

Output the questions in JSON format. Here is the schema:
\n{{{outputSchema}}}
`,
});

const generateQuizFromNotesFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateQuizFromNotesFlow',
    inputSchema: GenerateQuizFromNotesInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.quiz || !Array.isArray(output.quiz)) {
      console.error("[AI Flow Error - Quiz From Notes] AI returned empty or invalid data:", output);
      // Return a valid empty structure to prevent downstream errors
      return { quiz: [] }; 
    }
    return output;
  }
);
