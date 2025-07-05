'use server';
/**
 * @fileOverview An AI agent that generates a text summary from content (text or image).
 * NOTE: This flow has been updated to ONLY generate text. Audio is now handled client-side.
 *
 * - generateAudioSummary - A function that handles the summary process.
 * - GenerateAudioSummaryInput - The input type for this function.
 * - GenerateAudioSummaryOutput - The return type for this function.
 */

import { aiForNotes, aiForImages } from '@/ai/genkit';
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

// Define a prompt specifically for summarizing content.
const summaryPrompt = aiForNotes.definePrompt({
  name: 'generateSummaryForAudioPrompt',
  model: 'googleai/gemini-1.5-flash-latest', 
  input: { schema: z.object({ content: z.string() }) },
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `You are an expert summarizer. Your task is to provide a clear, concise, and informative summary of the provided content. The summary should capture the main points and be easy to understand when read aloud.

  Content to Summarize:
  ---
  {{{content}}}
  ---
  
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
    let textToSummarize = input.text || "";

    // Step 1: If an image is provided, generate a description of it first using the vision-enabled client.
    if (input.imageDataUri) {
      console.log("[AI Flow - Audio Summary] Describing provided image...");
      const { output: imageDescriptionOutput, finishReason } = await aiForImages.generate({
        model: 'googleai/gemini-1.5-flash-latest', // Vision model
        prompt: [
          { text: "Your task is to describe the contents of this image in detail. Focus on the key subjects, actions, and environment. This description will be used to create a summary." },
          { media: { url: input.imageDataUri } }
        ],
      });
      if (finishReason !== 'STOP' || !imageDescriptionOutput?.text) {
        throw new Error('Failed to get a description from the image.');
      }
      textToSummarize = imageDescriptionOutput.text;
      console.log("[AI Flow - Audio Summary] Image description generated successfully.");
    }

    if (!textToSummarize) {
      throw new Error("No content (from text or image) available to summarize.");
    }

    // Step 2: Generate a text summary from the content (either original text or image description).
    console.log(`[AI Flow - Audio Summary] Summarizing text content (length: ${textToSummarize.length})...`);
    const { output: summaryOutput } = await summaryPrompt({ content: textToSummarize });
    const summaryText = summaryOutput?.summary;

    if (!summaryText) {
      throw new Error("Failed to generate a text summary from the content.");
    }
    console.log(`[AI Flow - Audio Summary] Text summary generated: "${summaryText.substring(0, 50)}..."`);

    // Step 3: Return the final output. The audioDataUri is intentionally left undefined.
    return {
      summary: summaryText,
      audioDataUri: undefined,
    };
  }
);
