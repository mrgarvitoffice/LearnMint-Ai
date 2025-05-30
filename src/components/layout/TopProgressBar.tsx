
"use client";

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false, minimum: 0.1, speed: 300, trickleSpeed: 150 });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();
    
    // Initial stop for the first load
    handleStop();

    // Subsequent navigations
    NProgress.done(); // Ensure it's done before starting a new one

    return () => {
      NProgress.remove();
    };
  }, []);

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => NProgress.done(), 500); // Ensure it completes if route change is very fast
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);


  return null; // This component doesn't render anything itself
}
