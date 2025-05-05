import React, { useMemo } from "react";
import {
    Box,
    Typography,
    alpha,
    useTheme,
    Paper,
    Chip,
    Tooltip,
    CircularProgress
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
    UploadFile as UploadFileIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Article as ArticleIcon,
    Assignment as AssignmentIcon,
    PictureAsPdf as PdfIcon
} from "@mui/icons-material";
import Upload from "@/Components/Upload";
import Signers from "@/Pages/Report/Components/Signers";

/**
 * Enhanced DocumentUploadSection Component with improved UX
 *
 * @param {Object} data - Form data with document information
 * @param {Function} setData - Function to update form data
 * @param {Object} errors - Form validation errors
 * @param {Function} handleFileChange - Function to handle file changes
 * @param {string|number} patientID - Patient ID for document association
 * @param {boolean} isSubmitting - Form submission status
 */
const DocumentUploadSection = ({
                                   data,
                                   setData,
                                   errors,
                                   handleFileChange,
                                   patientID,
                                   isSubmitting = false
                               }) => {
    const theme = useTheme();

    // Memoized document status indicators
    const documentStatus = useMemo(() => ({
        reported: !!data.reported_document,
        approved: !!data.approveded_document,
        published: !!data.published_document
    }), [data.reported_document, data.approveded_document, data.published_document]);

    // Document progress percentage
    const progressPercentage = useMemo(() => {
        const steps = Object.values(documentStatus).filter(Boolean).length;
        return Math.floor((steps / 3) * 100);
    }, [documentStatus]);

    // Section styling
    const getSectionStyle = (type) => {
        const baseStyle = {
            mb: 3,
            p: 3,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            overflow: 'hidden'
        };

        const statusColors = {
            active: {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: alpha(theme.palette.primary.main, 0.3),
                boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`
            },
            completed: {
                backgroundColor: alpha(theme.palette.success.main, 0.05),
                borderColor: alpha(theme.palette.success.main, 0.3),
                boxShadow: `0 0 0 1px ${alpha(theme.palette.success.main, 0.1)}`
            },
            pending: {
                backgroundColor: alpha(theme.palette.warning.main, 0.05),
                borderColor: alpha(theme.palette.warning.main, 0.3)
            },
            error: {
                backgroundColor: alpha(theme.palette.error.main, 0.05),
                borderColor: theme.palette.error.main,
                boxShadow: `0 0 0 1px ${alpha(theme.palette.error.main, 0.1)}`
            }
        };

        switch (type) {
            case 'reported':
                return {
                    ...baseStyle,
                    ...(errors.reported_document
                        ? statusColors.error
                        : documentStatus.reported
                            ? statusColors.completed
                            : statusColors.active)
                };
            case 'approved':
                return {
                    ...baseStyle,
                    ...(documentStatus.approved
                        ? statusColors.completed
                        : documentStatus.reported
                            ? statusColors.active
                            : statusColors.pending),
                    opacity: !documentStatus.reported ? 0.7 : 1,
                    pointerEvents: !documentStatus.reported ? 'none' : 'auto'
                };
            case 'published':
                return {
                    ...baseStyle,
                    ...(documentStatus.published
                        ? statusColors.completed
                        : documentStatus.approved
                            ? statusColors.active
                            : statusColors.pending),
                    opacity: !documentStatus.approved ? 0.7 : 1,
                    pointerEvents: !documentStatus.approved ? 'none' : 'auto'
                };
            case 'supporting':
                return {
                    ...baseStyle,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.04)
                };
            case 'signers':
                return {
                    ...baseStyle,
                    backgroundColor: 'background.paper',
                    border: errors.signers
                        ? `1px solid ${theme.palette.error.main}`
                        : `1px solid ${theme.palette.divider}`
                };
            default:
                return baseStyle;
        }
    };

    // Document section status indicator
    const StatusIndicator = ({ type }) => {
        let icon = <PendingIcon fontSize="small" />;
        let color = "warning";
        let label = "Pending";

        switch (type) {
            case 'reported':
                if (documentStatus.reported) {
                    icon = <CheckCircleIcon fontSize="small" />;
                    color = "success";
                    label = "Uploaded";
                } else {
                    icon = <UploadFileIcon fontSize="small" />;
                    color = "primary";
                    label = "Required";
                }
                break;
            case 'approved':
                if (documentStatus.approved) {
                    icon = <CheckCircleIcon fontSize="small" />;
                    color = "success";
                    label = "Approved";
                } else if (documentStatus.reported) {
                    icon = <UploadFileIcon fontSize="small" />;
                    color = "primary";
                    label = "Ready for Approval";
                }
                break;
            case 'published':
                if (documentStatus.published) {
                    icon = <CheckCircleIcon fontSize="small" />;
                    color = "success";
                    label = "Published";
                } else if (documentStatus.approved) {
                    icon = <UploadFileIcon fontSize="small" />;
                    color = "primary";
                    label = "Ready to Publish";
                }
                break;
            default:
                break;
        }

        return (
            <Chip
                icon={icon}
                label={label}
                color={color}
                size="small"
                sx={{ position: 'absolute', top: 10, right: 10 }}
            />
        );
    };

    // Document Icons
    const getDocumentIcon = (type) => {
        switch (type) {
            case 'reported':
                return <ArticleIcon color={documentStatus.reported ? "success" : "primary"} />;
            case 'approved':
                return <AssignmentIcon color={documentStatus.approved ? "success" : "primary"} />;
            case 'published':
                return <PdfIcon color={documentStatus.published ? "success" : "primary"} />;
            default:
                return <UploadFileIcon />;
        }
    };

    // Helper text generator
    const getHelperText = (type) => {
        switch (type) {
            case 'reported':
                return "Upload the initial document report (Word format)";
            case 'approved':
                return documentStatus.reported
                    ? "Upload the approved document with reviewer changes"
                    : "First upload the reported document";
            case 'published':
                return documentStatus.approved
                    ? "Upload the final published document (PDF format)"
                    : "Document needs approval before publishing";
            default:
                return "";
        }
    };

    // Document upload components
    const renderDocumentUpload = (type, label, acceptTypes) => {
        const disabled = (type === 'approved' && !documentStatus.reported) ||
            (type === 'published' && !documentStatus.approved);

        // Key for accessing data and errors
        const dataKey = type === 'reported' ? 'reported_document' :
            type === 'approved' ? 'approveded_document' : 'published_document';

        // Show only if value exists or is the next step
        const shouldShow = data[dataKey] ||
            (type === 'reported') ||
            (type === 'approved' && documentStatus.reported) ||
            (type === 'published' && documentStatus.approved);

        if (!shouldShow) return null;

        return (
            <Box sx={getSectionStyle(type)}>
                <StatusIndicator type={type} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getDocumentIcon(type)}
                    <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 500 }}>
                        {label}
                    </Typography>
                </Box>

                <Upload
                    label={label}
                    value={data[dataKey]}
                    name={dataKey}
                    editable
                    onChange={setData}
                    required={type === 'reported'}
                    accept={acceptTypes}
                    url={route("documents.store")}
                    helperText={getHelperText(type)}
                    disabled={disabled || isSubmitting}
                />

                {errors[dataKey] && (
                    <Typography
                        color="error"
                        variant="caption"
                        sx={{mt: 1, display: 'block'}}
                    >
                        {errors[dataKey]}
                    </Typography>
                )}
            </Box>
        );
    };

    // Progress indicator for document workflow
    const DocumentProgressIndicator = () => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 1 }}>
            <Box sx={{ flex: 1, mr: 1 }}>
                <Box
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: `${progressPercentage}%`,
                            bgcolor: progressPercentage === 100
                                ? theme.palette.success.main
                                : theme.palette.primary.main,
                            transition: 'width 0.5s ease-in-out'
                        }}
                    />
                </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
                {progressPercentage}% Complete
            </Typography>
        </Box>
    );

    return (
        <>
            {/* Document Upload Progress */}
            <Grid size={{xs: 12}}>
                <DocumentProgressIndicator />
            </Grid>

            {/* Main Document Uploads */}
            <Grid size={{xs: 12}}>
                <Paper
                    elevation={1}
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        mb: 3
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight="500"
                        gutterBottom
                        color="primary"
                        sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 3}}
                    >
                        <UploadFileIcon />
                        Document Workflow
                        {isSubmitting && (
                            <CircularProgress size={16} sx={{ ml: 1 }} />
                        )}
                    </Typography>

                    {/* Document uploads in sequential order */}
                    {renderDocumentUpload(
                        'reported',
                        'Reported Document',
                        ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )}

                    {renderDocumentUpload(
                        'approved',
                        'Approved Document',
                        ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )}

                    {renderDocumentUpload(
                        'published',
                        'Published Document',
                        ".pdf"
                    )}
                </Paper>
            </Grid>

            {/* Supporting Materials Section */}
            <Grid size={{xs: 12}}>
                <Box sx={getSectionStyle('supporting')}>
                    <Typography
                        variant="subtitle1"
                        fontWeight="500"
                        gutterBottom
                        color="secondary"
                        sx={{display: 'flex', alignItems: 'center', gap: 1}}
                    >
                        <InfoIcon fontSize="small"/>
                        Supporting Materials
                    </Typography>

                    <Tooltip title="Upload any additional files to support this report">
                        <Box sx={{mt: 2}}>
                            <Upload
                                label="Related Documents"
                                url={route("documents.store", {
                                    ownerClass: "patient",
                                    ownerId: patientID,
                                    tag: "related"
                                })}
                                onChange={handleFileChange}
                                multiple
                                value={data.files}
                                helperText="Upload any supporting files related to this report (optional)"
                                disabled={isSubmitting}
                            />
                        </Box>
                    </Tooltip>
                </Box>
            </Grid>

            {/* Signers Section */}
            {data?.signers && data?.id && (
                <Grid size={{xs: 12}}>
                    <Box sx={getSectionStyle('signers')}>
                        <Signers
                            signers={data?.signers}
                            editable={!isSubmitting}
                            onChange={setData}
                            error={errors.signers}
                            errorMessage={errors.signers}
                        />
                    </Box>
                </Grid>
            )}
        </>
    );
};

export default DocumentUploadSection;
