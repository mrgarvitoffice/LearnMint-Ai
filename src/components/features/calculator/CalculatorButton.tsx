
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalculatorButtonConfig } from '@/lib/types';

interface CalculatorButtonProps {
  config: CalculatorButtonConfig;
  onClick: (value: string, type: CalculatorButtonConfig['type'], action?: string) => void;
  isModeActive?: boolean;
}

export function CalculatorButton({ config, onClick, isModeActive = false }: CalculatorButtonProps) {
  const getVariant = () => {
    if (config.type === 'action' || config.type === 'scientific') return 'secondary';
    if (config.type === 'digit' || config.type === 'decimal') return 'outline';
    return 'default'; // For operators and equals
  };

  return (
    <Button
      variant={getVariant()}
      onClick={() => onClick(config.value, config.type, config.action)}
      className={cn(
        "text-lg md:text-xl h-14 md:h-16 active:scale-95 transition-transform",
        isModeActive && "bg-accent text-accent-foreground",
        config.className
      )}
      aria-label={config.label || config.value}
    >
      {config.label || config.value}
    </Button>
  );
}
