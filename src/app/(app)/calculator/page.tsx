"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalculatorDisplay } from '@/components/features/calculator/CalculatorDisplay';
import { CalculatorButton } from '@/components/features/calculator/CalculatorButton';
import { UnitConverter } from '@/components/features/calculator/UnitConverter';
import type { CalculatorButtonConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';


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
  { value: '0', label: '0', type: 'digit' }, // Spans 2 columns handled in CalculatorButton
  { value: '.', label: '.', type: 'decimal' },
  { value: '=', label: '=', type: 'equals', className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
];

const scientificButtonsConfig: CalculatorButtonConfig[] = [
  { value: 'sin', label: 'sin', type: 'scientific', action: 'sin' },
  { value: 'cos', label: 'cos', type: 'scientific', action: 'cos' },
  { value: 'tan', label: 'tan', type: 'scientific', action: 'tan' },
  { value: 'log', label: 'log', type: 'scientific', action: 'log10' }, // base 10
  { value: 'ln', label: 'ln', type: 'scientific', action: 'log' }, // natural log
  { value: 'sqrt', label: '√', type: 'scientific', action: 'sqrt' },
  { value: '(', label: '(', type: 'operator' },
  { value: ')', label: ')', type: 'operator' },
  { value: 'x^y', label: 'xʸ', type: 'operator', value: '**' },
  { value: 'PI', label: 'π', type: 'digit', value: Math.PI.toString()},
  { value: 'E', label: 'e', type: 'digit', value: Math.E.toString()},
  { value: 'deg', label: 'DEG', type: 'action', action: 'toggleMode' }, // Placeholder for Rad/Deg mode
];


export default function CalculatorPage() {
  const [mainDisplay, setMainDisplay] = useState('');
  const [currentExpression, setCurrentExpression] = useState('');
  const [historyDisplay, setHistoryDisplay] = useState('');
  const [calculationHistory, setCalculationHistory] = useState<{ expression: string, result: string }[]>([]);
  const [isRadians, setIsRadians] = useState(true); // Default to Radians

  const { playSound } = useSound('/sounds/ting.mp3', 0.2);

  const evaluateExpression = (expr: string): string => {
    try {
      // Sanitize: allow numbers, decimal points, operators +-*/%() and functions like Math.sin, etc.
      // A more robust solution would be a proper math expression parser.
      // This is a simplified and somewhat unsafe approach.
      const sanitizedExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        // Add more replacements if needed (e.g. for scientific functions if not directly using Math.)
      
      // eslint-disable-next-line no-eval
      let result = eval(sanitizedExpr);
      if (typeof result === 'number' && !Number.isFinite(result)) return 'Error';
      return String(Number(result.toFixed(10))); // Limit precision
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
            // Avoid operator right after an opening parenthesis
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
          // This needs careful handling with currentExpression
          // For simplicity, this might only affect the current number being typed
        }
        break;
      case 'percentage':
        if (mainDisplay) {
          const percentageValue = (parseFloat(mainDisplay) / 100).toString();
          setMainDisplay(percentageValue);
          setCurrentExpression(percentageValue); // Assuming it replaces current input
        }
        break;
       case 'toggleMode':
        setIsRadians(prev => !prev);
        // Update display or state related to RAD/DEG if needed
        setHistoryDisplay(isRadians ? 'Mode: DEG' : 'Mode: RAD'); // Show current mode after toggle
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
        case 'log': result = Math.log(val); break; // Natural log
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
        // Allows functions to be part of the expression, e.g. Math.sqrt(
        setCurrentExpression(prev => prev + `Math.${func}(`);
        setHistoryDisplay(prev => prev + `${func}(`);
        setMainDisplay(''); // Clear main display to type the argument
    }
  };
  
  const useHistoryItem = (item: { expression: string, result: string }) => {
    setMainDisplay(item.result);
    setCurrentExpression(item.result); // Start new calculation with this result
    setHistoryDisplay(`${item.expression.replace(/\*/g, '×').replace(/\//g, '÷')} = ${item.result}`);
  };
  
  const deleteHistoryItem = (index: number) => {
    setCalculationHistory(prev => prev.filter((_, i) => i !== index));
  };


  return (
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
              <h3 className="text-sm font-medium text-muted-foreground mb-2">History (Last 3)</h3>
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
  );
}
