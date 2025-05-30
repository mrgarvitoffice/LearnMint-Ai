
"use server";

import type { NewsApiResponse, NewsArticle } from './types';

const NEWS_API_URL = "https://newsdata.io/api/1/news";

interface FetchNewsParams {
  query?: string;
  country?: string;
  stateOrRegion?: string;
  city?: string;
  category?: string;
  page?: string; // For pagination, newsdata.io uses a 'page' token
  language?: string;
}

export async function fetchNews(params: FetchNewsParams): Promise<NewsApiResponse> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.error("NEWSDATA_API_KEY is not set.");
    return { status: "error", totalResults: 0, results: [{
      article_id: "error-no-apikey",
      title: "API Key Missing",
      link: "#",
      description: "Newsdata.io API key is not configured. Please set it in your environment variables.",
      pubDate: new Date().toISOString(), category: ["error"], country: [], language: "en", source_id: "learnflow-error", source_priority: 0, keywords: null, creator: null, video_url: null, image_url: null,
    }], nextPage: undefined };
  }

  let combinedQuery = params.query || "";
  if (params.country) { // Only add state/city if country is present
    if (params.stateOrRegion) {
      combinedQuery = combinedQuery ? `${combinedQuery} AND ${params.stateOrRegion}` : params.stateOrRegion;
    }
    if (params.city) {
      combinedQuery = combinedQuery ? `${combinedQuery} AND ${params.city}` : params.city;
    }
  }
  
  const queryParams = new URLSearchParams({
    apikey: apiKey,
    language: params.language || "en",
  });

  if (combinedQuery.trim()) {
    queryParams.append("q", combinedQuery.trim());
  }
  if (params.country) queryParams.append("country", params.country);
  if (params.category && params.category !== "_all_categories_") { // Ensure _all_categories_ isn't sent
    queryParams.append("category", params.category);
  }
  if (params.page) queryParams.append("page", params.page);
  
  // Default to 'top' category if no query and no specific category is provided by user
  if (!combinedQuery.trim() && (!params.category || params.category === "_all_categories_")) {
    queryParams.set("category", "top"); // API expects 'top' for general top headlines
  }


  try {
    const response = await fetch(`${NEWS_API_URL}?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`News API Error (${response.status}):`, errorData);
      const message = errorData?.results?.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    const data: NewsApiResponse = await response.json();
    
    const cleanedResults = data.results.filter(article => article.title && article.link);
    
    return { ...data, results: cleanedResults };

  } catch (error) {
    console.error("Failed to fetch news:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching news.";
    return { 
        status: "error", 
        totalResults: 0, 
        results: [{ 
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
        } as NewsArticle], 
        nextPage: undefined 
    };
  }
}
