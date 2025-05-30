
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UnitCategory, Unit, UnitConverterState } from '@/lib/types';
import { ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const unitsConfig: Record<UnitCategory, Unit[]> = {
  Length: [
    { name: 'Meter', symbol: 'm', factor: 1 },
    { name: 'Kilometer', symbol: 'km', factor: 1000 },
    { name: 'Centimeter', symbol: 'cm', factor: 0.01 },
    { name: 'Millimeter', symbol: 'mm', factor: 0.001 },
    { name: 'Mile', symbol: 'mi', factor: 1609.34 },
    { name: 'Yard', symbol: 'yd', factor: 0.9144 },
    { name: 'Foot', symbol: 'ft', factor: 0.3048 },
    { name: 'Inch', symbol: 'in', factor: 0.0254 },
  ],
  Temperature: [ // Conversions are special, handle in logic
    { name: 'Celsius', symbol: '°C', factor: 1 }, // Base for logic
    { name: 'Fahrenheit', symbol: '°F', factor: 1.8, offset: 32 }, // factor for C->F delta, offset for C->F
    { name: 'Kelvin', symbol: 'K', factor: 1, offset: 273.15 }, // factor for C->K delta, offset for C->K
  ],
  'Weight/Mass': [
    { name: 'Kilogram', symbol: 'kg', factor: 1 },
    { name: 'Gram', symbol: 'g', factor: 0.001 },
    { name: 'Milligram', symbol: 'mg', factor: 0.000001 },
    { name: 'Pound', symbol: 'lb', factor: 0.453592 },
    { name: 'Ounce', symbol: 'oz', factor: 0.0283495 },
  ],
  Volume: [
    { name: 'Liter', symbol: 'L', factor: 1 },
    { name: 'Milliliter', symbol: 'mL', factor: 0.001 },
    { name: 'US Gallon', symbol: 'gal', factor: 3.78541 },
    { name: 'US Quart', symbol: 'qt', factor: 0.946353 },
    { name: 'US Pint', symbol: 'pt', factor: 0.473176 },
    { name: 'US Cup', symbol: 'cup', factor: 0.236588 },
    { name: 'US Fluid Ounce', symbol: 'fl oz', factor: 0.0295735 },
  ],
   Area: [
    { name: 'Square Meter', symbol: 'm²', factor: 1 },
    { name: 'Square Kilometer', symbol: 'km²', factor: 1000000 },
    { name: 'Square Foot', symbol: 'ft²', factor: 0.092903 },
    { name: 'Acre', symbol: 'acre', factor: 4046.86 },
  ],
  Speed: [
    { name: 'Meters/second', symbol: 'm/s', factor: 1 },
    { name: 'Kilometers/hour', symbol: 'km/h', factor: 1/3.6 },
    { name: 'Miles/hour', symbol: 'mph', factor: 0.44704 },
    { name: 'Feet/second', symbol: 'ft/s', factor: 0.3048 },
  ],
};

export function UnitConverter() {
  const [state, setState] = useState<UnitConverterState>({
    category: 'Length',
    fromUnit: unitsConfig['Length'][0].symbol,
    toUnit: unitsConfig['Length'][1].symbol,
    inputValue: '1',
    outputValue: '',
  });

  const { category, fromUnit, toUnit, inputValue, outputValue } = state;

  const handleConvert = useCallback(() => {
    const valueNum = parseFloat(inputValue);
    if (isNaN(valueNum)) {
      if (outputValue !== 'Invalid input') {
        setState(s => ({ ...s, outputValue: 'Invalid input' }));
      }
      return;
    }

    const currentUnitsInConfig = unitsConfig[category];
    const fromUnitConfig = currentUnitsInConfig.find(u => u.symbol === fromUnit);
    const toUnitConfig = currentUnitsInConfig.find(u => u.symbol === toUnit);

    if (!fromUnitConfig || !toUnitConfig) {
      if (outputValue !== 'Error') {
        setState(s => ({ ...s, outputValue: 'Error' }));
      }
      return;
    }
    
    let result: number;

    if (category === 'Temperature') {
        if (fromUnitConfig.symbol === '°C') {
            if (toUnitConfig.symbol === '°F') result = (valueNum * 9/5) + 32;
            else if (toUnitConfig.symbol === 'K') result = valueNum + 273.15;
            else result = valueNum; // C to C
        } else if (fromUnitConfig.symbol === '°F') {
            if (toUnitConfig.symbol === '°C') result = (valueNum - 32) * 5/9;
            else if (toUnitConfig.symbol === 'K') result = ((valueNum - 32) * 5/9) + 273.15;
            else result = valueNum; // F to F
        } else { // Kelvin
            if (toUnitConfig.symbol === '°C') result = valueNum - 273.15;
            else if (toUnitConfig.symbol === '°F') result = ((valueNum - 273.15) * 9/5) + 32;
            else result = valueNum; // K to K
        }
    } else {
        const valueInBaseUnit = valueNum * fromUnitConfig.factor;
        result = valueInBaseUnit / toUnitConfig.factor;
    }
    
    const newOutputValue = result.toLocaleString(undefined, {maximumFractionDigits: 5});
    if (newOutputValue !== outputValue) {
      setState(s => ({ ...s, outputValue: newOutputValue }));
    }
  }, [category, fromUnit, toUnit, inputValue, outputValue]); // Add setState if ESLint complains, but it's stable
  
  useEffect(() => {
    handleConvert();
  }, [handleConvert]);


  const handleCategoryChange = (newCategory: UnitCategory) => {
    const defaultUnits = unitsConfig[newCategory];
    setState(s => ({
      ...s,
      category: newCategory,
      fromUnit: defaultUnits[0].symbol,
      toUnit: defaultUnits.length > 1 ? defaultUnits[1].symbol : defaultUnits[0].symbol,
      inputValue: '1', 
    }));
  };
  
  const handleSwapUnits = () => {
    setState(s => ({
      ...s,
      fromUnit: s.toUnit,
      toUnit: s.fromUnit,
      inputValue: s.outputValue === 'Invalid input' || s.outputValue === 'Error' ? '1' : s.outputValue,
      // outputValue: s.inputValue, // if you want to swap output too
    }));
  };


  const currentUnits = unitsConfig[state.category];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Unit Converter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category-select">Category</Label>
          <Select value={state.category} onValueChange={(val) => handleCategoryChange(val as UnitCategory)}>
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(unitsConfig).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="fromValue">From</Label>
            <Input
              id="fromValue"
              type="number"
              value={state.inputValue}
              onChange={(e) => setState(s => ({ ...s, inputValue: e.target.value }))}
            />
            <Select value={state.fromUnit} onValueChange={(val) => setState(s => ({ ...s, fromUnit: val }))}>
              <SelectTrigger id="fromUnit-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currentUnits.map(unit => (
                  <SelectItem key={unit.symbol} value={unit.symbol}>{unit.name} ({unit.symbol})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleSwapUnits} className="self-center mb-8" aria-label="Swap units">
            <ArrowRightLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 space-y-2">
            <Label htmlFor="toValue">To</Label>
            <Input id="toValue" type="text" value={state.outputValue} readOnly className="bg-muted/50" />
             <Select value={state.toUnit} onValueChange={(val) => setState(s => ({ ...s, toUnit: val }))}>
              <SelectTrigger id="toUnit-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currentUnits.map(unit => (
                  <SelectItem key={unit.symbol} value={unit.symbol}>{unit.name} ({unit.symbol})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
