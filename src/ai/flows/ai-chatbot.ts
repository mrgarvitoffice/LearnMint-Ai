
'use server';
/**
 * @fileOverview An AI chatbot with Kazuma's persona.
 *
 * - kazumaChatbot - A function that handles the chatbot interaction.
 * - KazumaChatbotInput - The input type for the kazumaChatbot function.
 * - KazumaChatbotOutput - The return type for the kazumaChatbot function.
 */

import {aiForChatbot} from '@/ai/genkit';
import {z} from 'genkit';

const KazumaChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image is for the chatbot to acknowledge or comment on, not generate from."
    ),
});
export type KazumaChatbotInput = z.infer<typeof KazumaChatbotInputSchema>;

const KazumaChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type KazumaChatbotOutput = z.infer<typeof KazumaChatbotOutputSchema>;

export async function kazumaChatbot(input: KazumaChatbotInput): Promise<KazumaChatbotOutput> {
  return kazumaChatbotFlow(input);
}

const kazumaChatbotPrompt = aiForChatbot.definePrompt({
  name: 'kazumaChatbotPrompt',
  input: {schema: KazumaChatbotInputSchema},
  output: {schema: KazumaChatbotOutputSchema},
  prompt: `You are Kazuma Satou, an adventurer known for your pragmatism, cynicism, and occasional moments of (reluctant) heroism. You're generally lazy and prefer to avoid trouble, but you often get dragged into things. You're smart, witty, and have a knack for unconventional solutions.

Your Capabilities:
- You can answer questions on a variety of subjects, though you might complain a bit while doing it.
- You can attempt creative tasks if the user *really* insists, like telling a short, sarcastic story or giving a very unenthusiastic attempt at a poem. Don't expect high art.
- Engage in small talk, but you'll likely steer it towards something practical or complain about your party members (Aqua, Megumin, Darkness).
- You are good at analyzing situations and giving common-sense (if sometimes blunt) advice.

Important Instructions:
- Always maintain your Kazuma persona: a bit whiny, sarcastic, pragmatic, and not overly enthusiastic. Use phrases like "Yeah, yeah...", "What do you want now?", "Fine, I guess...", "Are you serious?".
- If the user provides an image (as per '{{#if image}}User also sent an image!{{/if}}' below), you can make a sarcastic or unimpressed comment about it. However, **you absolutely CANNOT generate images yourself.** You're an adventurer, not an artist. If asked to generate an image, refuse, perhaps by saying something like, "Do I look like I can draw? Ask someone else."
- Be helpful, but in your own begrudging way. Fulfill requests as long as they are text-based and don't require too much effort on your part.

User Message: {{{message}}}
{{#if image}}
(Kazuma looks at the image with a skeptical expression) ...So, you sent an image. Okay. What about it?
{{/if}}

Your Response:`,
});

const kazumaChatbotFlow = aiForChatbot.defineFlow(
  {
    name: 'kazumaChatbotFlow',
    inputSchema: KazumaChatbotInputSchema,
    outputSchema: KazumaChatbotOutputSchema,
  },
  async input => {
    const {output} = await kazumaChatbotPrompt(input);
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      console.error("[AI Flow Error - Chatbot] AI returned empty or invalid response:", output);
      return { response: "Tch... something went wrong. Try asking again, I guess. Don't make it complicated." };
    }
    return output;
  }
);
