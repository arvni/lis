import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useForm, router } from '@inertiajs/react';
import Add from '@/Pages/Acceptance/Add';
import AcceptanceForm from '@/Pages/Acceptance/Components/AcceptanceForm';

vi.mock('@inertiajs/react', () => ({
    useForm: vi.fn(),
    router: { post: vi.fn() },
    Head: () => null,
}));

// Stub the heavy multi-step form; we only capture the `onSubmit` (save) handler it receives
// and drive the step-based validation/submit logic directly.
vi.mock('@/Pages/Acceptance/Components/AcceptanceForm', () => ({
    default: vi.fn(() => null),
}));

vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));

describe('Acceptance/Add create flow — validation gate before submit', () => {
    let setData, setError, clearErrors, reset, formData;

    // Add.jsx validates against the `data` held in useForm (not the arg passed to save),
    // so each test seeds this before rendering.
    const seed = (overrides = {}) => {
        formData = {
            acceptanceItems: { panels: [], tests: [] },
            referred: false,
            referrer: '',
            howReport: { way: 'print', who: 'John Doe' },
            ...overrides,
        };
    };

    beforeEach(() => {
        vi.clearAllMocks();
        setData = vi.fn();
        setError = vi.fn();
        clearErrors = vi.fn();
        reset = vi.fn();
        seed();
        useForm.mockImplementation(() => ({
            data: formData,
            setData,
            errors: {},
            setError,
            clearErrors,
            reset,
            processing: false,
        }));
    });

    const renderAdd = () => {
        render(<Add patient={{ id: 3 }} canAddPrescription={false} maxDiscount={100} />);
        return AcceptanceForm.mock.calls[0][0].onSubmit;
    };

    it('blocks submit and flags acceptanceItems when no tests/panels are selected (step 3)', () => {
        const save = renderAdd();
        save({}, 3);
        expect(setError).toHaveBeenCalledWith('acceptanceItems', 'Please select at least one test');
        expect(router.post).not.toHaveBeenCalled();
    });

    it('posts to the acceptances.store route (scoped to the patient) when a test is selected', () => {
        seed({ acceptanceItems: { panels: [], tests: [{ id: 1 }] } });
        const save = renderAdd();
        save({ note: 'x' }, 3);
        expect(setError).not.toHaveBeenCalled();
        expect(router.post).toHaveBeenCalledWith(
            '/acceptances.store/3',
            expect.objectContaining({ step: 3, note: 'x' }),
            expect.any(Object),
        );
    });

    it('requires a referrer when the acceptance is marked as referred (step 2)', () => {
        seed({ referred: true, referrer: '' });
        const save = renderAdd();
        save({}, 2);
        expect(setError).toHaveBeenCalledWith('referrer', 'Please select referrer');
        expect(router.post).not.toHaveBeenCalled();
    });

    it('rejects an unknown reporting method (step 4)', () => {
        seed({ howReport: { way: 'carrier-pigeon', who: 'John Doe' } });
        const save = renderAdd();
        save({}, 4);
        expect(setError).toHaveBeenCalledWith('howReport.way', 'Please select reporting method');
        expect(router.post).not.toHaveBeenCalled();
    });

    it('rejects an invalid email when the report is delivered by email (step 4)', () => {
        seed({ howReport: { way: 'email', who: 'not-an-email' } });
        const save = renderAdd();
        save({}, 4);
        expect(setError).toHaveBeenCalledWith('howReport.who', 'Please enter a valid email');
        expect(router.post).not.toHaveBeenCalled();
    });

    it('submits when the reporting step is valid (step 4)', () => {
        seed({ howReport: { way: 'email', who: 'john@example.com' } });
        const save = renderAdd();
        save({}, 4);
        expect(setError).not.toHaveBeenCalled();
        expect(router.post).toHaveBeenCalledWith(
            '/acceptances.store/3',
            expect.objectContaining({ step: 4 }),
            expect.any(Object),
        );
    });

    it('never submits from the patient-info step (step 0)', () => {
        const save = renderAdd();
        save({}, 0);
        expect(router.post).not.toHaveBeenCalled();
    });
});
