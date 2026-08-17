import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import PromoteToPanelDialog from '@/Pages/Acceptance/Components/TestsSection/PromoteToPanelDialog';

vi.mock('axios', () => ({
    default: { get: vi.fn() },
}));

const tests = [{ id: 11, method_test: { method_id: 7, test: { name: 'CBC' } } }];

const panelList = { data: { data: [{ id: 99, name: 'Anemia Panel', method_ids: [7, 8] }] } };

const renderDialog = (props = {}) =>
    render(
        <PromoteToPanelDialog
            open
            onClose={vi.fn()}
            onConfirm={vi.fn()}
            tests={tests}
            {...props}
        />,
    );

beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.get).mockResolvedValue(panelList);
});

describe('Acceptance/PromoteToPanelDialog', () => {
    it('renders the selected tests and keeps only the panels covering them', async () => {
        renderDialog();

        expect(await screen.findByText('1 compatible panel found. Choose one:')).toBeTruthy();
        expect(screen.getByText('CBC')).toBeTruthy();
    });

    // A failed promote comes back as a redirect with validation errors, so
    // without this the submit looked like nothing had happened at all.
    it('shows a server validation error returned by the promote request', async () => {
        renderDialog({
            serverErrors: { panel_method_tests: 'The selected panel has no tests configured.' },
        });

        await waitFor(() =>
            expect(screen.getByText('The selected panel has no tests configured.')).toBeTruthy(),
        );
    });

    it('lists every server error when more than one comes back', async () => {
        renderDialog({
            serverErrors: {
                panel_method_tests: 'The selected panel has no tests configured.',
                'acceptance_item_ids.0':
                    'One of the selected tests does not belong to this acceptance.',
            },
        });

        await waitFor(() =>
            expect(screen.getByText('The selected panel has no tests configured.')).toBeTruthy(),
        );
        expect(
            screen.getByText('One of the selected tests does not belong to this acceptance.'),
        ).toBeTruthy();
    });

    it('renders nothing extra when there are no server errors', async () => {
        renderDialog({ serverErrors: null });

        await waitFor(() => expect(vi.mocked(axios.get)).toHaveBeenCalled());
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
