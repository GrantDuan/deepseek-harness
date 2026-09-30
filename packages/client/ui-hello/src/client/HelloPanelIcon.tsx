/** Decorative occupant for the hello sidebar entry. */
import { IconGlobeOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'

/**
 * Render the globe glyph at the size the sidebar asks for; the sidebar owns
 * its accessible navigation label.
 * @param props - the sidebar's icon share: the requested edge and whether the panel is selected.
 * @returns decorative globe icon.
 */
export function HelloPanelIcon({ size }: PropsRuntime<'sidebar.panellist'>) {
  return <IconGlobeOutlineRegular size={size} />
}
