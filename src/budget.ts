import { LLMBudgetExceededError } from './errors'

export interface BudgetConfig {
  userId: string
  limitUsd: number
  windowType: 'day' | 'week' | 'month'
  action: 'block' | 'warn' | 'dry_run'
  alertThresholdPct?: number
  mode?: 'local' // reserved for 'server' later
}

export interface BudgetCheckResult {
  allowed: boolean
  warned: boolean
  spendUsd: number
  limitUsd: number
  windowStart: Date
  budgetConfig: BudgetConfig
}

// Returns the start of the current window for a given windowType
export function getWindowStart(windowType: 'day' | 'week' | 'month'): Date {
  const now = new Date()

  if (windowType === 'day') {
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ))
  }

  if (windowType === 'week') {
    const day = now.getUTCDay() // 0 = Sunday
    const diff = now.getUTCDate() - day
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      diff
    ))
  }

  // month
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1
  ))
}

// In-memory spend store keyed by "userId:windowStart ISO string"
// This resets when the process restarts, which is acceptable for v1
const spendStore = new Map<string, number>()

function getStoreKey(userId: string, windowStart: Date): string {
  return `${userId}:${windowStart.toISOString()}`
}

export function getCurrentSpend(userId: string, windowStart: Date): number {
  return spendStore.get(getStoreKey(userId, windowStart)) ?? 0
}

export function incrementSpend(userId: string, windowStart: Date, costUsd: number): void {
  const key = getStoreKey(userId, windowStart)
  const current = spendStore.get(key) ?? 0
  spendStore.set(key, current + costUsd)
}

export function checkBudget(
  userId: string,
  budget: BudgetConfig,
  onWarn?: (result: BudgetCheckResult) => void
): void {
  const windowStart = getWindowStart(budget.windowType)
  const spendUsd = getCurrentSpend(userId, windowStart)
  const { limitUsd, action, alertThresholdPct = 80 } = budget

  const result: BudgetCheckResult = {
    allowed: true,
    warned: false,
    spendUsd,
    limitUsd,
    windowStart,
    budgetConfig: budget,
  }

  // Check if over limit
  if (spendUsd >= limitUsd) {
    if (action === 'block') {
      throw new LLMBudgetExceededError({
        userId,
        limitUsd,
        spendUsd,
        windowType: budget.windowType,
        windowStart,
        action,
      })
    }

    if (action === 'warn' || action === 'dry_run') {
      result.warned = true
      result.allowed = action !== 'dry_run' ? true : false
      onWarn?.({ ...result })

      if (action === 'dry_run') {
        // Log but don't block — caller decides what to do
        console.warn(
          `[llmcosttracker] dry_run: would have blocked user "${userId}" ` +
          `($${spendUsd.toFixed(4)} of $${limitUsd.toFixed(4)} ${budget.windowType} limit)`
        )
      }
      return
    }
  }

  // Check alert threshold even if not over limit
  const thresholdUsd = limitUsd * (alertThresholdPct / 100)
  if (spendUsd >= thresholdUsd && onWarn) {
    result.warned = true
    onWarn({ ...result })
  }
}