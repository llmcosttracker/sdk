export interface EventPayload {
  api_key: string
  feature?: string
  user_id?: string
  prompt_version?: string 
  model: string
  input_tokens: number
  output_tokens: number
  latency_ms?: number
}

export async function logEvent(
  endpoint: string,
  payload: EventPayload
): Promise<void> {
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // non-blocking — never throws
  }
}