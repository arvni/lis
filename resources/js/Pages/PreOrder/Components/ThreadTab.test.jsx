import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThreadTab from '@/Pages/PreOrder/Components/ThreadTab';

vi.mock('@inertiajs/react', () => ({
    useForm: () => ({
        data: { body: '', internal: false },
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    }),
}));

const preOrder = {
    notes: [
        { id: 1, body: 'Internal only', actor_name: 'Dr C', created_at: '2026-10-24T10:00:00Z' },
    ],
    history: [
        {
            type: 'comment',
            side: 'center',
            actor_name: 'Nurse',
            body: '<img src=x onerror=alert(1)>',
            created_at: '2026-10-24T10:00:00Z',
        },
        { type: 'stage', side: 'bion', body: 'not a message', created_at: '2026-10-24T10:00:00Z' },
    ],
};

describe('ThreadTab', () => {
    it('shows center text as plain text, never as markup', () => {
        const { container } = render(<ThreadTab preOrder={preOrder} />);

        expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
        expect(container.querySelector('img')).toBeNull();
        expect(screen.queryByText('not a message')).toBeNull();
    });

    it('shows internal notes only on the notes tab', () => {
        render(<ThreadTab preOrder={preOrder} internal />);

        expect(screen.getByText('Internal only')).toBeInTheDocument();
        expect(screen.getByText(/never shown to the center/)).toBeInTheDocument();
    });
});
