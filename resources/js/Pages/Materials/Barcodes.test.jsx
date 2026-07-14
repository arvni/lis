import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

const material2 = {
    id: 2,
    barcode: 'BC-1002',
    tube_series: 'TUBE-88',
    packing_series: 'PACK-9',
    manufactured_date: '2026-02-15',
    expire_date: '2026-11-30',
    created_at: '2026-02-01',
    sample_type_name: 'Plasma',
};

const renderPage = (materials = [material]) => render(<Barcodes materials={materials} />);

// The barcode preview area (labels), excluding the selection/print control panels.
const labels = () => within(screen.getByTestId('barcode-labels'));

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

        expect(labels().getByText('BC-1001')).toBeInTheDocument();
        expect(labels().getByText('2026-12-31')).toBeInTheDocument();
        expect(labels().getByText('Serum')).toBeInTheDocument();

        // Off-by-default fields are not rendered on the label.
        expect(labels().queryByText('TUBE-77')).not.toBeInTheDocument();
        expect(labels().queryByText('PACK-9')).not.toBeInTheDocument();
    });

    it('adds an opt-in field to the label when its checkbox is ticked', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Show Tube series' }));

        expect(labels().getByText('TUBE-77')).toBeInTheDocument();
    });

    it('removes a default field from the label when unticked', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Show Barcode number' }));

        expect(labels().queryByText('BC-1001')).not.toBeInTheDocument();
    });

    it('adds the created date field after the expire date when ticked', () => {
        renderPage();

        // Off by default.
        expect(labels().queryByText('2026-01-01')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Show Created date' }));

        expect(labels().getByText('2026-01-01')).toBeInTheDocument();
    });

    it('persists field visibility and per-field font size to localStorage', () => {
        renderPage();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Show Packing series' }));
        fireEvent.click(screen.getByRole('button', { name: 'Large font for Barcode number' }));

        const prefs = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
        expect(prefs.fields.packingSeries.show).toBe(true);
        expect(prefs.fields.barcodeNumber.size).toBe('lg');
    });

    it('migrates legacy boolean + global font-size preferences', () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ fields: { barcodeNumber: false, tubeSeries: true }, fontSize: 'xl' }),
        );

        renderPage();

        // Saved overrides applied: barcode number hidden, tube series shown.
        expect(labels().queryByText('BC-1001')).not.toBeInTheDocument();
        expect(labels().getByText('TUBE-77')).toBeInTheDocument();
        // Unsaved fields keep their defaults.
        expect(labels().getByText('Serum')).toBeInTheDocument();
    });
});

describe('Materials/Barcodes per-field repeat & font size', () => {
    beforeEach(() => {
        installStorage();
        window.print = vi.fn();
    });

    it('repeats a field on N stacked lines within one label', () => {
        renderPage();

        fireEvent.change(
            screen.getByRole('spinbutton', { name: 'Repeat count for Barcode number' }),
            {
                target: { value: '3' },
            },
        );

        expect(labels().getAllByText('BC-1001')).toHaveLength(3);
    });

    it('repeats the barcode image the requested number of times', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Increase repeats for Barcode' }));

        expect(
            screen.getByTestId('barcode-labels').querySelectorAll('svg.barcode-svg'),
        ).toHaveLength(2);
    });

    it('clamps a field repeat to a minimum of one', () => {
        renderPage();

        fireEvent.change(
            screen.getByRole('spinbutton', { name: 'Repeat count for Barcode number' }),
            {
                target: { value: '0' },
            },
        );

        expect(labels().getAllByText('BC-1001')).toHaveLength(1);
    });

    it('applies per-field repeat on top of per-material copies', () => {
        renderPage();

        // 2 copies of the material, each with the barcode number on 2 lines = 4 total.
        fireEvent.click(screen.getByRole('button', { name: 'Increase copies for BC-1001' }));
        fireEvent.click(
            screen.getByRole('button', { name: 'Increase repeats for Barcode number' }),
        );

        expect(labels().getAllByText('BC-1001')).toHaveLength(4);
    });
});

describe('Materials/Barcodes selection & copies', () => {
    beforeEach(() => {
        installStorage();
        window.print = vi.fn();
    });

    it('prints every material once by default', () => {
        renderPage([material, material2]);

        expect(labels().getByText('BC-1001')).toBeInTheDocument();
        expect(labels().getByText('BC-1002')).toBeInTheDocument();
    });

    it('excludes a material from the labels when its row is unticked', () => {
        renderPage([material, material2]);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select material BC-1002' }));

        expect(labels().getByText('BC-1001')).toBeInTheDocument();
        expect(labels().queryByText('BC-1002')).not.toBeInTheDocument();
    });

    it('repeats a material once per requested copy', () => {
        renderPage();

        fireEvent.change(screen.getByRole('spinbutton', { name: 'Copies for BC-1001' }), {
            target: { value: '3' },
        });

        // Barcode number is shown by default, once per label copy.
        expect(labels().getAllByText('BC-1001')).toHaveLength(3);
    });

    it('increments copies with the stepper button', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Increase copies for BC-1001' }));

        expect(labels().getAllByText('BC-1001')).toHaveLength(2);
    });

    it('clamps copies to a minimum of one', () => {
        renderPage();

        fireEvent.change(screen.getByRole('spinbutton', { name: 'Copies for BC-1001' }), {
            target: { value: '0' },
        });

        expect(labels().getAllByText('BC-1001')).toHaveLength(1);
    });
});
