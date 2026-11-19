import { describe, it, expect } from 'vitest';
import { STEPS } from './constants';
import { firstErrorStep, listErrors, stepErrorKeys } from './errors';

const panel = STEPS.PANEL;

describe('test form errors → steps', () => {
    it('puts a server-only error like test_groups on Basic Info', () => {
        expect(firstErrorStep(panel, { test_groups: 'The test groups field is required.' })).toBe(
            0,
        );
    });

    it('matches nested server keys to the step that owns the field', () => {
        const errors = { 'method_tests.0.method.id': 'The selected method is invalid.' };

        expect(stepErrorKeys(panel[2], errors)).toEqual(['method_tests.0.method.id']);
        expect(firstErrorStep(panel, errors)).toBe(2);
    });

    it('puts panel pricing errors on Pricing', () => {
        expect(firstErrorStep(panel, { price_type: 'Required' })).toBe(1);
    });

    it('lists an error no step owns instead of dropping it', () => {
        expect(listErrors(panel, { something_else: ['Bad', 'value'] })).toEqual([
            { key: 'something_else', message: 'Bad value', stepIndex: -1 },
        ]);
    });

    it('returns -1 when there are no errors', () => {
        expect(firstErrorStep(panel, {})).toBe(-1);
    });
});
