import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import SelectSearch from '@/Components/SelectSearch';
import ShiftAssignmentsPanel from '@/Pages/User/Components/ShiftAssignmentsPanel';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

// The real picker fetches over axios; the panel only decides what it searches and keeps.
vi.mock('@/Components/SelectSearch', () => ({
    default: vi.fn(({ label, helperText }) => (
        <div>
            {label} {helperText}
        </div>
    )),
}));

vi.mock('@mui/x-date-pickers', () => ({
    LocalizationProvider: ({ children }) => children,
    DatePicker: ({ label, value }) => (
        <div>
            {label} {value?.format('YYYY-MM-DD')}
        </div>
    ),
}));

const assignments = [
    {
        id: 9,
        shift: { id: 2, name: 'Evening', is_active: true },
        effective_from: '2026-09-01',
        effective_to: null,
        is_current: true,
    },
    {
        id: 5,
        shift: { id: 1, name: 'Morning', is_active: true },
        effective_from: '2026-01-01',
        effective_to: '2026-08-31',
        is_current: false,
    },
];

const pickShift = (shift) =>
    act(() => {
        vi.mocked(SelectSearch)
            .mock.calls.at(-1)[0]
            .onChange({ target: { name: 'shift', value: shift } });
    });

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-14T10:00:00'));
    vi.mocked(axios.get).mockResolvedValue({ data: { data: assignments } });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('ShiftAssignmentsPanel', () => {
    it('lists the shift history newest first and marks the current one', async () => {
        render(<ShiftAssignmentsPanel userId={7} />);

        expect(await screen.findByText('Evening')).toBeInTheDocument();
        expect(screen.getByText('Ongoing')).toBeInTheDocument();
        expect(screen.getByText('2026-08-31')).toBeInTheDocument();
        expect(screen.getAllByText('Current')).toHaveLength(1);
    });

    it('only offers to remove the latest assignment', async () => {
        render(<ShiftAssignmentsPanel userId={7} />);
        await screen.findByText('Evening');

        expect(screen.getByRole('button', { name: 'Remove Evening' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Remove Morning' })).not.toBeInTheDocument();
    });

    it('explains what having no shift means', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: { data: [] } });
        render(<ShiftAssignmentsPanel userId={7} />);

        expect(
            await screen.findByText(
                'No shift assigned yet. Without a shift, every day counts as a day off.',
            ),
        ).toBeInTheDocument();
    });

    it('assigns the picked shift from today by default and reloads the history', async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: {} });
        render(<ShiftAssignmentsPanel userId={7} />);
        await screen.findByText('Evening');

        const assign = screen.getByRole('button', { name: 'Assign shift' });
        expect(assign).toBeDisabled();

        pickShift({ id: 3, name: 'Night' });
        fireEvent.click(assign);

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('api.attendance.users.shift-assignments.store'),
            { shift_id: 3, effective_from: '2026-09-14' },
        );
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    });

    it('shows why the server refused an assignment', async () => {
        const reason = 'A new shift has to start after 2026-09-01, when this user’s latest shift starts.';
        vi.mocked(axios.post).mockRejectedValue({
            response: { data: { message: reason, errors: { effective_from: [reason] } } },
        });
        render(<ShiftAssignmentsPanel userId={7} />);
        await screen.findByText('Evening');

        pickShift({ id: 3, name: 'Night' });
        fireEvent.click(screen.getByRole('button', { name: 'Assign shift' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(reason);
    });
});
