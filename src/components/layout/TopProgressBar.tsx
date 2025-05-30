
"use client";

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false, minimum: 0.1, speed: 300, trickleSpeed: 150 });
    // Clear any NProgress bar from a full page load/refresh on initial mount
    NProgress.done();
    
    return () => {
      // Cleanup NProgress if TopProgressBar component itself is ever unmounted
      NProgress.remove(); 
    };
  }, []); // Runs once on mount

  useEffect(() => {
    // When pathname or searchParams change, a navigation event has occurred.
    // Start the progress bar.
    NProgress.start();

    // NProgress will trickle. To ensure it completes if a page loads very quickly 
    // and there's no immediate next navigation (which would restart it),
    // we use a timeout to call done().
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300); // Reduced timeout to make it feel quicker for fast loads

    return () => {
      // Cleanup: ensure progress bar is done when the effect re-runs for a new navigation
      // or when the component unmounts (though the mount effect's NProgress.remove() also handles unmount).
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]); // Re-run when navigation changes

  return null; // This component doesn't render anything itself
}
