import { LinearProgress, Stack, Typography, Tooltip, Card, Box, IconButton,
    Menu, MenuItem, Select, FormControl } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import LabelIcon from "@mui/icons-material/Label";
import React, { useState } from "react";

/**
 * Component to display an uploaded file with actions
 *
 * @param {Object} props - Component properties
 * @param {Object} props.value - File information object
 * @param {string} props.status - Current status ('pending', 'uploading', 'success', 'error', 'deleting')
 * @param {number} props.progress - Upload progress percentage
 * @param {string} props.error - Error message if any
 * @param {Function} props.onDelete - Delete handler function
 * @param {Function} props.onCancel - Cancel upload handler function
 * @param {Function} props.onTagChange - Handler for changing the tag
 * @param {Array} props.availableTags - Available tags for selection
 * @param {boolean} props.editable - Whether the file can be deleted or edited
 * @param {boolean} props.showFileSize - Whether to show the file size
 * @returns {JSX.Element}
 */
const UploadItem = ({
                        value,
                        status = 'success',
                        progress = 0,
                        error,
                        onDelete,
                        onCancel,
                        onTagChange,
                        availableTags = [],
                        editable = true,
                        showFileSize = false
                    }) => {
    // Format file size to human-readable format
    const formatFileSize = (bytes) => {
        if (!bytes) return "";

        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Determine file icon based on file type
    const getFileIcon = () => {
        if (!value?.originalName) return <InsertDriveFileIcon />;

        const extension = value.originalName.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
            return <ImageIcon color="primary" />;
        } else if (extension === 'pdf') {
            return <PictureAsPdfIcon color="error" />;
        } else if (['doc', 'docx'].includes(extension)) {
            return <DescriptionIcon color="primary" />;
        } else {
            return <InsertDriveFileIcon color="action" />;
        }
    };

    // Pending state (waiting for tag selection)
    if (status === 'pending') {
        return (
            <Card
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    width: "100%",
                    borderColor: "divider",
                    borderRadius: 1,
                    borderStyle: "dashed"
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {value?.originalName ? `Waiting to upload ${value.originalName}...` : "Waiting to upload..."}
                        </Typography>
                    </Box>
                    {onCancel && (
                        <Tooltip title="Cancel">
                            <IconButton
                                size="small"
                                color="default"
                                onClick={onCancel}
                                aria-label="Cancel file"
                            >
                                <CancelIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Card>
        );
    }

    // Uploading state with progress bar
    if (status === 'uploading') {
        return (
            <Card
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    width: "100%",
                    borderColor: "divider",
                    borderRadius: 1
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {value?.originalName ? `Uploading ${value.originalName}...` : "Uploading..."}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={progress ?? 0}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#e0e0e0"
                            }}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45, textAlign: "right" }}>
                        {Math.floor(progress)}%
                    </Typography>
                    {onCancel && (
                        <Tooltip title="Cancel upload">
                            <IconButton
                                size="small"
                                color="default"
                                onClick={onCancel}
                                aria-label="Cancel upload"
                            >
                                <CancelIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Card>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <Card
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    width: "100%",
                    borderColor: "error.main",
                    borderRadius: 1,
                    bgcolor: "error.light",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" gutterBottom fontWeight="medium">
                            {value?.originalName || "File"} - Upload failed
                        </Typography>
                        <Typography variant="caption" color="error.dark">
                            {error || "An error occurred during upload"}
                        </Typography>
                    </Box>
                    <Tooltip title="Remove">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={onDelete}
                            aria-label="Remove failed file"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Card>
        );
    }

    // Deleting state
    if (status === 'deleting') {
        return (
            <Card
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    width: "100%",
                    borderColor: "divider",
                    borderRadius: 1,
                    opacity: 0.6,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Deleting {value?.originalName || "file"}...
                        </Typography>
                        <LinearProgress />
                    </Box>
                </Stack>
            </Card>
        );
    }

    // Success state (default) - Regular display of uploaded file with actions
    if (value?.id || value?.hasOwnProperty("id") || status === 'success') {
        // State for tag editing
        const [isEditingTag, setIsEditingTag] = useState(false);
        const [selectedTag, setSelectedTag] = useState(value?.tag || "TEMP");

        // Handle tag selection
        const handleTagSelect = (event) => {
            const newTag = event.target.value;
            setSelectedTag(newTag);
            // Call the onTagChange callback if provided
            if (onTagChange) {
                onTagChange(newTag);
                setIsEditingTag(false);
            }
        };

        return (
            <Card
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    width: "100%",
                    borderColor: status === 'updating' ? "primary.light" : "divider",
                    borderRadius: 1,
                    transition: "all 0.2s",
                    "&:hover": {
                        boxShadow: 1,
                        borderColor: "primary.main"
                    }
                }}
            >
                <Stack
                    direction="row"
                    spacing={2}
                    width="100%"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ overflow: "hidden" }}>
                        {getFileIcon()}
                        <Box sx={{ overflow: "hidden" }}>
                            <Tooltip title={value?.originalName || "File"} placement="top">
                                <Typography
                                    noWrap
                                    variant="body1"
                                    sx={{
                                        maxWidth: { xs: 120, sm: 200, md: 300 },
                                        fontWeight: 500
                                    }}
                                >
                                    {value?.originalName || "File"}
                                </Typography>
                            </Tooltip>

                            <Stack direction="row" alignItems="center" spacing={1}>
                                {showFileSize && value?.size && (
                                    <Typography variant="caption" color="text.secondary">
                                        {formatFileSize(value.size)}
                                    </Typography>
                                )}

                                {/* Display tag if available - either as editable or text */}
                                {isEditingTag && onTagChange && availableTags.length > 0 ? (
                                    <FormControl size="small" sx={{ minWidth: 100, maxWidth: 150 }}>
                                        <Select
                                            value={selectedTag}
                                            onChange={handleTagSelect}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                            displayEmpty
                                        >
                                            {availableTags.map((tag, index) => (
                                                <MenuItem key={index} value={tag.value}>
                                                    {tag.label}
                                                </MenuItem>
                                            ))}
                                            <MenuItem value="TEMP">TEMP</MenuItem>
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <LabelIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                        <Typography variant="caption" color="primary">
                                            {value?.tag || "TEMP"}
                                        </Typography>
                                        {editable && onTagChange && availableTags.length > 0 && (
                                            <Tooltip title="Edit tag">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setIsEditingTag(true)}
                                                    sx={{ p: 0, ml: 0.5 }}
                                                >
                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                )}
                            </Stack>

                            {/* Show updating status if needed */}
                            {status === 'updating' && (
                                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                                    Updating tag...
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        {value?.id && (
                            <Tooltip title="View file">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    href={value?.id ? route("documents.show", value?.id) : null}
                                    target="_blank"
                                    aria-label="View file"
                                >
                                    <VisibilityIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {editable && onDelete && !isEditingTag && (
                            <Tooltip title="Delete file">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={onDelete}
                                    aria-label="Delete file"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>
            </Card>
        );
    }

    return null;
};

export default UploadItem;
