import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import Index from '@/Pages/Acceptance/Index';
import { buildColumns } from '@/Pages/Acceptance/Index/columns';

vi.mock('@inertiajs/react', () => ({
    useForm: vi.fn(),
    usePage: () => ({
        props: {
            acceptances: { data: [], meta: {} },
            requestInputs: {},
            canUpdate: true,
            canDelete: true,
            canCancel: true,
            canEditInvoiced: true,
        },
    }),
    router: { visit: vi.fn() },
    Head: () => null,
    Link: () => null,
}));

vi.mock('notistack', () => ({ useSnackbar: vi.fn() }));

// The grid, the layout and the dialogs are noise here; only the delete handler
// this page hands to DeleteForm matters.
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Layouts/TableLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Components/Filter', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Components/AddPoolingDialog.jsx', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Index/CancelDialog', () => ({ default: () => null }));

const DeleteForm = vi.fn(() => null);
vi.mock('@/Components/DeleteForm', () => ({ default: (props) => DeleteForm(props) }));

let post;
let reset;
let enqueueSnackbar;

const renderIndex = () => {
    render(<Index />);

    return DeleteForm.mock.calls.at(-1)[0];
};

beforeEach(() => {
    vi.clearAllMocks();
    post = vi.fn();
    reset = vi.fn();
    enqueueSnackbar = vi.fn();
    vi.mocked(useForm).mockReturnValue({
        post,
        setData: vi.fn(),
        data: { id: 7 },
        reset,
        processing: false,
    });
    vi.mocked(useSnackbar).mockReturnValue({ enqueueSnackbar });
});

describe('Acceptance/Index delete', () => {
    // A refused delete used to leave the dialog open with no explanation.
    it('closes the dialog and reports a refused delete in the snackbar', () => {
        const { agreeCB } = renderIndex();
        agreeCB();

        const { onError } = post.mock.calls[0][1];
        onError({ message: 'This acceptance is reported and can no longer be deleted.' });

        expect(enqueueSnackbar).toHaveBeenCalledWith(
            'This acceptance is reported and can no longer be deleted.',
            { variant: 'error' },
        );
        // handleCloseDeleteForm resets the form as it closes the dialog.
        expect(reset).toHaveBeenCalled();
    });

    it('reports every error when the response carries more than one', () => {
        renderIndex().agreeCB();

        const { onError } = post.mock.calls[0][1];
        onError({ message: 'first problem', other: ['second problem'] });

        expect(enqueueSnackbar).toHaveBeenCalledTimes(2);
        expect(enqueueSnackbar).toHaveBeenCalledWith('second problem', { variant: 'error' });
    });
});

describe('Acceptance/Index delete action visibility', () => {
    const actionsColumn = () =>
        buildColumns({
            canUpdate: true,
            canDelete: true,
            canCancel: true,
            canEditInvoiced: true,
            edit: () => () => {},
            deleteAcceptance: () => () => {},
            cancelAcceptance: () => () => {},
            onAddPooling: () => {},
        }).find((column) => column.field === 'id');

    const labels = (status) =>
        actionsColumn()
            .getActions({ row: { id: 1, status } })
            .map((action) => action.props.label);

    it.each(['pending', 'processing', 'Canceled'])('offers delete for %s', (status) => {
        expect(labels(status)).toContain('Delete');
    });

    // The server refuses these outright, so the action was only ever an error.
    it.each(['waiting for payment', 'sampling', 'reported'])('hides delete for %s', (status) => {
        expect(labels(status)).not.toContain('Delete');
    });
});
