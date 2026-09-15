import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import ShiftForm, {
    DEFAULT_HOURS,
    setDayTime,
    setWorking,
} from '@/Pages/Attendance/Shifts/Components/ShiftForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

// The real pickers are exercised by MUI; the form only decides which days get them.
vi.mock('@mui/x-date-pickers', () => ({
    LocalizationProvider: ({ children }) => children,
    TimePicker: ({ label, value }) => (
        <div>
            {label} {value?.format('HH:mm')}
        </div>
    ),
}));

const weekdays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
];

const emptyShift = { name: '', description: '', is_active: true, days: [] };

let form;

const mockForm = (overrides = {}) => {
    form = {
        data: emptyShift,
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

const renderForm = (defaultValue = null) =>
    render(<ShiftForm open onClose={vi.fn()} defaultValue={defaultValue} weekdays={weekdays} />);

const lastUpdate = () =>
    form.setData.mock.calls.filter(([arg]) => typeof arg === 'function').at(-1)[0];

beforeEach(() => {
    vi.clearAllMocks();
    mockForm();
});

describe('setWorking', () => {
    it('gives the first working day the default hours', () => {
        expect(setWorking([], 1, true)).toEqual([{ weekday: 1, ...DEFAULT_HOURS }]);
    });

    it('copies the last working day and keeps the days in week order', () => {
        const days = [{ weekday: 3, start_time: '07:30', end_time: '14:00' }];

        expect(setWorking(days, 1, true)).toEqual([
            { weekday: 1, start_time: '07:30', end_time: '14:00' },
            { weekday: 3, start_time: '07:30', end_time: '14:00' },
        ]);
    });

    it('drops a day that is switched off', () => {
        const days = [
            { weekday: 1, ...DEFAULT_HOURS },
            { weekday: 2, ...DEFAULT_HOURS },
        ];

        expect(setWorking(days, 1, false)).toEqual([{ weekday: 2, ...DEFAULT_HOURS }]);
    });
});

describe('setDayTime', () => {
    it('changes only the given weekday', () => {
        const days = [
            { weekday: 1, ...DEFAULT_HOURS },
            { weekday: 2, ...DEFAULT_HOURS },
        ];

        expect(setDayTime(days, 2, 'end_time', '13:00')).toEqual([
            { weekday: 1, ...DEFAULT_HOURS },
            { weekday: 2, start_time: '08:00', end_time: '13:00' },
        ]);
    });
});

describe('ShiftForm', () => {
    it('shows every weekday as a day off for a new shift', () => {
        renderForm();

        expect(screen.getByRole('heading', { name: 'Add New Shift' })).toBeInTheDocument();
        expect(screen.getAllByText('Day off')).toHaveLength(3);
    });

    it('switching a weekday on adds it to the working days', () => {
        renderForm();
        fireEvent.click(screen.getByLabelText('Monday'));

        expect(lastUpdate()(emptyShift).days).toEqual([{ weekday: 1, ...DEFAULT_HOURS }]);
    });

    it('shows the hours of working days only', () => {
        mockForm({
            data: {
                ...emptyShift,
                days: [{ weekday: 2, start_time: '09:00', end_time: '17:00' }],
            },
        });
        renderForm();

        expect(screen.getByText('Start 09:00')).toBeInTheDocument();
        expect(screen.getByText('End 17:00')).toBeInTheDocument();
        expect(screen.getAllByText('Day off')).toHaveLength(2);
    });

    it('shows a time error next to the weekday it belongs to', () => {
        mockForm({
            data: {
                ...emptyShift,
                days: [
                    { weekday: 1, ...DEFAULT_HOURS },
                    { weekday: 2, start_time: '16:00', end_time: '08:00' },
                ],
            },
            errors: { 'days.1.end_time': 'The end time must be after the start time.' },
        });
        renderForm();

        expect(screen.getByText('End 08:00')).toBeInTheDocument();
    });

    it('posts an existing shift to its update route', () => {
        mockForm({ data: { ...emptyShift, id: 4, name: 'Morning' } });
        renderForm({ id: 4, name: 'Morning', days: [] });
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(form.post).toHaveBeenCalledWith(
            '/attendance.shifts.update/4',
            expect.objectContaining({ preserveScroll: true }),
        );
    });
});
