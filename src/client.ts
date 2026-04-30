export interface EventPayload {
  api_key:        string
  feature?:       string
  user_id?:       string
  prompt_version?: string
  model:          string
  // null means usage data was unavailable — server will store cost_usd = null.
  // Do not substitute 0, which would make the call appear free in aggregates.
  input_tokens:   number | null
  output_tokens:  number | null
  latency_ms?:    number
}

export async function logEvent(
  endpoint: string,
  payload: EventPayload
): Promise<void> {
  try {
    await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch {
    // non-blocking — never throws
  }
}