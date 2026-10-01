/**
 * Host half of the hello-world counter: the CounterService owns the count on
 * the Host and exposes it to the browser through the generated Remote API.
 */
import { Context } from '@deepseek-ai/cordis'
import { expect, it, onTestFinished } from 'vitest'
import CounterService from '../src/index.ts'

/** Mount the counter service on a fresh Host Context. */
async function mount() {
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  await ctx.plugin(CounterService)
  return { ctx, counter: ctx.counter }
}

it('reads zero before any increment', async () => {
  const { counter } = await mount()
  expect(counter.read()).toEqual({ count: 0 })
})

it('increments the Host-side counter and returns the new count', async () => {
  const { counter } = await mount()
  expect(counter.increment()).toEqual({ count: 1 })
  expect(counter.increment()).toEqual({ count: 2 })
  expect(counter.read()).toEqual({ count: 2 })
})
