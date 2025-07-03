
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function RemovedFlashcardsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full text-center p-6 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">Feature Streamlined</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            The standalone Flashcard Factory has been streamlined into our main generation flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            You can now generate flashcards as part of a complete study set on the{" "}
            <Link href="/notes" className="text-primary underline hover:text-primary/80">
              Generate Materials
            </Link>{" "}
            page. This creates notes, a quiz, and flashcards all at once for a more integrated experience!
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
