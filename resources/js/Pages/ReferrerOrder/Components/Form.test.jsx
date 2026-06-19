import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import Form from '@/Pages/ReferrerOrder/Components/Form';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));
vi.mock('@/Pages/Patient/Components/PatientForm', () => ({
    default: () => <div>patient-form</div>,
}));

describe('ReferrerOrder Form', () => {
    let setData;
    beforeEach(() => {
        setData = vi.fn();
        useForm.mockReturnValue({
            data: {},
            setData,
            errors: {},
            post: vi.fn(),
            reset: vi.fn(),
        });
    });

    const renderForm = (props) =>
        render(<Form open={true} onClose={() => {}} defaultValues={{}} {...props} />);

    const lastUpdater = () => setData.mock.calls.filter((c) => typeof c[0] === 'function').at(-1)?.[0];

    it('seeds relative fields from id + mainPatientId on mount', () => {
        renderForm({ id: 42, mainPatientId: 7 });
        const updater = lastUpdater();
        expect(updater).toBeTypeOf('function');
        expect(updater({})).toMatchObject({ patient_id: 7, referrer_order_id: 42, relative_id: null });
    });

    it('re-seeds with the new id when the id prop changes (no stale id)', () => {
        const { rerender } = renderForm({ id: 42, mainPatientId: 7 });
        setData.mockClear();
        rerender(<Form open={true} onClose={() => {}} defaultValues={{}} id={99} mainPatientId={7} />);
        const updater = lastUpdater();
        expect(updater).toBeTypeOf('function');
        expect(updater({})).toMatchObject({ referrer_order_id: 99 });
    });
});
