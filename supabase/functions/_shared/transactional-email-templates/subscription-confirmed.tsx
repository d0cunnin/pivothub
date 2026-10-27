import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  credits?: number
  amount?: string
  periodEnd?: string
  changeType?: 'new' | 'upgrade' | 'renewal'
}

const Email = ({ name, planName, credits, amount, periodEnd, changeType }: Props) => {
  const plan = planName ?? 'your plan'
  const headline =
    changeType === 'upgrade'
      ? `You've upgraded to ${plan}`
      : changeType === 'renewal'
        ? `Your ${plan} plan has renewed`
        : `Your ${plan} subscription is active`
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headline} — payment confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>PivotHub</Heading>
          <Hr style={divider} />
          <Heading style={h1}>{headline}</Heading>
          <Text style={text}>Hi{name ? ` ${name}` : ''}, your payment went through. Here's a summary:</Text>
          <Section style={summaryBox}>
            <Text style={summaryRow}><strong>Plan:</strong> {plan}</Text>
            {typeof credits === 'number' && (
              <Text style={summaryRow}><strong>Tool Credits added:</strong> {credits}</Text>
            )}
            {amount && <Text style={summaryRow}><strong>Amount:</strong> {amount}</Text>}
            {periodEnd && (
              <Text style={summaryRowLast}><strong>Next renewal:</strong> {periodEnd}</Text>
            )}
          </Section>
          <Section style={buttonSection}>
            <Button style={button} href="https://pivothub.io">
              Start using your credits
            </Button>
          </Section>
          <Text style={text}>
            You can change or cancel your plan any time from Account Settings. Paid credits stay
            usable for three months from the day they're issued.
          </Text>
          <Hr style={divider} />
          <Text style={footer}>PivotHub — practical AI tools for your next move.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data.changeType === 'upgrade'
      ? `Confirmed: you've upgraded to ${data.planName ?? 'your new plan'}`
      : `Payment confirmed: ${data.planName ?? 'your PivotHub plan'}`,
  displayName: 'Subscription payment confirmation',
  previewData: { name: 'Jane', planName: 'Pro', credits: 100, amount: '$24.00', periodEnd: 'November 26, 2026', changeType: 'new' },
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
