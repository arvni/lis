import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import CorrectionForm, { describeDay } from '@/Pages/Attendance/Days/Components/CorrectionForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

vi.mock('@mui/x-date-pickers', () => ({
    LocalizationProvider: ({ children }) => children,
    TimePicker: ({ label, value }) => (
        <div>
            {label} {value?.format('HH:mm')}
        </div>
    ),
}));

const day = {
    id: 12,
    date: '2026-09-14',
    weekday: 'Mon',
    user: { id: 3, name: 'Sara Ahmed' },
    shift: { id: 1, name: 'Morning' },
    scheduled_start: '08:00',
    scheduled_end: '16:00',
    check_in: '08:11',
    check_out: null,
};

let form;

const mockForm = (overrides = {}) => {
    form = {
        data: { id: 12, _method: 'put', check_in: '08:11', check_out: '', note: '' },
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
        clearErrors: vi.fn(),
        setError: vi.fn(),
        ...overrides,
    };
    vi.mocked(useForm).mockReturnValue(form);
};

beforeEach(() => {
    vi.clearAllMocks();
    mockForm();
});

describe('CorrectionForm', () => {
    it('starts from the recorded times with an empty reason', () => {
        render(<CorrectionForm open day={day} onClose={vi.fn()} />);

        expect(useForm).toHaveBeenCalledWith({
            id: 12,
            _method: 'put',
            check_in: '08:11',
            check_out: '',
            note: '',
        });
        expect(screen.getByText('Check-in 08:11')).toBeInTheDocument();
    });

    it('says whose day it is and what hours it was judged against', () => {
        expect(describeDay(day)).toBe('Sara Ahmed · Mon 2026-09-14 · Morning 08:00–16:00');
        expect(describeDay({ ...day, scheduled_start: null, shift: null })).toBe(
            'Sara Ahmed · Mon 2026-09-14 · no working hours',
        );
    });

    it('sends the correction to the day', () => {
        mockForm({
            data: { id: 12, _method: 'put', check_in: '08:11', check_out: '16:00', note: 'Forgot card' },
        });
        render(<CorrectionForm open day={day} onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(form.post).toHaveBeenCalledWith(
            expect.stringContaining('attendance.days.update'),
            expect.objectContaining({ preserveScroll: true }),
        );
    });
});
