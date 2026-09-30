/** The Hello world page the sidebar entry opens in the main column. */

/**
 * Render the greeting in the main panel.
 * @returns the hello-world page.
 */
export function HelloPage() {
  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <h1>Hello world</h1>
    </div>
  )
}
