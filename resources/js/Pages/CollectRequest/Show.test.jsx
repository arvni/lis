import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePage } from '@inertiajs/react';
import Show from '@/Pages/CollectRequest/Show';

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    Head: () => null,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

// The orders table only builds a route; it has nothing to do with what is asserted here.
vi.mock('@/Components/LoadMore', () => ({ default: () => null }));

const renderShow = (collectRequest) => {
    usePage.mockReturnValue({
        props: {
            collectRequest,
            sampleCollector: { name: 'Collector A', email: 'a@example.test' },
            referrer: { fullName: 'Clinic A', email: 'clinic@example.test' },
            referrerOrders: [],
        },
    });

    return render(<Show />);
};

// The API stores what the provider asked for in logistic_information; a standalone
// request has no orders, so its sample_types are the only description of the pickup.
const standalone = {
    id: 412,
    preferred_date: '2026-08-12T00:00:00.000000Z',
    note: 'Two tubes ready',
    logistic_information: {
        type: 'standalone',
        sample_types: [{ id: 3, server_id: 17, name: 'EDTA Blood' }],
    },
    created_at: '2026-08-10T10:00:00.000000Z',
    updated_at: '2026-08-10T10:00:00.000000Z',
};

const orderBased = {
    ...standalone,
    note: null,
    logistic_information: { type: 'order', sample_types: [] },
};

describe('CollectRequest/Show', () => {
    beforeEach(() => vi.clearAllMocks());

    it('flags a standalone request and lists its requested sample types', () => {
        renderShow(standalone);

        expect(screen.getByText('Standalone')).toBeInTheDocument();
        expect(screen.getByText('Requested Sample Types')).toBeInTheDocument();
        expect(screen.getByText('EDTA Blood')).toBeInTheDocument();
    });

    it('hides the standalone chip and sample types for an order-based request', () => {
        renderShow(orderBased);

        expect(screen.queryByText('Standalone')).not.toBeInTheDocument();
        expect(screen.queryByText('Requested Sample Types')).not.toBeInTheDocument();
    });

    it('shows the preferred date and the provider note', () => {
        renderShow(standalone);

        // The value sits next to its label; 'N/A' alone is ambiguous because the
        // journey cards render it too.
        expect(screen.getByText('Preferred Date').nextElementSibling).toHaveTextContent(/2026/);
        expect(screen.getByText('Provider Note')).toBeInTheDocument();
        expect(screen.getByText('Two tubes ready')).toBeInTheDocument();
    });

    it('falls back to N/A when no preferred date was sent', () => {
        renderShow({ ...standalone, preferred_date: null });

        expect(screen.getByText('Preferred Date').nextElementSibling).toHaveTextContent('N/A');
    });

    it('renders a request that has no logistic_information at all', () => {
        renderShow({ ...standalone, logistic_information: null });

        expect(screen.queryByText('Standalone')).not.toBeInTheDocument();
        expect(screen.getByText('No logistics information available')).toBeInTheDocument();
    });
});
