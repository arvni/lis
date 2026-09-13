import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Filter from '@/Pages/TatAlertRule/Components/Filter';

// TableLayout hands filters a curried callback: onFilter(filters) returns the reload.
const setup = (defaultValues) => {
    const reload = vi.fn();
    const onFilter = vi.fn(() => reload);
    render(<Filter defaultValues={defaultValues} onFilter={onFilter} />);

    return { onFilter, reload };
};

describe('TatAlertRule Filter', () => {
    it('prefills the current filters and applies edits', () => {
        const { onFilter, reload } = setup({ search: 'cult', active: '1' });
        const search = screen.getByLabelText('Search');

        expect(search).toHaveValue('cult');
        fireEvent.change(search, { target: { value: 'culture' } });
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        expect(onFilter).toHaveBeenCalledWith({ search: 'culture', active: '1' });
        expect(reload).toHaveBeenCalled();
    });

    it('clears every filter on reset', () => {
        const { onFilter, reload } = setup({ search: 'cult', active: '0' });

        fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

        expect(onFilter).toHaveBeenCalledWith({ search: '', active: '' });
        expect(reload).toHaveBeenCalled();
        expect(screen.getByLabelText('Search')).toHaveValue('');
    });
});
