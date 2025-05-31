
'use server';
import { generateStudyNotes, type GenerateStudyNotesInput, type GenerateStudyNotesOutput } from "@/ai/flows/generate-study-notes";
import { generateQuizQuestions, type GenerateQuizQuestionsInput, type GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import { generateFlashcards, type GenerateFlashcardsInput, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";
import { generateQuizFromNotes, type GenerateQuizFromNotesInput } from "@/ai/flows/generate-quiz-from-notes";
import { generateFlashcardsFromNotes, type GenerateFlashcardsFromNotesInput } from "@/ai/flows/generate-flashcards-from-notes";

import type { YoutubeSearchInput, YoutubeSearchOutput, YoutubeVideoItem, GoogleBooksSearchInput, GoogleBooksSearchOutput, GoogleBookItem } from './types';

export async function generateNotesAction(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  console.log(`[Server Action] generateNotesAction called for topic: ${input.topic}`);
  try {
    const result = await generateStudyNotes(input);
    if (!result || !result.notes) {
      throw new Error("AI returned empty or invalid notes data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Notes] Error generating notes:", error);
    let clientErrorMessage = "Failed to generate study notes. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key issue. Please check server configuration (GOOGLE_API_KEY, GOOGLE_API_KEY_NOTES, or GOOGLE_API_KEY_IMAGES).";
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
      throw new Error("AI returned empty or invalid quiz data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Quiz] Error generating quiz:", error);
    let clientErrorMessage = "Failed to generate quiz. Please try again.";
     if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key issue. Please check server configuration.";
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
      throw new Error("AI returned empty or invalid flashcard data.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Flashcards] Error generating flashcards:", error);
    let clientErrorMessage = "Failed to generate flashcards. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Flashcard Generation: Failed due to an API key issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

export async function generateQuizFromNotesAction(input: GenerateQuizFromNotesInput): Promise<GenerateQuizQuestionsOutput> {
  console.log(`[Server Action] generateQuizFromNotesAction called, numQuestions: ${input.numQuestions}, notes length: ${input.notesContent.length}`);
  try {
    // The output of generateQuizFromNotes is compatible with GenerateQuizQuestionsOutput
    const result = await generateQuizFromNotes(input);
    if (!result || !result.quiz || result.quiz.length === 0) { // generateQuizFromNotes returns { quiz: QuizQuestion[] }
      throw new Error("AI returned empty or invalid quiz data from notes.");
    }
    return { questions: result.quiz }; // Adapt to GenerateQuizQuestionsOutput structure
  } catch (error: any) {
    console.error("[Server Action Error - Quiz from Notes] Error generating quiz:", error);
    let clientErrorMessage = "Failed to generate quiz from notes. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Quiz from Notes: Generation failed due to an API key issue. Check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Quiz from Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}

export async function generateFlashcardsFromNotesAction(input: GenerateFlashcardsFromNotesInput): Promise<GenerateFlashcardsOutput> {
  console.log(`[Server Action] generateFlashcardsFromNotesAction called, numFlashcards: ${input.numFlashcards}, notes length: ${input.notesContent.length}`);
  try {
    const result = await generateFlashcardsFromNotes(input);
    if (!result || !result.flashcards || result.flashcards.length === 0) {
      throw new Error("AI returned empty or invalid flashcard data from notes.");
    }
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - Flashcards from Notes] Error generating flashcards:", error);
    let clientErrorMessage = "Failed to generate flashcards from notes. Please try again.";
    if (error.message && (error.message.includes("GOOGLE_API_KEY") || error.message.includes("API_KEY_INVALID"))) {
      clientErrorMessage = "Flashcards from Notes: Generation failed due to an API key issue. Check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Flashcards from Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}


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
