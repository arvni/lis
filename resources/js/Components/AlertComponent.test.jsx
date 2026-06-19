import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useSnackbar } from 'notistack';
import AlertComponent from '@/Components/AlertComponent';

vi.mock('notistack', () => ({ useSnackbar: vi.fn() }));

describe('AlertComponent', () => {
    let enqueueSnackbar;
    beforeEach(() => {
        enqueueSnackbar = vi.fn();
        useSnackbar.mockReturnValue({ enqueueSnackbar });
    });

    it('shows a success snackbar when success and status are set', () => {
        render(<AlertComponent success={true} status="Saved successfully" />);
        expect(enqueueSnackbar).toHaveBeenCalledWith('Saved successfully', { variant: 'success' });
    });

    it('shows an error snackbar when success is false but status is set', () => {
        render(<AlertComponent success={false} status="Something failed" />);
        expect(enqueueSnackbar).toHaveBeenCalledWith('Something failed', { variant: 'error' });
    });

    it('shows a warning snackbar per field error (array or string)', () => {
        render(<AlertComponent errors={{ name: ['Name is required'], email: 'Invalid email' }} />);
        expect(enqueueSnackbar).toHaveBeenCalledWith('Name is required', { variant: 'warning' });
        expect(enqueueSnackbar).toHaveBeenCalledWith('Invalid email', { variant: 'warning' });
    });

    it('does nothing when there is no status and no errors', () => {
        render(<AlertComponent />);
        expect(enqueueSnackbar).not.toHaveBeenCalled();
    });
});
