
import { SignUp } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardContent className="p-8">
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </CardContent>
    </Card>
  );
}
