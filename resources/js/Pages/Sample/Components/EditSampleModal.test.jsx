import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import EditSampleModal from '@/Pages/Sample/Components/EditSampleModal';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

describe('EditSampleModal', () => {
    let setData, clearErrors;
    beforeEach(() => {
        setData = vi.fn();
        clearErrors = vi.fn();
        useForm.mockReturnValue({
            data: { barcode: '' },
            setData,
            put: vi.fn(),
            processing: false,
            errors: {},
            reset: vi.fn(),
            clearErrors,
        });
    });

    const renderModal = (sample) =>
        render(<EditSampleModal open={true} sample={sample} onClose={() => {}} />);

    it('populates the barcode and clears errors when a sample is provided', () => {
        renderModal({ id: 1, barcode: 'ABC123' });
        expect(setData).toHaveBeenCalledWith('barcode', 'ABC123');
        expect(clearErrors).toHaveBeenCalled();
    });

    it('re-populates when the sample prop changes', () => {
        const { rerender } = renderModal({ id: 1, barcode: 'ABC123' });
        setData.mockClear();
        rerender(<EditSampleModal open={true} sample={{ id: 2, barcode: 'XYZ999' }} onClose={() => {}} />);
        expect(setData).toHaveBeenCalledWith('barcode', 'XYZ999');
    });

    it('does nothing when there is no sample', () => {
        renderModal(null);
        expect(setData).not.toHaveBeenCalled();
    });
});
