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

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `client` | `Anthropic \| OpenAI \| GoogleGenerativeAI \| XAI` | Yes | Your initialized client |
| `params` | `object` | Yes | Params passed to the underlying call |
| `apiKey` | `string` | Yes | Your LLM Cost Tracker project API key |
| `feature` | `string` | No | Tag for this call e.g. `'search'` |
| `userId` | `string` | No | Your app's user identifier |
| `metadata` | `object` | No | Any additional key-value pairs |
| `endpoint` | `string` | No | Custom endpoint for self-hosted installs |

## Links

- [Dashboard](https://llmcosttracker.com)
- [Docs](https://llmcosttracker.com/docs)
- [GitHub](https://github.com/llmcosttracker/sdk)