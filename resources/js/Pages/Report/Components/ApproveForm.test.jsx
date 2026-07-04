import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApproveForm from '@/Pages/Report/Components/ApproveForm';
import PublishedReportSelect from '@/Pages/Report/Components/ApproveForm/PublishedReportSelect';
import ClinicalDocumentTab from '@/Pages/Report/Components/ApproveForm/ClinicalDocumentTab';

// Stub the child fields (heavy MUI selects + rich-text editor + uploader). We drive the
// dialog's own buttons for real and capture the field callbacks to assert the setData updaters.
vi.mock('@/Pages/Report/Components/ApproveForm/PublishedReportSelect', () => ({
    default: vi.fn(() => null),
}));
vi.mock('@/Pages/Report/Components/ApproveForm/ClinicalDocumentTab', () => ({
    default: vi.fn(() => null),
}));
vi.mock('@/Pages/Report/Components/ApproveForm/EditorTab', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Pages/Report/Components/ApproveForm/ApproveDialogHeader', () => ({
    default: ({ title }) => <div>{title}</div>,
}));

const documents = [
    { id: 'doc1', name: 'Report A' },
    { id: 'doc2', name: 'Report B' },
];

const renderForm = (props = {}) =>
    render(
        <ApproveForm
            open
            data={{ published_report: '', clinical_comment: '' }}
            documents={documents}
            setData={vi.fn()}
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
            {...props}
        />,
    );

describe('Report/ApproveForm — approve dialog interactions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows the approve affordances and submits when Approve is clicked', async () => {
        const onSubmit = vi.fn();
        renderForm({ onSubmit });
        expect(screen.getByText('Approve Report')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /^approve$/i }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('switches to update-mode labels when the report already has an approver', () => {
        renderForm({ data: { approver: { id: 1 }, published_report: '' } });
        expect(screen.getByText('Update Clinical Report')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument();
    });

    it('cancels via the Cancel button', async () => {
        const onCancel = vi.fn();
        renderForm({ onCancel });
        await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('disables the actions and shows a busy label while processing', () => {
        renderForm({ processing: true });
        expect(screen.getByRole('button', { name: /approving/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('clears a clinical document that matches the newly-selected published report', () => {
        const setData = vi.fn();
        renderForm({ setData });
        const { onChange } = PublishedReportSelect.mock.calls.at(-1)[0];
        act(() => onChange({ target: { value: 'doc1' } }));

        const updater = setData.mock.calls.at(-1)[0];
        expect(updater).toBeTypeOf('function');
        // When the previously-selected clinical document IS the one now chosen as the
        // published report, it must be cleared to avoid publishing the same file twice.
        expect(updater({ clinical_comment_document_id: 'doc1' })).toMatchObject({
            published_report: 'doc1',
            published_report_document: { id: 'doc1', name: 'Report A' },
            clinical_comment_document_id: '',
            clinical_comment_document: null,
        });
        // An unrelated clinical document is left untouched.
        expect(updater({ clinical_comment_document_id: 'doc2' })).toMatchObject({
            published_report: 'doc1',
            clinical_comment_document_id: 'doc2',
        });
    });

    it('drops editor content when an existing clinical document is selected', () => {
        const setData = vi.fn();
        renderForm({ setData });
        const { onClinicalDocumentChange } = ClinicalDocumentTab.mock.calls.at(-1)[0];
        act(() => onClinicalDocumentChange({ target: { value: 'doc2' } }));

        const updater = setData.mock.calls.at(-1)[0];
        expect(updater({ clinical_comment: 'typed text' })).toMatchObject({
            clinical_comment_document_id: 'doc2',
            clinical_comment_document: { id: 'doc2', name: 'Report B' },
            clinical_comment: '',
        });
    });
});
