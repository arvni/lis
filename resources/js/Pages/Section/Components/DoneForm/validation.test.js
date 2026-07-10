import { describe, it, expect } from 'vitest';
import { validateWorkflowAction } from './validation';

describe('validateWorkflowAction', () => {
    it('requires a value for required parameters only', () => {
        const state = {
            parameters: [
                { name: 'Result', value: '', required: true },
                { name: 'Notes', value: '', required: false },
                { name: 'Volume', value: '5', required: true },
            ],
        };
        expect(validateWorkflowAction(state, false)).toEqual({
            Result: 'Please enter Result value',
        });
    });

    it('passes completion with all required parameters filled', () => {
        const state = { parameters: [{ name: 'Result', value: 'ok', required: true }] };
        expect(validateWorkflowAction(state, false)).toEqual({});
    });

    it('tolerates a missing parameters list', () => {
        expect(validateWorkflowAction({}, false)).toEqual({});
    });

    it('requires details and a return-to section for rejection', () => {
        const errors = validateWorkflowAction({ parameters: [], details: '', next: null }, true);
        expect(errors.details).toBe('Please provide rejection details');
        expect(errors.next).toBe('Please select a section to return to');
    });

    it('accepts the empty-string next ("Sample Collection") for rejection', () => {
        const errors = validateWorkflowAction(
            { parameters: [], details: 'broken sample', next: '' },
            true,
        );
        expect(errors).toEqual({});
    });
});
