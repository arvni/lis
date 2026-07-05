import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/Components/ErrorBoundary';

// A child that throws on demand so we can drive the boundary into its error state.
const Boom = ({ crash }) => {
    if (crash) {
        throw new Error('kaboom');
    }
    return <div>safe child</div>;
};

describe('ErrorBoundary', () => {
    let consoleError;

    beforeEach(() => {
        // React logs the caught error to console.error; silence it for clean output.
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    it('renders children when nothing throws', () => {
        render(
            <ErrorBoundary>
                <div>hello world</div>
            </ErrorBoundary>,
        );
        expect(screen.getByText('hello world')).toBeInTheDocument();
    });

    it('shows the fallback when a child throws', () => {
        render(
            <ErrorBoundary>
                <Boom crash />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.queryByText('safe child')).not.toBeInTheDocument();
    });

    it('shows the custom title/description for the widget variant with a Try again action', () => {
        render(
            <ErrorBoundary variant="widget" title="Chart failed" description="bad data">
                <Boom crash />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Chart failed')).toBeInTheDocument();
        expect(screen.getByText('bad data')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('recovers when Try again is clicked and the child no longer throws', () => {
        const { rerender } = render(
            <ErrorBoundary variant="widget">
                <Boom crash />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

        // The underlying condition is fixed before the user retries.
        rerender(
            <ErrorBoundary variant="widget">
                <Boom crash={false} />
            </ErrorBoundary>,
        );
        fireEvent.click(screen.getByRole('button', { name: /try again/i }));

        expect(screen.getByText('safe child')).toBeInTheDocument();
    });

    it('resets automatically when a resetKey changes (e.g. navigation)', () => {
        const { rerender } = render(
            <ErrorBoundary variant="inline" resetKeys={['/a']}>
                <Boom crash />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        // Navigating swaps both the resetKey and the (now-safe) page content.
        rerender(
            <ErrorBoundary variant="inline" resetKeys={['/b']}>
                <Boom crash={false} />
            </ErrorBoundary>,
        );
        expect(screen.getByText('safe child')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
});
