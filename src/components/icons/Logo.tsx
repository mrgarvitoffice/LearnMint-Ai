
import type { ImgHTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <Image
      src="/icons/icon-192x192.png" // Using the 192x192 PNG as the primary logo image
      alt="LearnMint Logo"
      width={size}
      height={size}
      className={cn(className)}
      priority // Ensures logo loads quickly, good for LCP
      {...props}
    />
  );
}
