
import type { ReactNode } from 'react';

/**
 * AuthLayout Component
 * 
 * This layout component is specifically for authentication-related pages
 * (e.g., Sign In, Sign Up). It provides a consistent centered structure
 * for these forms against the application's background.
 * 
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child elements to be rendered within this layout (typically the sign-in or sign-up form).
 * @returns {JSX.Element} The rendered authentication layout.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Flex container to center content vertically and horizontally on the screen
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Renders the specific authentication page content (e.g., SignInPage, SignUpPage) */}
      {children}
    </div>
  );
}
```