
'use server';
/**
 * @fileOverview A quiz question generation AI agent.
 *
 * - generateQuizQuestions - A function that handles the quiz question generation process.
 * - GenerateQuizQuestionsInput - The input type for this function.
 * - GenerateQuizQuestionsOutput - The return type for this function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question text.'),
  options: z.array(z.string()).optional().describe('An array of 3-4 multiple-choice options. Required for "multiple-choice" type.'),
  answer: z.string().describe('The correct answer to the question.'),
  type: z.enum(['multiple-choice', 'short-answer']).describe("The type of question: 'multiple-choice' or 'short-answer'."),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct or relevant context.'),
});

const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate quiz questions.'),
  numQuestions: z.number().min(1).max(50).describe('The number of quiz questions to generate.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of generated quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

const generateQuizQuestionsPrompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert quiz designer for educational content.
  Generate {{numQuestions}} diverse quiz questions about the topic: {{{topic}}}.
  The questions should cover key concepts and test understanding effectively.
  Include a mix of 'multiple-choice' and 'short-answer' question types.
  For 'multiple-choice' questions, provide exactly 4 distinct options, with one being the correct answer. Ensure options are plausible.
  For 'short-answer' questions, the answer should be concise (typically 1-5 words).
  For ALL questions, provide the correct 'answer'.
  For ALL questions, provide a brief 'explanation' for why the answer is correct or gives relevant context.
  
  Output the questions as a JSON object with a "questions" array, conforming to this schema:
  {{{outputSchema}}}
  Ensure the 'type' field is correctly set for each question ('multiple-choice' or 'short-answer').
  If 'type' is 'multiple-choice', the 'options' array must be present and contain 4 strings.
  If 'type' is 'short-answer', the 'options' array should be omitted (or be an empty array).`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
    // temperature: 0.7 // Adjust for creativity vs. determinism if needed
  }
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuizQuestionsPrompt(input);
    if (!output || !output.questions || !Array.isArray(output.questions) || output.questions.length === 0) {
      console.error("[AI Flow Error - Quiz Questions] Invalid or empty output from LLM:", output);
      throw new Error('AI failed to generate quiz questions in the expected format.');
    }
    // Basic validation for MCQs
    output.questions.forEach(q => {
        if (q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) { // Check for at least 2, ideally 4
            console.warn(`[AI Flow Warning - Quiz Questions] Multiple-choice question for topic "${input.topic}" has insufficient options:`, q.question);
            // Potentially throw an error or try to provide default options if critical
        }
        if (!q.explanation) {
             console.warn(`[AI Flow Warning - Quiz Questions] Question for topic "${input.topic}" is missing an explanation:`, q.question);
        }
    });
    return output;
  }
);

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  console.log(`[AI Flow] generateQuizQuestions called for topic: ${input.topic}, num: ${input.numQuestions}`);
  try {
    return await generateQuizQuestionsFlow(input);
  } catch (error: any) {
    console.error("[AI Flow Error - generateQuizQuestions] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate quiz questions. Please try again.";
    if (error.message && (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Quiz Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
