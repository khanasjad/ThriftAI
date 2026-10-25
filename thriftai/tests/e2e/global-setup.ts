/** Records when the run started so teardown removes only rows this run created. */
export default function globalSetup() {
  process.env.E2E_STARTED_AT = new Date().toISOString()
}
