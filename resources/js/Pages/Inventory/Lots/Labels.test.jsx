import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePage } from '@inertiajs/react';
import Labels from '@/Pages/Inventory/Lots/Labels';

vi.mock('jsbarcode', () => ({ default: vi.fn() }));
vi.mock('@inertiajs/react', () => ({ usePage: vi.fn(), Head: () => null }));

const STORAGE_KEY = 'inventory.lotLabels.printPrefs';

const lot = {
    id: 1,
    barcode: 'LOT-BC-1',
    lot_number: 'LN-555',
    brand: 'Acme',
    expiry_date: '2027-03-01',
    store: { name: 'Main Store' },
    location: { label: 'Shelf A1' },
    quantity_base_units: '12',
    item: { name: 'Reagent X', item_code: 'RX-01' },
};

const renderPage = () => render(<Labels />);

// This jsdom setup ships a non-functional localStorage; install an in-memory one.
const installStorage = () => {
    let store = {};
    Object.defineProperty(window, 'localStorage', {
        configurable: true,
        writable: true,
        value: {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => {
                store[k] = String(v);
            },
            removeItem: (k) => {
                delete store[k];
            },
            clear: () => {
                store = {};
            },
        },
    });
};

describe('Inventory/Lots/Labels print field selection', () => {
    beforeEach(() => {
        installStorage();
        usePage.mockReturnValue({ props: { lots: [lot], reference: 'TXN-9' } });
    });

    it('renders every label field by default', () => {
        renderPage();

        expect(screen.getByText('Reagent X')).toBeInTheDocument();
        expect(screen.getByText('LN-555')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('Main Store')).toBeInTheDocument();
    });

    it('removes a field from the label when its checkbox is unticked', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Brand' }));

        expect(screen.queryByText('Acme')).not.toBeInTheDocument();
        // Other fields are unaffected.
        expect(screen.getByText('LN-555')).toBeInTheDocument();
    });

    it('persists field and font-size choices to localStorage', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Store' }));
        fireEvent.click(screen.getByRole('button', { name: 'X-Large' }));

        const prefs = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
        expect(prefs.fields.store).toBe(false);
        expect(prefs.fontSize).toBe('xl');
    });

    it('restores saved preferences on next visit', () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ fields: { brand: false }, fontSize: 'lg' }),
        );

        renderPage();

        expect(screen.queryByText('Acme')).not.toBeInTheDocument();
        // Fields without a saved override keep their default (visible).
        expect(screen.getByText('LN-555')).toBeInTheDocument();
    });
});
