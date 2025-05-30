
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/', // Protect the dashboard
  '/notes(.*)',
  '/quiz(.*)',
  '/flashcards(.*)',
  '/custom-test(.*)',
  '/calculator(.*)',
  '/chatbot(.*)',
  '/news(.*)',
  '/library(.*)',
  '/arcade(.*)',
  '/study(.*)',
  // Add other routes that need protection
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
