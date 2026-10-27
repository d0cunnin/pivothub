import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  amount?: string
  renewalDate?: string
  credits?: number
}

const Email = ({ name, planName, amount, renewalDate, credits }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {planName ?? 'PivotHub'} plan renews in 4 days</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>PivotHub</Heading>
        <Hr style={divider} />
        <Heading style={h1}>Your subscription renews in 4 days</Heading>
        <Text style={text}>
          Hi{name ? ` ${name}` : ''}, a quick heads-up that your {planName ?? 'PivotHub'} plan
          will renew{renewalDate ? ` on ${renewalDate}` : ' in 4 days'}.
        </Text>
        <Section style={summaryBox}>
          <Text style={summaryRow}><strong>Plan:</strong> {planName ?? 'Your plan'}</Text>
          {amount && <Text style={summaryRow}><strong>Renewal amount:</strong> {amount}</Text>}
          {typeof credits === 'number' && (
            <Text style={summaryRow}><strong>Credits you'll receive:</strong> {credits} Tool Credits</Text>
          )}
          {renewalDate && <Text style={summaryRowLast}><strong>Renewal date:</strong> {renewalDate}</Text>}
        </Section>
        <Text style={text}>
          No action is needed — your card on file will be charged automatically. If you'd like to
          change or cancel your plan, you can do so before the renewal date in Account Settings.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href="https://pivothub.io/settings">
            Manage my plan
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>PivotHub — practical AI tools for your next move.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Reminder: your ${data.planName ?? 'PivotHub'} plan renews in 4 days`,
  displayName: 'Renewal reminder (4 days before)',
  previewData: { name: 'Jane', planName: 'Pro', amount: '$24.00', renewalDate: 'October 31, 2026', credits: 100 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 25px', maxWidth: '560px', margin: '0 auto' }
const brand = { color: '#00399b', fontSize: '22px', margin: '0 0 8px', letterSpacing: '0.5px' }
const h1 = { color: '#1a1a1a', fontSize: '24px', margin: '16px 0' }
const text = { color: '#3a3a3a', fontSize: '15px', lineHeight: '24px' }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const summaryBox = { backgroundColor: '#f4f7fd', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }
const summaryRow = { color: '#1a1a1a', fontSize: '15px', lineHeight: '22px', margin: '0 0 8px' }
const summaryRowLast = { ...summaryRow, margin: '0' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#00399b',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
}
const footer = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' }
