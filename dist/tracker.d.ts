export interface TrackedCallOptions {
    client: any;
    params: Record<string, any>;
    apiKey: string;
    feature?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    endpoint?: string;
}
export declare function trackedCall(options: TrackedCallOptions): Promise<any>;
export interface TrackedStreamOptions extends TrackedCallOptions {
}
export declare function trackedStream(options: TrackedStreamOptions): Promise<any>;
//# sourceMappingURL=tracker.d.ts.map