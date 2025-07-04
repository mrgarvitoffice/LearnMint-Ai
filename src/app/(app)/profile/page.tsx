
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Mail, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, signOutUser } = useAuth();

  return (
    <div className="container mx-auto max-w-xl py-8 text-center">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
          <CardHeader>
              <UserCircle className="mx-auto h-24 w-24 text-primary/80" />
              <CardTitle className="text-3xl font-bold text-primary mt-4">User Profile</CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1">
                  Manage your account information.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            {user ? (
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                   <Mail className="h-5 w-5 text-muted-foreground" />
                   <div>
                     <p className="text-xs text-muted-foreground">Email</p>
                     <p className="font-semibold">{user.email}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                   <KeyRound className="h-5 w-5 text-muted-foreground" />
                   <div>
                     <p className="text-xs text-muted-foreground">User ID</p>
                     <p className="font-mono text-xs">{user.uid}</p>
                   </div>
                 </div>
                 <Button onClick={signOutUser} variant="destructive" className="w-full mt-4">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                 </Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Loading user data...</p>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
