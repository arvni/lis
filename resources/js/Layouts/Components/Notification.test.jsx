import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import Notification from '@/Layouts/Components/Notification';

// The bell reads `notifications` + `unread_count` off the API envelope. It used
// to read those keys off a bare `{data: [...]}` resource collection, so the
// badge sat at 0 and the menu always said "No notifications yet".
const envelope = {
    notifications: [
        {
            id: 'n-1',
            type: 'Report Rejected',
            title: 'Report Rejected',
            message: 'Your report #5 was rejected',
            url: '/reports/5',
            read: false,
            time: '2 minutes ago',
        },
    ],
    unread_count: 3,
};

const mockFetch = (payload) =>
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) }));

// A fresh cache per test — SWR's cache is global and would otherwise leak the
// previous test's payload into the next render.
const renderBell = () =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <Notification />
        </SWRConfig>,
    );

describe('Notification bell', () => {
    beforeEach(() => {
        global.fetch = mockFetch(envelope);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the unread count on the badge', async () => {
        renderBell();

        expect(await screen.findByText('3')).toBeInTheDocument();
    });

    it('lists the notification title, message and time in the dropdown', async () => {
        renderBell();
        await userEvent.click(screen.getByRole('button'));

        expect(await screen.findByText('Report Rejected')).toBeInTheDocument();
        expect(screen.getByText('Your report #5 was rejected')).toBeInTheDocument();
        expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
        expect(screen.queryByText(/no notifications yet/i)).not.toBeInTheDocument();
    });

    it('falls back to the empty state when there is nothing unread', async () => {
        global.fetch = mockFetch({ notifications: [], unread_count: 0 });
        renderBell();
        await userEvent.click(screen.getByRole('button'));

        expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument();
    });
});
