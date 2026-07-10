import { describe, it, expect } from 'vitest';
import { parseParameters } from './helpers';

describe('parseParameters', () => {
    it('passes an array through untouched', () => {
        const params = [{ name: 'Result', value: 'ok' }];
        expect(parseParameters(params)).toBe(params);
    });

    it('parses a JSON string', () => {
        expect(parseParameters('[{"name":"Result","value":"ok"}]')).toEqual([
            { name: 'Result', value: 'ok' },
        ]);
    });
});
