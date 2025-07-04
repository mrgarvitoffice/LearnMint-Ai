
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOP_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { NewslyIcon } from '../icons/NewslyIcon';
import { Header } from './Header';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { motion } from 'framer-motion';

export function TopMobileNav() {
  const { playSound } = useSound('/sounds/ting.mp3', 0.2);
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden border-b bg-background/90 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4">
        <motion.div whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Logo size={32} />
                </motion.div>
                <span className="font-bold text-xl text-foreground whitespace-nowrap">
                  LearnMint
                </span>
            </Link>
        </motion.div>
        
        {/* Renders the Settings Dropdown and PWA install button */}
        <Header />
      </div>

      <nav className="grid h-16 grid-cols-5 items-center justify-around border-t bg-background/80 px-1 backdrop-blur-sm">
        {TOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;
          const title = t(item.title);
          
          if (item.title === 'sidebar.dailyNews') {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 rounded-md p-1 text-center text-muted-foreground transition-colors group",
                  isActive ? "text-primary" : "hover:text-primary"
                )}
                onClick={playSound}
              >
                <div className="flex flex-col items-center justify-center -mt-1">
                  <NewslyIcon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-[10px] font-bold leading-tight mt-0.5">{title}</span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 rounded-md p-1 text-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary group",
                isActive && "text-primary [text-shadow:0_0_8px_hsl(var(--primary))]"
              )}
              onClick={playSound}
            >
              <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[10px] font-medium leading-tight">{title}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
