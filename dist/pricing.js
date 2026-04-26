"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_PRICING = void 0;
exports.calculateCost = calculateCost;
exports.MODEL_PRICING = {
    // Anthropic — price per million tokens
    'claude-opus-4-6': { input: 15.00, output: 75.00 },
    'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
    'claude-haiku-4-5': { input: 0.80, output: 4.00 },
    // OpenAI — price per million tokens
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};
function calculateCost(model, inputTokens, outputTokens) {
    const pricing = exports.MODEL_PRICING[model];
    if (!pricing)
        return 0;
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
}
//# sourceMappingURL=pricing.js.map