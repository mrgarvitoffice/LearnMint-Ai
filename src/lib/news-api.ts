"use server";

import type { NewsApiResponse, NewsArticle } from './types';

const NEWS_API_URL = "https://newsdata.io/api/1/news";

interface FetchNewsParams {
  query?: string;
  country?: string;
  category?: string;
  page?: string; // For pagination, newsdata.io uses a 'page' token
  language?: string;
  // Add other parameters as needed from Newsdata.io documentation
  // e.g., domain, timeframe, prioritydomain, timezone etc.
}

export async function fetchNews(params: FetchNewsParams): Promise<NewsApiResponse> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.error("NEWSDATA_API_KEY is not set.");
    return { status: "error", totalResults: 0, results: [], nextPage: undefined };
  }

  const queryParams = new URLSearchParams({
    apikey: apiKey,
    language: params.language || "en", // Default to English
  });

  if (params.query) queryParams.append("q", params.query);
  if (params.country) queryParams.append("country", params.country);
  if (params.category) queryParams.append("category", params.category);
  if (params.page) queryParams.append("page", params.page);
  
  // Default to 'top' category if no query or specific category is provided
  if (!params.query && !params.category) {
    queryParams.set("category", "top");
  }


  try {
    const response = await fetch(`${NEWS_API_URL}?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`News API Error (${response.status}):`, errorData);
      // Try to provide a more specific error message if available
      const message = errorData?.results?.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    const data: NewsApiResponse = await response.json();
    
    // Filter out articles that might be problematic (e.g. null title or link)
    const cleanedResults = data.results.filter(article => article.title && article.link);
    
    return { ...data, results: cleanedResults };

  } catch (error) {
    console.error("Failed to fetch news:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching news.";
    // Return an error structure that matches NewsApiResponse for consistency
    return { 
        status: "error", 
        totalResults: 0, 
        results: [{ 
            // Provide a placeholder error article
            article_id: "error-" + Date.now(),
            title: "Failed to Load News",
            link: "#",
            description: errorMessage,
            pubDate: new Date().toISOString(),
            category: ["error"],
            country: [],
            language: "en",
            source_id: "learnflow-error",
            source_priority: 0,
            keywords: null,
            creator: null,
            video_url: null,
            image_url: null,
        } as NewsArticle], // Cast to NewsArticle to satisfy type, even though it's an error
        nextPage: undefined 
    };
  }
}
