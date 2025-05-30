import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_ITEMS } from "@/lib/constants";
import { ArrowRight, Lightbulb, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const features = NAV_ITEMS.flatMap(item => 
    item.children ? item.children.map(child => ({ ...child, parentIcon: item.icon })) : [{ ...item, parentIcon: item.icon }]
  ).filter(item => item.href !== '/' && item.href !== '#');

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
          Welcome to LearnFlow!
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered learning assistant. Generate notes, create quizzes, explore flashcards, and much more to supercharge your studies.
        </p>
      </header>

      <section className="mb-12">
        <Card className="bg-primary/10 border-primary/30 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl text-primary">Get Started Quickly</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Jump right into your learning journey with our powerful AI tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Generate Study Notes", href: "/notes", icon: NAV_ITEMS.find(i => i.title === 'AI Tools')?.children?.find(c => c.title === 'Note Generator')?.icon || Zap },
              { title: "Create a Quiz", href: "/quiz", icon: NAV_ITEMS.find(i => i.title === 'AI Tools')?.children?.find(c => c.title === 'Quiz Creator')?.icon || Zap },
              { title: "Explore Flashcards", href: "/flashcards", icon: NAV_ITEMS.find(i => i.title === 'AI Tools')?.children?.find(c => c.title === 'Flashcards')?.icon || Zap },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link href={action.href} key={action.href} legacyBehavior>
                  <a className="block">
                    <Card className="hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                      <CardHeader className="flex-row items-center gap-3 pb-4">
                        <Icon className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          Leverage AI to create personalized {action.title.toLowerCase().replace('create a ', '').replace('explore ', '')}.
                        </p>
                      </CardContent>
                      <CardContent className="pt-0">
                         <Button variant="ghost" className="w-full justify-start text-primary hover:text-primary/80">
                          Go to {action.title.split(' ')[0]} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-3xl font-semibold mb-6 text-center">Explore All Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href} legacyBehavior>
                <a className="block">
                  <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col justify-between">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base font-medium">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Button variant="link" className="p-0 h-auto text-sm text-primary hover:text-primary/80">
                        Open {item.title.split(' ')[0]} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
