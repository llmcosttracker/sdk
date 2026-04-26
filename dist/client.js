"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = logEvent;
async function logEvent(endpoint, payload) {
    try {
        await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    }
    catch {
        // non-blocking — never throws
    }
}
//# sourceMappingURL=client.js.map