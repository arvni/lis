import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import Show from '@/Pages/Acceptance/Show';
import TestItemsSection from '@/Pages/Acceptance/Show/TestItemsSection';

vi.mock('@inertiajs/react', () => ({
    router: { put: vi.fn() },
    Head: () => null,
}));

vi.mock('notistack', () => ({ useSnackbar: vi.fn() }));

// Capture the handlers the section receives; the rest of the page is noise here.
vi.mock('@/Pages/Acceptance/Show/TestItemsSection', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Pages/Patient/Components/PatientInfo', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Components/Prescription', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Components/Payment', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: () => null }));
vi.mock('@/Components/InlineTagManager', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Show/StatusChip', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Show/PriorityChanger', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Show/SummaryCards', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Show/QuickActions', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Show/ReportSamplingSection', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Show/DoctorInfoSection', () => ({ default: () => null }));

const acceptance = {
    id: 5,
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    acceptance_items: { tests: [], panels: [] },
    howReport: {},
};

const panel = { acceptanceItems: [{ id: 42 }] };

let enqueueSnackbar;

const renderShow = () => {
    render(
        <Show
            acceptance={acceptance}
            patient={{ id: 1 }}
            acceptanceItems={[]}
            invoice={null}
            canEdit
            status={null}
        />,
    );

    return TestItemsSection.mock.calls[0][0];
};

beforeEach(() => {
    vi.clearAllMocks();
    enqueueSnackbar = vi.fn();
    vi.mocked(useSnackbar).mockReturnValue({ enqueueSnackbar });
});

describe('Acceptance/Show eject panel', () => {
    it('sends an empty body so the options are not read as request data', () => {
        renderShow().onEjectPanel(panel);

        const [, data, options] = vi.mocked(router.put).mock.calls[0];
        expect(data).toEqual({});
        expect(options.only).toEqual(['acceptance']);
    });

    // Eject has no dialog, so a rejected request used to vanish entirely.
    it('surfaces a rejected eject in the snackbar', () => {
        renderShow().onEjectPanel(panel);

        const { onError } = vi.mocked(router.put).mock.calls[0][2];
        onError({ message: 'This acceptance item is not part of a panel.' });

        expect(enqueueSnackbar).toHaveBeenCalledWith(
            'This acceptance item is not part of a panel.',
            { variant: 'error' },
        );
    });

    it('reports every error when the response carries more than one', () => {
        renderShow().onEjectPanel(panel);

        const { onError } = vi.mocked(router.put).mock.calls[0][2];
        onError({ message: 'first problem', other: ['second problem'] });

        expect(enqueueSnackbar).toHaveBeenCalledTimes(2);
        expect(enqueueSnackbar).toHaveBeenCalledWith('second problem', { variant: 'error' });
    });

    it('does nothing when the panel has no items to eject', () => {
        renderShow().onEjectPanel({ acceptanceItems: [] });

        expect(router.put).not.toHaveBeenCalled();
    });
});
