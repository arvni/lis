import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RequestedSampleTypes from '@/Pages/CollectRequest/Show/RequestedSampleTypes';

// The provider panel snapshots each type as {id, server_id, name} into
// logistic_information.sample_types.
const sampleType = (id, name) => ({ id, server_id: id + 10, name });

describe('RequestedSampleTypes', () => {
    it('renders a chip per requested sample type', () => {
        render(
            <RequestedSampleTypes
                sampleTypes={[sampleType(3, 'EDTA Blood'), sampleType(4, 'Serum')]}
            />,
        );

        expect(screen.getByText('EDTA Blood')).toBeInTheDocument();
        expect(screen.getByText('Serum')).toBeInTheDocument();
    });

    it('explains the gap when the request carries no sample types', () => {
        render(<RequestedSampleTypes sampleTypes={[]} />);

        expect(screen.getByText(/did not list any sample type/i)).toBeInTheDocument();
    });

    it('falls back to the default when the prop is missing entirely', () => {
        render(<RequestedSampleTypes />);

        expect(screen.getByText(/did not list any sample type/i)).toBeInTheDocument();
    });
});
