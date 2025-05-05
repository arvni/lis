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
    Tab
} from "@mui/material";
import Upload from "@/Components/Upload";
import {
    ThumbUpAlt,
    InfoOutlined,
    Close,
    FileDownloadOutlined,
    CloudUploadOutlined,
    EditNote,
    Description
} from "@mui/icons-material";

/**
 * ApproveForm Component - A dialog for approving reports or updating clinical reports
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Form data
 * @param {Function} props.onSubmit - Function to handle form submission
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.setData - Function to update form data
 * @param {Function} props.onCancel - Function to handle dialog close/cancel
 * @param {string} props.clinicalCommentTemplateUrl - URL for clinical report template
 * @param {boolean} props.processing - Whether the form is processing a submission
 */
const ApproveForm = ({
                         data,
                         onSubmit,
                         open,
                         setData,
                         onCancel,
                         clinicalCommentTemplateUrl,
                         processing = false
                     }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [errors, setErrors] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    const isUpdateMode = Boolean(data?.approver);
    const dialogTitle = isUpdateMode ? "Update Clinical Report" : "Approve Report";

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setErrors({});
            setHasAttemptedSubmit(false);
            setActiveTab(0);
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

            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="approval methods"
                    variant="fullWidth"
                >
                    <Tab
                        icon={<CloudUploadOutlined fontSize="small"/>}
                        label="Upload Document"
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

            <DialogContent sx={{p: 3}}>
                <Alert
                    severity="info"
                    variant="outlined"
                    icon={<InfoOutlined/>}
                    sx={{mb: 3}}
                >
                    {isUpdateMode
                        ? "Update the clinical report by either uploading a PDF or using the built-in editor."
                        : "Approve this report by either uploading a clinical report document or creating one with the editor."}
                </Alert>

                {/* Upload Document Tab */}
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
