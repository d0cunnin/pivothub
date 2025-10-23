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

interface PaymentFailedEmailProps {
  userName: string;
  subscriptionTier: string;
  gracePeriodEndDate: string;
  retryPaymentUrl: string;
}

export const PaymentFailedEmail = ({
  userName,
  subscriptionTier,
  gracePeriodEndDate,
  retryPaymentUrl,
}: PaymentFailedEmailProps) => (
  <Html>
    <Head />
    <Preview>Action Required: Payment Failed for Your PivotHub Subscription</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Failed</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>

        <Text style={text}>
          We were unable to process your payment for your <strong>{subscriptionTier}</strong> subscription.
        </Text>

        <Section style={alertBox}>
          <Text style={alertText}>
            <strong>⚠️ Your account is now in a 7-day grace period</strong>
          </Text>
          <Text style={alertText}>
            Grace period ends: <strong>{gracePeriodEndDate}</strong>
          </Text>
        </Section>

        <Text style={text}>
          During the grace period, you'll retain full access to your subscription features. 
          However, if payment is not resolved by the end date above, your account will be 
          automatically downgraded to <strong>Explore Mode</strong> (5 free credits per month).
        </Text>

        <Text style={text}>
          <strong>What happens on downgrade:</strong>
        </Text>
        <ul style={list}>
          <li>Your subscription will be cancelled</li>
          <li>All rollover credits will be deleted</li>
          <li>You'll receive 5 free credits per month (Explore Mode)</li>
          <li>You can resubscribe anytime to restore full access</li>
        </ul>

        <Link
          href={retryPaymentUrl}
          style={button}
        >
          Update Payment Method
        </Link>

        <Hr style={hr} />

        <Text style={footer}>
          Need help? Contact us or visit your{' '}
          <Link href="https://pivothub.io/settings" style={link}>
            account settings
          </Link>
          .
        </Text>

        <Text style={footer}>
          PivotHub - Your AI-Powered Career & Business Platform
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PaymentFailedEmail

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
  backgroundColor: '#fff3cd',
  border: '2px solid #ffc107',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
}

const alertText = {
  color: '#856404',
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
