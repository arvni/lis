import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import axios from 'axios';
import { router } from '@inertiajs/react';
import Notification from '@/Layouts/Components/Notification';

// Clicking a notification hands off to `router.visit`; the real router has no
// page context under jsdom and throws asynchronously.
vi.mock('@inertiajs/react', () => ({ router: { visit: vi.fn() } }));

// The write calls used to go out through bare `fetch` with an
// `X-CSRF-TOKEN` read off a `<meta name="csrf-token">` tag that the Inertia
// layout never renders — every POST came back 419 "Page Expired". They must
// go through axios, which sends the XSRF-TOKEN cookie back as a header.
vi.mock('axios', () => ({
    default: { post: vi.fn(() => Promise.resolve({ status: 204 })) },
}));

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

    it('marks all as read through axios so the CSRF cookie is sent', async () => {
        renderBell();
        await userEvent.click(screen.getByRole('button'));
        await userEvent.click(await screen.findByRole('button', { name: /mark all as read/i }));

        expect(axios.post).toHaveBeenCalledWith(route('api.notifications.markAllAsRead'));
    });

    it('marks a single notification as read through axios with an ids array', async () => {
        renderBell();
        await userEvent.click(screen.getByRole('button'));
        await userEvent.click(await screen.findByText('Report Rejected'));

        expect(axios.post).toHaveBeenCalledWith(route('api.notifications.markAsRead'), {
            ids: ['n-1'],
        });
        expect(router.visit).toHaveBeenCalledWith('/reports/5');
    });

    it('falls back to the empty state when there is nothing unread', async () => {
        global.fetch = mockFetch({ notifications: [], unread_count: 0 });
        renderBell();
        await userEvent.click(screen.getByRole('button'));

        expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument();
    });
});
