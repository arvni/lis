import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import { FormProvider } from '@/Components/FormTemplate';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

describe('FormProvider', () => {
    let setData;
    beforeEach(() => {
        setData = vi.fn();
        useForm.mockReturnValue({
            data: {},
            setData,
            post: vi.fn(),
            processing: false,
            errors: {},
            reset: vi.fn(),
            clearErrors: vi.fn(),
            setError: vi.fn(),
        });
    });

    const renderProvider = (defaultValue) =>
        render(
            <FormProvider open={true} onClose={() => {}} url="/save" defaultValue={defaultValue}>
                <div>field</div>
            </FormProvider>,
        );

    it('seeds the form with defaultValue on mount and renders children', () => {
        renderProvider({ name: 'Acme' });
        expect(setData).toHaveBeenCalledWith({ name: 'Acme' });
        expect(screen.getByText('field')).toBeInTheDocument();
    });

    it('re-seeds when defaultValue changes', () => {
        const { rerender } = renderProvider({ name: 'Acme' });
        setData.mockClear();
        rerender(
            <FormProvider open={true} onClose={() => {}} url="/save" defaultValue={{ name: 'Beta' }}>
                <div>field</div>
            </FormProvider>,
        );
        expect(setData).toHaveBeenCalledWith({ name: 'Beta' });
    });
});
