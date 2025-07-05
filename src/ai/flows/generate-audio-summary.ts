
'use server';
/**
 * @fileOverview An AI agent that generates a text summary from content (text or image).
 * NOTE: This flow has been updated to ONLY generate text. Audio is now handled client-side.
 *
 * - generateAudioSummary - A function that handles the summary process.
 * - GenerateAudioSummaryInput - The input type for this function.
 * - GenerateAudioSummaryOutput - The return type for this function.
 */

import { aiForNotes, aiForTTS } from '@/ai/genkit';
import { z } from 'zod';
import type { GenerateAudioSummaryOutput } from '@/lib/types';

const GenerateAudioSummaryInputSchema = z.object({
  text: z.string().optional().describe("Text content to be summarized."),
  imageDataUri: z.string().optional().describe("An image (as a data URI) to be described and summarized."),
}).refine(data => data.text || data.imageDataUri, {
  message: "Either text or an image data URI must be provided.",
});
export type GenerateAudioSummaryInput = z.infer<typeof GenerateAudioSummaryInputSchema>;

const GenerateAudioSummaryOutputSchema = z.object({
  summary: z.string().describe("The generated text summary."),
  audioDataUri: z.string().optional().describe("DEPRECATED: This will no longer be populated. Audio is handled client-side."),
});

// This function is exported and called from a server action.
export async function generateAudioSummary(input: GenerateAudioSummaryInput): Promise<GenerateAudioSummaryOutput> {
  return generateAudioSummaryFlow(input);
}

// Define a prompt specifically for summarizing TEXT content.
const summaryPrompt = aiForNotes.definePrompt({
  name: 'generateSummaryForAudioPrompt',
  model: 'googleai/gemini-1.5-flash-latest', 
  input: { schema: z.object({ content: z.string() }) },
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `You are an expert summarizer. Your task is to provide a clear, concise, and informative summary of the provided text content. The summary should capture the main points and be easy to understand when read aloud.

  Content to Summarize:
  ---
  {{{content}}}
  ---
  
  Please provide your summary below.`,
});

// Define a new, dedicated prompt for summarizing an IMAGE.
// This is a more robust approach than a direct .generate() call.
const imageSummaryPrompt = aiForTTS.definePrompt({ // Using aiForTTS as it appears to have working vision permissions
  name: 'generateSummaryFromImagePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: z.object({ imageDataUri: z.string() }) },
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `You are an expert at describing and summarizing images. Your task is to provide a clear, concise, and informative summary of the provided image. The summary should capture the main subjects, actions, and environment, and be easy to understand when read aloud.

  Image to Summarize:
  {{media url=imageDataUri}}
  
  Please provide your summary below.`,
});


// The main Genkit flow definition.
const generateAudioSummaryFlow = aiForNotes.defineFlow(
  {
    name: 'generateAudioSummaryFlow',
    inputSchema: GenerateAudioSummaryInputSchema,
    outputSchema: GenerateAudioSummaryOutputSchema,
  },
  async (input) => {
    let summaryText: string | undefined;

    // Step 1: If an image is provided, use the new dedicated image summarization prompt.
    if (input.imageDataUri) {
      console.log("[AI Flow - Audio Summary] Summarizing provided image directly using dedicated prompt...");
      const { output: imageSummaryOutput } = await imageSummaryPrompt({ imageDataUri: input.imageDataUri });
      summaryText = imageSummaryOutput?.summary;

      if (!summaryText) {
        throw new Error('Failed to get a summary from the image.');
      }
      console.log("[AI Flow - Audio Summary] Image summary generated successfully via dedicated prompt.");

    } else if (input.text) {
      // Step 2: If text is provided, use the existing text summarization prompt.
      console.log(`[AI Flow - Audio Summary] Summarizing text content (length: ${input.text.length})...`);
      const { output: summaryOutput } = await summaryPrompt({ content: input.text });
      summaryText = summaryOutput?.summary;
      console.log(`[AI Flow - Audio Summary] Text summary generated successfully.`);
    }

    if (!summaryText) {
      throw new Error("No content available to summarize or summary generation failed.");
    }

    console.log(`[AI Flow - Audio Summary] Final summary generated: "${summaryText.substring(0, 50)}..."`);

    // Step 3: Return the final output.
    return {
      summary: summaryText,
      audioDataUri: undefined,
    };
  }
);
