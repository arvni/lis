import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Ziggy's `route()` is a global in the running app (injected by @routes).
// Provide a lightweight stub so component tests that build URLs don't crash.
globalThis.route = vi.fn((name, params) => {
    if (params === undefined) return `/${name}`;
    const v = typeof params === 'object' ? Object.values(params).join('/') : params;
    return `/${name}/${v}`;
});
