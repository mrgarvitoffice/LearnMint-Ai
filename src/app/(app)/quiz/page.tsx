
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function RemovedQuizPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full text-center p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">Feature Removed</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            The standalone Quiz Creator has been removed to streamline the app experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            You can still generate quizzes as part of a complete study set on the{" "}
            <Link href="/notes" className="text-primary underline hover:text-primary/80">
              Generate Materials
            </Link>{" "}
            page, or build a highly specific test using the{" "}
            <Link href="/custom-test" className="text-primary underline hover:text-primary/80">
              Custom Test Creator
            </Link>.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
