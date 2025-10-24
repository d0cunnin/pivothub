import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface DowngradeCreditsTruncatedEmailProps {
  userName: string;
  oldPackage: string;
  newPackage: string;
  creditsLost: number;
  remainingCredits: number;
  dashboardUrl: string;
}

export const DowngradeCreditsTruncatedEmail = ({
  userName,
  oldPackage,
  newPackage,
  creditsLost,
  remainingCredits,
  dashboardUrl,
}: DowngradeCreditsTruncatedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your PivotHub plan has been changed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Plan Changed</Heading>
        
        <Text style={text}>Hi {userName},</Text>
        
        <Text style={text}>
          Your subscription has been updated from <strong>{oldPackage}</strong> to <strong>{newPackage}</strong>.
        </Text>

        <Section style={alertBox}>
          <Text style={alertTitle}>⚠️ Credit Balance Adjusted</Text>
          <Text style={alertText}>
            Because {newPackage} has a lower credit limit, we've adjusted your credit balance:
          </Text>
          <Text style={alertText}>
            • <strong>{creditsLost} credits removed</strong> (exceeded new plan's rollover cap)<br />
            • <strong>{remainingCredits} credits remaining</strong> in your account
          </Text>
        </Section>

        <Text style={text}>
          Your new plan's credit limit is now active, and you'll be billed at the new rate on your next billing date.
        </Text>

        <Text style={text}>
          If you'd like to upgrade again to restore your credit balance, you can do so anytime from your account settings.
        </Text>

        <Link
          href={dashboardUrl}
          target="_blank"
          style={button}
        >
          View Your Dashboard
        </Link>

        <Text style={footer}>
          Questions? Reply to this email or visit our support center.<br />
          <Link
            href="https://pivothub.io"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            PivotHub
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default DowngradeCreditsTruncatedEmail;

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const alertBox = {
  backgroundColor: '#fff4e6',
  border: '2px solid #ff9800',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const alertTitle = {
  color: '#e65100',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const alertText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 8px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '24px 0',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '32px',
};
