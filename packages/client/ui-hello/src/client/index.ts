/**
 * Hello world demo, browser half: the **Hello** entry of the sidebar and the
 * greeting page it opens in the main column. A single slot registration each:
 * the sidebar entry into the `sidebar.panellist` list, the page into the
 * keyed `main` panel slot under the same `MainPanelId`. The entry and the
 * panel share one id — that is the whole navigation contract.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the main-panel id brand the sidebar entry and the main slot share.
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the renderer-owned slots service (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { HelloPage } from './HelloPage.tsx'
import { HelloPanelIcon } from './HelloPanelIcon.tsx'

/** The id shared by the sidebar entry and the main panel it opens. */
export const PANEL_ID = 'hello' as MainPanelId

/** Required browser services: the slot registry. */
export const inject = ['slots']

/**
 * Contribute the Hello sidebar entry with the greeting page it opens.
 * @param ctx - the browser plugin context carrying the slots service.
 */
export function apply(ctx: ClientContext): void {
  // The sidebar entry: order 99 keeps it at the bottom of the panel list.
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 99,
    label: () => 'Hello',
  }, HelloPanelIcon))

  // The main panel the sidebar entry selects.
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
  }, HelloPage))
}
