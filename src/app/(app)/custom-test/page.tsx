
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Loader2, TestTubeDiagonal, CheckCircle, XCircle, RotateCcw, Clock, Lightbulb, AlertTriangle, Mic, Sparkles, Award, HelpCircle, TimerIcon, PlayCircle, PauseCircle, StopCircle, Palette } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { Badge } from '@/components/ui/badge';

const MAX_RECENT_TOPICS_DISPLAY = 10;
const MAX_RECENT_TOPICS_SELECT = 3;
const PAGE_TITLE = "Advanced Test Configuration";
const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';

const formSchema = z.object({
  sourceType: z.enum(['topic', 'notes', 'recent']).default('topic'),
  topics: z.string().optional(),
  notes: z.string().optional(),
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
  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', 0.5);
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', 0.5);
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, supportedVoices, selectedVoice, setVoicePreference, voicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);
  const resultAnnouncementSpokenRef = useRef(false);

  const currentQuestionTimerIdRef = useRef<NodeJS.Timeout | null>(null);
  const overallTestTimerIdRef = useRef<NodeJS.Timeout | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'topic', difficulty: 'medium', numQuestions: 5, timer: 0, perQuestionTimer: 0, selectedRecentTopics: [],
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

  const clearCurrentQuestionTimer = useCallback(() => {
    if (currentQuestionTimerIdRef.current) clearInterval(currentQuestionTimerIdRef.current);
    currentQuestionTimerIdRef.current = null;
  }, []);

  const clearOverallTestTimer = useCallback(() => {
    if (overallTestTimerIdRef.current) clearInterval(overallTestTimerIdRef.current);
    overallTestTimerIdRef.current = null;
  }, []);

  const handleSubmitTest = useCallback((autoSubmitted = false) => {
    if (!autoSubmitted) playClickSound();
    clearCurrentQuestionTimer();
    clearOverallTestTimer();

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

      if (!resultAnnouncementSpokenRef.current && selectedVoice && !isSpeaking && !isPaused) {
        const ttsMessage = `Test ${autoSubmitted ? "auto-submitted" : "submitted"}! Your score is ${currentScore} out of ${totalPossibleScore}. Your performance is ${calculatedPerformanceTag}!`;
        speak(ttsMessage);
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
  }, [playClickSound, clearCurrentQuestionTimer, clearOverallTestTimer, getPerformanceTag, playCorrectSound, playIncorrectSound, selectedVoice, isSpeaking, isPaused, speak, toast]);


  const handleNextQuestion = useCallback(() => {
    playClickSound();
    clearCurrentQuestionTimer();
    setTestState(prev => {
      if (!prev || prev.showResults || prev.currentQuestionIndex >= prev.questions.length - 1) return prev;
      const nextQuestionTime = prev.settings.perQuestionTimer && prev.settings.perQuestionTimer > 0 ? prev.settings.perQuestionTimer : undefined;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1, currentQuestionTimeLeft: nextQuestionTime };
    });
  }, [playClickSound, clearCurrentQuestionTimer]);


  useEffect(() => {
    let isMounted = true;
    if (isMounted && supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia');
      voicePreferenceWasSetRef.current = true;
    }
    return () => { isMounted = false; };
  }, [supportedVoices, setVoicePreference]);


  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !testState && !isLoading) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { 
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak, testState, isLoading]);

  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isSpeaking && !isPaused) {
      speak("Creating custom test. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) generatingMessageSpokenRef.current = false;
  }, [isLoading, selectedVoice, isSpeaking, isPaused, speak]);

  useEffect(() => {
    if (transcript && sourceType === 'topic') setValue('topics', transcript);
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
    if (overallTestTimerIdRef.current) clearInterval(overallTestTimerIdRef.current);
    if (testState && typeof testState.timeLeft === 'number' && testState.timeLeft > 0 && !testState.showResults && !testState.isAutoSubmitting) {
      overallTestTimerIdRef.current = setInterval(() => {
        setTestState(currentTestState => {
          if (!currentTestState || typeof currentTestState.timeLeft !== 'number' || currentTestState.timeLeft <= 0 || currentTestState.showResults || currentTestState.isAutoSubmitting) {
            if (overallTestTimerIdRef.current) clearInterval(overallTestTimerIdRef.current); return currentTestState;
          }
          const newTimeLeftVal = currentTestState.timeLeft - 1;
          if (newTimeLeftVal <= 0) {
            if (overallTestTimerIdRef.current) clearInterval(overallTestTimerIdRef.current);
            toast({ title: "Time's Up!", description: "Your test is being submitted automatically.", variant: "default" });
            handleSubmitTest(true);
            return { ...currentTestState, timeLeft: 0, isAutoSubmitting: true };
          }
          return { ...currentTestState, timeLeft: newTimeLeftVal };
        });
      }, 1000);
    }
    return () => {
      if (overallTestTimerIdRef.current) clearInterval(overallTestTimerIdRef.current);
    };
  }, [testState?.timeLeft, testState?.isAutoSubmitting, testState?.showResults, handleSubmitTest, toast]);

  useEffect(() => {
    clearCurrentQuestionTimer();
    if (testState && !testState.showResults && !testState.isAutoSubmitting && testState.settings.perQuestionTimer && testState.settings.perQuestionTimer > 0) {
      const perQuestionDuration = testState.settings.perQuestionTimer;
      if (testState.currentQuestionTimeLeft === undefined || testState.currentQuestionTimeLeft > perQuestionDuration || testState.currentQuestionTimeLeft <= 0) {
        setTestState(prev => prev ? { ...prev, currentQuestionTimeLeft: perQuestionDuration } : null);
      }
      currentQuestionTimerIdRef.current = setInterval(() => {
        setTestState(prev => {
          if (!prev || prev.showResults || prev.isAutoSubmitting || !prev.currentQuestionTimeLeft || prev.currentQuestionTimeLeft <= 0) {
            clearCurrentQuestionTimer(); return prev;
          }
          const newTimeLeft = prev.currentQuestionTimeLeft - 1;
          if (newTimeLeft <= 0) {
            clearCurrentQuestionTimer();
            toast({ title: "Time's up for this question!", variant: "default" });
            if (prev.currentQuestionIndex < prev.questions.length - 1) handleNextQuestion();
            else handleSubmitTest(true);
            return { ...prev, currentQuestionTimeLeft: 0 };
          }
          return { ...prev, currentQuestionTimeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => clearCurrentQuestionTimer();
  }, [testState?.currentQuestionIndex, testState?.settings.perQuestionTimer, testState?.showResults, testState?.isAutoSubmitting, handleNextQuestion, handleSubmitTest, toast, clearCurrentQuestionTimer]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true); setTestState(null);
    resultAnnouncementSpokenRef.current = false;
    pageTitleSpokenRef.current = true;
    generatingMessageSpokenRef.current = false;

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Creating custom test. Please wait.");
      generatingMessageSpokenRef.current = true;
    }

    let topicForAI = ""; let topicsForSettings: string[] = [];
    if (data.sourceType === 'topic' && data.topics) { topicForAI = data.topics; topicsForSettings = [data.topics]; }
    else if (data.sourceType === 'notes' && data.notes) { topicForAI = `the following notes: ${data.notes}`; topicsForSettings = ["Notes-based Test"]; }
    else if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > 0) { topicForAI = data.selectedRecentTopics.join(', '); topicsForSettings = data.selectedRecentTopics; }
    else { toast({ title: "Error", description: "Please provide a topic, notes, or select recent topics.", variant: "destructive" }); setIsLoading(false); generatingMessageSpokenRef.current = false; return; }

    const settings: TestSettings = {
      topics: topicsForSettings, sourceType: data.sourceType, selectedRecentTopics: data.selectedRecentTopics,
      notes: data.notes, difficulty: data.difficulty, numQuestions: data.numQuestions,
      timer: data.timer, perQuestionTimer: data.perQuestionTimer
    };

    try {
      const quizInputTopic = data.sourceType === 'notes' ? `questions based on the following notes: ${data.notes}` : topicForAI;
      const result: GenerateQuizQuestionsOutput = await generateQuizAction({ topic: `${quizInputTopic}`, numQuestions: settings.numQuestions, difficulty: settings.difficulty });

      if (result.questions && result.questions.length > 0) {
        setTestState({
          settings, questions: result.questions, userAnswers: Array(result.questions.length).fill(undefined),
          currentQuestionIndex: 0, showResults: false, score: 0,
          timeLeft: settings.timer && settings.timer > 0 ? settings.timer * 60 : undefined,
          currentQuestionTimeLeft: settings.perQuestionTimer && settings.perQuestionTimer > 0 ? settings.perQuestionTimer : undefined,
        });
        toast({ title: 'Test Generated!', description: 'Your custom test is ready to start.' });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Test Generated!");
      } else {
        toast({ title: 'No Questions', description: 'The AI returned no questions for this configuration.', variant: 'destructive' });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, no questions were returned.");
      }
    } catch (error) {
      console.error('Error generating custom test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate test. Please try again.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, there was an error generating the test.");
    } finally { setIsLoading(false); generatingMessageSpokenRef.current = false; }
  };

  const handleAnswerSelect = (answer: string) => {
    playClickSound();
    if (!testState || testState.showResults) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = answer;
    setTestState({ ...testState, userAnswers: newUserAnswers });
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (!testState || testState.currentQuestionIndex <= 0 || testState.isAutoSubmitting) return;
    clearCurrentQuestionTimer();
    setTestState(prev => {
      if (!prev) return null;
      const prevQuestionTime = prev.settings.perQuestionTimer && prev.settings.perQuestionTimer > 0 ? prev.settings.perQuestionTimer : undefined;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1, currentQuestionTimeLeft: prevQuestionTime };
    });
  };

  const handleRetakeTest = () => {
    playClickSound(); if (!testState) return;
    const originalSettings = testState.settings;
    setIsLoading(true); setTestState(null);
    resultAnnouncementSpokenRef.current = false;
    pageTitleSpokenRef.current = true;
    generatingMessageSpokenRef.current = false;

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Recreating test. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
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
          if (selectedVoice && !isSpeaking && !isPaused) speak("Test ready for retake!");
        } else {
          toast({ title: 'Retake Error', description: 'Could not regenerate questions for retake.', variant: 'destructive' });
          if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, could not regenerate the test.");
        }
      })
      .catch(error => { console.error('Error retaking test:', error); const errorMessage = error instanceof Error ? error.message : 'Failed to retake test.'; toast({ title: 'Error', description: errorMessage, variant: 'destructive' }); })
      .finally(() => { setIsLoading(false); generatingMessageSpokenRef.current = false; });
  };

  const handleNewTest = () => {
    playClickSound(); setTestState(null); clearCurrentQuestionTimer(); clearOverallTestTimer();
    pageTitleSpokenRef.current = false; resultAnnouncementSpokenRef.current = false;
    generatingMessageSpokenRef.current = false;
    setValue('topics', ''); setValue('notes', ''); setValue('selectedRecentTopics', []);
    setValue('difficulty', 'medium'); setValue('numQuestions', 5); setValue('timer', 0); setValue('perQuestionTimer', 0);
  };

  const currentQuestionData = testState?.questions[testState.currentQuestionIndex];
  const overallTimeLeft = testState?.timeLeft;
  const perQuestionTimeLeft = testState?.currentQuestionTimeLeft;

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds < 0) return '00:00';
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

  const handlePlaybackControl = () => {
    playClickSound();
    let textToPlay = "";
    if (!pageTitleSpokenRef.current && !testState && !isLoading) textToPlay = PAGE_TITLE;
    else if (testState?.showResults && !resultAnnouncementSpokenRef.current && testState.score !== undefined && testState.questions.length > 0 && testState.performanceTag) {
      textToPlay = `Test submitted! Your score is ${testState.score} out of ${testState.questions.length * 4}. Your performance is ${testState.performanceTag}!`;
    } else if (isLoading && !generatingMessageSpokenRef.current) {
      textToPlay = "Creating custom test. Please wait.";
    }
    if (textToPlay && selectedVoice && !isSpeaking && !isPaused) {
      speak(textToPlay);
      if (textToPlay === PAGE_TITLE && !pageTitleSpokenRef.current) pageTitleSpokenRef.current = true;
      else if (textToPlay.startsWith("Test submitted") && !resultAnnouncementSpokenRef.current) resultAnnouncementSpokenRef.current = true;
      else if (textToPlay.startsWith("Creating custom test") && !generatingMessageSpokenRef.current) generatingMessageSpokenRef.current = true;
    } else if (isSpeaking && !isPaused) {
      pauseTTS();
    } else if (isPaused) {
      resumeTTS();
    }
  };
  const handleStopTTS = () => { playClickSound(); cancelTTS(); };

  const getSelectedDropdownValue = () => {
    if (voicePreference) return voicePreference;
    if (selectedVoice?.name.toLowerCase().includes('zia')) return 'zia';
    if (selectedVoice?.name.toLowerCase().includes('kai')) return 'kai';
    return 'zia';
  };

  if (!testState) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4"><TestTubeDiagonal className="h-12 w-12 text-primary" /></div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex-1 text-center">{PAGE_TITLE}</CardTitle>
              <div className="flex items-center gap-1 self-center sm:self-end mt-2 sm:mt-0">
                <Select
                  value={getSelectedDropdownValue()}
                  onValueChange={(value) => { playClickSound(); setVoicePreference(value as 'zia' | 'kai' | null); }}
                >
                  <SelectTrigger className="w-auto text-xs h-7 px-2 py-1"> <SelectValue placeholder="Voice" /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zia">Zia</SelectItem>
                    <SelectItem value="kai">Kai</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handlePlaybackControl} variant="outline" size="icon" className="h-7 w-7" title={isSpeaking && !isPaused ? "Pause" : isPaused ? "Resume" : "Play Title"}>
                  {isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </Button>
                <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-7 w-7" title="Stop" disabled={!isSpeaking && !isPaused}>
                  <StopCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">Configure your test parameters. Generate questions from topics, notes, or recent studies.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <div>
                <Label className="text-base font-semibold mb-2 block">Test Source</Label>
                <Controller name="sourceType" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={(value) => { playClickSound(); field.onChange(value); }} value={field.value} className="flex flex-col sm:flex-row gap-4">
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
                  {voiceError && <p className="text-sm text-destructive">Voice input error: {voiceError}</p>}
                </div>
              )}
              {sourceType === 'notes' && (
                <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="notes" className="text-base">Your Notes</Label>
                  <Textarea id="notes" placeholder="Paste your study notes here (min 50 characters)..." {...register('notes')} rows={6} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
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
              <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px] transition-all duration-300 ease-in-out group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 active:scale-95">
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />}
                Generate Test
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (isLoading && !testState) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
        <p className="text-2xl text-muted-foreground font-semibold">Generating your custom test...</p><p className="text-lg text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="shadow-lg w-full">
        {!testState.showResults && currentQuestionData ? (
          <>
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl text-primary font-bold truncate max-w-md">Test: {testState.settings.topics.join(', ').substring(0, 50)}{testState.settings.topics.join(', ').length > 50 ? "..." : ""} (Difficulty: {testState.settings.difficulty})</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {overallTimeLeft !== undefined && (<span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Total: {formatTime(overallTimeLeft)}</span>)}
                  {perQuestionTimeLeft !== undefined && testState.settings.perQuestionTimer && testState.settings.perQuestionTimer > 0 && (<span className="flex items-center gap-1"><TimerIcon className="w-4 h-4 text-destructive animate-pulse" /> Q Time: {formatTime(perQuestionTimeLeft)}</span>)}
                </div>
              </div>
              <Progress value={((testState.currentQuestionIndex + 1) / testState.questions.length) * 100} className="w-full mt-3 h-2.5" />
              <CardDescription className="mt-2 text-center sm:text-left">Question {testState.currentQuestionIndex + 1} of {testState.questions.length}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <ReactMarkdown className="text-lg font-semibold prose dark:prose-invert max-w-none">{currentQuestionData.question}</ReactMarkdown>
              <RadioGroup onValueChange={(value) => { playClickSound(); handleAnswerSelect(value); }} value={testState.userAnswers[testState.currentQuestionIndex]} className="space-y-3">
                {currentQuestionData.options?.map((option, i) => (<Label key={i} htmlFor={`option-${i}-${testState.currentQuestionIndex}`} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer transition-all"><RadioGroupItem value={option} id={`option-${i}-${testState.currentQuestionIndex}`} /><span className="text-base">{option}</span></Label>))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between p-6 border-t">
              <Button variant="outline" onClick={handlePrevQuestion} disabled={testState.currentQuestionIndex === 0 || testState.isAutoSubmitting}>Previous</Button>
              {testState.currentQuestionIndex < testState.questions.length - 1 ? (<Button onClick={handleNextQuestion} disabled={testState.isAutoSubmitting}>Next</Button>) : (<Button onClick={() => handleSubmitTest(false)} variant="default" disabled={testState.isAutoSubmitting}>Submit Test</Button>)}
            </CardFooter>
          </>
        ) : testState.showResults ? (
          <Card className="w-full">
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
          <Card className="w-full shadow-xl"><CardHeader className="text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" /><AlertTitle className="text-xl font-semibold">Test Error</AlertTitle></CardHeader><CardContent className="text-center"><AlertDescription className="text-muted-foreground">Something went wrong, or no questions were generated. Please try configuring a new test.</AlertDescription><Button variant="outline" onClick={handleNewTest} className="mt-6">Create New Test</Button></CardContent></Card>
        )}
      </Card>
    </div>
  );
}

    