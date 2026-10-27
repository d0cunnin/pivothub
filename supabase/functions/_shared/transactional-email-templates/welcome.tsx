import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
}

const Email = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to PivotHub — your 5 free Tool Credits are ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>PivotHub</Heading>
        <Hr style={divider} />
        <Heading style={h1}>Welcome aboard{name ? `, ${name}` : ''}!</Heading>
        <Text style={text}>
          Your account is ready. You've started with <strong>5 free Tool Credits</strong> every
          month — use them across any of our 40+ AI tools for business plans, contracts, grants,
          schedules, and more.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href="https://pivothub.io">
            Explore the tools
          </Button>
        </Section>
        <Text style={text}>
          Need more credits? You can upgrade to a monthly plan or grab a booster pack any time
          from the Pricing page.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>
          PivotHub — practical AI tools for your next move. Questions? Just reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Welcome to PivotHub — your free Tool Credits are ready',
  displayName: 'Welcome email',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 25px', maxWidth: '560px', margin: '0 auto' }
const brand = { color: '#00399b', fontSize: '22px', margin: '0 0 8px', letterSpacing: '0.5px' }
const h1 = { color: '#1a1a1a', fontSize: '24px', margin: '16px 0' }
const text = { color: '#3a3a3a', fontSize: '15px', lineHeight: '24px' }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
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
