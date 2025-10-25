import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 font-light leading-relaxed">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 prose prose-gray max-w-none">
              <div>
                <p className="text-muted-foreground leading-relaxed">
                  PivotHub ("we," "us," or "our") respects your privacy and is committed to protecting the personal information you provide while using our website and tools. This Privacy Policy outlines how we collect, use, and protect your information in compliance with Michigan law and applicable data protection regulations.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using this website, you agree to the terms of this Privacy Policy.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">1. Information We Collect</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  We may collect the following types of information when you use our services:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Personal Information:</strong> Name, email address, location, and other identifying information you voluntarily provide.</li>
                  <li><strong>Resume and Job Data:</strong> Work history, education, skills, certifications, and any other data submitted through resume, cover letter, or job-related tools.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device information, pages visited, and time spent on the site.</li>
                  <li><strong>User Input into AI Tools:</strong> Any data you enter into our AI-driven tools, including grant generators, resume builders, personality assessment tools, etc.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">2. How We Use Your Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  The data we collect is used to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide, improve, and personalize your experience on our website.</li>
                  <li>Operate AI-based tools and return relevant responses.</li>
                  <li>Respond to your inquiries and support requests.</li>
                  <li>Perform research and analysis to improve services.</li>
                  <li>Comply with legal obligations and protect our rights.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Note:</strong> Data you input into our AI tools may be used to generate results or suggestions. However, we do not store or use this information beyond the session unless explicitly stated.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">3. Sharing and Disclosure</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell or rent your personal information to third parties.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  We may share your information under the following limited circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>With service providers that assist in website functionality or security (e.g., hosting).</li>
                  <li>As required by law or legal process.</li>
                  <li>To protect the safety, rights, or property of PivotHub or others.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">4. AI Tool Usage Disclaimer</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  We act solely as a conduit between users and the AI technologies embedded in our tools. Users acknowledge that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Generated content (e.g., resumes, cover letters, assessment results, or grant narratives) is for informational and illustrative purposes only.</li>
                  <li>PivotHub is not responsible for the accuracy, suitability, originality, or legality of AI-generated content.</li>
                  <li>Users are solely responsible for reviewing, editing, and ensuring the appropriateness of any AI-generated content before use or publication.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">5. Data Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We take reasonable measures to protect your data, including encryption, secure servers, and access controls. However, no system is entirely foolproof. By using the site, you acknowledge and accept this risk.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">6. Your Rights</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Depending on your location, you may have rights under applicable data protection laws to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Access, correct, or delete your personal data.</li>
                  <li>Withdraw consent or object to data processing.</li>
                  <li>File a complaint with a data protection authority.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Contact us through our contact page to exercise these rights.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">7. Children's Privacy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our website is not intended for anyone under the legal adult age of 18 years old. We do not knowingly collect information from anyone under 18 years of age. If we discover that we have inadvertently collected personal information from someone under 18, we will delete that information promptly.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">8. Changes to This Policy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy at any time. Changes will be posted on this page with an updated effective date.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">9. Contact Us</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions or concerns about this policy, please contact us through our contact page.
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;