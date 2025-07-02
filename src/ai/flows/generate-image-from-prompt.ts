
'use server';
/**
 * @fileOverview A Genkit flow to generate an image from a text prompt using a generative image model.
 *
 * - generateImageFromPrompt - A function that takes a text prompt and returns a generated image as a data URI.
 * - GenerateImageInput - The input type for this function.
 * - GenerateImageOutput - The return type for this function.
 */

import { aiForImages } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().url().optional().describe('A data URI of the generated image. Format: data:image/png;base64,...'),
  error: z.string().optional().describe('Error message if generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFromPromptFlow(input);
}

const generateImageFromPromptFlow = aiForImages.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Image Gen] Attempting to generate image for prompt: "${input.prompt.substring(0, 50)}..."`);
    try {
      const { media, finishReason, "usage": _ } = await aiForImages.generate({
        model: 'googleai/gemini-2.0-flash-exp-image-generation', // Explicitly setting model for robustness
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (finishReason !== 'STOP' && finishReason !== 'MODEL') {
        const errorDetail = `Generation did not finish successfully. Reason: ${finishReason}.`;
        console.warn(`[AI Flow - Image Gen] ${errorDetail}`);
        return { error: errorDetail };
      }
      
      // Stricter validation: Ensure we have a valid data URI for an image.
      if (media?.url && media.url.startsWith('data:image/')) {
        console.log(`[AI Flow - Image Gen] Successfully generated image for prompt: "${input.prompt.substring(0, 50)}..."`);
        return { imageUrl: media.url };
      } else {
        const errorDetail = `Image generation did not produce a valid image data URI. Output was: ${media?.url?.substring(0,50) || 'empty'}`;
        console.error(`[AI Flow - Image Gen] ${errorDetail}`);
        return { error: errorDetail };
      }

    } catch (error: any) {
      console.error(`[AI Flow Error - Image Gen] Error processing prompt "${input.prompt.substring(0,50)}...":`, error);
      let errorMessage = "Failed to generate image due to an unexpected error.";
      if (error.message) {
        errorMessage = error.message;
        if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY_IMAGES")) {
          errorMessage = "Image Generation: API key issue. Check GOOGLE_API_KEY_IMAGES and ensure billing is enabled and the Generative Language API is active for the project associated with the key.";
        } else if (error.message.includes("quota")) {
          errorMessage = "Image Generation: Quota exceeded. Please check your Google Cloud project quotas for Generative Language API.";
        } else if (error.message.includes("billing")) {
          errorMessage = "Image Generation: Billing issue. Please ensure billing is enabled for the Google Cloud project associated with the API key being used.";
        } else if (error.message.includes("not found")) {
            errorMessage = `Image Generation: The specified model was not found. This might be an API key permission issue. Details: ${error.message}`;
        }
      }
      return { error: errorMessage };
    }
  }
);
