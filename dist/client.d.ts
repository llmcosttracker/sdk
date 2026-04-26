export interface EventPayload {
    api_key: string;
    feature?: string;
    user_id?: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    latency_ms?: number;
    metadata?: Record<string, unknown>;
}
export declare function logEvent(endpoint: string, payload: EventPayload): Promise<void>;
//# sourceMappingURL=client.d.ts.map