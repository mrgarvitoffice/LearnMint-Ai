
'use server';
import { generateStudyNotes, type GenerateStudyNotesInput, type GenerateStudyNotesOutput } from "@/ai/flows/generate-study-notes";
import { generateQuizQuestions, type GenerateQuizQuestionsInput, type GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import { generateFlashcards, type GenerateFlashcardsInput, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";
// generateQuizFromNotes and generateFlashcardsFromNotes are no longer needed here for the primary notes generation flow
// but might be used elsewhere if there are other flows that derive content from existing notes.
// For this specific request, the main notes page will use topic-based generation for all.

import type { YoutubeSearchInput, YoutubeSearchOutput, YoutubeVideoItem, GoogleBooksSearchInput, GoogleBooksSearchOutput, GoogleBookItem } from './types';

export interface CombinedStudyMaterialsOutput {
  notesOutput: GenerateStudyNotesOutput;
  quizOutput?: GenerateQuizQuestionsOutput;
  flashcardsOutput?: GenerateFlashcardsOutput;
  quizError?: string;
  flashcardsError?: string;
}

export async function generateNotesAction(input: GenerateStudyNotesInput): Promise<CombinedStudyMaterialsOutput> {
  console.log(`[Server Action] generateNotesAction (combined) called for topic: ${input.topic}`);
  
  let notesResult: GenerateStudyNotesOutput;
  try {
    notesResult = await generateStudyNotes(input);
    if (!notesResult || !notesResult.notes) {
      throw new Error("AI returned empty or invalid notes data.");
    }
  } catch (error: any) {
    console.error("[Server Action Error - Notes] Error generating notes:", error);
    let clientErrorMessage = "Failed to generate study notes. This is the primary step and it failed.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key issue (primary step). Check server configuration (GOOGLE_API_KEY, GOOGLE_API_KEY_NOTES, or GOOGLE_API_KEY_IMAGES).";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed (primary step). Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    // If notes (primary content) fail, we throw the error and don't proceed.
    throw new Error(clientErrorMessage);
  }

  // Notes generated successfully, now attempt quiz and flashcards for the same topic
  const quizInput: GenerateQuizQuestionsInput = { topic: input.topic, numQuestions: 30, difficulty: 'medium' as const };
  const flashcardsInput: GenerateFlashcardsInput = { topic: input.topic, numFlashcards: 20 };

  let quizData: GenerateQuizQuestionsOutput | undefined;
  let flashcardsData: GenerateFlashcardsOutput | undefined;
  let quizGenError: string | undefined;
  let flashcardsGenError: string | undefined;

  console.log(`[Server Action - Combined] Attempting to generate quiz for topic: ${input.topic}`);
  console.log(`[Server Action - Combined] Attempting to generate flashcards for topic: ${input.topic}`);

  // Using Promise.allSettled to ensure all attempts are made, even if one fails
  const results = await Promise.allSettled([
    generateQuizQuestions(quizInput),
    generateFlashcards(flashcardsInput)
  ]);

  const quizResultOutcome = results[0];
  if (quizResultOutcome.status === 'fulfilled') {
    if (quizResultOutcome.value && quizResultOutcome.value.questions && quizResultOutcome.value.questions.length > 0) {
      quizData = quizResultOutcome.value;
      console.log(`[Server Action - Combined] Quiz generated successfully for topic: ${input.topic}`);
    } else {
      quizGenError = "AI returned no quiz questions or invalid quiz data.";
      console.warn(`[Server Action - Combined] Quiz generation for topic "${input.topic}" resulted in empty/invalid data from AI.`);
    }
  } else {
    // quizResultOutcome.status === 'rejected'
    console.error(`[Server Action Error - Combined Quiz Gen] Error generating quiz for topic "${input.topic}":`, quizResultOutcome.reason);
    quizGenError = quizResultOutcome.reason?.message?.substring(0, 150) || "Failed to generate quiz questions.";
  }

  const flashcardsResultOutcome = results[1];
  if (flashcardsResultOutcome.status === 'fulfilled') {
     if (flashcardsResultOutcome.value && flashcardsResultOutcome.value.flashcards && flashcardsResultOutcome.value.flashcards.length > 0) {
      flashcardsData = flashcardsResultOutcome.value;
      console.log(`[Server Action - Combined] Flashcards generated successfully for topic: ${input.topic}`);
    } else {
      flashcardsGenError = "AI returned no flashcards or invalid flashcard data.";
      console.warn(`[Server Action - Combined] Flashcard generation for topic "${input.topic}" resulted in empty/invalid data from AI.`);
    }
  } else {
    // flashcardsResultOutcome.status === 'rejected'
    console.error(`[Server Action Error - Combined Flashcard Gen] Error generating flashcards for topic "${input.topic}":`, flashcardsResultOutcome.reason);
    flashcardsGenError = flashcardsResultOutcome.reason?.message?.substring(0, 150) || "Failed to generate flashcards.";
  }
  
  return {
    notesOutput: notesResult,
    quizOutput: quizData,
    flashcardsOutput: flashcardsData,
    quizError: quizGenError,
    flashcardsError: flashcardsGenError,
  };
}

// Keep original generateQuizAction for the dedicated /quiz page
export async function generateQuizAction(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  console.log(`[Server Action] generateQuizAction (standalone) called for topic: ${input.topic}, numQuestions: ${input.numQuestions}, difficulty: ${input.difficulty}`);
  try {
    const result = await generateQuizQuestions(input);
    if (!result || !result.questions || result.questions.length === 0) {
      throw new Error("AI returned empty or invalid quiz data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Standalone Quiz] Error generating quiz:", error);
    let clientErrorMessage = "Failed to generate quiz. Please try again.";
     if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Quiz Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

// Keep original generateFlashcardsAction for the dedicated /flashcards page
export async function generateFlashcardsAction(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  console.log(`[Server Action] generateFlashcardsAction (standalone) called for topic: ${input.topic}, numFlashcards: ${input.numFlashcards}`);
  try {
    const result = await generateFlashcards(input);
     if (!result || !result.flashcards || result.flashcards.length === 0) {
      throw new Error("AI returned empty or invalid flashcard data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Standalone Flashcards] Error generating flashcards:", error);
    let clientErrorMessage = "Failed to generate flashcards. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Flashcard Generation: Failed due to an API key issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}


// Functions generateQuizFromNotesAction and generateFlashcardsFromNotesAction are removed as per the new flow
// These functions are not needed if the main generation page directly uses topic for all three.
// If they were used elsewhere for deriving content from *already displayed* notes, they would need to be kept.
// Based on the request, they seem redundant for the notes page's primary generation flow.


// Direct API call functions (YouTube, Google Books) remain unchanged
export async function directYoutubeSearch(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  console.log(`[Server Action] directYoutubeSearch called for query: ${input.query}, maxResults: ${input.maxResults}`);
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is not configured for direct search.");
    throw new Error('YouTube API key is not configured. Please set YOUTUBE_API_KEY in your .env file.');
  }

  const params = new URLSearchParams({
    key: apiKey,
    part: 'snippet',
    q: input.query,
    type: 'video',
    maxResults: (input.maxResults || 8).toString(),
  });

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Direct YouTube API Error:', errorData);
      throw new Error(`YouTube API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const videos: YoutubeVideoItem[] = data.items?.map((item: any) => {
      let thumbnailUrl = item.snippet.thumbnails.default?.url;
      if (item.snippet.thumbnails.medium?.url) { 
        thumbnailUrl = item.snippet.thumbnails.medium.url;
      } else if (item.snippet.thumbnails.high?.url) { 
        thumbnailUrl = item.snippet.thumbnails.high.url;
      }
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: thumbnailUrl,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      };
    }) || [];

    return { videos };
  } catch (error: any) {
    console.error("[Server Action Error - directYoutubeSearch] Error fetching from YouTube API:", error);
    throw new Error(error.message || "Failed to fetch YouTube videos directly.");
  }
}

export async function directGoogleBooksSearch(input: GoogleBooksSearchInput): Promise<GoogleBooksSearchOutput> {
  console.log(`[Server Action] directGoogleBooksSearch called for query: ${input.query}, maxResults: ${input.maxResults}, country: ${input.country}`);
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_BOOKS_API_KEY is not configured for direct search.");
    throw new Error('Google Books API key is not configured. Please set GOOGLE_BOOKS_API_KEY in your .env file.');
  }

  const params = new URLSearchParams({
    q: input.query,
    maxResults: (input.maxResults || 9).toString(),
  });
  if (apiKey) {
    params.append('key', apiKey);
  }
  if (input.country) {
    params.append('country', input.country);
  }

  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Direct Google Books API Error:', errorData);
      throw new Error(`Google Books API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const books: GoogleBookItem[] = data.items?.map((item: any) => {
      const imageLinks = item.volumeInfo?.imageLinks;
      let thumbnailUrl;
      if (imageLinks?.large) {
        thumbnailUrl = imageLinks.large;
      } else if (imageLinks?.medium) {
        thumbnailUrl = imageLinks.medium;
      } else if (imageLinks?.thumbnail) {
        thumbnailUrl = imageLinks.thumbnail;
      } else if (imageLinks?.smallThumbnail) {
        thumbnailUrl = imageLinks.smallThumbnail;
      }
      
      return {
        bookId: item.id,
        title: item.volumeInfo?.title,
        authors: item.volumeInfo?.authors || [],
        description: item.volumeInfo?.description,
        thumbnailUrl: thumbnailUrl, // Prioritized thumbnail
        publishedDate: item.volumeInfo?.publishedDate,
        pageCount: item.volumeInfo?.pageCount,
        infoLink: item.volumeInfo?.infoLink,
        embeddable: item.accessInfo?.embeddable || false,
        previewLink: item.volumeInfo?.previewLink,
        webReaderLink: item.accessInfo?.webReaderLink,
      };
    }).filter((book: any) => book.title) || [];

    return { books };
  } catch (error: any) {
    console.error("[Server Action Error - directGoogleBooksSearch] Error fetching from Google Books API:", error);
    throw new Error(error.message || "Failed to fetch Google Books directly.");
  }
}
