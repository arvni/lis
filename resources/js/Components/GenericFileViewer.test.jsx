import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenericFileViewer from '@/Components/GenericFileViewer';

describe('GenericFileViewer', () => {
    const renderViewer = (props = {}) =>
        render(
            <GenericFileViewer
                fileUrl="/files/report.pdf"
                fileType="pdf"
                fileName="report.pdf"
                fileSize={2048}
                onDownload={() => {}}
                {...props}
            />,
        );

    it('shows the file name, type chip and formatted size', () => {
        renderViewer();
        expect(screen.getByText('report.pdf')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('2 KB')).toBeInTheDocument();
    });

    it('calls onDownload when the Download button is clicked', async () => {
        const onDownload = vi.fn();
        renderViewer({ onDownload });
        await userEvent.click(screen.getByRole('button', { name: /download file/i }));
        expect(onDownload).toHaveBeenCalledTimes(1);
    });
});
