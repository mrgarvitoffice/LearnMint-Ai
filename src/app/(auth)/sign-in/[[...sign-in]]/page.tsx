
import { SignIn } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardContent className="p-8">
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </CardContent>
    </Card>
  );
}
