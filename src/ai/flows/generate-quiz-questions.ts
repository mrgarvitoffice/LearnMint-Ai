
'use server';
/**
 * @fileOverview A quiz question generation AI agent.
 *
 * - generateQuizQuestions - A function that handles the quiz question generation process.
 * - GenerateQuizQuestionsInput - The input type for this function.
 * - GenerateQuizQuestionsOutput - The return type for this function.
 */

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'zod';

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question text.'),
  options: z.array(z.string()).optional().describe('An array of 3-4 multiple-choice options. Required for "multiple-choice" type.'),
  answer: z.string().describe('The correct answer to the question. For multiple-choice, this must be the full text of the correct option.'),
  type: z.enum(['multiple-choice', 'short-answer']).describe("The type of question: 'multiple-choice' or 'short-answer'."),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct or relevant context.'),
});

// NOT EXPORTED as an object
const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate quiz questions.'),
  numQuestions: z.number().min(1).max(50).describe('The number of quiz questions to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the quiz questions.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

// NOT EXPORTED as an object
const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of generated quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

const generateQuizQuestionsPrompt = aiForQuizzes.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are an expert quiz designer for educational content.
  Generate {{numQuestions}} diverse quiz questions about the topic: {{{topic}}}{{#if difficulty}} (Difficulty: {{{difficulty}}}){{/if}}.
  The questions should cover key concepts and test understanding effectively.

  Include a mix of 'multiple-choice' and 'short-answer' question types.
  The proportion of 'short-answer' questions should generally be between 15% and 30% of the total number of questions ({{numQuestions}}).
  For example:
  - If {{numQuestions}} is 30, aim for approximately 5-8 'short-answer' questions.
  - If {{numQuestions}} is 10, aim for approximately 2-3 'short-answer' questions.
  - If {{numQuestions}} is 5, aim for approximately 1-2 'short-answer' questions.
  The majority of questions should be 'multiple-choice'.

  For 'multiple-choice' questions:
    - Provide exactly 4 distinct and plausible options.
    - The 'answer' field MUST contain the full text of the correct option (e.g., "Paris"), not just a letter (e.g., "C").

  For 'short-answer' questions:
    - The 'answer' should be concise (typically 1-5 words).

  For ALL questions:
    - Provide the correct 'answer' as specified above.
    - Provide a brief 'explanation' for why the answer is correct or gives relevant context.
  
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
  }
});

const generateQuizQuestionsFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Quiz] Generating ${input.numQuestions} quiz questions for topic: ${input.topic}, difficulty: ${input.difficulty || 'not specified'}`);
    const { output } = await generateQuizQuestionsPrompt(input);
    if (!output || !output.questions || !Array.isArray(output.questions) || output.questions.length === 0) {
      console.error("[AI Flow Error - Quiz Questions] Invalid or empty output from LLM:", output);
      throw new Error('AI failed to generate quiz questions in the expected format.');
    }
    output.questions.forEach(q => {
        if (q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) { 
            console.warn(`[AI Flow Warning - Quiz Questions] Multiple-choice question for topic "${input.topic}" has insufficient options:`, q.question);
        }
        if (!q.explanation) {
             console.warn(`[AI Flow Warning - Quiz Questions] Question for topic "${input.topic}" is missing an explanation:`, q.question);
        }
    });
    console.log(`[AI Flow - Quiz] Successfully generated ${output.questions.length} quiz questions for topic: ${input.topic}`);
    return output;
  }
);

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  console.log(`[AI Wrapper] generateQuizQuestions called for topic: ${input.topic}, num: ${input.numQuestions}, difficulty: ${input.difficulty}`);
  try {
    return await generateQuizQuestionsFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateQuizQuestions] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate quiz questions. Please try again.";
    const lowerCaseError = error.message?.toLowerCase() || "";

    if (lowerCaseError.includes("model not found") || lowerCaseError.includes("permission denied") || lowerCaseError.includes("api key not valid")) {
       clientErrorMessage = "Quiz Generation: Failed due to an API key or project configuration issue. Please check that GOOGLE_API_KEY_QUIZZES (or its fallback) is correct and that the 'Generative Language API' is enabled with billing in its Google Cloud project.";
    } else if (lowerCaseError.includes("api key") || lowerCaseError.includes("google_api_key")) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Quiz Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
