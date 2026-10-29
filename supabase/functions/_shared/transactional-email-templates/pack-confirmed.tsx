import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  packName?: string
  credits?: number
  amount?: string
}

const Email = ({ name, packName, credits, amount }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your ${packName ?? 'credit pack'} is ready — ${credits ?? ''} Tool Credits added`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>PivotHub</Heading>
        <Hr style={divider} />
        <Heading style={h1}>Your credit pack is ready</Heading>
        <Text style={text}>
          Hi{name ? ` ${name}` : ''}, thanks for your purchase. Your credits are already in your
          account and ready to use.
        </Text>
        <Section style={summaryBox}>
          <Text style={summaryRow}><strong>Pack:</strong> {packName ?? 'Credit pack'}</Text>
          {typeof credits === 'number' && (
            <Text style={summaryRow}><strong>Tool Credits added:</strong> {credits}</Text>
          )}
          {amount && <Text style={summaryRowLast}><strong>Amount:</strong> {amount}</Text>}
        </Section>
        <Section style={buttonSection}>
          <Button style={button} href="https://pivothub.io">
            Use your credits
          </Button>
        </Section>
        <Text style={text}>
          Booster pack credits stay usable for three months from today, alongside your monthly
          plan credits.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>PivotHub — practical AI tools for your next move.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Purchase confirmed: ${data.credits ?? ''} Tool Credits added to your account`,
  displayName: 'Booster pack purchase confirmation',
  previewData: { name: 'Jane', packName: 'Boost Pack', credits: 70, amount: '$10.00' },
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
