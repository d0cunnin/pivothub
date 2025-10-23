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
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SubscriptionSuccessEmailProps {
  userName: string;
  subscriptionTier: string;
  subscriptionPackage: string;
  monthlyCredits: number;
  nextBillingDate: string;
  dashboardUrl: string;
}

export const SubscriptionSuccessEmail = ({
  userName,
  subscriptionTier,
  subscriptionPackage,
  monthlyCredits,
  nextBillingDate,
  dashboardUrl,
}: SubscriptionSuccessEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {subscriptionPackage}! Your PivotHub Subscription is Active</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Welcome to {subscriptionPackage}!</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>

        <Text style={text}>
          Thank you for subscribing to PivotHub! Your <strong>{subscriptionPackage}</strong> subscription is now active.
        </Text>

        <Section style={successBox}>
          <Text style={successText}>
            <strong>Your Plan Details:</strong>
          </Text>
          <Text style={successText}>
            💳 Package: <strong>{subscriptionPackage}</strong>
          </Text>
          <Text style={successText}>
            ⚡ Monthly Credits: <strong>{monthlyCredits}</strong>
          </Text>
          <Text style={successText}>
            📅 Next Billing: <strong>{nextBillingDate}</strong>
          </Text>
        </Section>

        <Text style={text}>
          <strong>What's included:</strong>
        </Text>
        <ul style={list}>
          <li>{monthlyCredits} AI credits per month</li>
          <li>Unused credits roll over each month</li>
          <li>Access to all tools in your package</li>
          <li>Priority email support</li>
          <li>Save unlimited results</li>
        </ul>

        <Link
          href={dashboardUrl}
          style={button}
        >
          Go to Dashboard
        </Link>

        <Text style={text}>
          <strong>Important billing information:</strong>
        </Text>
        <ul style={list}>
          <li>Credits reset on the same calendar day each month</li>
          <li>Unused credits automatically roll over</li>
          <li>If you downgrade, Explore Mode credits are preserved for re-upgrade</li>
          <li>Failed payments trigger a 7-day grace period before downgrade</li>
          <li>You can cancel anytime from your account settings</li>
        </ul>

        <Hr style={hr} />

        <Text style={footer}>
          Need help getting started?{' '}
          <Link href="https://pivothub.io/contact" style={link}>
            Contact support
          </Link>
          {' '}or visit our{' '}
          <Link href="https://pivothub.io/pricing" style={link}>
            pricing page
          </Link>
          {' '}for more details.
        </Text>

        <Text style={footer}>
          PivotHub - Your AI-Powered Career & Business Platform
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SubscriptionSuccessEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
}

const successBox = {
  backgroundColor: '#d1fae5',
  border: '2px solid '#10b981',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
}

const successText = {
  color: '#065f46',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px 0 60px',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textDecoration: 'none',
  padding: '14px 32px',
  margin: '32px 40px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}
