/** The Hello counter page the sidebar entry opens in the main column. */

import { useEffect, useRef, useState } from 'react'
import type { RemoteResult } from '@deepseek-ai/dsh-api-remotes/client'
import type { CounterView } from '../types.ts'

export interface HelloPageProps {
  /** Read the current Host-side count through the Remote API. */
  readonly readCount: () => Promise<RemoteResult<CounterView>>
  /** Add one on the Host and return the updated count. */
  readonly incrementCount: () => Promise<RemoteResult<CounterView>>
}

/**
 * Mirror the Host-side counter: read it once on mount, then add one through
 * the Remote API on click. The count is never kept here — every change is
 * reported back by the Host and re-rendered.
 * @param props - the Remote counter face the registry injects.
 */
export function HelloPage(props: HelloPageProps) {
  // The registry re-runs the inject share on every render, so the mount effect
  // and the click handler read the freshest face through this ref.
  const latest = useRef(props)
  latest.current = props
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void latest.current.readCount().then((result) => {
      if (result.ok) setCount(result.value.count)
    })
  }, [])

  const increment = async () => {
    setBusy(true)
    const result = await latest.current.incrementCount()
    setBusy(false)
    if (result.ok) setCount(result.value.count)
  }

  return (
    <div style={{
      display: 'flex', flex: 1, flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      <h1>Hello, Host counter</h1>
      <output aria-label="count">{count ?? '—'}</output>
      <button aria-label="increment" disabled={busy || count === null} onClick={() => void increment()}>
        {busy ? 'Adding…' : 'Increment'}
      </button>
    </div>
  )
}
