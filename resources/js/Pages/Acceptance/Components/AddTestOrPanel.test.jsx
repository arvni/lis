import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';
import AddTestOrPanel from './AddTestOrPanel.jsx';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

const testItem = {
    id: 41,
    price: 100,
    discount: 0,
    customParameters: { sampleType: '', discounts: [] },
    method_test: {
        id: 3,
        test: { id: 9, name: 'Karyotype', type: 'TEST', method_tests: [] },
        method: { id: 4, name: 'Manual', price_type: 'Fix', no_patient: 1, no_sample: 1 },
    },
};

const panelItem = {
    id: 'panel-uuid',
    panel: { id: 12, name: 'Lipid Panel', price_type: 'Fix' },
    acceptanceItems: [],
    price: 100,
    discount: 0,
};

const renderDialog = (props = {}) =>
    render(<AddTestOrPanel open onClose={vi.fn()} onSubmitTest={vi.fn()} {...props} />);

beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [] } });
});

describe('Acceptance/AddTestOrPanel', () => {
    it('lets an edited test be pointed at another test', () => {
        renderDialog({ initialTestData: testItem });

        expect(screen.getByText('Edit Test')).toBeTruthy();
        expect(screen.getByText('Change Test')).toBeTruthy();
    });

    it('keeps the type fixed while editing, so a test can only become another test', () => {
        renderDialog({ initialTestData: testItem });

        fireEvent.click(screen.getByText('Change Test'));

        expect(screen.getByText('Which one should this item point at?')).toBeTruthy();
        expect(screen.getByLabelText(/Select Test/)).toBeTruthy();
        // Clicking another type card is inert while editing.
        fireEvent.click(screen.getByText('Panel'));
        expect(screen.getByLabelText(/Select Test/)).toBeTruthy();
    });

    it('does not offer to swap the panel of an edited panel', () => {
        renderDialog({ initialPanelData: panelItem, onSubmitPanel: vi.fn() });

        expect(screen.getByText('Edit Panel')).toBeTruthy();
        expect(screen.queryByText('Change Panel')).toBeNull();
        expect(screen.queryByText('Change Test')).toBeNull();
    });
});
