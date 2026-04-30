import { logEvent } from './client'

const DEFAULT_ENDPOINT = 'https://www.llmcosttracker.com/api/events'

export interface TrackedCallOptions {
  client: any
  params: Record<string, any>
  apiKey: string
  feature?: string
  userId?: string
  promptVersion?: string
  endpoint?: string
}

export async function trackedCall(options: TrackedCallOptions): Promise<any> {
  const {
    client,
    params,
    apiKey,
    feature,
    userId,
    promptVersion,
    endpoint = DEFAULT_ENDPOINT,
  } = options

  const start = Date.now()
  let response: any

  // ── Anthropic ────────────────────────────────────────────────
  if (typeof client?.messages?.create === 'function') {
    response = await client.messages.create(params)
    const latency_ms = Date.now() - start
    const usage = response?.usage

    logEvent(endpoint, {
      api_key:        apiKey,
      feature,
      user_id:        userId,
      prompt_version: promptVersion,
      model:          params.model ?? response?.model ?? 'unknown',
      input_tokens:   usage?.input_tokens  ?? null,
      output_tokens:  usage?.output_tokens ?? null,
      latency_ms,
    })

    return response
  }

  // ── OpenAI-compatible (OpenAI, DeepSeek, xAI, Perplexity) ───
  // All use client.chat.completions.create with prompt_tokens / completion_tokens
  if (typeof client?.chat?.completions?.create === 'function') {
    response = await client.chat.completions.create(params)
    const latency_ms = Date.now() - start
    const usage = response?.usage

    logEvent(endpoint, {
      api_key:        apiKey,
      feature,
      user_id:        userId,
      prompt_version: promptVersion,
      model:          params.model ?? response?.model ?? 'unknown',
      input_tokens:   usage?.prompt_tokens     ?? null,
      output_tokens:  usage?.completion_tokens ?? null,
      latency_ms,
    })

    return response
  }

  // ── Google Gemini ─────────────────────────────────────────────
  // Gemini SDK uses client.models.generateContent and returns
  // usageMetadata with promptTokenCount / candidatesTokenCount
  if (typeof client?.models?.generateContent === 'function') {
    response = await client.models.generateContent(params)
    const latency_ms = Date.now() - start
    const usage = response?.usageMetadata

    logEvent(endpoint, {
      api_key:        apiKey,
      feature,
      user_id:        userId,
      prompt_version: promptVersion,
      model:          params.model ?? 'unknown',
      input_tokens:   usage?.promptTokenCount     ?? null,
      output_tokens:  usage?.candidatesTokenCount ?? null,
      latency_ms,
    })

    return response
  }

  throw new Error(
    'Unsupported client. Pass an Anthropic, OpenAI-compatible, or Google Gemini client instance.'
  )
}

export interface TrackedStreamOptions extends TrackedCallOptions {}

export async function trackedStream(options: TrackedStreamOptions): Promise<any> {
  const {
    client,
    params,
    apiKey,
    feature,
    userId,
    promptVersion,
    endpoint = DEFAULT_ENDPOINT,
  } = options

  const start = Date.now()

  // ── Anthropic streaming ───────────────────────────────────────
  if (typeof client?.messages?.stream === 'function') {
    const stream = client.messages.stream(params)

    const logAfterStream = stream.finalMessage().then((msg: any) => {
      const latency_ms = Date.now() - start
      const usage = msg?.usage
      return logEvent(endpoint, {
        api_key:        apiKey,
        feature,
        user_id:        userId,
        prompt_version: promptVersion,
        model:          params.model ?? msg?.model ?? 'unknown',
        input_tokens:   usage?.input_tokens  ?? null,
        output_tokens:  usage?.output_tokens ?? null,
        latency_ms,
      })
    }).catch(() => {})

    ;(stream as any).__logPromise = logAfterStream

    return stream
  }

  // ── OpenAI-compatible streaming ───────────────────────────────
  // stream: true returns an async iterable; usage appears in the
  // final chunk when stream_options: { include_usage: true } is set.
  if (typeof client?.chat?.completions?.create === 'function') {
    const stream = await client.chat.completions.create({
      ...params,
      stream: true,
      stream_options: { include_usage: true },
    })

    let inputTokens:  number | null = null
    let outputTokens: number | null = null
    let finalModel = params.model ?? 'unknown'

    const logAfterStream = (async () => {
      for await (const chunk of stream) {
        if (chunk.model) finalModel = chunk.model
        if (chunk.usage) {
          inputTokens  = chunk.usage.prompt_tokens     ?? null
          outputTokens = chunk.usage.completion_tokens ?? null
        }
      }
      const latency_ms = Date.now() - start
      return logEvent(endpoint, {
        api_key:        apiKey,
        feature,
        user_id:        userId,
        prompt_version: promptVersion,
        model:          finalModel,
        input_tokens:   inputTokens,
        output_tokens:  outputTokens,
        latency_ms,
      })
    })().catch(() => {})

    ;(stream as any).__logPromise = logAfterStream

    return stream
  }

  throw new Error(
    'trackedStream supports Anthropic streaming and OpenAI-compatible streaming clients.'
  )
}