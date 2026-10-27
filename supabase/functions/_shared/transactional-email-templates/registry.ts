import type { ComponentType } from 'npm:react@18.3.1'
import { template as welcome } from './welcome.tsx'
import { template as subscriptionConfirmed } from './subscription-confirmed.tsx'
import { template as packConfirmed } from './pack-confirmed.tsx'
import { template as renewalReminder } from './renewal-reminder.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'subscription-confirmed': subscriptionConfirmed,
  'pack-confirmed': packConfirmed,
  'renewal-reminder': renewalReminder,
}
