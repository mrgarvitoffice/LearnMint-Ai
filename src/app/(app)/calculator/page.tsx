
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
  // Row 1
  { value: 'AC', label: 'AC', type: 'action', action: 'clear', className: 'bg-destructive/80 hover:bg-destructive text-destructive-foreground' },
  { value: '±', label: '±', type: 'action', action: 'toggleSign' },
  { value: '%', label: '%', type: 'action', action: 'percentage' },
  { value: '/', label: '÷', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  // Row 2
  { value: '7', label: '7', type: 'digit' },
  { value: '8', label: '8', type: 'digit' },
  { value: '9', label: '9', type: 'digit' },
  { value: '*', label: '×', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  // Row 3
  { value: '4', label: '4', type: 'digit' },
  { value: '5', label: '5', type: 'digit' },
  { value: '6', label: '6', type: 'digit' },
  { value: '-', label: '−', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  // Row 4
  { value: '1', label: '1', type: 'digit' },
  { value: '2', label: '2', type: 'digit' },
  { value: '3', label: '3', type: 'digit' },
  { value: '+', label: '+', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
  // Row 5
  { value: '0', label: '0', type: 'digit' }, 
  { value: '.', label: '.', type: 'decimal' },
  { value: '=', label: '=', type: 'equals', className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
];

const scientificButtonsConfig: CalculatorButtonConfig[] = [
  { value: 'sin', label: 'sin', type: 'scientific', action: 'sin' },
  { value: 'cos', label: 'cos', type: 'scientific', action: 'cos' },
  { value: 'tan', label: 'tan', type: 'scientific', action: 'tan' },
  { value: 'log', label: 'log', type: 'scientific', action: 'log10' }, 
  { value: 'ln', label: 'ln', type: 'scientific', action: 'log' }, 
  { value: 'sqrt', label: '√', type: 'scientific', action: 'sqrt' },
  { value: '(', label: '(', type: 'operator' },
  { value: ')', label: ')', type: 'operator' },
  { value: 'x^y', label: 'xʸ', type: 'operator', value: '**' },
  { value: 'PI', label: 'π', type: 'digit', value: Math.PI.toString()},
  { value: 'E', label: 'e', type: 'digit', value: Math.E.toString()},
  { value: 'deg', label: 'DEG', type: 'action', action: 'toggleMode' }, 
];


export default function CalculatorPage() {
  const [mainDisplay, setMainDisplay] = useState('');
  const [currentExpression, setCurrentExpression] = useState('');
  const [historyDisplay, setHistoryDisplay] = useState('');
  const [calculationHistory, setCalculationHistory] = useState<{ expression: string, result: string }[]>([]);
  const [isRadians, setIsRadians] = useState(true); 

  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const { speak, isSpeaking: isTTSSpeaking, selectedVoice, setVoicePreference, supportedVoices } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('female'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    if (selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
  }, [selectedVoice, isTTSSpeaking, speak]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        try {
          setCalculationHistory(JSON.parse(storedHistory));
        } catch (e) {
          console.error("Failed to parse calculator history from localStorage", e);
          localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY); 
        }
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
      const sanitizedExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-');
      
      // eslint-disable-next-line no-eval
      let result = eval(sanitizedExpr);
      if (typeof result === 'number' && !Number.isFinite(result)) return 'Error';
      return String(Number(result.toFixed(10))); 
    } catch (error) {
      return 'Error';
    }
  };

  const handleButtonClick = (value: string, type: CalculatorButtonConfig['type'], action?: string) => {
    playSound();
    if (mainDisplay === 'Error') {
      setMainDisplay('');
      setCurrentExpression('');
      setHistoryDisplay('');
    }

    switch (type) {
      case 'digit':
        if (value === Math.PI.toString() || value === Math.E.toString()) {
          setMainDisplay(prev => prev + parseFloat(value).toFixed(8));
          setCurrentExpression(prev => prev + parseFloat(value).toFixed(8));
        } else {
          setMainDisplay(prev => prev + value);
          setCurrentExpression(prev => prev + value);
        }
        break;
      case 'decimal':
        if (!mainDisplay.includes('.')) {
          setMainDisplay(prev => prev + '.');
          setCurrentExpression(prev => prev + '.');
        }
        break;
      case 'operator':
        if(currentExpression.endsWith('(') && (value === '+' || value === '-' || value === '*' || value === '/')) {
            return;
        }
        setCurrentExpression(prev => prev + value);
        setHistoryDisplay(prev => prev + mainDisplay + ` ${value === '**' ? '^' : value} `);
        setMainDisplay('');
        break;
      case 'equals':
        if (currentExpression) {
          const finalExpression = currentExpression;
          const result = evaluateExpression(finalExpression);
          setMainDisplay(result);
          setHistoryDisplay(prev => prev + mainDisplay + ' =');
          if (result !== 'Error') {
             setCalculationHistory(prev => [{expression: finalExpression.replace(/\*/g, '×').replace(/\//g, '÷'), result}, ...prev.slice(0,2)]);
          }
          setCurrentExpression(result === 'Error' ? '' : result);
        }
        break;
      case 'action':
        performAction(action || value);
        break;
      case 'scientific':
        performScientificAction(action || value);
        break;
    }
  };

  const performAction = (action: string) => {
    switch (action) {
      case 'clear':
        setMainDisplay('');
        setCurrentExpression('');
        setHistoryDisplay('');
        break;
      case 'toggleSign':
        if (mainDisplay) {
          const newValue = (parseFloat(mainDisplay) * -1).toString();
          setMainDisplay(newValue);
        }
        break;
      case 'percentage':
        if (mainDisplay) {
          const percentageValue = (parseFloat(mainDisplay) / 100).toString();
          setMainDisplay(percentageValue);
          setCurrentExpression(percentageValue);
        }
        break;
       case 'toggleMode':
        setIsRadians(prev => !prev);
        setHistoryDisplay(isRadians ? 'Mode: DEG' : 'Mode: RAD');
        setTimeout(() => setHistoryDisplay(prev => prev.replace(/Mode: (DEG|RAD)/, '')), 1000);
        break;
    }
  };
  
  const performScientificAction = (func: string) => {
    if (mainDisplay && !isNaN(parseFloat(mainDisplay))) {
      let val = parseFloat(mainDisplay);
      let result: number | undefined;
      switch (func) {
        case 'sin': result = isRadians ? Math.sin(val) : Math.sin(val * Math.PI / 180); break;
        case 'cos': result = isRadians ? Math.cos(val) : Math.cos(val * Math.PI / 180); break;
        case 'tan': result = isRadians ? Math.tan(val) : Math.tan(val * Math.PI / 180); break;
        case 'log10': result = Math.log10(val); break;
        case 'log': result = Math.log(val); break; 
        case 'sqrt': result = Math.sqrt(val); break;
        default: break;
      }
      if (result !== undefined) {
        const resultStr = String(Number(result.toFixed(10)));
        setMainDisplay(resultStr);
        setCurrentExpression(resultStr);
        setHistoryDisplay(`${func}(${val}) =`);
      } else {
        setMainDisplay('Error');
        setCurrentExpression('');
      }
    } else if (func === 'sqrt' || func === 'sin' || func === 'cos' || func === 'tan' || func === 'log10' || func === 'log') {
        setCurrentExpression(prev => prev + `Math.${func}(`);
        setHistoryDisplay(prev => prev + `${func}(`);
        setMainDisplay('');
    }
  };
  
  const useHistoryItem = (item: { expression: string, result: string }) => {
    playSound();
    setMainDisplay(item.result);
    setCurrentExpression(item.result);
    setHistoryDisplay(`${item.expression.replace(/\*/g, '×').replace(/\//g, '÷')} = ${item.result}`);
  };
  
  const deleteHistoryItem = (index: number) => {
    playSound();
    setCalculationHistory(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllHistory = () => {
    playSound();
    setCalculationHistory([]);
  }


  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-2xl md:text-3xl text-primary font-bold">
            <CalculatorIcon className="w-7 h-7" />
            {PAGE_TITLE}
          </CardTitle>
        </CardHeader>
      </Card>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <Card className="w-full lg:max-w-md flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-2xl">Scientific Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="calculator">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calculator">Calculator</TabsTrigger>
                <TabsTrigger value="scientific">Scientific</TabsTrigger>
              </TabsList>
              <CalculatorDisplay mainDisplay={mainDisplay} historyDisplay={historyDisplay + (isRadians ? ' RAD' : ' DEG')} />
              <TabsContent value="calculator">
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {calculatorButtonsConfig.map(btn => (
                    <CalculatorButton key={btn.value} config={btn} onClick={handleButtonClick} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="scientific">
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {scientificButtonsConfig.map(btn => (
                    <CalculatorButton key={btn.value} config={btn} onClick={handleButtonClick} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            {calculationHistory.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">History (Last 3)</h3>
                  <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-xs text-destructive/80 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
                  </Button>
                </div>
                <ul className="space-y-2">
                  {calculationHistory.map((item, index) => (
                    <li key={index} className="flex justify-between items-center p-2 border rounded-md bg-muted/30 text-sm">
                      <button 
                        onClick={() => useHistoryItem(item)} 
                        className="truncate text-left hover:text-primary"
                        title={`Use: ${item.expression} = ${item.result}`}
                      >
                        <span className="text-muted-foreground">{item.expression.replace(/\*/g, '×').replace(/\//g, '÷')} = </span> 
                        <span className="font-semibold">{item.result}</span>
                      </button>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => useHistoryItem(item)} className="h-7 w-7">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteHistoryItem(index)} className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5 text-destructive/80" />
                        </Button>
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
