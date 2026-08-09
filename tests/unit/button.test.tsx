import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save invoice</Button>)
    expect(screen.getByRole('button', { name: 'Save invoice' })).toBeInTheDocument()
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)

    await user.click(screen.getByRole('button', { name: 'Click me' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>
    )

    await user.click(screen.getByRole('button', { name: 'Disabled' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies the destructive variant class', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-destructive')
  })

  it('renders as a different element when asChild is used', () => {
    render(
      <Button asChild>
        <a href="/dashboard">Go to dashboard</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Go to dashboard' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard')
  })
})
