
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QUICK_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// THIS COMPONENT IS DEPRECATED AND REPLACED BY MobileSecondaryNav.tsx
// It can be safely deleted. I'm emptying it to ensure it's not used.
export function SecondaryNavBar() {
  return null;
}
