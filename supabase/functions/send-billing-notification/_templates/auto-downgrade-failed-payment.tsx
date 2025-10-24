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

interface AutoDowngradeFailedPaymentEmailProps {
  userName: string;
  subscriptionPackage: string;
  resubscribeUrl: string;
}

export const AutoDowngradeFailedPaymentEmail = ({
  userName,
  subscriptionPackage,
  resubscribeUrl,
}: AutoDowngradeFailedPaymentEmailProps) => (
  <Html>
    <Head />
    <Preview>Your PivotHub subscription has been downgraded</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Subscription Downgraded</Heading>
        
        <Text style={text}>Hi {userName},</Text>
        
        <Text style={text}>
          We've been unable to process payment for your <strong>{subscriptionPackage}</strong> subscription after multiple attempts.
        </Text>

        <Section style={alertBox}>
          <Text style={alertTitle}>⚠️ Account Downgraded to Explore Mode</Text>
          <Text style={alertText}>
            Your account has been automatically downgraded to our free tier:
          </Text>
          <Text style={alertText}>
            • <strong>5 AI credits per month</strong><br />
            • Access to basic tools and features<br />
            • All previous credits have been removed
          </Text>
        </Section>

        <Text style={text}>
          <strong>What you can do:</strong>
        </Text>

        <Text style={text}>
          1. <strong>Update your payment method</strong> - Add a valid payment method to resubscribe<br />
          2. <strong>Choose a new plan</strong> - Select a plan that fits your current needs<br />
          3. <strong>Continue with Explore Mode</strong> - Use PivotHub with 5 free credits per month
        </Text>

        <Link
          href={resubscribeUrl}
          target="_blank"
          style={button}
        >
          Resubscribe Now
        </Link>

        <Text style={text}>
          We hope to see you back as a premium member soon! If you have any questions or concerns about this change, please don't hesitate to reach out.
        </Text>

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

export default AutoDowngradeFailedPaymentEmail;

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
  backgroundColor: '#ffebee',
  border: '2px solid #f44336',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const alertTitle = {
  color: '#c62828',
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
