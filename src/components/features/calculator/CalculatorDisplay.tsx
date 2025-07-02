
interface CalculatorDisplayProps {
  mainDisplay: string;
  historyDisplay?: string;
  mode?: 'RAD' | 'DEG';
}

export function CalculatorDisplay({ mainDisplay, historyDisplay, mode }: CalculatorDisplayProps) {
  return (
    <div className="bg-muted/50 p-4 rounded-md text-right space-y-1 min-h-[7rem] flex flex-col justify-between relative">
      <div className="absolute top-2 left-2 text-xs font-mono text-muted-foreground">{mode}</div>
      <div>
        <div className="text-sm text-muted-foreground truncate" title={historyDisplay}>
          {historyDisplay}
        </div>
      </div>
      <div className="text-3xl md:text-4xl font-mono font-bold text-foreground break-all" title={mainDisplay || "0"}>
        {mainDisplay || "0"}
      </div>
    </div>
  );
}
