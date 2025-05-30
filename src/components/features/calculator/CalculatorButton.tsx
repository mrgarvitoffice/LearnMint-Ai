import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalculatorButtonConfig } from '@/lib/types';

interface CalculatorButtonProps {
  config: CalculatorButtonConfig;
  onClick: (value: string, type: CalculatorButtonConfig['type'], action?: string) => void;
}

export function CalculatorButton({ config, onClick }: CalculatorButtonProps) {
  const getVariant = () => {
    if (config.type === 'operator' || config.type === 'equals') return 'default'; // Primary color for operators
    if (config.type === 'action') return 'secondary'; // Secondary for actions
    return 'outline'; // Outline for digits and others
  };
  
  const getSize = () => {
    if (config.value === '0') return "default"; // Normal size for 0
    return "default"; // Default size for others, can be adjusted
  }

  return (
    <Button
      variant={getVariant()}
      size={getSize()}
      onClick={() => onClick(config.value, config.type, config.action)}
      className={cn(
        "text-xl md:text-2xl h-16 md:h-20 active:scale-95 transition-transform",
        config.value === '0' && 'col-span-2', // Span 0 across two columns
        config.className
      )}
      aria-label={config.label || config.value}
    >
      {config.label || config.value}
    </Button>
  );
}
