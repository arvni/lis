import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardsContainer } from '@/Pages/Test/Components/CardsContainer';

// SampleTypeCard reads `sampleType.description`, `sampleType.SampleType.name` and
// `sampleType.sampleType.name`, so a renderable card needs all three.
const makeCard = (id) => ({
    id,
    text: `Card ${id}`,
    description: `Description ${id}`,
    SampleType: { name: `Type ${id}` },
    sampleType: { name: `Type ${id}` },
});

describe('CardsContainer', () => {
    it('renders a card per sample type (regression: forwards the `sampleType` prop the child reads)', () => {
        render(
            <CardsContainer
                sampleTypes={[makeCard(1), makeCard(2)]}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
            />,
        );
        // `description` is read from the forwarded sampleType prop; before the fix the
        // card was passed `section={card}` and this threw on `sampleType.description`.
        expect(screen.getByText('Description 1')).toBeInTheDocument();
        expect(screen.getByText('Description 2')).toBeInTheDocument();
    });

    it('renders nothing when there are no sample types', () => {
        const { container } = render(
            <CardsContainer sampleTypes={[]} onEdit={vi.fn()} onDelete={vi.fn()} />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('calls onEdit with the card id when its edit button is clicked', () => {
        const onEdit = vi.fn();
        render(<CardsContainer sampleTypes={[makeCard(7)]} onEdit={onEdit} onDelete={vi.fn()} />);
        // Edit is the first action button on the card.
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(onEdit).toHaveBeenCalledWith(7);
    });
});
