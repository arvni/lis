import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShiftIndex, { weeklyHours } from '@/Pages/Attendance/Shifts/Index';
import TableLayout from '@/Layouts/TableLayout';

const shift = {
    id: 3,
    name: 'Morning',
    description: null,
    is_active: true,
    days: [
        { weekday: 0, start_time: '08:00', end_time: '16:00' },
        { weekday: 4, start_time: '08:00', end_time: '12:30' },
    ],
};

const props = {
    shifts: { data: [shift], total: 1, current_page: 1 },
    weekdays: [
        { value: 0, label: 'Sunday' },
        { value: 4, label: 'Thursday' },
    ],
    requestInputs: {},
    status: null,
    success: false,
    errors: {},
};

vi.mock('@inertiajs/react', () => ({
    router: { post: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

vi.mock('@/Layouts/TableLayout', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: ({ actions }) => actions }));
vi.mock('@/Components/DeleteForm', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Pages/Attendance/Shifts/Components/ShiftForm', () => ({ default: vi.fn(() => null) }));

const column = (field) =>
    vi.mocked(TableLayout).mock.calls.at(-1)[0].columns.find((col) => col.field === field);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('weeklyHours', () => {
    it('adds up the hours of every working day', () => {
        expect(weeklyHours(shift.days)).toBe('12 h 30 m');
        expect(weeklyHours([{ weekday: 1, start_time: '08:00', end_time: '16:00' }])).toBe('8 h');
        expect(weeklyHours([])).toBe('0 h');
    });
});

describe('Attendance/Shifts/Index', () => {
    it('lists each working day with its hours', () => {
        render(<ShiftIndex />);
        render(column('days').renderCell({ value: shift.days }));

        expect(screen.getByText('Sun 08:00–16:00')).toBeInTheDocument();
        expect(screen.getByText('Thu 08:00–12:30')).toBeInTheDocument();
    });
});
