import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilter from '@/Components/SearchFilter.jsx';

describe('SearchFilter', () => {
    it('renders the default label and seeds the field from defaultFilter', () => {
        render(<SearchFilter defaultFilter={{ search: 'abc' }} onFilter={vi.fn(() => vi.fn())} />);
        expect(screen.getByLabelText('Search title')).toHaveValue('abc');
    });

    it('renders a custom label', () => {
        render(
            <SearchFilter defaultFilter={{}} onFilter={vi.fn(() => vi.fn())} label="Search name" />,
        );
        expect(screen.getByLabelText('Search name')).toBeInTheDocument();
    });

    it('passes the current filter to the curried onFilter and fires it on click', () => {
        const submit = vi.fn();
        const onFilter = vi.fn(() => submit);
        render(<SearchFilter defaultFilter={{ search: '' }} onFilter={onFilter} />);

        fireEvent.change(screen.getByLabelText('Search title'), {
            target: { value: 'hemoglobin' },
        });
        expect(onFilter).toHaveBeenLastCalledWith({ search: 'hemoglobin' });

        // The accordion summary is also a <button> named "Filter" (ButtonBase)
        // — expand it first, then click the actual MuiButton in the details.
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        const submitButton = screen
            .getAllByRole('button', { name: 'Filter' })
            .find((el) => el.classList.contains('MuiButton-root'));
        fireEvent.click(submitButton);
        expect(submit).toHaveBeenCalledTimes(1);
    });
});
