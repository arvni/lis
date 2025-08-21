import React, {useState, useEffect} from "react";
import Grid from "@mui/material/Grid2";
import Editor from "@/Components/Editor";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import {
    Dialog,
    DialogActions,
    DialogContent,
    Stack,
    Typography,
    Box,
    Divider,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    Fade,
    Paper,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListItemText,
    Chip,
    RadioGroup,
    FormControlLabel,
    Radio
} from "@mui/material";
import Upload from "@/Components/Upload";
import {
    ThumbUpAlt,
    InfoOutlined,
    Close,
    FileDownloadOutlined,
    CloudUploadOutlined,
    EditNote,
    Description,
    PictureAsPdf,
    Visibility,
    InsertDriveFile
} from "@mui/icons-material";

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
                         processing = false
                     }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [errors, setErrors] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [clinicalDocumentMode, setClinicalDocumentMode] = useState('upload'); // 'upload' or 'select'

    const isUpdateMode = Boolean(data?.approver);
    const dialogTitle = isUpdateMode ? "Update Clinical Report" : "Approve Report";

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
        setData(prevState => ({
            ...prevState,
            clinical_comment: value
        }));
    };

    // Handle published report selection
    const handlePublishedReportChange = (event) => {
        const selectedDocumentId = event.target.value;
        const selectedDocument = documents.find(doc =>
            (doc.hash ?? doc.id) === selectedDocumentId
        );

        setData(prevState => ({
            ...prevState,
            published_report: selectedDocumentId,
            published_report_document: selectedDocument,
            // Clear clinical document if it's the same as published report
            ...(prevState.clinical_comment_document_id === selectedDocumentId && {
                clinical_comment_document_id: '',
                clinical_comment_document: null
            })
        }));
    };

    // Handle clinical document selection from existing documents
    const handleClinicalDocumentChange = (event) => {
        const selectedDocumentId = event.target.value;
        const selectedDocument = documents.find(doc =>
            (doc.hash ?? doc.id) === selectedDocumentId
        );

        setData(prevState => ({
            ...prevState,
            clinical_comment_document_id: selectedDocumentId,
            clinical_comment_document: selectedDocument,
            // Clear uploaded document and editor content when selecting existing
            clinical_comment: ''
        }));
    };

    // Handle clinical document mode change
    const handleClinicalDocumentModeChange = (event) => {
        const mode = event.target.value;
        setClinicalDocumentMode(mode);

        // Clear relevant fields when switching modes
        setData(prevState => ({
            ...prevState,
            ...(mode === 'upload' && {
                clinical_comment_document_id: '',
            }),
            ...(mode === 'select' && {
                clinical_comment_document: null,
                clinical_comment: ''
            })
        }));
    };

    // Get available documents for clinical report (excluding published report)
    const getAvailableClinicalDocuments = () => {
        return documents.filter(doc =>
            (doc.hash ?? doc.id) !== data.published_report
        );
    };

    // Get the view URL for a document
    const getDocumentViewUrl = (document) => {
        return route('documents.show', document.hash ?? document.id);
    };

    // Format document display name
    const formatDocumentName = (document) => {
        const name = document.originalName || document.file_name;
        const maxLength = 50;
        return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
    };

    // Format file size (if available)
    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const availableClinicalDocuments = getAvailableClinicalDocuments();

    return (
        <Dialog
            open={open}
            onClose={!processing ? onCancel : undefined}
            fullWidth
            maxWidth="md"
            slots={{Transition: Fade}}
            transitionDuration={300}
            slotsProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2.5,
                    bgcolor: 'background.default'
                }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {isUpdateMode ? <EditNote color="primary"/> : <ThumbUpAlt color="primary"/>}
                    <Typography variant="h6">{dialogTitle}</Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    {clinicalCommentTemplateUrl && (
                        <Tooltip title="Download Template">
                            <Button
                                size="small"
                                startIcon={<FileDownloadOutlined/>}
                                href={clinicalCommentTemplateUrl}
                                target="_blank"
                                variant="outlined"
                                color="primary"
                            >
                                Template
                            </Button>
                        </Tooltip>
                    )}

                    <Tooltip title="Close">
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={onCancel}
                            disabled={processing}
                            aria-label="close"
                            size="small"
                        >
                            <Close/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </DialogTitle>

            <Divider/>

            <DialogContent sx={{p: 3}}>
                <Alert
                    severity="info"
                    variant="outlined"
                    icon={<InfoOutlined/>}
                    sx={{mb: 3}}
                >
                    {isUpdateMode
                        ? "Update the clinical report by selecting an existing document, uploading a new PDF, or using the built-in editor."
                        : "Approve this report by selecting an existing document, uploading a clinical report document, or creating one with the editor."}
                </Alert>

                {/* Published Report Selection */}
                <Grid container spacing={3} sx={{mb: 3}}>
                    <Grid size={12}>
                        <Typography
                            variant="subtitle1"
                            gutterBottom
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <PictureAsPdf fontSize="small"/>
                            Published Report
                        </Typography>

                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="published-report-label">
                                Select Published Report
                            </InputLabel>
                            <Select
                                labelId="published-report-label"
                                id="published-report-select"
                                value={data.published_report || ''}
                                onChange={handlePublishedReportChange}
                                label="Select Published Report"
                                disabled={processing || documents.length === 0}
                                renderValue={(selected) => {
                                    const selectedDoc = documents.find(doc =>
                                        (doc.hash ?? doc.id) === selected
                                    );
                                    return selectedDoc ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PictureAsPdf fontSize="small" color="error" />
                                            <Typography variant="body2">
                                                {formatDocumentName(selectedDoc)}
                                            </Typography>
                                            <Chip
                                                label={selectedDoc.tag || 'PDF'}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>
                                    ) : '';
                                }}
                            >
                                {documents.length === 0 ? (
                                    <MenuItem disabled>
                                        <Typography color="text.secondary">
                                            No PDF documents available
                                        </Typography>
                                    </MenuItem>
                                ) : (
                                    documents.map((document) => (
                                        <MenuItem
                                            key={document.hash ?? document.id}
                                            value={document.hash ?? document.id}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                gap: 2
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                    <PictureAsPdf fontSize="small" color="error" />
                                                    <Box sx={{ flex: 1 }}>
                                                        <ListItemText
                                                            primary={formatDocumentName(document)}
                                                            secondary={
                                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {new Date(document.created_at).toLocaleDateString()}
                                                                    </Typography>
                                                                    {document.tag && (
                                                                        <Chip
                                                                            label={document.tag}
                                                                            size="small"
                                                                            color="primary"
                                                                            variant="outlined"
                                                                        />
                                                                    )}
                                                                </Box>
                                                            }
                                                        />
                                                    </Box>
                                                </Box>

                                                <Tooltip title="View PDF">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(getDocumentViewUrl(document), '_blank');
                                                        }}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="approval methods"
                        variant="fullWidth"
                    >
                        <Tab
                            icon={<InsertDriveFile fontSize="small"/>}
                            label="Select/Upload Document"
                            id="tab-0"
                            aria-controls="tabpanel-0"
                        />
                        <Tab
                            icon={<EditNote fontSize="small"/>}
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
                    sx={{mt: 2}}
                >
                    {activeTab === 0 && (
                        <Grid container spacing={3} justifyContent="center">
                            <Grid size={12}>
                                <Typography
                                    variant="subtitle1"
                                    gutterBottom
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <Description fontSize="small"/>
                                    Clinical Report Document
                                </Typography>

                                {/* Document Mode Selection */}
                                <FormControl component="fieldset" sx={{ mb: 2 }}>
                                    <RadioGroup
                                        row
                                        aria-label="clinical-document-mode"
                                        name="clinical-document-mode"
                                        value={clinicalDocumentMode}
                                        onChange={handleClinicalDocumentModeChange}
                                    >
                                        {availableClinicalDocuments.length > 0 && (
                                            <FormControlLabel
                                                value="select"
                                                control={<Radio />}
                                                label="Select Existing Document"
                                                disabled={processing}
                                            />
                                        )}
                                        <FormControlLabel
                                            value="upload"
                                            control={<Radio />}
                                            label="Upload New Document"
                                            disabled={processing}
                                        />
                                    </RadioGroup>
                                </FormControl>

                                {/* Existing Document Selection */}
                                {clinicalDocumentMode === 'select' && (
                                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                        <InputLabel id="clinical-document-label">
                                            Select Clinical Document
                                        </InputLabel>
                                        <Select
                                            labelId="clinical-document-label"
                                            id="clinical-document-select"
                                            value={data.clinical_comment_document_id || ''}
                                            onChange={handleClinicalDocumentChange}
                                            label="Select Clinical Document"
                                            disabled={processing}
                                            renderValue={(selected) => {
                                                const selectedDoc = availableClinicalDocuments.find(doc =>
                                                    (doc.hash ?? doc.id) === selected
                                                );
                                                return selectedDoc ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PictureAsPdf fontSize="small" color="error" />
                                                        <Typography variant="body2">
                                                            {formatDocumentName(selectedDoc)}
                                                        </Typography>
                                                        <Chip
                                                            label={selectedDoc.tag || 'PDF'}
                                                            size="small"
                                                            color="secondary"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                ) : '';
                                            }}
                                        >
                                            {availableClinicalDocuments.length === 0 ? (
                                                <MenuItem disabled>
                                                    <Typography color="text.secondary">
                                                        No available documents (excluding published report)
                                                    </Typography>
                                                </MenuItem>
                                            ) : (
                                                availableClinicalDocuments.map((document) => (
                                                    <MenuItem
                                                        key={document.hash ?? document.id}
                                                        value={document.hash ?? document.id}
                                                    >
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            width: '100%',
                                                            gap: 2
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                                <PictureAsPdf fontSize="small" color="error" />
                                                                <Box sx={{ flex: 1 }}>
                                                                    <ListItemText
                                                                        primary={formatDocumentName(document)}
                                                                        secondary={
                                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    {new Date(document.created_at).toLocaleDateString()}
                                                                                </Typography>
                                                                                {document.tag && (
                                                                                    <Chip
                                                                                        label={document.tag}
                                                                                        size="small"
                                                                                        color="secondary"
                                                                                        variant="outlined"
                                                                                    />
                                                                                )}
                                                                            </Box>
                                                                        }
                                                                    />
                                                                </Box>
                                                            </Box>

                                                            <Tooltip title="View PDF">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(getDocumentViewUrl(document), '_blank');
                                                                    }}
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    <Visibility fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>
                                )}

                                {/* Upload New Document */}
                                {clinicalDocumentMode === 'upload' && (
                                    <Upload
                                        label="Upload Clinical Report"
                                        value={data.clinical_comment_document}
                                        name="clinical_comment_document"
                                        editable={!processing}
                                        onChange={setData}
                                        accept={".pdf"}
                                        url={route("documents.store")}
                                        placeholder="Select or drag and drop a PDF file"
                                        icon={<CloudUploadOutlined/>}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    )}
                </Box>

                {/* Editor Tab */}
                <Box
                    role="tabpanel"
                    hidden={activeTab !== 1}
                    id="tabpanel-1"
                    aria-labelledby="tab-1"
                    sx={{mt: 2}}
                >
                    {activeTab === 1 && (
                        <Grid container spacing={3} justifyContent="center">
                            <Grid size={12}>
                                <Typography
                                    variant="subtitle1"
                                    gutterBottom
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <EditNote fontSize="small"/>
                                    Create Clinical Report
                                </Typography>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 1,
                                        minHeight: '300px',
                                        borderRadius: 1
                                    }}
                                >
                                    <Editor
                                        value={data.clinical_comment || ''}
                                        onChange={handleEditorChange}
                                        disabled={processing}
                                        placeholder="Enter clinical report content here..."
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </DialogContent>

            <Divider/>

            <DialogActions sx={{p: 2.5, justifyContent: 'space-between'}}>
                <Button
                    onClick={onCancel}
                    color="inherit"
                    disabled={processing}
                >
                    Cancel
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={processing}
                    startIcon={processing ? <CircularProgress size={20} color="inherit"/> : (isUpdateMode ?
                        <EditNote/> : <ThumbUpAlt/>)}
                >
                    {processing
                        ? (isUpdateMode ? 'Updating...' : 'Approving...')
                        : (isUpdateMode ? 'Update' : 'Approve')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApproveForm;
