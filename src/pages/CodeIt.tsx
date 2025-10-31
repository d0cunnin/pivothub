import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Code2, Play, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.jpg";
import { ToolGuard } from "@/components/ToolGuard";

const CodeIt = () => {
  const { user } = useAuth();
  const { checkAndIncrementUsage } = useUsage();
  const [userCode, setUserCode] = useState("");
  const [explanation, setExplanation] = useState<{ explanation: string; expectedOutput: string; tips: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const examples = [
    {
      title: "Hello World",
      code: `print("Hello, world!")`,
      explanation: "print() tells the computer to display text. Quotes \" \" mark text as a string. Parentheses () wrap what is displayed.",
      output: "Hello, world!"
    },
    {
      title: "Variables and Math",
      code: `name = "Jordan"
age = 25
height = 5.9
print(name, "is", age, "years old and", height, "feet tall.")`,
      explanation: "Variables are containers that hold data (text, numbers, etc.).",
      output: 'Jordan is 25 years old and 5.9 feet tall.'
    },
    {
      title: "Comments",
      code: `# This is a comment. Computers ignore it.`,
      explanation: "Comments start with # and help explain code to humans. The computer skips over them.",
      output: "(No output - comments are ignored)"
    },
    {
      title: "Doing Math",
      code: `a = 10
b = 5
print(a + b)`,
      explanation: "Coding can handle math like a calculator.",
      output: "15"
    },
    {
      title: "JSON Display",
      code: `{
  "name": "Jordan",
  "skills": ["coding", "problem solving", "teamwork"]
}`,
      explanation: "JSON helps computers share and store data neatly.",
      output: "(JSON is a data format, not executable code)"
    }
  ];

  const handleExplain = async () => {
    if (!user) {
      toast.error("Please sign in to use Code It");
      return;
    }

    if (!userCode.trim()) {
      toast.error("Please enter some code to explain");
      return;
    }

    setIsLoading(true);
    setExplanation(null);

    try {
      const canUse = await checkAndIncrementUsage('code-it');
      if (!canUse) {
        toast.error("Insufficient credits. Please upgrade or purchase credits.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('code-it', {
        body: { code: userCode }
      });

      if (error) throw error;

      setExplanation(data);
      toast.success("Code explained successfully!");
    } catch (error: any) {
      console.error('Error explaining code:', error);
      toast.error(error.message || "Failed to explain code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">CODE IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Learn to Code by Doing
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-4 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Coding is how we teach computers to think
            </p>
            <p className="text-lg md:text-xl text-white/80 mb-10 animate-fade-in max-w-3xl mx-auto" style={{ animationDelay: '0.3s' }}>
              Start small, understand the logic, and see how your code comes to life
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Badge variant="secondary" className="text-lg px-6 py-2">
                1 Credit per use
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <main id="code-content" className="flex-grow container mx-auto px-4 py-12">
        <ToolGuard toolName="code-it">
          {/* Static Examples */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Python Examples</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {examples.map((example, index) => (
                <Card key={index} className="bg-gradient-card/30 backdrop-blur-sm border border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-accent" />
                      {example.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Code:</p>
                      <pre className="bg-background/50 p-4 rounded-lg overflow-x-auto border border-accent/20">
                        <code className="text-sm">{example.code}</code>
                      </pre>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">🗣️ Explanation:</p>
                      <p className="text-sm">{example.explanation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Output:</p>
                      <div className="bg-background/50 p-3 rounded border border-accent/20">
                        <code className="text-sm text-accent">{example.output}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* User Input Section */}
          <Card className="mb-12 bg-gradient-card/30 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Try Your Own Code</CardTitle>
              <CardDescription>Paste Python code below and get an AI explanation in simple terms</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your Python code here..."
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="min-h-[200px] font-mono bg-background/50 mb-4"
              />
              <Button 
                onClick={handleExplain} 
                disabled={isLoading || !userCode.trim()}
                size="lg"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Explaining...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Explain Code
                  </>
                )}
              </Button>

              {explanation && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-accent">Explanation</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{explanation.explanation}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-accent">Expected Output</h3>
                    <div className="bg-background/50 p-4 rounded-lg border border-accent/20">
                      <code className="text-accent">{explanation.expectedOutput}</code>
                    </div>
                  </div>
                  {explanation.tips && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-accent">Tips</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{explanation.tips}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collapsible Lesson */}
          <Card className="bg-gradient-card/30 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Understanding Coding</CardTitle>
              <CardDescription>Learn the fundamentals of programming</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is-coding">
                  <AccordionTrigger>What is Coding?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      Coding is writing instructions for computers. Just like you follow a recipe to bake a cake, computers follow code to complete tasks. 
                      Code is written in special languages that computers understand, like Python, JavaScript, or Java.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="languages">
                  <AccordionTrigger>What are Programming Languages?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-3">
                      Programming languages are special ways to communicate with computers. Each language has its own rules (syntax) and purpose:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong className="text-foreground">Python:</strong> Great for beginners, used for AI, data, and automation</li>
                      <li><strong className="text-foreground">JavaScript:</strong> Powers interactive websites and web apps</li>
                      <li><strong className="text-foreground">Java:</strong> Used for Android apps and enterprise software</li>
                      <li><strong className="text-foreground">HTML/CSS:</strong> Structure and style websites</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="python-basics">
                  <AccordionTrigger>Python Basics</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-muted-foreground">
                      <p><strong className="text-foreground">Strings:</strong> Text enclosed in quotes. Example: "Hello"</p>
                      <p><strong className="text-foreground">Variables:</strong> Containers that store data. Example: name = "Alex"</p>
                      <p><strong className="text-foreground">Integers:</strong> Whole numbers. Example: 25</p>
                      <p><strong className="text-foreground">Floats:</strong> Decimal numbers. Example: 3.14</p>
                      <p><strong className="text-foreground">Comments:</strong> Notes that start with #. Computers ignore them.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="math">
                  <AccordionTrigger>Doing Math with Code</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-3">Computers are great at math! Here's how:</p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong className="text-foreground">+</strong> Addition: 5 + 3 = 8</li>
                      <li><strong className="text-foreground">-</strong> Subtraction: 10 - 4 = 6</li>
                      <li><strong className="text-foreground">*</strong> Multiplication: 3 * 7 = 21</li>
                      <li><strong className="text-foreground">/</strong> Division: 20 / 4 = 5</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="json">
                  <AccordionTrigger>How JSON Works</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-3">
                      JSON (JavaScript Object Notation) is a way to organize and share data. Think of it like a digital filing system:
                    </p>
                    <pre className="bg-background/50 p-4 rounded-lg overflow-x-auto border border-accent/20 mb-3">
                      <code className="text-sm">{`{
  "person": "Sam",
  "age": 30,
  "hobbies": ["reading", "gaming", "cooking"]
}`}</code>
                    </pre>
                    <p className="text-muted-foreground">
                      This shows a person's name, age, and hobbies in a clear, structured format that computers can easily read and understand.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="practice">
                  <AccordionTrigger>Where to Practice Coding for Free</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <p className="font-semibold text-foreground mb-2">Replit.com Tutorial</p>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Go to <a href="https://replit.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">replit.com <ExternalLink className="h-3 w-3" /></a></li>
                          <li>Click "Sign up" and create a free account</li>
                          <li>Once logged in, click "+ Create Repl"</li>
                          <li>Choose "Python" as your language</li>
                          <li>Give your project a name (e.g., "My First Code")</li>
                          <li>Click "Create Repl"</li>
                          <li>Write your Python code in the editor</li>
                          <li>Click "Run" to see your code in action!</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-2">Other Free Resources:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li><a href="https://codecademy.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">Codecademy <ExternalLink className="h-3 w-3" /></a> - Interactive coding lessons</li>
                          <li><a href="https://freecodecamp.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">freeCodeCamp <ExternalLink className="h-3 w-3" /></a> - Full curriculum and projects</li>
                          <li><a href="https://python.org/shell" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">Python.org Shell <ExternalLink className="h-3 w-3" /></a> - Quick Python practice</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </ToolGuard>
      </main>

      <Footer />
    </div>
  );
};

export default CodeIt;
