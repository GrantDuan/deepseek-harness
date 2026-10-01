// @vitest-environment node
/**
 * Browser-boot reproduction: materialize the built api-remotes client bundle
 * exactly as the web module loader does — a require that answers NO specifier.
 * A bundle that asks the table for anything it cannot answer (the external
 * `zod` regression) throws here, mirroring "Failed to load plugins
 * @deepseek-ai/dsh-api-remotes" in the real web boot.
 */
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'

interface Handoff {
  id: string
  factory: (require: (specifier: string) => unknown) => { inject: readonly string[]; apply: (ctx: Context) => unknown }
}

/** The built artifact is what the browser loads; a fresh checkout without it skips. */
const builtClient = new URL('../lib/client.js', import.meta.url)

describe.skipIf(!existsSync(builtClient))('built api-remotes client bundle, browser module-table conditions', () => {
  it('materializes without requesting any external specifier', async () => {
    const handoffs = new Map<string, Handoff>()
    // Mirror window.__ModuleLoader__.load({ id, factory }).
    ;(globalThis as { window?: unknown }).window = {
      __ModuleLoader__: { load: (handoff: Handoff) => void handoffs.set(handoff.id, handoff) },
    }
    await import(builtClient.href)

    const handoff = handoffs.get('@deepseek-ai/dsh-api-remotes')
    expect(handoff).toBeDefined()
    // The browser module table answers only shared platform rows. The fixed
    // bundle must never call require for anything — zod included.
    const plugin = handoff!.factory(() => {
      throw new Error('browser module table: no external specifier available')
    })
    expect(plugin.inject).toEqual(['remote'])
  })
})
