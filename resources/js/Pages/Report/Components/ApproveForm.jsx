import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import {
    Dialog,
    DialogActions,
    DialogContent,
    Box,
    Divider,
    Alert,
    CircularProgress,
    Fade,
    Tabs,
    Tab,
} from '@mui/material';
import { ThumbUpAlt, InfoOutlined, EditNote, InsertDriveFile } from '@mui/icons-material';
import ApproveDialogHeader from './ApproveForm/ApproveDialogHeader';
import PublishedReportSelect from './ApproveForm/PublishedReportSelect';
import ClinicalDocumentTab from './ApproveForm/ClinicalDocumentTab';
import EditorTab from './ApproveForm/EditorTab';

/**
 * ApproveForm Component - A dialog for approving reports or updating clinical reports
 */
const ApproveForm = ({
    data,
    onSubmit,
    open,
    setData,
    onCancel,
    documents = [],
    clinicalCommentTemplateUrl,
    processing = false,
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [, setErrors] = useState({});
    const [, setHasAttemptedSubmit] = useState(false);
    const [clinicalDocumentMode, setClinicalDocumentMode] = useState('upload'); // 'upload' or 'select'

    const isUpdateMode = Boolean(data?.approver);
    const dialogTitle = isUpdateMode ? 'Update Clinical Report' : 'Approve Report';

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setErrors({});
            setHasAttemptedSubmit(false);
            setActiveTab(0);
            setClinicalDocumentMode('upload');
        }
    }, [open]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle form submission
    const handleSubmit = () => {
        setHasAttemptedSubmit(true);
        onSubmit();
    };

    // Handle form field changes
    const handleEditorChange = (value) => {
        setData((prevState) => ({
            ...prevState,
            clinical_comment: value,
        }));
    };

    // Handle published report selection
    const handlePublishedReportChange = (event) => {
        const selectedDocumentId = event.target.value;
        const selectedDocument = documents.find(
            (doc) => (doc.hash ?? doc.id) === selectedDocumentId,
        );

        setData((prevState) => ({
            ...prevState,
            published_report: selectedDocumentId,
            published_report_document: selectedDocument,
            // Clear clinical document if it's the same as published report
            ...(prevState.clinical_comment_document_id === selectedDocumentId && {
                clinical_comment_document_id: '',
                clinical_comment_document: null,
            }),
        }));
    };

    // Handle clinical document selection from existing documents
    const handleClinicalDocumentChange = (event) => {
        const selectedDocumentId = event.target.value;
        const selectedDocument = documents.find(
            (doc) => (doc.hash ?? doc.id) === selectedDocumentId,
        );

        setData((prevState) => ({
            ...prevState,
            clinical_comment_document_id: selectedDocumentId,
            clinical_comment_document: selectedDocument,
            // Clear uploaded document and editor content when selecting existing
            clinical_comment: '',
        }));
    };

    // Handle clinical document mode change
    const handleClinicalDocumentModeChange = (event) => {
        const mode = event.target.value;
        setClinicalDocumentMode(mode);

        // Clear relevant fields when switching modes
        setData((prevState) => ({
            ...prevState,
            ...(mode === 'upload' && {
                clinical_comment_document_id: '',
            }),
            ...(mode === 'select' && {
                clinical_comment_document: null,
                clinical_comment: '',
            }),
        }));
    };

    // Available documents for clinical report (excluding the published report)
    const availableClinicalDocuments = documents.filter(
        (doc) => (doc.hash ?? doc.id) !== data.published_report,
    );

    return (
        <Dialog
            open={open}
            onClose={!processing ? onCancel : undefined}
            fullWidth
            maxWidth="md"
            slots={{ Transition: Fade }}
            transitionDuration={300}
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden',
                    },
                },
            }}
        >
            <ApproveDialogHeader
                title={dialogTitle}
                isUpdateMode={isUpdateMode}
                clinicalCommentTemplateUrl={clinicalCommentTemplateUrl}
                processing={processing}
                onCancel={onCancel}
            />

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                <Alert severity="info" variant="outlined" icon={<InfoOutlined />} sx={{ mb: 3 }}>
                    {isUpdateMode
                        ? 'Update the clinical report by selecting an existing document, uploading a new PDF, or using the built-in editor.'
                        : 'Approve this report by selecting an existing document, uploading a clinical report document, or creating one with the editor.'}
                </Alert>

                {/* Published Report Selection */}
                <PublishedReportSelect
                    documents={documents}
                    value={data.published_report}
                    onChange={handlePublishedReportChange}
                    processing={processing}
                />

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="approval methods"
                        variant="fullWidth"
                    >
                        <Tab
                            icon={<InsertDriveFile fontSize="small" />}
                            label="Select/Upload Document"
                            id="tab-0"
                            aria-controls="tabpanel-0"
                        />
                        <Tab
                            icon={<EditNote fontSize="small" />}
                            label="Create Clinical Report"
                            id="tab-1"
                            aria-controls="tabpanel-1"
                        />
                    </Tabs>
                </Box>

                {/* Select/Upload Document Tab */}
                <Box
                    role="tabpanel"
                    hidden={activeTab !== 0}
                    id="tabpanel-0"
                    aria-labelledby="tab-0"
                    sx={{ mt: 2 }}
                >
                    {activeTab === 0 && (
                        <ClinicalDocumentTab
                            data={data}
                            setData={setData}
                            processing={processing}
                            availableClinicalDocuments={availableClinicalDocuments}
                            clinicalDocumentMode={clinicalDocumentMode}
                            onModeChange={handleClinicalDocumentModeChange}
                            onClinicalDocumentChange={handleClinicalDocumentChange}
                        />
                    )}
                </Box>

                {/* Editor Tab */}
                <Box
                    role="tabpanel"
                    hidden={activeTab !== 1}
                    id="tabpanel-1"
                    aria-labelledby="tab-1"
                    sx={{ mt: 2 }}
                >
                    {activeTab === 1 && (
                        <EditorTab
                            value={data.clinical_comment}
                            onChange={handleEditorChange}
                            processing={processing}
                        />
                    )}
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                <Button onClick={onCancel} color="inherit" disabled={processing}>
                    Cancel
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={processing}
                    startIcon={
                        processing ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : isUpdateMode ? (
                            <EditNote />
                        ) : (
                            <ThumbUpAlt />
                        )
                    }
                >
                    {processing
                        ? isUpdateMode
                            ? 'Updating...'
                            : 'Approving...'
                        : isUpdateMode
                          ? 'Update'
                          : 'Approve'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApproveForm;
