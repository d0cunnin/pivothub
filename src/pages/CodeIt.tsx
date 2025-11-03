import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Code2, Play, ExternalLink, Zap, Download } from "lucide-react";
import jsPDF from 'jspdf';
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

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use this tool");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('code-it', {
        body: { code: userCode },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
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

  const downloadCodeExplanationPDF = () => {
    if (!explanation) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, maxLineWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        
        yPosition += 5;
      };

      // Title
      addText('CODE EXPLANATION', 18, true);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 10;

      // User's Code
      addText('YOUR CODE:', 14, true);
      doc.setFont('courier', 'normal');
      addText(userCode, 10);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;

      // Explanation
      addText('EXPLANATION:', 14, true);
      addText(explanation.explanation, 11);
      yPosition += 10;

      // Expected Output
      addText('EXPECTED OUTPUT:', 14, true);
      doc.setFont('courier', 'normal');
      addText(explanation.expectedOutput, 10);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;

      // Tips
      if (explanation.tips) {
        addText('TIPS:', 14, true);
        addText(explanation.tips, 11);
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated by HireYourself Platform | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`code-explanation-${Date.now()}.pdf`);
      toast.success('Code explanation exported to PDF!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
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
          </div>
        </div>
      </section>

      <main id="code-content" className="flex-grow container mx-auto px-4 py-12">
        <ToolGuard toolName="code-it">
          {/* Understanding Coding Section */}
          <Card className="mb-12 bg-gradient-card/30 backdrop-blur-sm border border-white/10">
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
                    <div className="space-y-6 text-muted-foreground">
                      {/* Introduction */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Introduction</h3>
                        <p>Welcome to your first lesson in Python!</p>
                        <p className="mt-2">Python is a beginner-friendly programming language that's used everywhere — from building websites and apps to powering artificial intelligence systems.</p>
                        <p className="mt-2">In this section, you'll learn the building blocks of Python so you can start understanding how programs think and work.</p>
                      </div>

                      {/* What You'll Learn */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">What You'll Learn</h3>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>How to write and run Python code</li>
                          <li>What variables, strings, integers, and floats are</li>
                          <li>How to use comments to take notes in your code</li>
                          <li>How to do math in Python</li>
                          <li>How to write simple functions</li>
                          <li>How to work with lists, tuples, and dictionaries</li>
                          <li>How to use Python Turtle to draw simple graphics</li>
                        </ul>
                      </div>

                      {/* Getting Started */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Getting Started</h3>
                        <p>When you open a coding platform (like Replit or Python Tutor), you'll see a blank space — that's called your code editor.</p>
                        <p className="mt-2">Every line you type is executed in order — so the position and spacing (called indentation) matter.</p>
                        <p className="mt-3 font-medium text-foreground">Example:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>print("Hello, world!")</code>
                        </pre>
                        <p className="mt-2">This prints text on the screen.</p>
                        <p className="mt-1">If you forget the parentheses or quotation marks, Python will give you an error.</p>
                      </div>

                      {/* Variables */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Variables</h3>
                        <p>A variable is like a labeled box that stores information. You can put different kinds of data in it, and you can change what's inside at any time.</p>
                        
                        <p className="mt-4 font-medium text-foreground">How to Name Variables:</p>
                        <ul className="mt-2 list-disc pl-6 space-y-1">
                          <li>Must start with a letter or underscore (_)</li>
                          <li>Can contain letters, numbers, and underscores</li>
                          <li>Cannot contain spaces or special characters</li>
                          <li>Case-sensitive (<code className="text-foreground">name</code> is different from <code className="text-foreground">Name</code>)</li>
                          <li>Cannot use Python keywords (like <code className="text-foreground">print</code>, <code className="text-foreground">if</code>, <code className="text-foreground">for</code>)</li>
                          <li>Use descriptive names (good: <code className="text-foreground">user_age</code>, bad: <code className="text-foreground">x</code>)</li>
                        </ul>

                        <p className="mt-4 font-medium text-foreground">Creating Variables:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`name = "Alex"
age = 25
city = "Portland"`}</code>
                        </pre>

                        <p className="mt-4 font-medium text-foreground">Using Variables:</p>
                        <p className="mt-2">You can print your variables to see what's inside:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`print(name)     # Prints: Alex
print(age)      # Prints: 25
print(city)     # Prints: Portland`}</code>
                        </pre>

                        <p className="mt-4 font-medium text-foreground">Updating Variables:</p>
                        <p className="mt-2">You can change what's stored in a variable at any time:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`age = 25
print(age)      # Prints: 25

age = 26
print(age)      # Prints: 26`}</code>
                        </pre>
                      </div>

                      {/* Comments */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Comments</h3>
                        <p>Comments are notes you add to explain what your code is doing.</p>
                        <p className="mt-2">They start with a # symbol, and Python ignores them when running the program.</p>
                        <p className="mt-3 font-medium text-foreground">Example:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`# This program says hello to the user
name = "Sam"  # Storing the user's name
print("Hello, " + name)`}</code>
                        </pre>
                        <p className="mt-3 font-medium text-foreground">Tips for Good Comments:</p>
                        <ul className="mt-2 list-disc pl-6 space-y-1">
                          <li>Use them to explain why something is written, not just what it does</li>
                          <li>Comments make your code easier for others (and your future self) to understand</li>
                        </ul>
                      </div>

                      {/* Math in Python */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Math in Python</h3>
                        <p>Python can handle all kinds of math.</p>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full border-collapse border border-accent/20">
                            <thead>
                              <tr className="bg-background/50">
                                <th className="border border-accent/20 p-2 text-left text-foreground">Operation</th>
                                <th className="border border-accent/20 p-2 text-left text-foreground">Symbol</th>
                                <th className="border border-accent/20 p-2 text-left text-foreground">Example</th>
                                <th className="border border-accent/20 p-2 text-left text-foreground">Output</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-accent/20 p-2">Addition</td>
                                <td className="border border-accent/20 p-2"><code className="text-foreground">+</code></td>
                                <td className="border border-accent/20 p-2"><code>5 + 3</code></td>
                                <td className="border border-accent/20 p-2"><code>8</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Subtraction</td>
                                <td className="border border-accent/20 p-2"><code className="text-foreground">-</code></td>
                                <td className="border border-accent/20 p-2"><code>9 - 4</code></td>
                                <td className="border border-accent/20 p-2"><code>5</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Multiplication</td>
                                <td className="border border-accent/20 p-2"><code className="text-foreground">*</code></td>
                                <td className="border border-accent/20 p-2"><code>7 * 2</code></td>
                                <td className="border border-accent/20 p-2"><code>14</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Division</td>
                                <td className="border border-accent/20 p-2"><code className="text-foreground">/</code></td>
                                <td className="border border-accent/20 p-2"><code>8 / 2</code></td>
                                <td className="border border-accent/20 p-2"><code>4.0</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Exponent</td>
                                <td className="border border-accent/20 p-2"><code className="text-foreground">**</code></td>
                                <td className="border border-accent/20 p-2"><code>3 ** 2</code></td>
                                <td className="border border-accent/20 p-2"><code>9</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Modulus (Remainder)</td>
                                <td className="border border-accent/20 p-2"><code className="text-foreground">%</code></td>
                                <td className="border border-accent/20 p-2"><code>10 % 3</code></td>
                                <td className="border border-accent/20 p-2"><code>1</code></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-3">You can store results in variables:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`x = 10
y = 3
result = x % y
print(result)`}</code>
                        </pre>
                        <div className="mt-2 p-3 bg-accent/10 border border-accent/30 rounded">
                          <p className="text-sm font-medium text-foreground mb-1">Output:</p>
                          <code className="text-foreground">1</code>
                        </div>
                      </div>

                      {/* Strings */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Strings</h3>
                        <p>Strings are text wrapped in quotes — single or double quotes both work.</p>
                        <p className="mt-3 font-medium text-foreground">Example:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`hobby = "coding"
language = "Python"
message = "I love " + hobby + " with " + language + "!"
print(message)`}</code>
                        </pre>
                        <p className="mt-2 font-medium text-foreground">Output:</p>
                        <pre className="mt-1 p-3 bg-background/50 border border-accent/20 rounded">
                          <code>I love coding with Python!</code>
                        </pre>
                        <p className="mt-3 font-medium text-foreground">Tips:</p>
                        <ul className="mt-2 list-disc pl-6 space-y-1">
                          <li>Use + to join (concatenate) strings</li>
                          <li>Strings can also be formatted like this: <code className="text-foreground">print(f"I love {'{hobby}'}!")</code></li>
                        </ul>
                      </div>

                      {/* Integers and Floats */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Integers and Floats</h3>
                        <ul className="list-disc pl-6 space-y-2">
                          <li><strong className="text-foreground">Integers (int):</strong> Whole numbers (no decimals). Example: 25</li>
                          <li><strong className="text-foreground">Floats (float):</strong> Numbers with decimals. Example: 3.14</li>
                        </ul>
                        <p className="mt-3 font-medium text-foreground">Example:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`price = 9.99  # float
quantity = 3  # integer
total = price * quantity
print(total)`}</code>
                        </pre>
                        <p className="mt-2 font-medium text-foreground">Output:</p>
                        <pre className="mt-1 p-3 bg-background/50 border border-accent/20 rounded">
                          <code>29.97</code>
                        </pre>
                        <ul className="mt-3 list-disc pl-6">
                          <li><strong className="text-foreground">Tip:</strong> Python automatically knows if a number is an integer or float based on how you write it.</li>
                        </ul>
                      </div>

                      {/* Functions */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Functions</h3>
                        <p>A function is a reusable piece of code that performs a task.</p>
                        <p className="mt-2">You "define" it using the <code className="text-foreground">def</code> keyword.</p>
                        <p className="mt-3 font-medium text-foreground">Example:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`def calculate_total(price, quantity):
    total = price * quantity
    print("Total cost: $" + str(total))

calculate_total(15.99, 3)`}</code>
                        </pre>
                        <p className="mt-2 font-medium text-foreground">Output:</p>
                        <pre className="mt-1 p-3 bg-background/50 border border-accent/20 rounded">
                          <code>Total cost: $47.97</code>
                        </pre>
                        <p className="mt-3 font-medium text-foreground">Tips:</p>
                        <ul className="mt-2 list-disc pl-6 space-y-1">
                          <li>Always indent the code inside your function by 4 spaces</li>
                          <li>Use functions to keep your code organized and reusable</li>
                        </ul>
                      </div>

                      {/* Lists, Tuples, and Dictionaries */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Lists, Tuples, and Dictionaries</h3>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full border-collapse border border-accent/20">
                            <thead>
                              <tr className="bg-background/50">
                                <th className="border border-accent/20 p-2 text-left text-foreground">Type</th>
                                <th className="border border-accent/20 p-2 text-left text-foreground">Description</th>
                                <th className="border border-accent/20 p-2 text-left text-foreground">Example</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-accent/20 p-2"><strong className="text-foreground">List</strong></td>
                                <td className="border border-accent/20 p-2">Ordered collection that can change (mutable)</td>
                                <td className="border border-accent/20 p-2"><code>colors = ["red", "blue", "green"]</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2"><strong className="text-foreground">Tuple</strong></td>
                                <td className="border border-accent/20 p-2">Ordered collection that cannot change (immutable)</td>
                                <td className="border border-accent/20 p-2"><code>coordinates = (10, 20)</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2"><strong className="text-foreground">Dictionary</strong></td>
                                <td className="border border-accent/20 p-2">Key-value pairs (like a mini database)</td>
                                <td className="border border-accent/20 p-2"><code>{`person = {"name": "Alex", "age": 25}`}</code></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-3 font-medium text-foreground">Example:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`colors = ["red", "blue", "green"]
print(colors[1])  # prints "blue"

student = {"name": "Taylor", "grade": 92}
print(student["name"])  # prints "Taylor"`}</code>
                        </pre>
                        <p className="mt-3 font-medium text-foreground">Tips:</p>
                        <ul className="mt-2 list-disc pl-6 space-y-1">
                          <li>Use lists when you need to change or add items</li>
                          <li>Use tuples for data that should stay fixed</li>
                          <li>Use dictionaries when you need to label information clearly</li>
                        </ul>
                      </div>

                      {/* Python Turtle */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Python Turtle — Visual Learning</h3>
                        <p>Python has a built-in module called Turtle, which lets you draw pictures using code.</p>
                        <p className="mt-3 font-medium text-foreground">Example:</p>
                        <pre className="mt-2 p-3 bg-background/50 border border-accent/20 rounded overflow-x-auto">
                          <code>{`import turtle

t = turtle.Turtle()
t.forward(100)
t.right(90)
t.forward(100)

turtle.done()`}</code>
                        </pre>
                        <p className="mt-3 font-medium text-foreground">Explanation:</p>
                        <ul className="mt-2 list-disc pl-6 space-y-1">
                          <li><code className="text-foreground">turtle.Turtle()</code> creates your "pen"</li>
                          <li><code className="text-foreground">forward(100)</code> moves it 100 pixels</li>
                          <li><code className="text-foreground">right(90)</code> turns it 90 degrees</li>
                        </ul>
                        <ul className="mt-2 list-disc pl-6">
                          <li>You can combine commands to draw shapes or write your name.</li>
                        </ul>
                      </div>

                      {/* Quick Reference */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Quick Reference</h3>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full border-collapse border border-accent/20">
                            <thead>
                              <tr className="bg-background/50">
                                <th className="border border-accent/20 p-2 text-left text-foreground">Concept</th>
                                <th className="border border-accent/20 p-2 text-left text-foreground">Description</th>
                                <th className="border border-accent/20 p-2 text-left text-foreground">Example</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-accent/20 p-2">String</td>
                                <td className="border border-accent/20 p-2">Text in quotes</td>
                                <td className="border border-accent/20 p-2"><code>"Hello"</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Variable</td>
                                <td className="border border-accent/20 p-2">Container for data</td>
                                <td className="border border-accent/20 p-2"><code>name = "Sam"</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Integer</td>
                                <td className="border border-accent/20 p-2">Whole number</td>
                                <td className="border border-accent/20 p-2"><code>25</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Float</td>
                                <td className="border border-accent/20 p-2">Decimal number</td>
                                <td className="border border-accent/20 p-2"><code>3.14</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Comment</td>
                                <td className="border border-accent/20 p-2">Note for humans</td>
                                <td className="border border-accent/20 p-2"><code># This is a comment</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Function</td>
                                <td className="border border-accent/20 p-2">Reusable code block</td>
                                <td className="border border-accent/20 p-2"><code>def greet(): print("Hi")</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">List</td>
                                <td className="border border-accent/20 p-2">Changeable collection</td>
                                <td className="border border-accent/20 p-2"><code>colors = ["red", "blue"]</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Tuple</td>
                                <td className="border border-accent/20 p-2">Unchangeable collection</td>
                                <td className="border border-accent/20 p-2"><code>point = (2, 3)</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Dictionary</td>
                                <td className="border border-accent/20 p-2">Key-value mapping</td>
                                <td className="border border-accent/20 p-2"><code>{`student = {"name": "Taylor"}`}</code></td>
                              </tr>
                              <tr>
                                <td className="border border-accent/20 p-2">Turtle</td>
                                <td className="border border-accent/20 p-2">Drawing module</td>
                                <td className="border border-accent/20 p-2"><code>import turtle</code></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Next Steps</h3>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>Try editing the examples above — change names, numbers, or text</li>
                          <li>Always save and run your code after each small change</li>
                          <li>Remember: every expert coder started right here</li>
                        </ul>
                      </div>
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
              </Accordion>
            </CardContent>
          </Card>

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
          {/* Credit Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-gray-200">
              <Badge variant="default" className="gap-2 text-base px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">1 credit per use</span>
              </Badge>
            </div>
          </div>
          
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-accent">AI Explanation</h3>
                    <Button onClick={downloadCodeExplanationPDF} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
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

        </ToolGuard>
      </main>

      <Footer />
    </div>
  );
};

export default CodeIt;
