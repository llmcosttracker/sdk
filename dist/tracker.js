"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackedCall = trackedCall;
exports.trackedStream = trackedStream;
const client_1 = require("./client");
const DEFAULT_ENDPOINT = 'https://burnwise.vercel.app/api/events';
async function trackedCall(options) {
    const { client, params, apiKey, feature, userId, metadata, endpoint = DEFAULT_ENDPOINT, } = options;
    const start = Date.now();
    let response;
    // Anthropic
    if (typeof client?.messages?.create === 'function') {
        response = await client.messages.create(params);
        const latency_ms = Date.now() - start;
        const usage = response?.usage;
        (0, client_1.logEvent)(endpoint, {
            api_key: apiKey,
            feature,
            user_id: userId,
            model: params.model ?? response?.model ?? 'unknown',
            input_tokens: usage?.input_tokens ?? 0,
            output_tokens: usage?.output_tokens ?? 0,
            latency_ms,
            metadata,
        });
        return response;
    }
    // OpenAI
    if (typeof client?.chat?.completions?.create === 'function') {
        response = await client.chat.completions.create(params);
        const latency_ms = Date.now() - start;
        const usage = response?.usage;
        (0, client_1.logEvent)(endpoint, {
            api_key: apiKey,
            feature,
            user_id: userId,
            model: params.model ?? response?.model ?? 'unknown',
            input_tokens: usage?.prompt_tokens ?? 0,
            output_tokens: usage?.completion_tokens ?? 0,
            latency_ms,
            metadata,
        });
        return response;
    }
    throw new Error('Unsupported client. Pass an Anthropic or OpenAI client instance.');
}
async function trackedStream(options) {
    const { client, params, apiKey, feature, userId, metadata, endpoint = DEFAULT_ENDPOINT, } = options;
    const start = Date.now();
    // Anthropic streaming
    if (typeof client?.messages?.stream === 'function') {
        const stream = client.messages.stream(params);
        stream.finalMessage().then((msg) => {
            const latency_ms = Date.now() - start;
            const usage = msg?.usage;
            (0, client_1.logEvent)(endpoint, {
                api_key: apiKey,
                feature,
                user_id: userId,
                model: params.model ?? msg?.model ?? 'unknown',
                input_tokens: usage?.input_tokens ?? 0,
                output_tokens: usage?.output_tokens ?? 0,
                latency_ms,
                metadata,
            });
        }).catch(() => {
            // non-blocking
        });
        return stream;
    }
    throw new Error('trackedStream only supports Anthropic streaming calls.');
}
//# sourceMappingURL=tracker.js.map