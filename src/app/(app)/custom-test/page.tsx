
"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/lib/actions';
import type { TestSettings, QuizQuestion as TestQuestionType, GenerateQuizQuestionsOutput } from '@/lib/types';
import { Loader2, TestTubeDiagonal, CheckCircle, XCircle, RotateCcw, Clock, Lightbulb, AlertTriangle, Mic, Sparkles, Award, HelpCircle, TimerIcon, PlayCircle, PauseCircle, StopCircle, ImageIcon, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettings } from '@/contexts/SettingsContext';
import { extractTextFromPdf } from '@/lib/utils';

const MAX_RECENT_TOPICS_DISPLAY = 10;
const MAX_RECENT_TOPICS_SELECT = 3;
const PAGE_TITLE = "Advanced Test Configuration";
const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const NOTES_TRUNCATION_LIMIT = 4000; // Character limit for notes sent to AI

const formSchema = z.object({
  sourceType: z.enum(['topic', 'notes', 'recent']).default('topic'),
  topics: z.string().optional(),
  notes: z.string().optional(),
  notesImage: z.string().optional(), // For the data URI of the image with notes
  selectedRecentTopics: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  numQuestions: z.coerce.number().min(1, 'Min 1 question').max(50, 'Max 50 questions').default(5),
  timer: z.coerce.number().min(0, 'Timer cannot be negative').default(0),
  perQuestionTimer: z.coerce.number().min(0, 'Per-question timer cannot be negative').optional().default(0),
}).superRefine((data, ctx) => {
  if (data.sourceType === 'topic' && (!data.topics || data.topics.trim().length < 3)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Topic(s) must be at least 3 characters.", path: ['topics'] });
  }
  if (data.sourceType === 'notes' && (!data.notes || data.notes.trim().length < 50)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Notes must be at least 50 characters.", path: ['notes'] });
  }
  if (data.sourceType === 'recent' && (!data.selectedRecentTopics || data.selectedRecentTopics.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select at least one recent topic.", path: ['selectedRecentTopics'] });
  }
  if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > MAX_RECENT_TOPICS_SELECT) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `You can select a maximum of ${MAX_RECENT_TOPICS_SELECT} recent topics.`, path: ['selectedRecentTopics'] });
  }
});

type FormData = z.infer<typeof formSchema>;

interface CustomTestState {
  settings: TestSettings;
  questions: TestQuestionType[];
  userAnswers: (string | undefined)[];
  currentQuestionIndex: number;
  showResults: boolean;
  score: number;
  timeLeft?: number;
  currentQuestionTimeLeft?: number;
  isAutoSubmitting?: boolean;
  performanceTag?: string;
}

export default function CustomTestPage() {
  const [testState, setTestState] = useState<CustomTestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [recentTopicsSelectionDone, setRecentTopicsSelectionDone] = useState(false);
  const [notesImagePreview, setNotesImagePreview] = useState<string | null>(null);
  const notesImageInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', { priority: 'essential' });
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { volume: 0.4, priority: 'essential' });

  const { speak, setVoicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { soundMode } = useSettings();

  const pageTitleSpokenRef = useRef(false);
  const resultAnnouncementSpokenRef = useRef(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'topic', difficulty: 'medium', numQuestions: 5, timer: 0, perQuestionTimer: 0, selectedRecentTopics: [], notesImage: undefined
    }
  });

  const sourceType = watch('sourceType');
  const selectedRecentTopicsWatch = watch('selectedRecentTopics');
  
  const getPerformanceTag = useCallback((percentage: number): string => {
    if (percentage === 100) return "Conqueror";
    if (percentage >= 90) return "Ace";
    if (percentage >= 80) return "Diamond";
    if (percentage >= 70) return "Gold";
    if (percentage >= 50) return "Bronze";
    return "Keep Practicing!";
  }, []);

  const handleSubmitTest = useCallback((autoSubmitted = false) => {
    if (!autoSubmitted) playClickSound();
    setTestState(prevTestState => {
      if (!prevTestState || prevTestState.showResults) return prevTestState;

      let currentScore = 0;
      const updatedQuestions = prevTestState.questions.map((q, index) => {
        const userAnswer = prevTestState.userAnswers[index];
        const isCorrect = userAnswer !== undefined && q.answer !== undefined && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
        if (isCorrect) currentScore += 4;
        else if (userAnswer !== undefined && userAnswer.trim() !== "") currentScore -= 1;

        if (!autoSubmitted && index === prevTestState.currentQuestionIndex) {
          if (isCorrect) playCorrectSound(); else if (userAnswer !== undefined && userAnswer.trim() !== "") playIncorrectSound();
        }
        return { ...q, userAnswer, isCorrect };
      });

      const totalPossibleScore = prevTestState.questions.length * 4;
      const percentage = totalPossibleScore > 0 ? Math.max(0, (currentScore / totalPossibleScore) * 100) : 0;
      const calculatedPerformanceTag = getPerformanceTag(percentage);

      if (!resultAnnouncementSpokenRef.current) {
        const ttsMessage = `Test ${autoSubmitted ? "auto-submitted" : "submitted"}! Your score is ${currentScore} out of ${totalPossibleScore}. Your performance is ${calculatedPerformanceTag}!`;
        speak(ttsMessage, { priority: 'essential' });
        resultAnnouncementSpokenRef.current = true;
      }
      if (!autoSubmitted || (autoSubmitted && !prevTestState.isAutoSubmitting)) {
        toast({ title: autoSubmitted ? "Test Auto-Submitted!" : "Test Submitted!", description: `Score: ${currentScore}/${totalPossibleScore} (${percentage.toFixed(1)}%). Performance: ${calculatedPerformanceTag}` });
      }

      return {
        ...prevTestState, questions: updatedQuestions, score: currentScore, showResults: true, isAutoSubmitting: autoSubmitted,
        timeLeft: autoSubmitted && prevTestState.timeLeft !== undefined ? 0 : prevTestState.timeLeft,
        performanceTag: calculatedPerformanceTag, currentQuestionTimeLeft: undefined,
      };
    });
  }, [playClickSound, getPerformanceTag, playCorrectSound, playIncorrectSound, speak, toast]);

  const handleNextQuestion = useCallback(() => {
      playClickSound();
      setTestState(prev => {
          if (!prev || prev.currentQuestionIndex >= prev.questions.length - 1 || prev.isAutoSubmitting) {
              if (!prev?.isAutoSubmitting) handleSubmitTest(false);
              return prev;
          }
          const nextIndex = prev.currentQuestionIndex + 1;
          const nextQuestionTime = prev.settings.perQuestionTimer && prev.settings.perQuestionTimer > 0 ? prev.settings.perQuestionTimer : undefined;
          return { ...prev, currentQuestionIndex: nextIndex, currentQuestionTimeLeft: nextQuestionTime };
      });
  }, [playClickSound, handleSubmitTest]);

  useEffect(() => { setVoicePreference('holo'); }, [setVoicePreference]);

  useEffect(() => {
    if (sourceType !== 'recent' || (selectedRecentTopicsWatch && selectedRecentTopicsWatch.length === 0)) {
      setRecentTopicsSelectionDone(false);
    }
  }, [sourceType, selectedRecentTopicsWatch]);

  const handleConfirmRecentTopics = () => {
    playClickSound();
    if (selectedRecentTopicsWatch && selectedRecentTopicsWatch.length > 0) {
      setRecentTopicsSelectionDone(true);
      toast({ title: "Topics Confirmed", description: "Recent topics selection confirmed. Please proceed with other test settings." });
    } else {
      toast({ title: "No Topics Selected", description: "Please select at least one recent topic to confirm.", variant: "destructive" });
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!pageTitleSpokenRef.current && !testState && !isLoading) {
        speak(PAGE_TITLE, { priority: 'optional' });
        pageTitleSpokenRef.current = true;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [speak, testState, isLoading]);

  useEffect(() => { if (isLoading) speak("Creating custom test. Please wait.", { priority: 'essential' }); }, [isLoading, speak]);

  useEffect(() => {
    if (transcript && sourceType === 'topic') setValue('topics', transcript);
    if (transcript && sourceType === 'notes') setValue('notes', transcript);
  }, [transcript, setValue, sourceType]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      if (storedTopics) {
        try { setRecentTopics(JSON.parse(storedTopics).slice(0, MAX_RECENT_TOPICS_DISPLAY)); }
        catch (e) { console.error("Failed to parse recent topics", e); localStorage.removeItem(RECENT_TOPICS_LS_KEY); }
      }
    }
  }, []);

  useEffect(() => {
    if (testState && typeof testState.timeLeft === 'number' && testState.timeLeft > 0 && !testState.showResults) {
      const timerId = setInterval(() => {
        setTestState(currentTestState => {
          if (!currentTestState || typeof currentTestState.timeLeft !== 'number' || currentTestState.timeLeft <= 0 || currentTestState.showResults) {
            clearInterval(timerId);
            return currentTestState;
          }
          const newTimeLeftVal = currentTestState.timeLeft - 1;
          if (newTimeLeftVal <= 0) {
            clearInterval(timerId);
            toast({ title: "Time's Up!", description: "Your test is being submitted automatically.", variant: "default" });
            handleSubmitTest(true);
            return { ...currentTestState, timeLeft: 0, isAutoSubmitting: true };
          }
          return { ...currentTestState, timeLeft: newTimeLeftVal };
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [testState?.timeLeft, testState?.showResults, handleSubmitTest, toast]);

  useEffect(() => {
    if (testState && !testState.showResults && testState.settings.perQuestionTimer && testState.settings.perQuestionTimer > 0) {
      const timerId = setInterval(() => {
        setTestState(prev => {
          if (!prev || prev.showResults || !prev.currentQuestionTimeLeft || prev.currentQuestionTimeLeft <= 0) {
            clearInterval(timerId);
            return prev;
          }
          const newTimeLeft = prev.currentQuestionTimeLeft - 1;
          if (newTimeLeft <= 0) {
            clearInterval(timerId);
            toast({ title: "Time's up for this question!", variant: "default" });
            handleNextQuestion();
            return { ...prev, currentQuestionTimeLeft: 0 };
          }
          return { ...prev, currentQuestionTimeLeft: newTimeLeft };
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [testState?.currentQuestionIndex, testState?.settings.perQuestionTimer, testState?.showResults, handleNextQuestion, toast]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playActionSound();
    setIsLoading(true); setTestState(null);
    resultAnnouncementSpokenRef.current = false;
    pageTitleSpokenRef.current = true;
    speak("Creating custom test. Please wait.", { priority: 'essential' });

    let topicForAI = ""; let topicsForSettings: string[] = []; let notesForAI = "";
    if (data.sourceType === 'topic' && data.topics) {
        topicForAI = data.topics; topicsForSettings = [data.topics];
    } else if (data.sourceType === 'notes' && data.notes) {
        notesForAI = data.notes;
        if (notesForAI.length > NOTES_TRUNCATION_LIMIT) {
          const truncatedNotes = `${notesForAI.substring(0, NOTES_TRUNCATION_LIMIT / 2)}... (content truncated) ...${notesForAI.substring(notesForAI.length - NOTES_TRUNCATION_LIMIT / 2)}`;
          topicForAI = `questions based on the following notes: ${truncatedNotes}`;
          toast({ title: "Notes Truncated", description: `Your notes were long and have been truncated to prevent errors.`, variant: "default"});
        } else {
          topicForAI = `questions based on the following notes: ${notesForAI}`;
        }
        topicsForSettings = ["Notes-based Test"];
    } else if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > 0) {
        topicForAI = data.selectedRecentTopics.join(', '); topicsForSettings = data.selectedRecentTopics;
    } else {
        toast({ title: "Error", description: "Please provide a topic, notes, or select recent topics.", variant: "destructive" });
        setIsLoading(false); return;
    }

    const settings: TestSettings = {
      topics: topicsForSettings, sourceType: data.sourceType, selectedRecentTopics: data.selectedRecentTopics,
      notes: data.notes, difficulty: data.difficulty, numQuestions: data.numQuestions,
      timer: data.timer, perQuestionTimer: data.perQuestionTimer
    };

    try {
      const result: GenerateQuizQuestionsOutput = await generateQuizAction({
        topic: topicForAI,
        numQuestions: settings.numQuestions,
        difficulty: settings.difficulty,
        image: data.sourceType === 'notes' ? data.notesImage : undefined
      });

      if (result.questions && result.questions.length > 0) {
        setTestState({
          settings, questions: result.questions, userAnswers: Array(result.questions.length).fill(undefined),
          currentQuestionIndex: 0, showResults: false, score: 0,
          timeLeft: settings.timer && settings.timer > 0 ? settings.timer * 60 : undefined,
          currentQuestionTimeLeft: settings.perQuestionTimer && settings.perQuestionTimer > 0 ? settings.perQuestionTimer : undefined,
        });
        toast({ title: 'Test Generated!', description: 'Your custom test is ready to start.' });
        speak("Test Generated!", { priority: 'essential' });
      } else {
        toast({ title: 'No Questions', description: 'The AI returned no questions for this configuration.', variant: 'destructive' });
        speak("Sorry, no questions were returned.", { priority: 'essential' });
      }
    } catch (error) {
      console.error('Error generating custom test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate test. Please try again.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      speak("Sorry, there was an error generating the test.", { priority: 'essential' });
    } finally { setIsLoading(false); }
  };

  const handleAnswerSelect = (answer: string) => { 
    playClickSound();
    if (!testState || testState.showResults || testState.isAutoSubmitting) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = answer;
    setTestState({ ...testState, userAnswers: newUserAnswers });
  };

  const handleShortAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!testState || testState.showResults || testState.isAutoSubmitting) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = e.target.value;
    setTestState(prev => prev ? { ...prev, userAnswers: newUserAnswers } : null);
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (!testState || testState.currentQuestionIndex <= 0 || testState.isAutoSubmitting) return;
    setTestState(prev => {
      if (!prev) return null;
      const prevQuestionTime = prev.settings.perQuestionTimer && prev.settings.perQuestionTimer > 0 ? prev.settings.perQuestionTimer : undefined;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1, currentQuestionTimeLeft: prevQuestionTime };
    });
  };

  const handleRetakeTest = () => {
    playActionSound(); 
    if (!testState) return;
    const originalSettings = testState.settings;
    setIsLoading(true); setTestState(null);
    resultAnnouncementSpokenRef.current = false;
    pageTitleSpokenRef.current = true;

    speak("Recreating test. Please wait.", { priority: 'essential' });
    let topicForAI = "";
    if (originalSettings.sourceType === 'topic' && originalSettings.topics.length > 0) topicForAI = originalSettings.topics.join(', ');
    else if (originalSettings.sourceType === 'notes' && originalSettings.notes) topicForAI = `questions based on the following notes: ${originalSettings.notes}`;
    else if (originalSettings.sourceType === 'recent' && originalSettings.selectedRecentTopics && originalSettings.selectedRecentTopics.length > 0) topicForAI = originalSettings.selectedRecentTopics.join(', ');

    generateQuizAction({ topic: `${topicForAI}`, numQuestions: originalSettings.numQuestions, difficulty: originalSettings.difficulty })
      .then(result => {
        if (result.questions && result.questions.length > 0) {
          setTestState({
            settings: originalSettings, questions: result.questions, userAnswers: Array(result.questions.length).fill(undefined),
            currentQuestionIndex: 0, showResults: false, score: 0,
            timeLeft: originalSettings.timer && originalSettings.timer > 0 ? originalSettings.timer * 60 : undefined,
            currentQuestionTimeLeft: originalSettings.perQuestionTimer && originalSettings.perQuestionTimer > 0 ? originalSettings.perQuestionTimer : undefined,
          });
          speak("Test ready for retake!", { priority: 'essential' });
        } else {
          toast({ title: 'Retake Error', description: 'Could not regenerate questions for retake.', variant: 'destructive' });
          speak("Sorry, could not regenerate the test.", { priority: 'essential' });
        }
      })
      .catch(error => { console.error('Error retaking test:', error); const errorMessage = error instanceof Error ? error.message : 'Failed to retake test.'; toast({ title: 'Error', description: errorMessage, variant: 'destructive' }); })
      .finally(() => { setIsLoading(false); });
  };

  const handleNewTest = () => {
    playActionSound(); 
    setTestState(null);
    pageTitleSpokenRef.current = false; resultAnnouncementSpokenRef.current = false;
    setValue('topics', ''); setValue('notes', ''); setValue('selectedRecentTopics', []);
    setValue('difficulty', 'medium'); setValue('numQuestions', 5); setValue('timer', 0); setValue('perQuestionTimer', 0);
    setRecentTopicsSelectionDone(false);
  };

  const overallTimeLeft = testState?.timeLeft;
  const perQuestionTimeLeft = testState?.currentQuestionTimeLeft;

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds < 0) return null;
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleMicClick = () => { playClickSound(); if (isListening) stopListening(); else startListening(); };

  const handleRecentTopicChange = (topic: string) => {
    playClickSound(); const currentSelected = selectedRecentTopicsWatch || []; let newSelected: string[];
    if (currentSelected.includes(topic)) newSelected = currentSelected.filter(t => t !== topic);
    else {
      if (currentSelected.length < MAX_RECENT_TOPICS_SELECT) newSelected = [...currentSelected, topic];
      else { toast({ title: "Limit Reached", description: `You can select a maximum of ${MAX_RECENT_TOPICS_SELECT} topics.`, variant: "default" }); return; }
    }
    setValue('selectedRecentTopics', newSelected, { shouldValidate: true });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({ title: "Image too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setNotesImagePreview(reader.result as string);
          setValue('notesImage', reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({ title: "PDF too large", description: "Please upload a PDF smaller than 5MB.", variant: "destructive" });
          return;
        }
        toast({ title: "Processing PDF...", description: "Extracting text from your document." });
        try {
          const text = await extractTextFromPdf(file);
          setValue('notes', text);
          setNotesImagePreview(null);
          setValue('notesImage', undefined);
          toast({ title: "PDF Processed!", description: "Text has been placed in the notes field." });
        } catch (error) {
          toast({ title: "PDF Error", description: "Could not extract text from the PDF.", variant: "destructive" });
        }
      } else {
        toast({ title: "Unsupported File", description: "This feature currently supports Images and PDFs.", variant: "default" });
      }
    }
  };

  const handleRemoveImage = () => {
    playClickSound();
    setNotesImagePreview(null);
    setValue('notesImage', undefined);
    if (notesImageInputRef.current) {
      notesImageInputRef.current.value = "";
    }
  };

  if (!testState) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4"><TestTubeDiagonal className="h-12 w-12 text-primary" /></div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex-1 text-center">{PAGE_TITLE}</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">Configure your test parameters. Generate questions from topics, notes, or recent studies.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <div>
                <Label className="text-base font-semibold mb-2 block">Test Source</Label>
                <Controller name="sourceType" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={(value) => { playClickSound(); field.onChange(value); setRecentTopicsSelectionDone(false); }} value={field.value} className="flex flex-col sm:flex-row gap-4">
                    <Label htmlFor="source-topic" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer flex-1 transition-all"><RadioGroupItem value="topic" id="source-topic" /> <span>Topic(s)</span></Label>
                    <Label htmlFor="source-notes" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer flex-1 transition-all"><RadioGroupItem value="notes" id="source-notes" /> <span>My Notes</span></Label>
                    <Label htmlFor="source-recent" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer flex-1 transition-all"><RadioGroupItem value="recent" id="source-recent" /> <span>Recent Topics</span></Label>
                  </RadioGroup>
                )} />
              </div>
              {sourceType === 'topic' && (
                <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="topics" className="text-base">Topic(s)</Label>
                  <div className="flex gap-2">
                    <Input id="topics" placeholder="e.g., Photosynthesis, World War II" {...register('topics')} className="transition-colors duration-200 ease-in-out text-base" />
                    {browserSupportsSpeechRecognition && (<Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading || isListening}><Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} /></Button>)}
                  </div>
                  {errors.topics && <p className="text-sm text-destructive">{errors.topics.message}</p>}
                  {voiceError && <p className="text-sm text-destructive">Voice input error. Please try again.</p>}
                </div>
              )}
              {sourceType === 'notes' && (
                <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="notes" className="text-base">Your Notes</Label>
                   <div className="flex gap-2">
                    <Textarea id="notes" placeholder="Paste your study notes here (min 50 characters)..." {...register('notes')} rows={6} className="transition-colors duration-200 ease-in-out text-base flex-1" />
                    <div className="flex flex-col gap-2">
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button type="button" variant="outline" size="icon" onClick={() => notesImageInputRef.current?.click()} title="Attach Image or PDF">
                             <ImageIcon className="w-5 h-5" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent><p>Attach Image or PDF</p></TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                      {browserSupportsSpeechRecognition && (
                        <Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading || isListening}>
                          <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                  {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
                  
                  {notesImagePreview && (
                    <div className="relative w-20 h-20">
                      <Image src={notesImagePreview} alt="Notes preview" layout="fill" objectFit="cover" className="rounded-md" />
                      <Button type="button" variant="ghost" size="icon" onClick={handleRemoveImage} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <input type="file" ref={notesImageInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
                  {voiceError && <p className="text-sm text-destructive">Voice input error. Please try again.</p>}
                </div>
              )}
              {sourceType === 'recent' && (
                <div className="space-y-3 animate-in fade-in-50">
                  <Label className="text-base font-semibold">Select Recent Topic(s) (Max {MAX_RECENT_TOPICS_SELECT})</Label>
                  {recentTopics.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/30">
                      {recentTopics.map(topic => (
                        <Label key={topic} htmlFor={`recent-${topic}`} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer has-[:checked]:bg-primary/10 transition-colors">
                          <Checkbox id={`recent-${topic}`} checked={(selectedRecentTopicsWatch || []).includes(topic)} onCheckedChange={() => handleRecentTopicChange(topic)} disabled={(selectedRecentTopicsWatch || []).length >= MAX_RECENT_TOPICS_SELECT && !(selectedRecentTopicsWatch || []).includes(topic)} />
                          <span className="text-sm">{topic}</span>
                        </Label>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground p-2 border rounded-md">No recent topics found. Generate some notes first!</p>}
                  {errors.selectedRecentTopics && <p className="text-sm text-destructive">{errors.selectedRecentTopics.message}</p>}
                  
                  {recentTopics.length > 0 && selectedRecentTopicsWatch && selectedRecentTopicsWatch.length > 0 && !recentTopicsSelectionDone && (
                    <Button type="button" onClick={handleConfirmRecentTopics} variant="secondary" className="mt-2">Confirm Recent Topics Selection</Button>
                  )}
                  {recentTopicsSelectionDone && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 p-2 border border-green-500 bg-green-500/10 rounded-md text-sm">
                      <CheckCircle className="h-5 w-5" />
                      <span>Recent topics selection confirmed!</span>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-base">Difficulty</Label>
                  <Controller name="difficulty" control={control} render={({ field }) => (
                    <Select onValueChange={(value) => { playClickSound(); field.onChange(value); }} value={field.value}>
                      <SelectTrigger id="difficulty" className="text-base"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                      <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numQuestions" className="text-base">Number of Questions (1-50)</Label>
                  <Input id="numQuestions" type="number" {...register('numQuestions')} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timer" className="text-base">Overall Test Timer (minutes, 0 for none)</Label>
                  <Input id="timer" type="number" {...register('timer')} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.timer && <p className="text-sm text-destructive">{errors.timer.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perQuestionTimer" className="text-base">Time per Question (sec, 0 for none)</Label>
                  <Input id="perQuestionTimer" type="number" {...register('perQuestionTimer')} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.perQuestionTimer && <p className="text-sm text-destructive">{errors.perQuestionTimer.message}</p>}
                  <p className="text-xs text-muted-foreground/80">Per-question timer will auto-advance if time expires.</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/80 text-center">Marking: +4 correct, -1 incorrect (for answered questions).</p>
            </CardContent>
            <CardFooter className="justify-center p-6">
              <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px] group">
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />}
                Generate Test
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  const currentQuestionData = testState.questions[testState.currentQuestionIndex];
  const currentAnswerForQuestion = testState?.userAnswers[testState.currentQuestionIndex];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        {!testState.showResults && currentQuestionData ? (
          <>
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl text-primary font-bold truncate max-w-md">Test: {testState.settings.topics.join(', ').substring(0, 50)}{testState.settings.topics.join(', ').length > 50 ? "..." : ""} (Difficulty: {testState.settings.difficulty})</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {overallTimeLeft !== undefined && formatTime(overallTimeLeft) !== null && (<span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Total: {formatTime(overallTimeLeft)}</span>)}
                  {perQuestionTimeLeft !== undefined && testState.settings.perQuestionTimer && testState.settings.perQuestionTimer > 0 && formatTime(perQuestionTimeLeft) !== null && (<span className="flex items-center gap-1"><TimerIcon className="w-4 h-4 text-destructive animate-pulse" /> Q Time: {formatTime(perQuestionTimeLeft)}</span>)}
                </div>
              </div>
              <Progress value={((testState.currentQuestionIndex + 1) / testState.questions.length) * 100} className="w-full mt-3 h-2.5" />
              <CardDescription className="mt-2 text-center sm:text-left">Question {testState.currentQuestionIndex + 1} of {testState.questions.length}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <ReactMarkdown className="text-lg font-semibold prose dark:prose-invert max-w-none">{currentQuestionData.question}</ReactMarkdown>
              
              {currentQuestionData.type === 'short-answer' ? (
                <Input value={currentAnswerForQuestion || ''} onChange={handleShortAnswerChange} disabled={testState.showResults || testState.isAutoSubmitting} placeholder="Type your answer here" className="text-base" aria-label="Short answer input"/>
              ) : currentQuestionData.options ? (
                <RadioGroup onValueChange={handleAnswerSelect} value={currentAnswerForQuestion} className="space-y-3">
                  {currentQuestionData.options.map((option, i) => (
                    <Label key={i} htmlFor={`option-${i}-${testState.currentQuestionIndex}`} className={cn("flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer transition-all", currentAnswerForQuestion === option && "bg-primary/20 border-primary", (testState.showResults || testState.isAutoSubmitting) && "cursor-not-allowed opacity-70")}>
                      <RadioGroupItem value={option} id={`option-${i}-${testState.currentQuestionIndex}`} disabled={testState.showResults || testState.isAutoSubmitting}/>
                      <span className="text-base">{option}</span>
                    </Label>
                  ))}
                </RadioGroup>
              ) : (<p className="text-muted-foreground">Question options not available.</p>)}
            </CardContent>
            <CardFooter className="flex justify-between p-6 border-t">
              <Button variant="outline" onClick={handlePrevQuestion} disabled={testState.currentQuestionIndex === 0 || testState.isAutoSubmitting}>Previous</Button>
              {testState.currentQuestionIndex < testState.questions.length - 1 ? (<Button onClick={handleNextQuestion} disabled={testState.isAutoSubmitting}>Next</Button>) : (<Button onClick={() => handleSubmitTest(false)} variant="default" disabled={testState.isAutoSubmitting}>Submit Test</Button>)}
            </CardFooter>
          </>
        ) : testState.showResults ? (
          <Card>
            <CardHeader className="text-center border-b pb-4">
              <CardTitle className="text-3xl font-bold text-primary">Test Results</CardTitle>
              <CardDescription className="text-lg">You scored {testState.score} out of {testState.questions.length * 4} ({((testState.score / (testState.questions.length * 4 || 1)) * 100).toFixed(1)}%)</CardDescription>
              {testState.performanceTag && (<Badge variant={testState.performanceTag === "Conqueror" || testState.performanceTag === "Ace" ? "default" : testState.performanceTag === "Diamond" || testState.performanceTag === "Gold" ? "secondary" : testState.performanceTag === "Bronze" ? "outline" : "destructive"} className="mx-auto mt-2 text-base px-4 py-1.5 shadow-md"><Award className="w-5 h-5 mr-2" /> {testState.performanceTag}</Badge>)}
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-center mb-4 text-muted-foreground">Review Your Answers</h3>
              {testState.questions.map((q, index) => (
                <Card key={index} className={cn("overflow-hidden shadow-sm", q.isCorrect ? 'border-green-500/70 bg-green-500/10' : (q.userAnswer !== undefined && q.userAnswer.trim() !== "") ? 'border-destructive/70 bg-destructive/10' : 'border-border bg-muted/30')}>
                  <CardHeader className="pb-3 pt-4 px-4"><CardTitle className="text-base flex items-start gap-2">{q.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : (q.userAnswer !== undefined && q.userAnswer.trim() !== "") ? <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" /> : <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}<span className="font-normal text-sm text-muted-foreground mr-1">Q{index + 1}:</span><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline leading-tight">{q.question}</ReactMarkdown></CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1 px-4 pb-4">
                    <p>Your answer: <span className="font-medium">{q.userAnswer || 'Not answered'}</span></p>
                    {!q.isCorrect && <p>Correct answer: <span className="font-medium text-green-600 dark:text-green-500">{q.answer}</span></p>}
                    {q.explanation && (<Alert variant="default" className="mt-2 bg-accent/10 border-accent/30 p-3"><Lightbulb className="h-4 w-4 text-accent-foreground/80" /><AlertTitle className="text-accent-foreground/90 text-xs font-semibold">Explanation</AlertTitle><AlertDescription className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground"><ReactMarkdown>{q.explanation}</ReactMarkdown></AlertDescription></Alert>)}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-6 border-t">
              <Button onClick={handleRetakeTest} disabled={isLoading} size="lg"><RotateCcw className="w-4 h-4 mr-2" />Retake Test</Button>
              <Button variant="outline" onClick={handleNewTest} size="lg">Create New Test</Button>
            </CardFooter>
          </Card>
        ) : (
          <Card><CardHeader className="text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" /><AlertTitle className="text-xl font-semibold">Test Error</AlertTitle></CardHeader><CardContent className="text-center"><AlertDescription className="text-muted-foreground">Something went wrong, or no questions were generated. Please try configuring a new test.</AlertDescription><Button variant="outline" onClick={handleNewTest} className="mt-6">Create New Test</Button></CardContent></Card>
        )}
      </Card>
    </div>
  );
}
