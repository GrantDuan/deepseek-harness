/**
 * Pure payload vocabulary of the hello-world counter, free of host-side imports
 * (cordis, the service): the durable wire shape the browser reads and writes
 * through the generated Remote API.
 * @module @deepseek-ai/dsh-client-ui-hello/types
 */

/** One snapshot of the Host-side counter, mirrored to the browser. */
export interface CounterView {
  count: number
}
