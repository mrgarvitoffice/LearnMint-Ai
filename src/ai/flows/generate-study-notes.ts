
'use server';
/**
 * @fileOverview A study note generation AI agent.
 *
 * - generateStudyNotes - A function that handles the study note generation process.
 * - GenerateStudyNotesInput - The input type for the generateStudyNotes function.
 * - GenerateStudyNotesOutput - The return type for the generateStudyNotes function.
 */

import {aiForNotes} from '@/ai/genkit'; 
import {z} from 'zod';
import { generateImageFromPrompt } from './generate-image-from-prompt'; // Uses updated image prompt flow

const GenerateStudyNotesInputSchema = z.object({ topic: z.string().describe('The academic topic for which to generate study notes.') });
export type GenerateStudyNotesInput = z.infer<typeof GenerateStudyNotesInputSchema>;

const GenerateStudyNotesOutputSchema = z.object({
  notes: z.string().describe("Comprehensive, well-structured study notes in Markdown format. Include headings (H1, H2, H3), subheadings, bullet points, bold text for key terms. Where a diagram or visual would be helpful, insert a placeholder like '[VISUAL_PROMPT: A diagram illustrating...]'. The notes should be engaging, like topper notes, with good spacing and visual hierarchy (big text, small text), and relevant emojis.")
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

const generateStudyNotesPrompt = aiForNotes.definePrompt({
  name: 'generateStudyNotesPrompt',
  input: { schema: GenerateStudyNotesInputSchema },
  output: { schema: GenerateStudyNotesOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest', 
  prompt: `You are an expert educator tasked with creating exceptionally engaging and visually appealing study notes, in the style of a top student's "topper notes." The notes must be well-formatted using Markdown to be both informative and a pleasure to study from. Your goal is to make learning fun and effective!

Topic: {{{topic}}}

Please generate study notes on this topic with the following characteristics:

1.  **Tone & Engagement:**
    *   Write in an **enthusiastic, conversational, and highly engaging tone**, as if you're an excited teacher explaining the concepts.
    *   Use **relevant emojis** (like 🚀, ✨, 🤔, 🧠, 💪, ⚡, 🕰️, 🌟, 🌱, 🐾, 🥳, etc.) to add visual appeal and thematic cues next to headings or key points where appropriate. Make it fun!
    *   Use catchy or question-based phrases for section introductions or summaries.
    *   Make key enthusiastic statements really **pop** and stand out using bolding or other Markdown emphasis! For example:
        > **A cell is the smallest structural and functional unit of an organism. Think of it as the tiny, self-contained powerhouse of life! It's amazing what these little guys can do!** 🤩

2.  **Structure & Formatting (Markdown):**
    *   Start with a brief, **exciting introductory paragraph** that hooks the reader.
    *   Employ a clear hierarchy of headings:
        *   A **main, attention-grabbing title** for the overall topic (using '# Main Topic Title 🚀✨'). This should be the largest and most prominent.
        *   **Prominent major section headings** (using '## Key Concept Unveiled! 🤔' or '## Another Big Section! 💡'). Make these visually distinct and larger than major section headings.
        *   **Clearly distinct sub-headings** for sub-topics (using '### Diving Deeper: ...' or '#### Specific Examples:'). These should be smaller than major section headings, creating a "big text, small text" visual flow.
    *   Provide detailed information in a **point-wise manner** using bullet points ('- ') or numbered lists ('1. ').
    *   Pay meticulous attention to **spacing and layout** throughout the document. Use blank lines effectively between paragraphs, headings, and list items to ensure the notes are scannable and easy on the eyes. Make the notes look good and visually appealing through excellent Markdown formatting.

3.  **Content & Emphasis:**
    *   Ensure the information is accurate, comprehensive, and clearly explained.
    *   Emphasize **key terms, definitions, and crucial concepts by making them bold**.
    *   Use *italics* for important nuances, examples, or foreign terms.
    *   Use \`blockquotes\` for highlighting critical pieces of information, direct definitions, important summaries, or memorable facts.
    *   If comparing concepts (e.g., Prokaryotic vs. Eukaryotic cells), format this information in a **clear Markdown table**.

4.  **Visuals (Placeholders ONLY - for initial text generation):**
    *   Where a diagram, chart, or image would significantly enhance understanding, insert a placeholder in the exact format: \`[VISUAL_PROMPT: descriptive query for the image]\`. For example: \`[VISUAL_PROMPT: diagram of a plant cell's organelles]\` or \`[VISUAL_PROMPT: timeline of World War 2 major European events]\`.
    *   **Do NOT generate actual images or image URLs yourself.** Only use the textual placeholder format described above. This text generation step should *only* produce the placeholders. A subsequent step will handle image generation. Limit to a maximum of 3-4 such visual prompts per notes document.

5.  **Conclusion:**
    *   End with a **concluding summary or a section to remember key facts**, perhaps with a fun, thematic title (e.g., "Remember These CELL-ebrated Facts! 🥳").

Your goal is to produce notes that are not only informative but exceptionally well-organized, visually engaging, and a genuine pleasure to study from – the kind of notes a top student would create to ace their exams. Ensure there's good visual separation (space) between headings and the text that follows them.
The entire output, including all Markdown formatting, emojis, and image placeholders, should be a single JSON object with a key "notes" containing the complete Markdown string.
Example of a desired style snippet for a section:
\`\`\`markdown
## MEET THE CELL SUPERSTARS: Prokaryotic vs. Eukaryotic 🌟🕰️

Not all cells are the same! There are two major types you must know!

### PROKARYOTIC CELLS (Think SIMPLE & ANCIENT! 🕰️)

- These are the original life forms!
- **No nucleus!** Their genetic material (DNA) is just chillin' in the cytoplasm.
- *Examples:* All Bacteria and Archaea.
\`\`\`
`,
  config: { 
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateStudyNotesFlow = aiForNotes.defineFlow( 
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateStudyNotesInputSchema,
    outputSchema: GenerateStudyNotesOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Notes Text] Generating notes text for topic: ${input.topic}`);
    const textGenerationResult = await generateStudyNotesPrompt(input);
    
    if (!textGenerationResult.output || typeof textGenerationResult.output.notes !== 'string' || textGenerationResult.output.notes.trim() === '') {
      console.error("[AI Flow Error - Notes Text] AI returned empty or invalid notes data:", textGenerationResult.output);
      throw new Error("AI failed to generate notes text in the expected style. The returned data was empty or invalid.");
    }
    
    let notesWithPlaceholders = textGenerationResult.output.notes;
    console.log(`[AI Flow - Notes Text] Successfully generated notes text for topic: ${input.topic}. Length: ${notesWithPlaceholders.length}`);

    // "Image" (Text/Link) generation step
    const visualPromptRegex = /\[VISUAL_PROMPT:\s*([^\]]+)\]/g;
    let match;
    const visualPrompts: { fullMatch: string, promptText: string }[] = [];

    // First, collect all visual prompts
    while ((match = visualPromptRegex.exec(notesWithPlaceholders)) !== null) {
      visualPrompts.push({ fullMatch: match[0], promptText: match[1].trim() });
    }
    
    console.log(`[AI Flow - Notes Images] Found ${visualPrompts.length} visual prompts to process for text/link generation:`, visualPrompts.map(vp => vp.promptText));

    if (visualPrompts.length > 0) {
        const imageInfoResults = await Promise.all(
            visualPrompts.map(vp => 
                generateImageFromPrompt({ prompt: vp.promptText }) // Calls the updated flow
                .then(imageInfoResult => ({ ...vp, imageInfoResult }))
                .catch(error => {
                    console.error(`[AI Flow Error - Image Text/Link Sub-flow] Failed for prompt "${vp.promptText}":`, error);
                    return { ...vp, imageInfoResult: { error: error.message || "Unknown error getting image text/link" } };
                })
            )
        );

        let finalNotes = notesWithPlaceholders;
        for (const result of imageInfoResults) {
            if (result.imageInfoResult.imageUrl) {
                console.log(`[AI Flow - Notes Images] Got image URL for: "${result.promptText.substring(0,30)}...". Replacing placeholder with image link.`);
                const markdownImage = `![Visual for: ${result.promptText.replace(/"/g, "'")}](${result.imageInfoResult.imageUrl})`;
                finalNotes = finalNotes.replace(result.fullMatch, markdownImage);
            } else if (result.imageInfoResult.textDescription) {
                console.log(`[AI Flow - Notes Images] Got text description for: "${result.promptText.substring(0,30)}...". Replacing placeholder with description.`);
                const markdownDescription = `> **AI Suggested Description for "${result.promptText.replace(/"/g, "'")}":**\n> ${result.imageInfoResult.textDescription.replace(/\n/g, '\n> ')}`;
                finalNotes = finalNotes.replace(result.fullMatch, markdownDescription);
            } else {
                console.warn(`[AI Flow - Notes Images] Failed to get URL or description for prompt: "${result.promptText}". Error: ${result.imageInfoResult.error}. Placeholder will remain.`);
                // The [VISUAL_PROMPT: ...] will remain, and AiGeneratedImage.tsx will handle it.
            }
        }
        console.log(`[AI Flow - Notes Images] Finished processing all visual prompts. Final notes length: ${finalNotes.length}`);
        return { notes: finalNotes };
    } else {
         console.log(`[AI Flow - Notes Images] No visual prompts found. Returning original notes.`);
         return { notes: notesWithPlaceholders };
    }
  }
);

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  console.log(`[AI Wrapper] generateStudyNotes called for topic: ${input.topic}. Using notes-specific AI configuration if GOOGLE_API_KEY_NOTES is set.`);
  try {
    return await generateStudyNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateStudyNotes] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate study notes. Please try again.";
    if (error.message && (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key issue. Please check server configuration (GOOGLE_API_KEY or GOOGLE_API_KEY_NOTES or GOOGLE_API_KEY_IMAGES) and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
