import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import Deleted from '@/Pages/Acceptance/Deleted';
import TableLayout from '@/Layouts/TableLayout';

const props = {
    acceptances: { data: [], total: 0, current_page: 1 },
    requestInputs: {},
    status: null,
    success: false,
};

vi.mock('@inertiajs/react', () => ({
    router: { put: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
    Link: () => null,
}));

vi.mock('notistack', () => ({ useSnackbar: vi.fn() }));

// Capture the columns the grid receives; the rest of the page is chrome.
vi.mock('@/Layouts/TableLayout', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: () => null }));

let enqueueSnackbar;

const restoreAction = () => {
    render(<Deleted />);

    const { columns } = vi.mocked(TableLayout).mock.calls.at(-1)[0];
    const actions = columns.find((column) => column.field === 'id');

    return actions.getActions({ row: { id: 12 } })[0];
};

beforeEach(() => {
    vi.clearAllMocks();
    enqueueSnackbar = vi.fn();
    vi.mocked(useSnackbar).mockReturnValue({ enqueueSnackbar });
});

describe('Acceptance/Deleted restore', () => {
    it('sends an empty body so the options are not read as request data', () => {
        restoreAction().props.onClick();

        const [, data] = vi.mocked(router.put).mock.calls[0];
        expect(data).toEqual({});
    });

    // The row leaves this list on success, so a failure has nowhere else to show.
    it('surfaces a refused restore in the snackbar', () => {
        restoreAction().props.onClick();

        const { onError } = vi.mocked(router.put).mock.calls[0][2];
        onError({ message: 'This acceptance is not deleted, so there is nothing to restore.' });

        expect(enqueueSnackbar).toHaveBeenCalledWith(
            'This acceptance is not deleted, so there is nothing to restore.',
            { variant: 'error' },
        );
    });

    it('reports every error when the response carries more than one', () => {
        restoreAction().props.onClick();

        const { onError } = vi.mocked(router.put).mock.calls[0][2];
        onError({ message: 'first problem', other: ['second problem'] });

        expect(enqueueSnackbar).toHaveBeenCalledTimes(2);
    });
});
