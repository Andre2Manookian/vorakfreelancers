const TRACKING_WEBHOOK_URL = import.meta.env.VITE_VORAK_TRACKING_WEBHOOK_URL

const TRACKING_EVENTS = new Set([
  'freelancer_registration',
  'client_registration',
  'project_created',
  'proposal_submitted',
  'project_completed',
  'payment_completed',
  'page_view',
  'login',
])

export function trackEvent(event, properties = {}) {
  if (!TRACKING_WEBHOOK_URL || !TRACKING_EVENTS.has(event)) return

  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ))
  )

  const payload = JSON.stringify({
    event,
    properties: safeProperties,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  })

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        TRACKING_WEBHOOK_URL,
        new Blob([payload], { type: 'application/json' })
      )
      return
    }
  } catch {
    // Tracking must never interrupt the user flow.
  }

  fetch(TRACKING_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {})
}

export { TRACKING_EVENTS }
