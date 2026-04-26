import { logEvent } from './client'

const DEFAULT_ENDPOINT = 'https://burnwise.vercel.app/api/events'

export interface TrackedCallOptions {
  client: any
  params: Record<string, any>
  apiKey: string
  feature?: string
  userId?: string
  promptVersion?: string          // ← add this
  metadata?: Record<string, unknown>
  endpoint?: string
}

export async function trackedCall(options: TrackedCallOptions): Promise<any> {
  const {
    client,
    params,
    apiKey,
    feature,
    userId,
    promptVersion,                // ← destructure
    metadata,
    endpoint = DEFAULT_ENDPOINT,
  } = options

  const start = Date.now()
  let response: any

  // Anthropic
  if (typeof client?.messages?.create === 'function') {
    response = await client.messages.create(params)
    const latency_ms = Date.now() - start
    const usage = response?.usage

    logEvent(endpoint, {
      api_key: apiKey,
      feature,
      user_id: userId,
      prompt_version: promptVersion,  // ← pass through
      model: params.model ?? response?.model ?? 'unknown',
      input_tokens: usage?.input_tokens ?? 0,
      output_tokens: usage?.output_tokens ?? 0,
      latency_ms,
      metadata,
    })

    return response
  }

  // OpenAI
  if (typeof client?.chat?.completions?.create === 'function') {
    response = await client.chat.completions.create(params)
    const latency_ms = Date.now() - start
    const usage = response?.usage

    logEvent(endpoint, {
      api_key: apiKey,
      feature,
      user_id: userId,
      prompt_version: promptVersion,  // ← pass through
      model: params.model ?? response?.model ?? 'unknown',
      input_tokens: usage?.prompt_tokens ?? 0,
      output_tokens: usage?.completion_tokens ?? 0,
      latency_ms,
      metadata,
    })

    return response
  }

  throw new Error('Unsupported client. Pass an Anthropic or OpenAI client instance.')
}

export interface TrackedStreamOptions extends TrackedCallOptions {}

export async function trackedStream(options: TrackedStreamOptions): Promise<any> {
  const {
    client,
    params,
    apiKey,
    feature,
    userId,
    promptVersion,                // ← destructure
    metadata,
    endpoint = DEFAULT_ENDPOINT,
  } = options

  const start = Date.now()

  if (typeof client?.messages?.stream === 'function') {
    const stream = client.messages.stream(params)

    stream.finalMessage().then((msg: any) => {
      const latency_ms = Date.now() - start
      const usage = msg?.usage

      logEvent(endpoint, {
        api_key: apiKey,
        feature,
        user_id: userId,
        prompt_version: promptVersion,  // ← pass through
        model: params.model ?? msg?.model ?? 'unknown',
        input_tokens: usage?.input_tokens ?? 0,
        output_tokens: usage?.output_tokens ?? 0,
        latency_ms,
        metadata,
      })
    }).catch(() => {})

    return stream
  }

  throw new Error('trackedStream only supports Anthropic streaming calls.')
}