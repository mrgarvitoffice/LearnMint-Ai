
'use server';
/**
 * @fileOverview A Genkit flow to generate a text description or a URL for an image from a text prompt, using a text model.
 *
 * - generateImageFromPrompt - A function that takes a text prompt and returns a potential image URL or a text description.
 * - GenerateImageInput - The input type for this function.
 * - GenerateImageOutput - The return type for this function.
 */

import { aiForImages } from '@/ai/genkit'; // Uses the reconfigured aiForImages instance (gemini-1.5-flash-latest)
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image description or find a link for.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().url().optional().describe('A URL to an image, if the AI provided one.'),
  textDescription: z.string().optional().describe('A text description related to the prompt, if the AI provided one.'),
  error: z.string().optional().describe('Error message if generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFromPromptFlow(input);
}

// This flow now uses gemini-1.5-flash-latest (via aiForImages instance) and expects text output.
const generateImageFromPromptFlow = aiForImages.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Image Text/Link] Attempting to get text/link for prompt: "${input.prompt.substring(0, 50)}..."`);
    try {
      // Using gemini-1.5-flash-latest, so we only expect text.
      // No 'IMAGE' modality.
      const { text, finishReason } = await aiForImages.generate({
        // Model is picked from aiForImages instance, which is now gemini-1.5-flash-latest
        prompt: `You are an assistant. The user wants a visual for the following prompt: "${input.prompt}". If you can find a relevant, publicly accessible image URL that accurately represents this, provide ONLY that URL. Otherwise, provide a concise text description of what such an image might look like. Do not add any conversational fluff.`,
        // No 'config.responseModalities' needed for text-only output from gemini-1.5-flash-latest.
      });

      if (finishReason !== 'STOP' && finishReason !== 'MODEL') {
         console.warn(`[AI Flow - Image Text/Link] Generation did not finish successfully. Reason: ${finishReason}. LLM text response: ${text}`);
         return { error: `Text/Link generation failed or was blocked. Reason: ${finishReason}. Detail: ${text || 'No additional detail.'}` };
      }
      
      if (text) {
        // Basic URL check (can be made more robust)
        const potentialUrl = text.trim();
        const isUrl = potentialUrl.startsWith('http://') || potentialUrl.startsWith('https://');
        // Further check if it looks like an image URL (very basic)
        const looksLikeImageUrl = /\.(jpeg|jpg|gif|png|webp)$/i.test(potentialUrl.split('?')[0]);

        if (isUrl && looksLikeImageUrl) {
          console.log(`[AI Flow - Image Text/Link] Successfully got an image URL: "${potentialUrl}"`);
          return { imageUrl: potentialUrl, error: undefined };
        } else {
          console.log(`[AI Flow - Image Text/Link] Successfully got a text description: "${text.substring(0,100)}..."`);
          return { textDescription: text, error: undefined };
        }
      } else {
        console.warn(`[AI Flow - Image Text/Link] Generation did not produce any text output.`);
        return { error: `No text output received from the model for prompt: "${input.prompt}"` };
      }

    } catch (error: any) {
      console.error(`[AI Flow Error - Image Text/Link] Error processing prompt "${input.prompt.substring(0,50)}...":`, error);
      let errorMessage = "Failed to process image prompt due to an unexpected error.";
      if (error.message) {
        errorMessage = error.message;
        if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY_IMAGES")) {
          errorMessage = "Image Text/Link Generation: API key issue. Check GOOGLE_API_KEY_IMAGES (and its fallbacks) and ensure billing is enabled and the Generative Language API is active for the project associated with the key.";
        } else if (error.message.includes("quota")) {
            errorMessage = "Image Text/Link Generation: Quota exceeded. Please check your Google Cloud project quotas for Generative Language API.";
        } else if (error.message.includes("billing")) {
             errorMessage = "Image Text/Link Generation: Billing issue. Please ensure billing is enabled for the Google Cloud project associated with the API key being used.";
        }
      }
      return { error: errorMessage };
    }
  }
);
