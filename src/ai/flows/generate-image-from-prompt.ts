
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
        // Ensure this model is correct and supports image generation for your key.
        // gemini-2.0-flash-exp is an experimental model that was mentioned to support this.
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: input.prompt,
        config: {
          // IMPORTANT: Image generation requires 'IMAGE' in responseModalities.
          // Some models/APIs require TEXT as well, even if you only want the image.
          responseModalities: ['TEXT', 'IMAGE'], 
          // Optional: Adjust temperature for creativity. Lower might be better for specific diagrams.
          // temperature: 0.4, 
        },
      });

      if (finishReason !== 'STOP' && finishReason !== 'MODEL') {
         console.warn(`[AI Flow - Image] Image generation did not finish successfully. Reason: ${finishReason}. LLM text response: ${text}`);
         return { imageDataUri: null, error: `Image generation failed or was blocked. Reason: ${finishReason}. Detail: ${text || 'No additional detail.'}` };
      }
      
      if (media && media.url) {
        console.log(`[AI Flow - Image] Successfully generated image for prompt: "${input.prompt.substring(0, 50)}...". URI length: ${media.url.length}`);
        return { imageDataUri: media.url, error: undefined };
      } else {
        console.warn('[AI Flow - Image] Image generation succeeded according to finishReason, but no media URL was returned. LLM text response:', text);
        return { imageDataUri: null, error: `Image generation did not return an image. Detail: ${text || 'No image data received.'}` };
      }
    } catch (error: any) {
      console.error(`[AI Flow Error - Image] Error generating image for prompt "${input.prompt.substring(0,50)}...":`, error);
      let errorMessage = "Failed to generate image due to an unexpected error.";
      if (error.message) {
        errorMessage = error.message;
        if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY_IMAGES")) {
          errorMessage = "Image Generation: API key issue. Check GOOGLE_API_KEY_IMAGES and billing.";
        } else if (error.message.includes("model") && error.message.includes("does not support image modality")) {
            errorMessage = "Image Generation: The configured model (gemini-2.0-flash-exp or fallback) does not support image generation with the current API key or settings.";
        } else if (error.message.includes("quota")) {
            errorMessage = "Image Generation: Quota exceeded. Please check your Google Cloud project quotas for Generative Language API.";
        }
      }
      return { imageDataUri: null, error: errorMessage };
    }
  }
);
