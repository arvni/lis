import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardsContainer } from '@/Pages/Test/Components/CardsContainer';

const sampleTypes = [
    { id: 7, SampleType: { name: 'Blood' }, sampleType: { name: 'Blood' }, description: 'd' },
];

describe('CardsContainer', () => {
    it('renders a card per sampleType and wires edit to onEdit(id)', async () => {
        const onEdit = vi.fn();
        render(<CardsContainer sampleTypes={sampleTypes} onEdit={onEdit} onDelete={vi.fn()} />);
        expect(screen.getByText('Blood')).toBeInTheDocument();
        await userEvent.click(screen.getAllByRole('button')[0]); // edit
        expect(onEdit).toHaveBeenCalledWith(7);
    });

    it('uses the latest onEdit after a re-render (no stale closure)', async () => {
        const onEdit1 = vi.fn();
        const onEdit2 = vi.fn();
        const { rerender } = render(
            <CardsContainer sampleTypes={sampleTypes} onEdit={onEdit1} onDelete={vi.fn()} />,
        );
        rerender(<CardsContainer sampleTypes={sampleTypes} onEdit={onEdit2} onDelete={vi.fn()} />);
        await userEvent.click(screen.getAllByRole('button')[0]); // edit
        expect(onEdit2).toHaveBeenCalledWith(7);
        expect(onEdit1).not.toHaveBeenCalled();
    });
});
