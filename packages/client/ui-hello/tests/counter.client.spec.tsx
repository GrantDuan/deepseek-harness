// @vitest-environment jsdom
/**
 * Browser half of the hello-world counter: the page reads the Host-side count
 * through the generated Remote API on mount and adds one through it on click.
 * The count itself is never kept here — the browser only mirrors what the Host
 * reports.
 */
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RemoteError, TestRemote } from '@deepseek-ai/dsh-client-test-runtime'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { RemoteResult } from '@deepseek-ai/dsh-api-remotes/client'
import { apply, inject, PANEL_ID } from '../src/client/index.ts'
import { HelloPage } from '../src/client/HelloPage.tsx'
import { HelloPanelIcon } from '../src/client/HelloPanelIcon.tsx'
import type { CounterView } from '../src/types.ts'

afterEach(cleanup)

/** The Remote counter face the page receives, as the generated API exposes it. */
interface PageFace {
  readCount: () => Promise<RemoteResult<CounterView>>
  incrementCount: () => Promise<RemoteResult<CounterView>>
}

interface BenchOptions {
  /** The Host-side count the scripted Remote starts at. */
  start?: number
  /** Override the `read` endpoint; the default answers the running count. */
  read?: () => Promise<RemoteResult<CounterView>>
  /** Override the `increment` endpoint; the default adds one. */
  increment?: () => Promise<RemoteResult<CounterView>>
}

/** One spec Context with the slots registry and a scripted Host counter Remote. */
async function bench(options: BenchOptions = {}) {
  const { start = 0, read: readImpl, increment: incrementImpl } = options
  const ctx = new Context()
  onTestFinished(async () => {
    await ctx.fiber.dispose()
  })
  await ctx.plugin(SlotRegistry).await()
  let current = start
  const read = vi.fn(readImpl ?? (async () => ({ ok: true as const, value: { count: current } })))
  const increment = vi.fn(incrementImpl ?? (async () => ({ ok: true as const, value: { count: ++current } })))
  new TestRemote(ctx, { counter: { read, increment } })
  return { ctx, slots: ctx.get('slots') as SlotRegistry, read, increment }
}

function declare(slots: SlotRegistry): () => void {
  return slots.register({
    name: 'root',
    children: {
      'main': { kind: 'keyed', scope: 'root' },
      'sidebar.panellist': { kind: 'list', scope: 'root' },
    },
  } as never, () => null)
}

/** Mount the browser plugin and hand back its registered entries and the page's Remote inject share. */
async function mountCounter(b: Awaited<ReturnType<typeof bench>>) {
  const removeRoot = declare(b.slots)
  await b.ctx.plugin({ inject: [...inject], apply }).await()
  const page = b.slots.entries('main')[0]!
  const icon = b.slots.entries('sidebar.panellist')[0]!
  const face = (page.inject as unknown as () => PageFace)()
  return { removeRoot, page, icon, face }
}

describe('ui-hello counter browser plugin', () => {
  it('declares only the services the page and its Remote methods use', () => {
    expect(inject).toEqual(['slots', 'remote', 'remote.counter'])
  })

  it('registers the sidebar entry and the counter page, reads the Host count on mount, and increments on click', async () => {
    const b = await bench()
    const { page, icon, face } = await mountCounter(b)
    expect(page.component).toBe(HelloPage)
    expect(page.options).toMatchObject({ key: PANEL_ID })
    expect(icon.component).toBe(HelloPanelIcon)
    expect(icon.options).toMatchObject({ id: PANEL_ID, order: 99 })
    expect(resolveSlotLabel(icon.options.label)).toBe('Hello')
    const glyph = render(<HelloPanelIcon size={18} active={false} />)
    expect(glyph.container.querySelector('svg')?.getAttribute('width')).toBe('18')
    render(<HelloPage {...face} />)
    expect((await screen.findByLabelText('count')).textContent).toBe('0')
    expect(b.read).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByLabelText('increment'))
    expect(b.increment).toHaveBeenCalledTimes(1)
    expect((await screen.findByLabelText('count')).textContent).toBe('1')
  })

  it('shows a placeholder until the Host answers the mount read', async () => {
    const b = await bench()
    const { face } = await mountCounter(b)
    render(<HelloPage {...face} />)
    expect(screen.getByLabelText('count').textContent).toBe('—')
    await screen.findByLabelText('count')
  })

  it('keeps the button disabled while an increment is in flight', async () => {
    let resolveIncrement!: (result: RemoteResult<CounterView>) => void
    const b = await bench({
      increment: () => new Promise<RemoteResult<CounterView>>((resolve) => { resolveIncrement = resolve }),
    })
    const { face } = await mountCounter(b)
    render(<HelloPage {...face} />)
    await screen.findByLabelText('count')
    const button = screen.getByLabelText('increment') as HTMLButtonElement
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    await vi.waitFor(() => expect(button.disabled).toBe(true))
    resolveIncrement({ ok: true, value: { count: 1 } })
    await vi.waitFor(() => expect(button.disabled).toBe(false))
    expect(screen.getByLabelText('count').textContent).toBe('1')
  })

  it('keeps the placeholder when the Host read fails', async () => {
    const b = await bench({
      read: async () => ({ ok: false as const, error: new RemoteError('gateway/internal', 'Host counter unavailable') }),
    })
    const { face } = await mountCounter(b)
    render(<HelloPage {...face} />)
    await screen.findByLabelText('count')
    expect(screen.getByLabelText('count').textContent).toBe('—')
    expect((screen.getByLabelText('increment') as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps the shown count when the Host increment fails', async () => {
    const b = await bench({
      increment: async () => ({ ok: false as const, error: new RemoteError('gateway/internal', 'Host counter unavailable') }),
    })
    const { face } = await mountCounter(b)
    render(<HelloPage {...face} />)
    await screen.findByLabelText('count')
    fireEvent.click(screen.getByLabelText('increment'))
    await vi.waitFor(() => {
      expect(screen.getByLabelText('count').textContent).toBe('0')
      expect((screen.getByLabelText('increment') as HTMLButtonElement).disabled).toBe(false)
    })
  })
})
