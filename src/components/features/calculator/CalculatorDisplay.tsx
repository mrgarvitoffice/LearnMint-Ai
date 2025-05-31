
interface CalculatorDisplayProps {
  mainDisplay: string; // This will show the current expression or result
  historyDisplay?: string; // This will show the previous calculation or mode
}

export function CalculatorDisplay({ mainDisplay, historyDisplay }: CalculatorDisplayProps) {
  return (
    <div className="bg-muted/50 p-4 rounded-t-md text-right space-y-1 min-h-[7rem] flex flex-col justify-end">
      {historyDisplay && (
        <div className="text-sm text-muted-foreground truncate" title={historyDisplay}>
          {historyDisplay}
        </div>
      )}
      <div className="text-3xl md:text-4xl font-mono font-bold text-foreground break-all" title={mainDisplay || "0"}>
        {mainDisplay || "0"}
      </div>
    </div>
  );
}

    