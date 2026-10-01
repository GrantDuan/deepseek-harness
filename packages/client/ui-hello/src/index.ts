/**
 * Host half of the hello-world counter. The count lives here, on the Host,
 * and the browser reads and increments it through the generated Remote API.
 */

import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { CounterView } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    counter: CounterService
  }
}

export type * from './types.ts'

/** Owns the hello counter on the Host; the Client calls {@link read} and {@link increment} remotely. */
export default class CounterService extends TypertRemoteService {
  private count = 0

  constructor(ctx: Context) {
    super(ctx, 'counter')
  }

  /**
   * Read the current count.
   * @returns the current {@link CounterView}.
   */
  @Remote
  read(): CounterView {
    return { count: this.count }
  }

  /**
   * Add one to the Host-side counter.
   * @returns the updated {@link CounterView}.
   */
  @Remote
  increment(): CounterView {
    return { count: ++this.count }
  }
}
