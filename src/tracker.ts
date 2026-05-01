import { logEvent } from './client'
import { checkBudget, incrementSpend, getWindowStart } from './budget'
import type { BudgetConfig, BudgetCheckResult } from './budget'

const DEFAULT_ENDPOINT = 'https://www.llmcosttracker.com/api/events'

export interface TrackedCallOptions {
  client: any
  params: Record<string, any>
  apiKey: string
  feature?: string
  userId?: string
  tier?: string
  promptVersion?: string
  endpoint?: string
  budget?: BudgetConfig
  onBudgetWarning?: (result: BudgetCheckResult) => void
}

export async function trackedCall(options: TrackedCallOptions): Promise<any> {
  const {
    client,
    params,
    apiKey,
    feature,
    userId,
    tier,
    promptVersion,
    endpoint = DEFAULT_ENDPOINT,
    budget,
    onBudgetWarning,
  } = options

  // ── Budget check (pre-call) ───────────────────────────────────
  if (budget && userId) {
    checkBudget(userId, budget, onBudgetWarning)
  }

  const start = Date.now()
  let response: any

  // ── Anthropic ────────────────────────────────────────────────
  if (typeof client?.messages?.create === 'function') {
    response = await client.messages.create(params)
    const latency_ms = Date.now() - start
    const usage = response?.usage

    const inputTokens  = usage?.input_tokens  ?? null
    const outputTokens = usage?.output_tokens ?? null

    logEvent(endpoint, {
      api_key:        apiKey,
      feature,
      user_id:        userId,
      tier,
      prompt_version: promptVersion,
      model:          params.model ?? response?.model ?? 'unknown',
      input_tokens:   inputTokens,
      output_tokens:  outputTokens,
      latency_ms,
    })

    if (budget && userId && inputTokens !== null && outputTokens !== null) {
      const { calculateCost } = await import('./pricing')
      const costUsd = calculateCost(
        params.model ?? response?.model ?? 'unknown',
        inputTokens,
        outputTokens
      )
      if (costUsd !== null) {
        const windowStart = getWindowStart(budget.windowType)
        incrementSpend(userId, windowStart, costUsd)
      }
    }

    return response
  }

  // ── OpenAI-compatible (OpenAI, DeepSeek, xAI, Perplexity) ───
  if (typeof client?.chat?.completions?.create === 'function') {
    response = await client.chat.completions.create(params)
    const latency_ms = Date.now() - start
    const usage = response?.usage

    const inputTokens  = usage?.prompt_tokens     ?? null
    const outputTokens = usage?.completion_tokens ?? null

    logEvent(endpoint, {
      api_key:        apiKey,
      feature,
      user_id:        userId,
      tier,
      prompt_version: promptVersion,
      model:          params.model ?? response?.model ?? 'unknown',
      input_tokens:   inputTokens,
      output_tokens:  outputTokens,
      latency_ms,
    })

    if (budget && userId && inputTokens !== null && outputTokens !== null) {
      const { calculateCost } = await import('./pricing')
      const costUsd = calculateCost(
        params.model ?? response?.model ?? 'unknown',
        inputTokens,
        outputTokens
      )
      if (costUsd !== null) {
        const windowStart = getWindowStart(budget.windowType)
        incrementSpend(userId, windowStart, costUsd)
      }
    }

    return response
  }

  // ── Google Gemini ─────────────────────────────────────────────
  if (typeof client?.models?.generateContent === 'function') {
    response = await client.models.generateContent(params)
    const latency_ms = Date.now() - start
    const usage = response?.usageMetadata

    const inputTokens  = usage?.promptTokenCount     ?? null
    const outputTokens = usage?.candidatesTokenCount ?? null

    logEvent(endpoint, {
      api_key:        apiKey,
      feature,
      user_id:        userId,
      tier,
      prompt_version: promptVersion,
      model:          params.model ?? 'unknown',
      input_tokens:   inputTokens,
      output_tokens:  outputTokens,
      latency_ms,
    })

    if (budget && userId && inputTokens !== null && outputTokens !== null) {
      const { calculateCost } = await import('./pricing')
      const costUsd = calculateCost(
        params.model ?? response?.model ?? 'unknown',
        inputTokens,
        outputTokens
      )
      if (costUsd !== null) {
        const windowStart = getWindowStart(budget.windowType)
        incrementSpend(userId, windowStart, costUsd)
      }
    }

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
    tier,
    promptVersion,
    endpoint = DEFAULT_ENDPOINT,
    budget,
    onBudgetWarning,
  } = options

  // ── Budget check (pre-call) ───────────────────────────────────
  if (budget && userId) {
    checkBudget(userId, budget, onBudgetWarning)
  }

  const start = Date.now()

  // ── Anthropic streaming ───────────────────────────────────────
  if (typeof client?.messages?.stream === 'function') {
    const stream = client.messages.stream(params)

    const logAfterStream = stream.finalMessage().then(async (msg: any) => {
      const latency_ms = Date.now() - start
      const usage = msg?.usage
      const inputTokens  = usage?.input_tokens  ?? null
      const outputTokens = usage?.output_tokens ?? null

      logEvent(endpoint, {
        api_key:        apiKey,
        feature,
        user_id:        userId,
        tier,
        prompt_version: promptVersion,
        model:          params.model ?? msg?.model ?? 'unknown',
        input_tokens:   inputTokens,
        output_tokens:  outputTokens,
        latency_ms,
      })

      if (budget && userId && inputTokens !== null && outputTokens !== null) {
        const { calculateCost } = await import('./pricing')
        const costUsd = calculateCost(
          params.model ?? msg?.model ?? 'unknown',
          inputTokens,
          outputTokens
        )
        if (costUsd !== null) {
          const windowStart = getWindowStart(budget.windowType)
          incrementSpend(userId, windowStart, costUsd)
        }
      }
    }).catch(() => {})

    ;(stream as any).__logPromise = logAfterStream

    return stream
  }

  // ── OpenAI-compatible streaming ───────────────────────────────
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

      logEvent(endpoint, {
        api_key:        apiKey,
        feature,
        user_id:        userId,
        tier,
        prompt_version: promptVersion,
        model:          finalModel,
        input_tokens:   inputTokens,
        output_tokens:  outputTokens,
        latency_ms,
      })

      if (budget && userId && inputTokens !== null && outputTokens !== null) {
        const { calculateCost } = await import('./pricing')
        const costUsd = calculateCost(finalModel, inputTokens, outputTokens)
        if (costUsd !== null) {
          const windowStart = getWindowStart(budget.windowType)
          incrementSpend(userId, windowStart, costUsd)
        }
      }
    })().catch(() => {})

    ;(stream as any).__logPromise = logAfterStream

    return stream
  }

  throw new Error(
    'trackedStream supports Anthropic streaming and OpenAI-compatible streaming clients.'
  )
}