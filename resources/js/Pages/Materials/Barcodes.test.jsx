import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Barcodes from '@/Pages/Materials/Barcodes';

// jsbarcode touches the DOM/SVG; we only care about the surrounding markup.
vi.mock('jsbarcode', () => ({ default: vi.fn() }));
vi.mock('@inertiajs/react', () => ({ Head: () => null }));

const STORAGE_KEY = 'materials.barcodes.printPrefs';

const material = {
    id: 1,
    barcode: 'BC-1001',
    tube_series: 'TUBE-77',
    packing_series: 'PACK-9',
    manufactured_date: '2026-01-15',
    expire_date: '2026-12-31',
    created_at: '2026-01-01',
    sample_type_name: 'Serum',
};

const renderPage = () => render(<Barcodes materials={[material]} />);

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

describe('Materials/Barcodes print field selection', () => {
    beforeEach(() => {
        installStorage();
        // jsdom doesn't implement window.print; the page auto-prints on mount.
        window.print = vi.fn();
    });

    it('shows the current default fields and hides the opt-in ones', () => {
        renderPage();

        expect(screen.getByText('BC-1001')).toBeInTheDocument();
        expect(screen.getByText('2026-12-31')).toBeInTheDocument();
        expect(screen.getByText('Serum')).toBeInTheDocument();

        // Off-by-default fields are not rendered on the label.
        expect(screen.queryByText('TUBE-77')).not.toBeInTheDocument();
        expect(screen.queryByText('PACK-9')).not.toBeInTheDocument();
    });

    it('adds an opt-in field to the label when its checkbox is ticked', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Tube series' }));

        expect(screen.getByText('TUBE-77')).toBeInTheDocument();
    });

    it('removes a default field from the label when unticked', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Barcode number' }));

        expect(screen.queryByText('BC-1001')).not.toBeInTheDocument();
    });

    it('persists field and font-size choices to localStorage', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Packing series' }));
        fireEvent.click(screen.getByRole('button', { name: 'Large' }));

        const prefs = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
        expect(prefs.fields.packingSeries).toBe(true);
        expect(prefs.fontSize).toBe('lg');
    });

    it('restores saved preferences on next visit', () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ fields: { barcodeNumber: false, tubeSeries: true }, fontSize: 'xl' }),
        );

        renderPage();

        // Saved overrides applied: barcode number hidden, tube series shown.
        expect(screen.queryByText('BC-1001')).not.toBeInTheDocument();
        expect(screen.getByText('TUBE-77')).toBeInTheDocument();
        // Unsaved fields keep their defaults.
        expect(screen.getByText('Serum')).toBeInTheDocument();
    });
});
