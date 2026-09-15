import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import ImportForm from '@/Pages/Attendance/Transactions/Components/ImportForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

const form = (overrides = {}) => ({
    data: { file: null },
    setData: vi.fn(),
    post: vi.fn(),
    processing: false,
    errors: {},
    reset: vi.fn(),
    clearErrors: vi.fn(),
    ...overrides,
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Attendance/Transactions/Components/ImportForm', () => {
    it('explains the column layouts it accepts', () => {
        vi.mocked(useForm).mockReturnValue(form());
        render(<ImportForm open onClose={vi.fn()} />);

        expect(screen.getByText('Employee ID · Date and Time')).toBeInTheDocument();
        expect(screen.getByText('Employee ID · Date · Time')).toBeInTheDocument();
        expect(
            screen.getByText('Employee ID · Access Date and Time · Access Date · Access Time'),
        ).toBeInTheDocument();
    });

    it('cannot be submitted before a file is chosen', () => {
        vi.mocked(useForm).mockReturnValue(form());
        render(<ImportForm open onClose={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
    });

    it('keeps the chosen file', () => {
        const state = form();
        vi.mocked(useForm).mockReturnValue(state);
        render(<ImportForm open onClose={vi.fn()} />);
        const file = new File(['x'], 'punches.xlsx');

        fireEvent.change(screen.getByTestId('punches-file'), { target: { files: [file] } });

        expect(state.setData).toHaveBeenCalledWith('file', file);
    });

    it('uploads the file and closes once imported', () => {
        const onClose = vi.fn();
        const state = form({ data: { file: new File(['x'], 'punches.xlsx') } });
        state.post.mockImplementation((url, options) => options.onSuccess());
        vi.mocked(useForm).mockReturnValue(state);
        render(<ImportForm open onClose={onClose} />);

        expect(screen.getByText('punches.xlsx')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Import' }));

        expect(state.post).toHaveBeenCalledWith(
            '/attendance.transactions.import',
            expect.objectContaining({ forceFormData: true }),
        );
        expect(onClose).toHaveBeenCalled();
    });

    it('shows why the file was refused', () => {
        vi.mocked(useForm).mockReturnValue(
            form({ errors: { file: 'No heading row found.' } }),
        );
        render(<ImportForm open onClose={vi.fn()} />);

        expect(screen.getByText('No heading row found.')).toBeInTheDocument();
    });
});
