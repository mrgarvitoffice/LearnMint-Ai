
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/lib/actions';
import type { GenerateQuizQuestionsOutput, QuizQuestion } from '@/lib/types';
import { Loader2, HelpCircle, Sparkles } from 'lucide-react';
import QuizView from '@/components/study/QuizView'; 
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.coerce.number().min(1, { message: 'Must be at least 1 question.' }).max(30, { message: 'Maximum 30 questions.' }), 
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});
type FormData = z.infer<typeof formSchema>;

const PAGE_TITLE = "AI Powered Quiz Creator";

export default function QuizPage() {
  const [generatedQuizData, setGeneratedQuizData] = useState<GenerateQuizQuestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { register, handleSubmit, control, formState: { errors }, watch, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numQuestions: 10, 
      difficulty: 'medium',
      topic: '',
    }
  });
  const topicValue = watch('topic');
  const difficultyValue = watch('difficulty');

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma');
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoading && !generatedQuizData) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { 
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak, isLoading, generatedQuizData]);

  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isSpeaking && !isPaused) {
      speak("Generating quiz. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) { 
      generatingMessageSpokenRef.current = false; 
    }
  }, [isLoading, selectedVoice, isSpeaking, isPaused, speak]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playActionSound();
    setIsLoading(true);
    setGeneratedQuizData(null);
    pageTitleSpokenRef.current = true; 
    generatingMessageSpokenRef.current = false;

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating quiz. Please wait.");
      generatingMessageSpokenRef.current = true;
    }

    try {
      const result = await generateQuizAction({ 
        topic: data.topic, 
        numQuestions: data.numQuestions,
        difficulty: data.difficulty 
      });
      if (result.questions && result.questions.length > 0) {
        setGeneratedQuizData(result);
        toast({ title: 'Quiz Generated!', description: 'Your quiz is ready to start.' });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Quiz ready!");
      } else {
        toast({ title: 'No Quiz Data', description: 'The AI returned no questions for this topic.', variant: 'destructive' });
         if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, no quiz data was returned for this topic.");
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, there was an error generating the quiz.");
    } finally {
      setIsLoading(false);
      generatingMessageSpokenRef.current = false;
    }
  };
  
  const handleNewQuiz = () => {
    playClickSound();
    setGeneratedQuizData(null);
    pageTitleSpokenRef.current = false; 
    generatingMessageSpokenRef.current = false;
    reset({ topic: '', numQuestions: 10, difficulty: 'medium' }); 
  }

  if (generatedQuizData && generatedQuizData.questions && topicValue) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <QuizView questions={generatedQuizData.questions} topic={topicValue} difficulty={difficultyValue} />
        <div className="text-center">
            <Button onClick={handleNewQuiz} variant="outline" size="lg">Create New Quiz</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><HelpCircle className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
            Enter a topic, number of questions (max 30), and difficulty to generate an interactive quiz.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" placeholder="e.g., Solar System, World War II" {...register('topic')} className="transition-colors duration-200 ease-in-out text-base" />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions (1-30)</Label>
                <Input id="numQuestions" type="number" {...register('numQuestions')} className="transition-colors duration-200 ease-in-out text-base" />
                {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                   <Controller
                      name="difficulty"
                      control={control}
                      render={({ field }) => (
                      <Select onValueChange={(value) => {playClickSound(); field.onChange(value);}} value={field.value}>
                          <SelectTrigger id="difficulty" className="text-base"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                      </Select>
                      )}
                  />
                   {errors.difficulty && <p className="text-sm text-destructive">{errors.difficulty.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center p-6">
            <Button type="submit" disabled={isLoading} size="lg" className="min-w-[200px]">
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" /> }
              Generate Quiz
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
