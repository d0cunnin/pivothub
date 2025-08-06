import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              Terms and Conditions
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed">
              Please read these terms and conditions carefully before using ReLaunch services
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 prose prose-gray max-w-none">
              <div>
                <h3 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using ReLaunch's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">2. Service Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ReLaunch provides career development services including skills assessments, training recommendations, business planning tools, and grant writing assistance. Our services are designed to help individuals enhance their career prospects and explore entrepreneurial opportunities.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">3. User Responsibilities</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Users are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Providing accurate and complete information</li>
                  <li>Maintaining the confidentiality of their account credentials</li>
                  <li>Using the service in compliance with all applicable laws</li>
                  <li>Not engaging in any fraudulent or harmful activities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">4. Privacy Policy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We respect your privacy and are committed to protecting your personal information. Any data collected is used solely for the purpose of providing our services and improving user experience. We do not sell or share personal information with third parties without explicit consent.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">5. Intellectual Property</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All content, features, and functionality of ReLaunch are owned by us and are protected by international copyright, trademark, and other intellectual property laws. Users may not reproduce, distribute, or create derivative works without written permission.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">6. Service Availability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  While we strive to provide continuous service, we do not guarantee that our services will be available at all times. We reserve the right to modify, suspend, or discontinue services with or without notice.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">7. Limitation of Liability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ReLaunch provides educational and informational services. We make no guarantees regarding career outcomes or business success. Users are responsible for their own decisions and actions based on the information and tools provided.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">8. Modifications to Terms</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the service constitutes acceptance of the modified terms.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">9. Contact Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms and Conditions, please contact us through our contact page or email us at legal@relaunch.com.
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

export default TermsAndConditions;