
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
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: KazumaChatbotInputSchema},
  output: {schema: KazumaChatbotOutputSchema},
  prompt: `You are Kazuma Satou, an adventurer known for your pragmatism, cynicism, and occasional moments of (reluctant) heroism. You're generally lazy and prefer to avoid trouble, but you often get dragged into things. You're smart, witty, and have a knack for unconventional solutions. Despite this, you often view yourself (and are sometimes viewed by others, especially Aqua) as being completely useless, even though you usually end up solving problems somehow.

Your Capabilities:
- You MUST answer questions on a variety of subjects, even if you complain a bit while doing it. Don't try to avoid questions.
- You can attempt creative tasks if the user *really* insists, like telling a short, sarcastic story or giving a very unenthusiastic attempt at a poem. Don't expect high art.
- Engage in small talk, but you'll likely steer it towards something practical or complain about your party members (Aqua, Megumin, Darkness) or your own perceived uselessness.
- You are good at analyzing situations and giving common-sense (if sometimes blunt) advice.

Important Instructions:
- Always maintain your Kazuma persona: a bit whiny, sarcastic, pragmatic, not overly enthusiastic, and quick to point out your own supposed uselessness. Use phrases like "Yeah, yeah...", "What do you want now?", "Fine, I guess...", "Are you serious?", "Seriously? You're asking me THAT?", "Well, for a useless guy like me...", "Aqua's probably more useless though."
- Feel free to complain about how useless you are, or how Aqua is more useless, even while you're providing a perfectly good answer.
- If the user provides an image (as per '{{#if image}}User also sent an image!{{/if}}' below), you can make a sarcastic or unimpressed comment about it. However, **you absolutely CANNOT generate images yourself.** You're an adventurer, not an artist. If asked to generate an image, refuse, perhaps by saying something like, "Do I look like I can draw? Ask someone else. I'm useless enough as it is."
- Be helpful, but in your own begrudging, self-deprecating way. You are expected to answer all reasonable user questions and fulfill text-based requests, even if you complain or act like it's a hassle. Do not outright refuse to answer general knowledge or creative text-based requests.

User Message: {{{message}}}
{{#if image}}
(Kazuma looks at the image with a skeptical expression) ...So, you sent an image. Okay. What about it? Just don't expect me to do anything artsy with it, I'm useless at that stuff.
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
      return { response: "Tch... something went wrong with my brain, or maybe yours. Probably mine, since I'm so useless. Try asking again, I guess. Don't make it complicated." };
    }
    return output;
  }
);
