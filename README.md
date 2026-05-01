# @llmcosttracker/sdk

Drop-in cost tracking for Anthropic, OpenAI, Google Gemini, and xAI Grok calls.

## Install

```bash
npm install @llmcosttracker/sdk
```

## Usage

```typescript
import { trackedCall } from '@llmcosttracker/sdk'

const response = await trackedCall({
  client: anthropic,
  feature: 'search',
  userId: session.userId,
  apiKey: process.env.LLMCOSTTRACKER_API_KEY,
  params: {
    model: 'claude-sonnet-4-6',
    messages,
    max_tokens: 1024,
  }
})
```

## Streaming

```typescript
import { trackedStream } from '@llmcosttracker/sdk'

const stream = await trackedStream({
  client: anthropic,
  feature: 'chat',
  userId: session.userId,
  apiKey: process.env.LLMCOSTTRACKER_API_KEY,
  params: {
    model: 'claude-sonnet-4-6',
    messages,
    max_tokens: 1024,
  }
})
```

## Budget Enforcement

Set a per-user spend limit and the SDK will enforce it automatically. Configure once at the call site — no changes to your existing params or response handling.

```typescript
import { trackedCall, LLMBudgetExceededError } from '@llmcosttracker/sdk'

try {
  const response = await trackedCall({
    client: anthropic,
    feature: 'search',
    userId: session.userId,
    apiKey: process.env.LLMCOSTTRACKER_API_KEY,
    params: {
      model: 'claude-sonnet-4-6',
      messages,
      max_tokens: 1024,
    },
    budget: {
      userId: session.userId,
      limitUsd: 10,
      windowType: 'month',
      action: 'block',
      alertThresholdPct: 80,
    },
    onBudgetWarning: (result) => {
      console.warn(`User ${result.budgetConfig.userId} is at ${result.spendUsd.toFixed(4)} of $${result.limitUsd} limit`)
    },
  })
} catch (err) {
  if (err instanceof LLMBudgetExceededError) {
    // Handle gracefully — return a friendly message to your user
    console.error(`Budget exceeded: $${err.spendUsd.toFixed(4)} of $${err.limitUsd} ${err.windowType} limit`)
  }
}
```

### Budget options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `userId` | `string` | Yes | Must match the `userId` on the call |
| `limitUsd` | `number` | Yes | Spend cap in USD |
| `windowType` | `'day' \| 'week' \| 'month'` | Yes | Rolling window for the limit |
| `action` | `'block' \| 'warn' \| 'dry_run'` | Yes | What happens when the limit is reached |
| `alertThresholdPct` | `number` | No | Fire `onBudgetWarning` at this % of limit (default: 80) |

### Actions

| Action | Behavior |
|--------|----------|
| `block` | Throws `LLMBudgetExceededError` — call does not proceed |
| `warn` | Call proceeds, `onBudgetWarning` fires |
| `dry_run` | Call proceeds, logs a console warning — safe for testing |

> Budget enforcement requires a Growth plan on [llmcosttracker.com](https://llmcosttracker.com).

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `client` | `Anthropic \| OpenAI \| GoogleGenerativeAI` | Yes | Your initialized client |
| `params` | `object` | Yes | Params passed to the underlying call |
| `apiKey` | `string` | Yes | Your LLM Cost Tracker project API key |
| `feature` | `string` | No | Tag for this call e.g. `'search'` |
| `userId` | `string` | No | Your app's user identifier |
| `promptVersion` | `string` | No | Tag deploys for cost comparison e.g. `process.env.DEPLOY_SHA` |
| `budget` | `BudgetConfig` | No | Per-user spend limit configuration |
| `onBudgetWarning` | `(result: BudgetCheckResult) => void` | No | Callback fired at alert threshold or on warn action |
| `endpoint` | `string` | No | Custom endpoint for self-hosted installs |

## Links

- [Dashboard](https://llmcosttracker.com)
- [Docs](https://llmcosttracker.com/docs)
- [GitHub](https://github.com/llmcosttracker/sdk)