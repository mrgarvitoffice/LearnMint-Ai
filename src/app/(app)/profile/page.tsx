
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function ProfilePage() {

  return (
    <div className="container mx-auto max-w-xl py-8 text-center">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
          <CardHeader>
              <UserCircle className="mx-auto h-24 w-24 text-primary/80" />
              <CardTitle className="text-3xl font-bold text-primary mt-4">User Profile</CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1">
                  This page is ready for your authentication provider's user profile component.
              </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
              <p>You can add a user profile management component here.</p>
          </CardContent>
      </Card>
    </div>
  );
}
