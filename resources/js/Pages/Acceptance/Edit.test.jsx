import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useForm, router } from '@inertiajs/react';
import Edit from '@/Pages/Acceptance/Edit';
import AcceptanceForm from '@/Pages/Acceptance/Components/AcceptanceForm';

vi.mock('@inertiajs/react', () => ({
    useForm: vi.fn(),
    router: { post: vi.fn() },
    Head: () => null,
}));

// Stub the heavy form; we only need to capture the `onSubmit` (save) handler it receives.
vi.mock('@/Pages/Acceptance/Components/AcceptanceForm', () => ({
    default: vi.fn(() => null),
}));

// Avoid pulling the full authenticated layout tree into the test.
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));

describe('Acceptance/Edit save + validation', () => {
    let setError, setData, clearErrors;

    beforeEach(() => {
        vi.clearAllMocks();
        setError = vi.fn();
        setData = vi.fn();
        clearErrors = vi.fn();
        useForm.mockReturnValue({
            data: { step: 3, acceptanceItems: {}, referred: false, referrer: '' },
            setData,
            setError,
            clearErrors,
            reset: vi.fn(),
        });
    });

    const renderEdit = () => {
        render(<Edit acceptance={{ id: 5, status: 'pending' }} errors={{}} />);
        return AcceptanceForm.mock.calls[0][0].onSubmit;
    };

    it('blocks submit and flags acceptanceItems when no tests/panels are selected', () => {
        const save = renderEdit();
        save({ acceptanceItems: { tests: [], panels: [] } }, 3, vi.fn());
        expect(setError).toHaveBeenCalledWith('acceptanceItems', 'Please select at least one test');
        expect(router.post).not.toHaveBeenCalled();
    });

    it('posts to the acceptance update route (using acceptance.id) when tests are present', () => {
        const save = renderEdit();
        save({ acceptanceItems: { tests: [{ id: 1 }] } }, 3, vi.fn());
        expect(router.post).toHaveBeenCalledWith(
            '/acceptances.update/5',
            expect.objectContaining({ step: 3 }),
            expect.any(Object),
        );
    });
});
