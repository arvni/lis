import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import SelectSearch from '@/Components/SelectSearch';
import LeaveRequestForm from '@/Pages/Attendance/LeaveRequests/Components/LeaveRequestForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

vi.mock('@/Components/SelectSearch', () => ({
    default: vi.fn(({ label }) => <div>{label}</div>),
}));

vi.mock('@mui/x-date-pickers', () => ({
    LocalizationProvider: ({ children }) => children,
    DatePicker: ({ label, value }) => (
        <div>
            {label} {value?.format('YYYY-MM-DD')}
        </div>
    ),
    TimePicker: ({ label, value }) => (
        <div>
            {label} {value?.format('HH:mm')}
        </div>
    ),
}));

const kinds = [
    { id: 1, name: 'Annual' },
    { id: 2, name: 'Sick' },
];

const fullDays = {
    user_id: null,
    person: null,
    leave_kind_id: 1,
    type: 'DAILY',
    start_date: '2026-09-20',
    end_date: '2026-09-24',
    start_time: '08:00',
    end_time: '10:00',
    reason: '',
};

let form;

const mockForm = (overrides = {}) => {
    form = {
        data: fullDays,
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

const renderForm = (canManage = false) =>
    render(<LeaveRequestForm open onClose={vi.fn()} kinds={kinds} canManage={canManage} />);

const lastUpdate = () =>
    form.setData.mock.calls.filter(([arg]) => typeof arg === 'function').at(-1)[0];

beforeEach(() => {
    vi.clearAllMocks();
    mockForm();
});

describe('LeaveRequestForm', () => {
    it('asks for a first and last day for full-day leave', () => {
        renderForm();

        expect(screen.getByText('First day 2026-09-20')).toBeInTheDocument();
        expect(screen.getByText('Last day 2026-09-24')).toBeInTheDocument();
        expect(screen.queryByText(/^From/)).not.toBeInTheDocument();
    });

    it('asks for one date and a time range for hourly leave', () => {
        mockForm({ data: { ...fullDays, type: 'HOURLY' } });
        renderForm();

        expect(screen.getByText('Date 2026-09-20')).toBeInTheDocument();
        expect(screen.getByText('From 08:00')).toBeInTheDocument();
        expect(screen.getByText('To 10:00')).toBeInTheDocument();
        expect(screen.queryByText(/^Last day/)).not.toBeInTheDocument();
    });

    it('switches to hourly leave', () => {
        renderForm();
        fireEvent.click(screen.getByRole('button', { name: 'Hours' }));

        expect(lastUpdate()(fullDays).type).toBe('HOURLY');
    });

    it('lets only leave managers enter leave for someone else', () => {
        renderForm();
        expect(SelectSearch).not.toHaveBeenCalled();

        renderForm(true);
        expect(vi.mocked(SelectSearch).mock.calls.at(-1)[0]).toEqual(
            expect.objectContaining({ label: 'Person', name: 'person' }),
        );
    });

    it('sends the request for approval', () => {
        renderForm();
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(form.post).toHaveBeenCalledWith(
            expect.stringContaining('attendance.leave-requests.store'),
            expect.objectContaining({ preserveScroll: true }),
        );
    });
});
