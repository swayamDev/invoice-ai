import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  buildInvoiceEmailHtml,
  buildInvoiceEmailText,
  type InvoiceEmailData,
} from '@/lib/email-templates'

function baseData(overrides: Partial<InvoiceEmailData> = {}): InvoiceEmailData {
  return {
    type: 'invoice',
    invoiceNumber: 'INV-0001',
    invoiceId: 'inv_123',
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    senderName: 'Swayam',
    senderCompany: 'Invoice AI',
    senderEmail: 'billing@invoice-ai.dev',
    senderAddress: '123 Main St',
    issueDate: '2026-01-01',
    dueDate: '2026-01-15',
    currency: 'USD',
    subtotal: 100,
    taxRate: 10,
    taxAmount: 10,
    discount: 0,
    total: 110,
    items: [{ description: 'Design work', quantity: 1, rate: 100, amount: 100 }],
    notes: 'Thanks for your business!',
    subject: 'Your invoice',
    body: 'Please find your invoice attached.',
    appName: 'Invoice AI',
    appUrl: 'https://invoice.swayam.space',
    ...overrides,
  }
}

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    expect(escapeHtml(`"quoted"`)).toBe('&quot;quoted&quot;')
    expect(escapeHtml(`it's`)).toBe('it&#39;s')
  })

  it('neutralizes a classic XSS payload', () => {
    const payload = `<img src=x onerror="alert(1)">`
    const escaped = escapeHtml(payload)
    expect(escaped).not.toContain('<img')
    expect(escaped).not.toContain('onerror="alert(1)"')
  })

  it('returns an empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('coerces non-string input to a string first', () => {
    expect(escapeHtml(42)).toBe('42')
  })

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Jane Doe')).toBe('Jane Doe')
  })
})

describe('buildInvoiceEmailHtml', () => {
  it('escapes a malicious client name so it cannot inject markup', () => {
    const html = buildInvoiceEmailHtml(
      baseData({ clientName: `<img src=x onerror="alert('xss')">` })
    )
    expect(html).not.toContain(`<img src=x onerror`)
    expect(html).toContain('&lt;img src=x onerror=')
  })

  it('escapes a malicious note field', () => {
    const html = buildInvoiceEmailHtml(baseData({ notes: '<script>steal()</script>' }))
    expect(html).not.toContain('<script>steal()</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes malicious line item descriptions', () => {
    const html = buildInvoiceEmailHtml(
      baseData({
        items: [{ description: '<b onmouseover=alert(1)>Design</b>', quantity: 1, rate: 50, amount: 50 }],
      })
    )
    expect(html).not.toContain('<b onmouseover=alert(1)>')
  })

  it('renders the actual invoice data for the happy path', () => {
    const html = buildInvoiceEmailHtml(baseData())
    expect(html).toContain('INV-0001')
    expect(html).toContain('Jane Doe')
    expect(html).toContain('$110.00')
  })

  it('formats currency using the provided currency code', () => {
    const html = buildInvoiceEmailHtml(baseData({ currency: 'EUR', total: 50, subtotal: 50, taxAmount: 0 }))
    expect(html).toMatch(/€\s?50\.00|EUR\s?50\.00/)
  })
})

describe('buildInvoiceEmailText', () => {
  it('includes the invoice number and client name in plain text', () => {
    const text = buildInvoiceEmailText(baseData())
    expect(text).toContain('INV-0001')
    expect(text).toContain('Jane Doe')
  })

  it('lists each line item with its amount', () => {
    const text = buildInvoiceEmailText(baseData())
    expect(text).toContain('Design work')
  })
})
