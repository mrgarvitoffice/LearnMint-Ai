
'use server';
import { generateStudyNotes, type GenerateStudyNotesInput, type GenerateStudyNotesOutput } from "@/ai/flows/generate-study-notes";
import { generateQuizQuestions, type GenerateQuizQuestionsInput, type GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import { generateFlashcards, type GenerateFlashcardsInput, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";

export async function generateNotesAction(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  console.log(`[Server Action] generateNotesAction called for topic: ${input.topic}`);
  try {
    const result = await generateStudyNotes(input);
    if (!result || !result.notes) {
      console.error("[Server Action Error - Notes] AI returned empty or invalid notes data from flow for topic:", input.topic, "Result:", result);
      throw new Error("AI returned empty or invalid notes data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Notes] Error generating notes for topic:", input.topic, error);
    let clientErrorMessage = "Failed to generate study notes. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

export async function generateQuizAction(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  console.log(`[Server Action] generateQuizAction called for topic: ${input.topic}, numQuestions: ${input.numQuestions}, difficulty: ${input.difficulty}`);
  try {
    const result = await generateQuizQuestions(input);
    if (!result || !result.questions || result.questions.length === 0) {
      console.error("[Server Action Error - Quiz] AI returned empty or invalid quiz data from flow for topic:", input.topic, "Result:", result);
      throw new Error("AI returned empty or invalid quiz data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Quiz] Error generating quiz for topic:", input.topic, error);
    let clientErrorMessage = "Failed to generate quiz. Please try again.";
     if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Quiz Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

export async function generateFlashcardsAction(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  console.log(`[Server Action] generateFlashcardsAction called for topic: ${input.topic}, numFlashcards: ${input.numFlashcards}`);
  try {
    const result = await generateFlashcards(input);
     if (!result || !result.flashcards || result.flashcards.length === 0) {
      console.error("[Server Action Error - Flashcards] AI returned empty or invalid flashcard data from flow for topic:", input.topic, "Result:", result);
      throw new Error("AI returned empty or invalid flashcard data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Flashcards] Error generating flashcards for topic:", input.topic, error);
    let clientErrorMessage = "Failed to generate flashcards. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Flashcard Generation: Failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

    