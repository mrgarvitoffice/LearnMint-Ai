
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
  { value: 'sin', label: 'sin', type: 'scientific', action: 'sin' }, { value: 'cos', label: 'cos', type: 'scientific', action: 'cos' },
  { value: 'tan', label: 'tan', type: 'scientific', action: 'tan' }, { value: 'log', label: 'log', type: 'scientific', action: 'log10' }, 
  { value: 'ln', label: 'ln', type: 'scientific', action: 'log' }, { value: 'sqrt', label: '√', type: 'scientific', action: 'sqrt' },
  { value: '(', label: '(', type: 'operator' }, { value: ')', label: ')', type: 'operator' },
  { value: 'x^y', label: 'xʸ', type: 'operator', value: '**' }, { value: 'PI', label: 'π', type: 'digit', value: Math.PI.toString()},
  { value: 'E', label: 'e', type: 'digit', value: Math.E.toString()}, { value: 'deg', label: 'DEG', type: 'action', action: 'toggleMode' }, 
];


export default function CalculatorPage() {
  const [mainDisplay, setMainDisplay] = useState('');
  const [currentExpression, setCurrentExpression] = useState('');
  const [historyDisplay, setHistoryDisplay] = useState('');
  const [calculationHistory, setCalculationHistory] = useState<{ expression: string, result: string }[]>([]);
  const [isRadians, setIsRadians] = useState(true); 

  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
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


  const evaluateExpression = (expr: string): string => {
    try {
      const sanitizedExpr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      // eslint-disable-next-line no-eval
      let result = eval(sanitizedExpr);
      if (typeof result === 'number' && !Number.isFinite(result)) return 'Error';
      return String(Number(result.toFixed(10))); 
    } catch (error) { return 'Error'; }
  };

  const handleButtonClick = (value: string, type: CalculatorButtonConfig['type'], action?: string) => {
    playSound();
    if (mainDisplay === 'Error') { setMainDisplay(''); setCurrentExpression(''); setHistoryDisplay(''); }

    switch (type) {
      case 'digit':
        if (value === Math.PI.toString() || value === Math.E.toString()) {
          setMainDisplay(prev => prev + parseFloat(value).toFixed(8)); setCurrentExpression(prev => prev + parseFloat(value).toFixed(8));
        } else { setMainDisplay(prev => prev + value); setCurrentExpression(prev => prev + value); }
        break;
      case 'decimal':
        if (!mainDisplay.includes('.')) { setMainDisplay(prev => prev + '.'); setCurrentExpression(prev => prev + '.');}
        break;
      case 'operator':
        if(currentExpression.endsWith('(') && ['+', '-', '*', '/'].includes(value)) return;
        setCurrentExpression(prev => prev + value); setHistoryDisplay(prev => prev + mainDisplay + ` ${value === '**' ? '^' : value} `); setMainDisplay('');
        break;
      case 'equals':
        if (currentExpression) {
          const finalExpression = currentExpression; const result = evaluateExpression(finalExpression);
          setMainDisplay(result); setHistoryDisplay(prev => prev + mainDisplay + ' =');
          if (result !== 'Error') setCalculationHistory(prev => [{expression: finalExpression.replace(/\*/g, '×').replace(/\//g, '÷'), result}, ...prev.slice(0,2)]);
          setCurrentExpression(result === 'Error' ? '' : result);
        }
        break;
      case 'action': performAction(action || value); break;
      case 'scientific': performScientificAction(action || value); break;
    }
  };

  const performAction = (action: string) => {
    switch (action) {
      case 'clear': setMainDisplay(''); setCurrentExpression(''); setHistoryDisplay(''); break;
      case 'toggleSign': if (mainDisplay) setMainDisplay((parseFloat(mainDisplay) * -1).toString()); break;
      case 'percentage': if (mainDisplay) { const pv = (parseFloat(mainDisplay) / 100).toString(); setMainDisplay(pv); setCurrentExpression(pv); } break;
      case 'toggleMode': setIsRadians(prev => !prev); setHistoryDisplay(isRadians ? 'Mode: DEG' : 'Mode: RAD'); setTimeout(() => setHistoryDisplay(prev => prev.replace(/Mode: (DEG|RAD)/, '')), 1000); break;
    }
  };
  
  const performScientificAction = (func: string) => {
    if (mainDisplay && !isNaN(parseFloat(mainDisplay))) {
      let val = parseFloat(mainDisplay); let result: number | undefined;
      switch (func) {
        case 'sin': result = isRadians ? Math.sin(val) : Math.sin(val * Math.PI / 180); break;
        case 'cos': result = isRadians ? Math.cos(val) : Math.cos(val * Math.PI / 180); break;
        case 'tan': result = isRadians ? Math.tan(val) : Math.tan(val * Math.PI / 180); break;
        case 'log10': result = Math.log10(val); break; case 'log': result = Math.log(val); break; 
        case 'sqrt': result = Math.sqrt(val); break;
        default: break;
      }
      if (result !== undefined) {
        const resultStr = String(Number(result.toFixed(10))); setMainDisplay(resultStr); setCurrentExpression(resultStr); setHistoryDisplay(`${func}(${val}) =`);
      } else { setMainDisplay('Error'); setCurrentExpression(''); }
    } else if (['sqrt', 'sin', 'cos', 'tan', 'log10', 'log'].includes(func)) {
        setCurrentExpression(prev => prev + `Math.${func}(`); setHistoryDisplay(prev => prev + `${func}(`); setMainDisplay('');
    }
  };
  
  const useHistoryItem = (item: { expression: string, result: string }) => {
    playSound(); setMainDisplay(item.result); setCurrentExpression(item.result);
    setHistoryDisplay(`${item.expression.replace(/\*/g, '×').replace(/\//g, '÷')} = ${item.result}`);
  };
  const deleteHistoryItem = (index: number) => { playSound(); setCalculationHistory(prev => prev.filter((_, i) => i !== index)); };
  const clearAllHistory = () => { playSound(); setCalculationHistory([]); }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><CalculatorIcon className="h-7 w-7 text-primary" /></div>
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
              <CalculatorDisplay mainDisplay={mainDisplay} historyDisplay={historyDisplay + (isRadians ? ' RAD' : ' DEG')} />
              <TabsContent value="calculator" className="mt-3">
                <div className="grid grid-cols-4 gap-2">
                  {calculatorButtonsConfig.map(btn => <CalculatorButton key={btn.value} config={btn} onClick={handleButtonClick} />)}
                </div>
              </TabsContent>
              <TabsContent value="scientific" className="mt-3">
                <div className="grid grid-cols-4 gap-2">
                  {scientificButtonsConfig.map(btn => <CalculatorButton key={btn.value} config={btn} onClick={handleButtonClick} />)}
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
                        <span className="text-muted-foreground/80">{item.expression.replace(/\*/g, '×').replace(/\//g, '÷')} = </span> 
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
