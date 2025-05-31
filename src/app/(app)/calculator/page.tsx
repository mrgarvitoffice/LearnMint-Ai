
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalculatorDisplay } from '@/components/features/calculator/CalculatorDisplay';
import { CalculatorButton } from '@/components/features/calculator/CalculatorButton';
import { UnitConverter } from '@/components/features/calculator/UnitConverter';
import type { CalculatorButtonConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Calculator as CalculatorIcon } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';

const LOCAL_STORAGE_HISTORY_KEY = 'learnmint-calculator-history';
const PAGE_TITLE = "Precision Toolkit: Calculator & Converter";

const calculatorButtonsConfig: CalculatorButtonConfig[] = [
  { value: 'AC', label: 'AC', type: 'action', action: 'clear', className: 'bg-destructive/80 hover:bg-destructive text-destructive-foreground' },
  { value: '±', label: '±', type: 'action', action: 'toggleSign' },
  { value: '%', label: '%', type: 'action', action: 'percentage' },
  { value: '/', label: '÷', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  { value: '7', label: '7', type: 'digit' }, { value: '8', label: '8', type: 'digit' }, { value: '9', label: '9', type: 'digit' },
  { value: '*', label: '×', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  { value: '4', label: '4', type: 'digit' }, { value: '5', label: '5', type: 'digit' }, { value: '6', label: '6', type: 'digit' },
  { value: '-', label: '−', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  { value: '1', label: '1', type: 'digit' }, { value: '2', label: '2', type: 'digit' }, { value: '3', label: '3', type: 'digit' },
  { value: '+', label: '+', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  { value: '0', label: '0', type: 'digit' }, { value: '.', label: '.', type: 'decimal' },
  { value: '=', label: '=', type: 'equals', className: 'bg-primary hover:bg-primary/90 text-primary-foreground col-span-2' },
];

const scientificButtonsConfig: CalculatorButtonConfig[] = [
  { value: 'sin(', label: 'sin', type: 'scientific', action: 'sin' }, { value: 'cos(', label: 'cos', type: 'scientific', action: 'cos' },
  { value: 'tan(', label: 'tan', type: 'scientific', action: 'tan' }, { value: 'log10(', label: 'log', type: 'scientific', action: 'log10' }, 
  { value: 'log(', label: 'ln', type: 'scientific', action: 'log' }, { value: 'sqrt(', label: '√', type: 'scientific', action: 'sqrt' },
  { value: '(', label: '(', type: 'operator' }, { value: ')', label: ')', type: 'operator' },
  { value: '**', label: 'xʸ', type: 'operator', }, { value: 'Math.PI', label: 'π', type: 'digit', action: 'pi' }, // action 'pi' for visual 'π'
  { value: 'Math.E', label: 'e', type: 'digit', action: 'e' }, { value: 'deg', label: 'DEG', type: 'action', action: 'toggleMode' }, 
];


export default function CalculatorPage() {
  const [visualExpression, setVisualExpression] = useState(''); // Main display, e.g., "2 × sin(30)"
  const [internalExpression, setInternalExpression] = useState(''); // For eval, e.g., "2 * Math.sin( (30*Math.PI/180) )"
  const [previousCalculation, setPreviousCalculation] = useState(''); // Small top display, "expr = result"
  
  const [calculationHistory, setCalculationHistory] = useState<{ expression: string, result: string }[]>([]);
  const [isRadians, setIsRadians] = useState(true); 
  const [justEvaluated, setJustEvaluated] = useState(false);


  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { 
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        try { setCalculationHistory(JSON.parse(storedHistory)); } 
        catch (e) { console.error("Failed to parse calculator history", e); localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY); }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(calculationHistory));
    }
  }, [calculationHistory]);

  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const evaluateInternalExpression = (expr: string): string => {
    try {
      // Pre-process for trig functions if in DEG mode
      let exprToEval = expr;
      if (!isRadians) {
        exprToEval = exprToEval.replace(/Math\.sin\(([^)]+)\)/g, (_, p1) => `Math.sin(${toRadians(eval(p1))})`);
        exprToEval = exprToEval.replace(/Math\.cos\(([^)]+)\)/g, (_, p1) => `Math.cos(${toRadians(eval(p1))})`);
        exprToEval = exprToEval.replace(/Math\.tan\(([^)]+)\)/g, (_, p1) => `Math.tan(${toRadians(eval(p1))})`);
      }
      // eslint-disable-next-line no-eval
      let result = eval(exprToEval);
      if (typeof result === 'number' && !Number.isFinite(result)) return 'Error: Div by Zero or Invalid Op';
      if (typeof result === 'number' && result.toString().length > 15) return result.toPrecision(10);
      return String(result);
    } catch (error) { return 'Error: Invalid Expression'; }
  };

  const handleButtonClick = (value: string, type: CalculatorButtonConfig['type'], action?: string) => {
    playSound();
    if (visualExpression.startsWith('Error')) {
      setVisualExpression(''); setInternalExpression(''); setPreviousCalculation('');
    }
    if (justEvaluated && type !== 'operator' && type !== 'equals') {
        setVisualExpression(''); setInternalExpression(''); 
    }
    setJustEvaluated(false);


    switch (type) {
      case 'digit':
        if (action === 'pi') {
          setVisualExpression(prev => prev + 'π'); setInternalExpression(prev => prev + 'Math.PI');
        } else if (action === 'e') {
          setVisualExpression(prev => prev + 'e'); setInternalExpression(prev => prev + 'Math.E');
        } else {
          setVisualExpression(prev => prev + value); setInternalExpression(prev => prev + value);
        }
        break;
      case 'decimal':
        // Basic check: only add if no decimal in current last number segment
        const segments = visualExpression.split(/[\+\-\×\÷\(\)\^\s]/);
        const lastSegment = segments[segments.length - 1];
        if (!lastSegment.includes('.')) {
            setVisualExpression(prev => prev + '.'); setInternalExpression(prev => prev + '.');
        }
        break;
      case 'operator':
        const lastCharVisual = visualExpression.slice(-1);
        const isLastCharOp = ['+', '−', '×', '÷', '^'].includes(lastCharVisual);
        if (isLastCharOp && value !== '(' && value !== ')') { // Replace last operator unless it's parenthesis
             setVisualExpression(prev => prev.slice(0, -1) + (calculatorButtonsConfig.find(b=>b.value===value)?.label || value) );
             setInternalExpression(prev => prev.slice(0, -1) + value);
        } else {
            setVisualExpression(prev => prev + (calculatorButtonsConfig.find(b=>b.value===value)?.label || value));
            setInternalExpression(prev => prev + value);
        }
        break;
      case 'equals':
        if (internalExpression) {
          const result = evaluateInternalExpression(internalExpression);
          setPreviousCalculation(visualExpression + (result.startsWith('Error') ? '' : ' = ' + result));
          setVisualExpression(result); 
          setInternalExpression(result.startsWith('Error') ? '' : result);
          if (!result.startsWith('Error')) {
             setCalculationHistory(prev => [{expression: visualExpression, result}, ...prev.slice(0,2)]);
             setJustEvaluated(true);
          }
        }
        break;
      case 'action': performAction(action || value); break;
      case 'scientific': // e.g. value = "sin(", action = "sin"
        setVisualExpression(prev => prev + (scientificButtonsConfig.find(b=>b.action===action)?.label || action) + '(');
        if (action === 'log10') setInternalExpression(prev => prev + 'Math.log10(');
        else if (action === 'log') setInternalExpression(prev => prev + 'Math.log(');
        else if (action === 'sqrt') setInternalExpression(prev => prev + 'Math.sqrt(');
        else setInternalExpression(prev => prev + `Math.${action}(`); // For sin, cos, tan
        break;
    }
  };

  const performAction = (action: string) => {
    switch (action) {
      case 'clear': 
        setVisualExpression(''); setInternalExpression(''); setPreviousCalculation(''); setJustEvaluated(false); 
        break;
      case 'toggleSign': 
        // Only operates if current visualExpression is a plain number
        if (visualExpression && !isNaN(parseFloat(visualExpression)) && /^[-\+]?\d*\.?\d+$/.test(visualExpression)) {
            const negated = (parseFloat(visualExpression) * -1).toString();
            setVisualExpression(negated); setInternalExpression(negated);
        } // else: complex expression, do nothing or decide on behavior for last number
        break;
      case 'percentage': 
        if (visualExpression && !isNaN(parseFloat(visualExpression)) && /^[-\+]?\d*\.?\d+$/.test(visualExpression)) {
            const percentVal = (parseFloat(visualExpression) / 100).toString();
            setVisualExpression(percentVal); setInternalExpression(percentVal);
        } // else: complex expression, do nothing
        break;
      case 'toggleMode': 
        setIsRadians(prev => !prev); 
        setPreviousCalculation(isRadians ? 'Mode: DEG' : 'Mode: RAD'); 
        setTimeout(() => setPreviousCalculation(prev => prev.replace(/Mode: (DEG|RAD)\s*/, '')), 1500); 
        break;
    }
  };
    
  const useHistoryItem = (item: { expression: string, result: string }) => {
    playSound(); 
    setVisualExpression(item.result); 
    setInternalExpression(item.result);
    setPreviousCalculation(`${item.expression} = ${item.result}`);
    setJustEvaluated(true);
  };
  const deleteHistoryItem = (index: number) => { playSound(); setCalculationHistory(prev => prev.filter((_, i) => i !== index)); };
  const clearAllHistory = () => { playSound(); setCalculationHistory([]); }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><CalculatorIcon className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
        </CardHeader>
      </Card>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <Card className="w-full lg:max-w-md flex-shrink-0 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Scientific Calculator</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Tabs defaultValue="calculator" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="calculator">Basic</TabsTrigger>
                <TabsTrigger value="scientific">Scientific</TabsTrigger>
              </TabsList>
              <CalculatorDisplay 
                mainDisplay={visualExpression} 
                historyDisplay={previousCalculation + (visualExpression ? '' : (isRadians ? ' RAD' : ' DEG'))} 
              />
              <TabsContent value="calculator" className="mt-3">
                <div className="grid grid-cols-4 gap-2">
                  {calculatorButtonsConfig.map(btn => <CalculatorButton key={btn.label} config={btn} onClick={handleButtonClick} />)}
                </div>
              </TabsContent>
              <TabsContent value="scientific" className="mt-3">
                <div className="grid grid-cols-4 gap-2">
                  {scientificButtonsConfig.map(btn => <CalculatorButton key={btn.label} config={btn} onClick={handleButtonClick} />)}
                </div>
              </TabsContent>
            </Tabs>
            
            {calculationHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">History (Last 3)</h3>
                  <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-xs text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
                  </Button>
                </div>
                <ul className="space-y-1.5">
                  {calculationHistory.map((item, index) => (
                    <li key={index} className="flex justify-between items-center p-1.5 border rounded-md bg-muted/40 text-xs hover:bg-muted/60">
                      <button onClick={() => useHistoryItem(item)} className="truncate text-left hover:text-primary flex-1" title={`Use: ${item.expression} = ${item.result}`}>
                        <span className="text-muted-foreground/80">{item.expression} = </span> 
                        <span className="font-semibold">{item.result}</span>
                      </button>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" onClick={() => useHistoryItem(item)} className="h-6 w-6"><RotateCcw className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteHistoryItem(index)} className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive/70" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="w-full lg:flex-grow">
           <UnitConverter />
        </div>
      </div>
    </div>
  );
}

    