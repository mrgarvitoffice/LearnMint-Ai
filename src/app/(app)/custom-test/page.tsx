
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
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import type { TestSettings, TestQuestion } from '@/lib/types';
import { Loader2, TestTubeDiagonal, CheckCircle, XCircle, RotateCcw, Clock, Lightbulb, AlertTriangle, Mic, FileText, BookOpen, Award, HelpCircle, TimerIcon } from 'lucide-react';
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
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Topic(s) must be at least 3 characters.",
      path: ['topics'],
    });
  }
  if (data.sourceType === 'notes' && (!data.notes || data.notes.trim().length < 50)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Notes must be at least 50 characters.",
      path: ['notes'],
    });
  }
  if (data.sourceType === 'recent' && (!data.selectedRecentTopics || data.selectedRecentTopics.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select at least one recent topic.",
      path: ['selectedRecentTopics'],
    });
  }
  if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > MAX_RECENT_TOPICS_SELECT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `You can select a maximum of ${MAX_RECENT_TOPICS_SELECT} recent topics.`,
      path: ['selectedRecentTopics'],
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface CustomTestState {
  settings: TestSettings;
  questions: TestQuestion[];
  userAnswers: (string | undefined)[];
  currentQuestionIndex: number;
  showResults: boolean;
  score: number;
  timeLeft?: number;
  timerId?: NodeJS.Timeout;
  isAutoSubmitting?: boolean;
  performanceTag?: string;
}

export default function CustomTestPage() {
  const [testState, setTestState] = useState<CustomTestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('correct');
  const { playSound: playIncorrectSound } = useSound('incorrect');
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  
  const { speak, isSpeaking: isTTSSpeaking, supportedVoices, setVoicePreference, selectedVoice, cancel: cancelTTS } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'topic',
      difficulty: 'medium',
      numQuestions: 5,
      timer: 0,
      perQuestionTimer: 0,
      selectedRecentTopics: [],
    }
  });

  const sourceType = watch('sourceType');

  const getPerformanceTag = (percentage: number): string => {
    if (percentage === 100) return "Conqueror";
    if (percentage >= 90) return "Ace";
    if (percentage >= 80) return "Diamond";
    if (percentage >= 70) return "Gold";
    if (percentage >= 50) return "Bronze";
    return "Keep Practicing!";
  };

  const handleSubmitTest = useCallback((autoSubmitted = false) => {
    playClickSound();
    setTestState(prevTestState => {
      if (!prevTestState || prevTestState.showResults) return prevTestState;
      if (prevTestState.timerId) {
        clearInterval(prevTestState.timerId);
      }

      let score = 0;
      const updatedQuestions = prevTestState.questions.map((q, index) => {
        const userAnswer = prevTestState.userAnswers[index];
        const isCorrect = userAnswer === q.answer;
        if (isCorrect) {
          score += 4;
          playCorrectSound();
        } else if (userAnswer !== undefined && userAnswer !== "") { 
          score -= 1;
          playIncorrectSound();
        }
        return { ...q, userAnswer, isCorrect };
      });

      const totalPossibleScore = prevTestState.questions.length * 4;
      const percentage = totalPossibleScore > 0 ? Math.max(0, (score / totalPossibleScore) * 100) : 0;
      const performanceTag = getPerformanceTag(percentage);

      const resultMessage = `Your score is ${score} out of ${totalPossibleScore}. Your performance: ${performanceTag}! Review your answers below.`;
      const ttsMessage = autoSubmitted ? `Test auto-submitted! ${resultMessage}` : `Test submitted! ${resultMessage}`;
      
      if (!autoSubmitted || (autoSubmitted && !prevTestState.showResults)) {
         toast({ title: autoSubmitted ? "Test Auto-Submitted!" : "Test Submitted!", description: `Score: ${score}/${totalPossibleScore}. Performance: ${performanceTag}.`});
         if (selectedVoice && !isTTSSpeaking) {
           speak(ttsMessage);
         }
      }

      return {
        ...prevTestState,
        questions: updatedQuestions,
        score,
        showResults: true,
        timerId: undefined,
        isAutoSubmitting: autoSubmitted,
        timeLeft: autoSubmitted ? 0 : prevTestState.timeLeft,
        performanceTag,
      };
    });
  }, [toast, playCorrectSound, playIncorrectSound, playClickSound, speak, selectedVoice, isTTSSpeaking, getPerformanceTag]); // Added getPerformanceTag


  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia');
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (
      selectedVoice &&
      !isTTSSpeaking &&
      !pageTitleSpokenRef.current &&
      !testState && 
      !isLoading 
    ) {
      pageTitleSpokenRef.current = true;
      if(isMounted) speak(PAGE_TITLE);
    }
    return () => {
      isMounted = false;
      if (pageTitleSpokenRef.current && isTTSSpeaking && !testState && !isLoading){
        // Only cancel if this specific speak call was the one active for the title
        // This is tricky to determine perfectly, but cancelling on unmount if it was likely the title is a safe bet.
        // cancelTTS(); 
        // Consider if broad cancelTTS() here is too aggressive if other TTS is desired on page change.
      }
    };
  }, [selectedVoice, isTTSSpeaking, speak, testState, isLoading, cancelTTS]);


  useEffect(() => {
    if (transcript) {
      setValue('topics', transcript);
    }
  }, [transcript, setValue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTopics = localStorage.getItem('learnmint-recent-topics');
      if (storedTopics) {
        try {
            setRecentTopics(JSON.parse(storedTopics).slice(0, MAX_RECENT_TOPICS_DISPLAY));
        } catch (e) {
            console.error("Failed to parse recent topics from localStorage", e);
            localStorage.removeItem('learnmint-recent-topics');
        }
      }
    }
  }, []);


  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isTTSSpeaking) {
      speak("Creating custom test. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) { 
      generatingMessageSpokenRef.current = false;
    }
  }, [isLoading, selectedVoice, isTTSSpeaking, speak]);


  useEffect(() => {
    let currentTimerId: NodeJS.Timeout | undefined;
    if (testState?.timerId) {
      currentTimerId = testState.timerId;
    }
    if (testState?.timeLeft === 0 && !testState.isAutoSubmitting && !testState.showResults) {
      setTestState(prev => prev ? { ...prev, isAutoSubmitting: true } : null);
      toast({ title: "Time's Up!", description: "Your test is being submitted automatically.", variant: "default" });
      handleSubmitTest(true);
    }
    return () => {
      if (currentTimerId) clearInterval(currentTimerId);
    };
  }, [testState?.timeLeft, testState?.isAutoSubmitting, testState?.showResults, testState?.timerId, handleSubmitTest]);


  const startTimer = (durationMinutes: number) => {
    if (durationMinutes <= 0) return;

    setTestState(prev => {
      if (!prev) return null;
      if (prev.timerId) clearInterval(prev.timerId);

      const newTimerId = setInterval(() => {
        setTestState(currentTestState => {
          if (currentTestState && currentTestState.timeLeft && currentTestState.timeLeft > 0 && !currentTestState.showResults && !currentTestState.isAutoSubmitting) {
            return {...currentTestState, timeLeft: currentTestState.timeLeft - 1};
          }
          if (currentTestState?.timerId && (currentTestState.timeLeft === 0 || currentTestState.showResults || currentTestState.isAutoSubmitting)) {
             clearInterval(currentTestState.timerId);
             return {...currentTestState, timerId: undefined};
          }
          return currentTestState;
        });
      }, 1000);
      return {...prev, timeLeft: durationMinutes * 60, timerId: newTimerId, isAutoSubmitting: false };
    });
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true);
    setTestState(null); 

    try {
      let topicForAI = "general knowledge";
      let sourceTopicsForSettings: string[] = [];
      let notesForSettings: string | undefined = undefined;
      let selectedRecentTopicsForSettings: string[] | undefined = undefined;

      if (data.sourceType === 'topic' && data.topics) {
        topicForAI = `${data.topics} (difficulty: ${data.difficulty})`;
        sourceTopicsForSettings = data.topics.split(',').map(t => t.trim());
        if (data.topics.trim().length >= 3) {
            const newTopic = data.topics.trim();
            setRecentTopics(prev => {
                const updated = [newTopic, ...prev.filter(t => t !== newTopic)].slice(0, MAX_RECENT_TOPICS_DISPLAY);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('learnmint-recent-topics', JSON.stringify(updated));
                }
                return updated;
            });
        }
      } else if (data.sourceType === 'notes' && data.notes) {
        topicForAI = data.notes.split(' ').slice(0, 15).join(' ') + `... (based on provided notes, difficulty: ${data.difficulty})`;
        sourceTopicsForSettings = ["Custom Notes Provided"];
        notesForSettings = data.notes;
      } else if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > 0) {
        topicForAI = `${data.selectedRecentTopics.join(', ')} (difficulty: ${data.difficulty})`;
        sourceTopicsForSettings = data.selectedRecentTopics;
        selectedRecentTopicsForSettings = data.selectedRecentTopics;
      }

      if (selectedVoice && !isTTSSpeaking && !generatingMessageSpokenRef.current) { 
          speak("Creating custom test. Please wait.");
          generatingMessageSpokenRef.current = true;
      }

      const result: GenerateQuizOutput = await generateQuiz({ topic: topicForAI, numQuestions: data.numQuestions });

      generatingMessageSpokenRef.current = false;

      if (result.quiz && result.quiz.length > 0) {
        const testSettings: TestSettings = {
          topics: sourceTopicsForSettings,
          notes: notesForSettings,
          sourceType: data.sourceType,
          selectedRecentTopics: selectedRecentTopicsForSettings,
          difficulty: data.difficulty,
          numQuestions: result.quiz.length,
          timer: data.timer,
          perQuestionTimer: data.perQuestionTimer,
        };
        setTestState({
          settings: testSettings,
          questions: result.quiz.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined, explanation: q.explanation || "No explanation provided." })),
          userAnswers: Array(result.quiz.length).fill(undefined),
          currentQuestionIndex: 0,
          showResults: false,
          score: 0,
          timeLeft: data.timer && data.timer > 0 ? data.timer * 60 : undefined,
          timerId: undefined,
          isAutoSubmitting: false,
        });
        if (data.timer && data.timer > 0) {
          startTimer(data.timer);
        }
        toast({ title: 'Test Generated!', description: 'Your custom test is ready.' });
        if (selectedVoice && !isTTSSpeaking) speak("Test Generated! Good luck.");
      } else {
        toast({ title: 'No Test Data', description: 'The AI returned no questions. Try a different topic or reduce complexity.', variant: 'destructive' });
        if (selectedVoice && !isTTSSpeaking) speak("Sorry, no test data was returned.");
      }
    } catch (error) {
      console.error('Error generating test:', error);
      generatingMessageSpokenRef.current = false;
      toast({ title: 'Error', description: 'Failed to generate test. Please try again.', variant: 'destructive' });
      if (selectedVoice && !isTTSSpeaking) speak("Sorry, there was an error generating the test.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    playClickSound();
    if (!testState || testState.showResults || testState.isAutoSubmitting) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = answer;
    setTestState({ ...testState, userAnswers: newUserAnswers });
  };

  const handleNextQuestion = () => {
    playClickSound();
    if (!testState || testState.currentQuestionIndex >= testState.questions.length - 1 || testState.isAutoSubmitting) return;
    setTestState({ ...testState, currentQuestionIndex: testState.currentQuestionIndex + 1 });
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (!testState || testState.currentQuestionIndex <= 0 || testState.isAutoSubmitting) return;
    setTestState({ ...testState, currentQuestionIndex: testState.currentQuestionIndex - 1 });
  };

  const handleRetakeTest = () => {
     playClickSound();
     if (!testState) return;
     setIsLoading(true);
     setTestState(null); 
     onSubmit({
        sourceType: testState.settings.sourceType || 'topic',
        topics: testState.settings.sourceType === 'topic' ? testState.settings.topics.join(',') : undefined,
        notes: testState.settings.sourceType === 'notes' ? testState.settings.notes : undefined,
        selectedRecentTopics: testState.settings.sourceType === 'recent' ? testState.settings.selectedRecentTopics : undefined,
        difficulty: testState.settings.difficulty,
        numQuestions: testState.settings.numQuestions,
        timer: testState.settings.timer || 0,
        perQuestionTimer: testState.settings.perQuestionTimer || 0,
     }).finally(() => setIsLoading(false));
  }

  const handleNewTest = () => {
    playClickSound();
    if (testState?.timerId) clearInterval(testState.timerId);
    setTestState(null);
    setValue('topics', '');
    setValue('notes', '');
    setValue('selectedRecentTopics', []);
    setValue('sourceType', 'topic');
    setValue('perQuestionTimer', 0);
    pageTitleSpokenRef.current = false; 
    if (selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current && !isLoading && !testState) { 
        speak(PAGE_TITLE);
        pageTitleSpokenRef.current = true;
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicClick = () => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };


  const currentQuestionData = testState?.questions[testState.currentQuestionIndex];

  if (isLoading && !testState) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Generating your custom test...</p>
      </div>
    );
  }

  if (!testState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl text-primary font-bold">
            <TestTubeDiagonal className="w-7 h-7" />
            {PAGE_TITLE}
          </CardTitle>
          <CardDescription>Configure your test parameters and generate a custom assessment.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <Label>Test Source</Label>
              <Controller
                name="sourceType"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={(value) => { playClickSound(); field.onChange(value); setValue('topics', ''); setValue('notes', ''); setValue('selectedRecentTopics', []); }} defaultValue={field.value} className="flex flex-wrap gap-2 md:gap-4 mt-2">
                    <Label htmlFor="sourceTopicChoice" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer text-sm md:text-base">
                      <RadioGroupItem value="topic" id="sourceTopicChoice" /> <FileText className="w-4 h-4 mr-1"/> Topic(s)
                    </Label>
                    <Label htmlFor="sourceNotesChoice" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer text-sm md:text-base">
                      <RadioGroupItem value="notes" id="sourceNotesChoice" /> <BookOpen className="w-4 h-4 mr-1"/> My Notes
                    </Label>
                    {recentTopics.length > 0 && (
                        <Label htmlFor="sourceRecentChoice" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer text-sm md:text-base">
                        <RadioGroupItem value="recent" id="sourceRecentChoice" /> <RotateCcw className="w-4 h-4 mr-1"/> Recent Topics
                        </Label>
                    )}
                  </RadioGroup>
                )}
              />
            </div>

            {sourceType === 'topic' && (
              <div className="space-y-2">
                <Label htmlFor="topics">Topic(s)</Label>
                 <div className="flex gap-2">
                    <Input
                        id="topics"
                        placeholder="e.g., Calculus, World History (comma-separated)"
                        {...register('topics')}
                        className={cn(errors.topics ? 'border-destructive' : '', "transition-colors duration-200 ease-in-out")}
                    />
                    {browserSupportsSpeechRecognition && (
                    <Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading}>
                        <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                    </Button>
                    )}
                </div>
                {voiceError && <p className="text-sm text-destructive">Voice input error: {voiceError}</p>}
                {errors.topics && <p className="text-sm text-destructive">{errors.topics.message}</p>}
              </div>
            )}
            {sourceType === 'notes' && (
              <div className="space-y-2">
                <Label htmlFor="notes">Your Notes</Label>
                <Textarea id="notes" placeholder="Paste your study notes here..." {...register('notes')} rows={6} className={cn(errors.notes ? 'border-destructive' : '', "transition-colors duration-200 ease-in-out")}/>
                {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
              </div>
            )}
            {sourceType === 'recent' && (
              <div className="space-y-2">
                <Label>Select Recent Topics (up to {MAX_RECENT_TOPICS_SELECT})</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-md max-h-60 overflow-y-auto">
                  {recentTopics.length > 0 ? recentTopics.map(topic => (
                    <Label key={topic} htmlFor={`recent-${topic}`} className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                      <Controller
                        name="selectedRecentTopics"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={`recent-${topic}`}
                            checked={field.value?.includes(topic)}
                            onCheckedChange={(checked) => {
                              playClickSound();
                              const currentSelection = field.value || [];
                              if (checked) {
                                if (currentSelection.length < MAX_RECENT_TOPICS_SELECT) {
                                  field.onChange([...currentSelection, topic]);
                                } else {
                                  toast({ title: "Limit Reached", description: `You can only select up to ${MAX_RECENT_TOPICS_SELECT} topics.`, variant: "destructive"});
                                  return false; 
                                }
                              } else {
                                field.onChange(currentSelection.filter(t => t !== topic));
                              }
                            }}
                          />
                        )}
                      />
                      <span className="truncate" title={topic}>{topic}</span>
                    </Label>
                  )) : <p className="text-sm text-muted-foreground p-2">No recent topics found. Generate some notes first!</p>}
                </div>
                {errors.selectedRecentTopics && <p className="text-sm text-destructive">{errors.selectedRecentTopics.message}</p>}
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Controller
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={(value) => { playClickSound(); field.onChange(value);}} defaultValue={field.value}>
                        <SelectTrigger id="difficulty" className="transition-colors duration-200 ease-in-out"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="numQuestions">Number of Questions (1-50)</Label>
                    <Input id="numQuestions" type="number" {...register('numQuestions')} className="transition-colors duration-200 ease-in-out" />
                    {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timer">Overall Timer (minutes, 0 for none)</Label>
                    <Input id="timer" type="number" {...register('timer')} className="transition-colors duration-200 ease-in-out" />
                    {errors.timer && <p className="text-sm text-destructive">{errors.timer.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="perQuestionTimer">Time per Question (seconds, 0 for none)</Label>
                    <Input id="perQuestionTimer" type="number" {...register('perQuestionTimer')} className="transition-colors duration-200 ease-in-out" />
                    {errors.perQuestionTimer && <p className="text-sm text-destructive">{errors.perQuestionTimer.message}</p>}
                    <p className="text-xs text-muted-foreground">Note: Per-question timer enforcement is a future enhancement. This setting is currently for planning.</p>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Test
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  if (!testState.showResults && currentQuestionData) {
     return (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Custom Test: Question {testState.currentQuestionIndex + 1} of {testState.questions.length}</CardTitle>
              <div className="flex items-center gap-4">
                {testState.settings.perQuestionTimer && testState.settings.perQuestionTimer > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TimerIcon className="w-4 h-4" /> Per Q: {testState.settings.perQuestionTimer}s (UI Only)
                    </div>
                )}
                {testState.settings.timer && testState.settings.timer > 0 && typeof testState.timeLeft === 'number' && (
                    <div className={`flex items-center gap-2 text-lg font-medium ${testState.timeLeft <= 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                    <Clock className="w-5 h-5" />
                    <span>{formatTime(testState.timeLeft)}</span>
                    </div>
                )}
              </div>
            </div>
            <Progress value={((testState.currentQuestionIndex + 1) / testState.questions.length) * 100} className="w-full mt-2" />
             {testState.isAutoSubmitting && (
                <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Submitting...</AlertTitle>
                    <AlertDescription>Time ran out. Your test is being submitted.</AlertDescription>
                </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <ReactMarkdown className="text-lg font-semibold prose dark:prose-invert max-w-none">{currentQuestionData.question}</ReactMarkdown>
             <RadioGroup
                onValueChange={(value) => handleAnswerSelect(value)}
                value={testState.userAnswers[testState.currentQuestionIndex]}
                className="space-y-2"
                disabled={testState.isAutoSubmitting}
              >
                {currentQuestionData.options.map((option, i) => (
                  <Label key={i} htmlFor={`option-${i}`} className={cn("flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary", testState.isAutoSubmitting ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
                    <RadioGroupItem value={option} id={`option-${i}`} disabled={testState.isAutoSubmitting}/>
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={testState.currentQuestionIndex === 0 || !!testState.isAutoSubmitting}>Previous</Button>
            {testState.currentQuestionIndex < testState.questions.length - 1 ? (
              <Button onClick={handleNextQuestion} disabled={!!testState.isAutoSubmitting}>Next</Button>
            ) : (
              <Button onClick={() => handleSubmitTest(false)} variant="default" disabled={!!testState.isAutoSubmitting}>
                {isLoading && testState.isAutoSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Test
              </Button>
            )}
          </CardFooter>
        </Card>
     );
  }

  if (testState.showResults) {
    const totalPossibleScore = testState.questions.length * 4;
    const percentage = totalPossibleScore > 0 ? Math.max(0, (testState.score / totalPossibleScore) * 100) : 0;
    
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default"; // default for Ace/Conqueror (primary-like)
    if (percentage >= 80 && percentage < 90) badgeVariant = "secondary"; // Diamond (secondary-like)
    else if (percentage >= 70 && percentage < 80) badgeVariant = "default"; // Gold (primary-like, slightly less intense than Ace)
    else if (percentage >= 50 && percentage < 70) badgeVariant = "outline"; // Bronze (outline)
    else if (percentage < 50) badgeVariant = "destructive"; // Keep Practicing (destructive)


    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Test Results</CardTitle>
          <CardDescription className="text-lg">
            You scored {testState.score} out of {totalPossibleScore} ({percentage.toFixed(1)}%).
          </CardDescription>
          {testState.performanceTag && (
            <div className="mt-3">
                <Badge variant={badgeVariant} className="text-lg px-4 py-2 shadow-lg">
                    <Award className="w-5 h-5 mr-2"/>
                    {testState.performanceTag}
                </Badge>
            </div>
          )}
           {testState.settings.timer && testState.settings.timer > 0 && testState.timeLeft !== undefined && (
                <p className="text-sm text-muted-foreground mt-2"> Time taken: {formatTime(testState.settings.timer * 60 - (testState.timeLeft > 0 ? testState.timeLeft : 0))}.</p>
            )}
          <Progress value={percentage} className="w-full mt-4 h-3" />
        </CardHeader>
        <CardContent className="space-y-4 mt-6">
          <h3 className="text-xl font-semibold text-center mb-4">Review Your Answers</h3>
          {testState.questions.map((q, index) => (
            <Card key={index} className={cn("overflow-hidden", q.isCorrect === undefined ? '' : q.isCorrect ? 'border-green-500 bg-green-500/5' : 'border-destructive bg-destructive/5')}>
              <CardHeader className="pb-3 pt-4 px-4 bg-muted/30">
                <CardTitle className="text-md flex items-start gap-2">
                   {q.isCorrect === undefined ? <HelpCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" /> : q.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />}
                  <span className="font-semibold">Question {index + 1}:</span>
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline leading-tight">{q.question}</ReactMarkdown>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 p-4">
                <p>Your answer: <span className={cn("font-medium", q.isCorrect === undefined ? '' : q.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-destructive')}>{q.userAnswer || 'Not answered'}</span></p>
                <p>Correct answer: <span className="font-medium text-green-700 dark:text-green-400">{q.answer}</span></p>
                {q.explanation && (
                  <Alert variant="default" className="mt-2 bg-accent/10 border-accent/30 text-accent-foreground/80">
                    <Lightbulb className="h-4 w-4 text-accent" />
                    <AlertTitle className="text-accent">Explanation</AlertTitle>
                    <AlertDescription className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                       <ReactMarkdown>{q.explanation}</ReactMarkdown>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
            <Button onClick={handleRetakeTest} disabled={isLoading} size="lg"><RotateCcw className="w-4 h-4 mr-2"/>Retake Test</Button>
            <Button variant="outline" onClick={handleNewTest} size="lg">Create New Test</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Test Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try generating a new test.</AlertDescription>
    </Alert>
  );
}
