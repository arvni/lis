import React, { useState, useEffect } from "react";
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
    Fade
} from "@mui/material";
import Upload from "@/Components/Upload";
import {
    Share,
    InfoOutlined,
    Close,
    FilePresentOutlined,
    CloudUploadOutlined
} from "@mui/icons-material";

/**
 * PublishForm Component - A dialog for publishing reports with document upload
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Function to handle form submission
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onCancel - Function to handle dialog close/cancel
 * @param {Object} props.data - Form data
 * @param {Function} props.setData - Function to update form data
 * @param {boolean} props.processing - Whether the form is processing a submission
 */
const PublishForm = ({ onSubmit, open, onCancel, data, setData, processing = false }) => {
    const [errors, setErrors] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    // Reset errors and attempt state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setErrors({});
            setHasAttemptedSubmit(false);
        }
    }, [open]);

    // Validate the form
    const validateForm = () => {
        const newErrors = {};

        if (!data?.published_document?.id) {
            newErrors.published_document = "A PDF document is required to publish the report";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = () => {
        setHasAttemptedSubmit(true);

        if (validateForm()) {
            onSubmit();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={!processing ? onCancel : undefined}
            fullWidth
            maxWidth="sm"
            slots={{Transition:Fade}}
            transitionDuration={300}
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2.5,
                bgcolor: 'background.default'
            }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Share color="primary" />
                    <Typography variant="h6">Publish Report</Typography>
                </Stack>

                <Tooltip title="Close">
          <span>
            <IconButton
                edge="end"
                color="inherit"
                onClick={onCancel}
                disabled={processing}
                aria-label="close"
                size="small"
            >
              <Close />
            </IconButton>
          </span>
                </Tooltip>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                <Alert
                    severity="info"
                    variant="outlined"
                    icon={<InfoOutlined />}
                    sx={{ mb: 3 }}
                >
                    Publishing this report will make it available to authorized users. You must upload a PDF version of the report to continue.
                </Alert>

                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <FilePresentOutlined fontSize="small" />
                        Report Document
                    </Typography>

                    <Upload
                        label="Upload PDF Version of Report"
                        value={data.published_document}
                        name="published_document"
                        editable={!processing}
                        onChange={setData}
                        required
                        accept={".pdf"}
                        url={route("documents.store")}
                        error={hasAttemptedSubmit && errors.published_document}
                        helperText={hasAttemptedSubmit && errors.published_document}
                        placeholder="Select or drag and drop a PDF file"
                        icon={<CloudUploadOutlined />}
                    />

                    {hasAttemptedSubmit && errors.published_document && (
                        <Typography
                            color="error"
                            variant="caption"
                            sx={{ display: 'block', mt: 1 }}
                        >
                            {errors.published_document}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
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
                    disabled={processing || (hasAttemptedSubmit && Object.keys(errors).length > 0)}
                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <Share />}
                >
                    {processing ? 'Publishing...' : 'Publish Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PublishForm;
