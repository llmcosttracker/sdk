export class LLMBudgetExceededError extends Error {
  readonly code = 'BUDGET_EXCEEDED'
  readonly userId: string
  readonly limitUsd: number
  readonly spendUsd: number
  readonly windowType: 'day' | 'week' | 'month'
  readonly windowStart: Date
  readonly action: 'block' | 'warn' | 'dry_run'

  constructor(params: {
    userId: string
    limitUsd: number
    spendUsd: number
    windowType: 'day' | 'week' | 'month'
    windowStart: Date
    action: 'block' | 'warn' | 'dry_run'
  }) {
    super(
      `LLM budget exceeded for user "${params.userId}": ` +
      `$${params.spendUsd.toFixed(4)} spent of $${params.limitUsd.toFixed(4)} ` +
      `${params.windowType} limit`
    )
    this.name = 'LLMBudgetExceededError'
    this.userId = params.userId
    this.limitUsd = params.limitUsd
    this.spendUsd = params.spendUsd
    this.windowType = params.windowType
    this.windowStart = params.windowStart
    this.action = params.action

    if ((Error as any).captureStackTrace) {
        (Error as any).captureStackTrace(this, LLMBudgetExceededError)
    }
  }
}