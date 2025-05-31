
'use server';
/**
 * @fileOverview A Genkit flow to generate an image from a text prompt.
 *
 * - generateImageFromPrompt - A function that takes a text prompt and returns an image data URI.
 * - GenerateImageInput - The input type for this function.
 * - GenerateImageOutput - The return type for this function.
 */

import { aiForImages } from '@/ai/genkit'; // Use the dedicated AI instance for images
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().url().describe('The generated image as a data URI (e.g., data:image/png;base64,...).')
    .nullable().describe('Null if image generation failed.'),
  error: z.string().optional().describe('Error message if image generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFromPromptFlow(input);
}

// This flow does not define a prompt template itself, but directly calls ai.generate
const generateImageFromPromptFlow = aiForImages.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Image] Attempting to generate image for prompt: "${input.prompt.substring(0, 50)}..."`);
    try {
      const { media, finishReason, text } = await aiForImages.generate({
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], 
        },
      });

      if (finishReason !== 'STOP' && finishReason !== 'MODEL') {
         console.warn(`[AI Flow - Image] Image generation did not finish successfully. Reason: ${finishReason}. LLM text response: ${text}`);
         return { imageDataUri: null, error: `Image generation failed or was blocked. Reason: ${finishReason}. Detail: ${text || 'No additional detail.'}` };
      }
      
      if (media && media.url && media.url.startsWith('data:image')) {
        console.log(`[AI Flow - Image] Successfully generated image for prompt: "${input.prompt.substring(0, 50)}...". URI length: ${media.url.length}`);
        return { imageDataUri: media.url, error: undefined };
      } else {
        const reason = (media && media.url) ? `Invalid image data URL received (does not start with 'data:image'): ${media.url.substring(0,100)}...` : 'No media URL was returned.';
        console.warn(`[AI Flow - Image] Image generation did not produce a valid data URI. ${reason}. LLM text response:`, text);
        return { imageDataUri: null, error: `Image generation did not return a valid image data URI. ${reason}. Detail: ${text || 'No image data received.'}` };
      }
    } catch (error: any) {
      console.error(`[AI Flow Error - Image] Error generating image for prompt "${input.prompt.substring(0,50)}...":`, error);
      let errorMessage = "Failed to generate image due to an unexpected error.";
      if (error.message) {
        errorMessage = error.message;
        if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY_IMAGES")) {
          errorMessage = "Image Generation: API key issue. Check GOOGLE_API_KEY_IMAGES (and its fallbacks) and ensure billing is enabled and the Generative Language API is active for the project associated with the key.";
        } else if (error.message.includes("model") && (error.message.includes("does not support image modality") || error.message.includes("not found"))) {
            errorMessage = "Image Generation: The configured model (gemini-2.0-flash-exp) does not support image generation or was not found with the current API key/settings. Ensure the key has access to this model.";
        } else if (error.message.includes("quota")) {
            errorMessage = "Image Generation: Quota exceeded. Please check your Google Cloud project quotas for Generative Language API.";
        } else if (error.message.includes("billing")) {
             errorMessage = "Image Generation: Billing issue. Please ensure billing is enabled for the Google Cloud project associated with the API key being used for images.";
        }
      }
      return { imageDataUri: null, error: errorMessage };
    }
  }
);

