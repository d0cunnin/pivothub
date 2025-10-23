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

interface DowngradeWarningEmailProps {
  userName: string;
  subscriptionTier: string;
  downgradeDate: string;
  updatePaymentUrl: string;
}

export const DowngradeWarningEmail = ({
  userName,
  subscriptionTier,
  downgradeDate,
  updatePaymentUrl,
}: DowngradeWarningEmailProps) => (
  <Html>
    <Head />
    <Preview>Final Notice: Your PivotHub Account Will Be Downgraded Soon</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Account Downgrade Notice</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>

        <Text style={text}>
          This is a final reminder that your <strong>{subscriptionTier}</strong> subscription 
          has not been renewed due to payment issues.
        </Text>

        <Section style={alertBox}>
          <Text style={alertText}>
            <strong>⏰ Account will be downgraded on: {downgradeDate}</strong>
          </Text>
        </Section>

        <Text style={text}>
          <strong>What will happen:</strong>
        </Text>
        <ul style={list}>
          <li>Your subscription will be cancelled</li>
          <li>You'll be moved to <strong>Explore Mode</strong> (5 free credits/month)</li>
          <li>All rollover credits will be removed</li>
          <li>Unused Explore Mode credits will be preserved if you resubscribe</li>
        </ul>

        <Text style={text}>
          <strong>To keep your subscription active:</strong>
        </Text>

        <Link
          href={updatePaymentUrl}
          style={button}
        >
          Update Payment Method Now
        </Link>

        <Text style={text}>
          Don't worry - you can resubscribe anytime to restore full access to all PivotHub tools!
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Questions?{' '}
          <Link href="https://pivothub.io/contact" style={link}>
            Contact support
          </Link>
        </Text>

        <Text style={footer}>
          PivotHub - Your AI-Powered Career & Business Platform
        </Text>
      </Container>
    </Body>
  </Html>
)

export default DowngradeWarningEmail

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

const alertBox = {
  backgroundColor: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
}

const alertText = {
  color: '#991b1b',
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
  backgroundColor: '#dc2626',
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
