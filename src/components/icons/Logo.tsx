import type { SVGProps } from 'react';
import { Sparkles } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <Sparkles className="h-6 w-6 text-primary" {...props} />
  );
}
