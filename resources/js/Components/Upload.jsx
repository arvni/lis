import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from "react";
import {
    Alert,
    Box,
    Chip,
    FormControl,
    FormGroup,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";

// Assuming UploadItem and DeleteForm exist and are adapted
import UploadItem from "./UploadItem";
import DeleteForm from "./DeleteForm";

// --- Styled Components ---
const UploadBox = styled(Box)(({ theme, isDragOver, error }) => ({
    border: `2px dashed ${
        error ? theme.palette.error.main : isDragOver ? theme.palette.primary.main : theme.palette.divider
    }`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: "120px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    backgroundColor: isDragOver ? `${theme.palette.primary.light}20` : "transparent",
    outline: "none", // Remove default outline
    "&:hover": {
        backgroundColor: `${theme.palette.primary.light}10`,
        borderColor: theme.palette.primary.main,
    },
    "&:focus-visible": {
        // Style for keyboard focus
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
}));

const FileTypeInfo = styled(Typography)(({ theme }) => ({
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
}));

// --- Helper Functions ---
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const formatFileTypes = (accept) => {
    return accept
        .split(",")
        .map((type) => type.trim())
        .map((type) => {
            if (type === "image/*") return "Images";
            if (type.includes("pdf")) return "PDF";
            if (type.includes("doc") || type.includes("word")) return "Word";
            if (type.startsWith(".")) return type.substring(1).toUpperCase();
            if (type.includes("/")) return type.split("/")[1]; // Basic MIME type part
            return type;
        })
        .filter((value, index, self) => self.indexOf(value) === index) // Unique types
        .join(", ");
};

// --- Sub-Components ---

// Tag Selection Dialog Component
const TagSelector = memo(({ files, tags, onConfirm, onCancel }) => {
    const [selectedTag, setSelectedTag] = useState(tags[0]?.value || "TEMP");

    return (
        <Box
            sx={{
                border: "1px solid",
                borderColor: "divider",
                p: 2,
                mb: 2,
                borderRadius: 1,
                bgcolor: "background.paper",
                boxShadow: 1,
            }}
        >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Select a tag for {files.length} file{files.length !== 1 ? "s" : ""}:
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
                <Select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    displayEmpty
                    size="small"
                >
                    {tags.map((tag) => (
                        <MenuItem key={tag.value} value={tag.value}>
                            {tag.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Chip label="Cancel" onClick={onCancel} color="default" variant="outlined" />
                <Chip
                    label="Confirm"
                    onClick={() => onConfirm(selectedTag)}
                    color="primary"
                />
            </Box>
        </Box>
    );
});

TagSelector.displayName = "TagSelector";

// File Error Alert Component
const FileErrorAlert = memo(({ errors, generalError, externalHelperText, onClear }) => {
    if (!errors.length && !generalError && !externalHelperText) return null;

    return (
        <Alert
            severity="error"
            sx={{ mt: 1 }}
            onClose={onClear}
        >
            {externalHelperText && <p>{externalHelperText}</p>}
            {generalError && <p>{generalError}</p>}
            {errors.length > 0 && (
                <ul>
                    {errors.map((err, i) => (
                        <li key={i}>{err.message}</li>
                    ))}
                </ul>
            )}
        </Alert>
    );
});

FileErrorAlert.displayName = "FileErrorAlert";

/**
 * Enhanced file upload component with tag selection
 */
const Upload = ({
                    url,
                    label,
                    name,
                    value: parentValue,
                    error: externalError,
                    helperText: externalHelperText,
                    onChange,
                    accept = "application/*",
                    multiple = false,
                    editable = true,
                    required = false,
                    maxFileSize = 20, // Default 20MB
                    maxFiles = 20, // Default max 20 files
                    tags = [], // Tag selection
                }) => {
    const inputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [managedFiles, setManagedFiles] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [generalError, setGeneralError] = useState("");
    const [fileToDelete, setFileToDelete] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [filesForTagging, setFilesForTagging] = useState([]);
    const [showTagSelector, setShowTagSelector] = useState(false);

    // --- Memoized Values ---
    const acceptedFileTypes = useMemo(() => formatFileTypes(accept), [accept]);
    const maxSizeBytes = useMemo(() => maxFileSize * 1024 * 1024, [maxFileSize]);

    const currentFileCount = useMemo(() =>
            managedFiles.filter(f => f.status === 'success' || f.status === 'uploading').length,
        [managedFiles]);

    const canUploadMore = useMemo(() =>
            editable && (multiple ? currentFileCount < maxFiles : currentFileCount === 0),
        [editable, multiple, currentFileCount, maxFiles]);

    const displayError = useMemo(() =>
            externalError || validationErrors.length > 0 || !!generalError,
        [externalError, validationErrors, generalError]);


    const remainingSlots = useMemo(() =>
            multiple ? Math.max(0, maxFiles - currentFileCount) : (currentFileCount === 0 ? 1 : 0),
        [multiple, maxFiles, currentFileCount]);

    // Create a cancelation token source map for better management
    const cancelTokenMap = useRef(new Map());

    // --- Sync with Parent Value ---
    useEffect(() => {
        // Convert parent value to array format for consistent handling
        const parentFilesArray = parentValue ? (multiple ? parentValue : [parentValue]).filter(Boolean) : [];

        setManagedFiles((currentFiles) => {
            // Map parent data to our internal format
            const parentMappedFiles = parentFilesArray.map((serverData) => {
                // Try to find existing file in state
                const existing = currentFiles.find(
                    (f) => f.serverData?.id === serverData?.id
                );

                if (existing && existing.status !== 'idle' && existing.status !== 'deleting') {
                    return { ...existing, serverData, status: 'success' };
                }

                // Create new entry
                return {
                    tempId: serverData?.id || generateTempId(),
                    serverData,
                    status: 'success',
                    progress: 100,
                };
            });

            // Keep files that are currently uploading or failed
            const uploadingOrFailedFiles = currentFiles.filter(
                (f) =>
                    (f.status === 'uploading' || f.status === 'error') &&
                    !parentFilesArray.some((pf) => pf?.id === f.serverData?.id)
            );

            // Combine and return without duplicates
            const combined = [...parentMappedFiles, ...uploadingOrFailedFiles];
            return combined.filter(
                (file, index, self) => index === self.findIndex((f) => f.tempId === file.tempId)
            );
        });
    }, [parentValue, multiple]);

    // --- File Validation ---
    const validateFile = useCallback((file) => {
        const errors = [];

        // Check file size
        if (file.size > maxSizeBytes) {
            errors.push(`File "${file.name}" is too large (max ${maxFileSize}MB).`);
        }

        // Check file type
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const acceptList = accept.split(',').map(a => a.trim().toLowerCase());

        const isAccepted = acceptList.some(type => {
            if (type.startsWith('.')) {
                return fileExtension === type;
            }
            if (type.endsWith('/*')) {
                return fileType.startsWith(type.slice(0, -1));
            }
            return fileType === type;
        });

        if (!isAccepted) {
            errors.push(`File type for "${file.name}" is not accepted (allowed: ${acceptedFileTypes}).`);
        }

        return errors.length > 0 ? { filename: file.name, messages: errors } : null;
    }, [accept, acceptedFileTypes, maxSizeBytes, maxFileSize]);

    // --- File State Management ---
    const updateFileState = useCallback((tempId, updates) => {
        setManagedFiles(current =>
            current.map(f => f.tempId === tempId ? {...f, ...updates} : f)
        );
    }, []);

    // --- Notify Parent of Changes ---
    const notifyParentOfChange = useCallback((results = []) => {
        const successfulFiles = managedFiles
            .filter(f => f.status === 'success' && f.serverData)
            .map(f => f.serverData);

        const allSuccessFiles = results.length > 0
            ? [...successfulFiles, ...results]
            : successfulFiles;

        onChange(name, multiple ? allSuccessFiles : allSuccessFiles[0] || null);
    }, [managedFiles, multiple, name, onChange]);

    // --- Upload Logic ---
    const performSingleUpload = useCallback(async (file, tempId, tag) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tag", tag || "TEMP");

        // Create and store cancelation token
        const cancelSource = axios.CancelToken.source();
        cancelTokenMap.current.set(tempId, cancelSource);

        updateFileState(tempId, { status: 'uploading', progress: 0 });

        try {
            const response = await axios.post(url, formData, {
                cancelToken: cancelSource.token,
                onUploadProgress: (e) => {
                    if (e.total) {
                        const percentCompleted = Math.round((e.loaded * 100) / e.total);
                        updateFileState(tempId, { progress: percentCompleted });
                    }
                },
            });

            // Update state with success data
            updateFileState(tempId, {
                status: 'success',
                progress: 100,
                serverData: response.data.data,
                file: undefined, // Remove blob to save memory
                error: undefined
            });

            return response.data.data;
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Upload canceled:', file.name);
                setManagedFiles(current => current.filter(f => f.tempId !== tempId));
                return null;
            } else {
                console.error("Upload error:", error);
                const errorMsg = error.response?.data?.message || error.message || "Upload failed";
                updateFileState(tempId, {
                    status: 'error',
                    progress: 0,
                    error: errorMsg,
                });
                setGeneralError("An upload failed. Please check individual files.");
                throw error;
            }
        } finally {
            // Always clean up the cancel token
            cancelTokenMap.current.delete(tempId);
        }
    }, [url, updateFileState]);

    // Handle multiple uploads efficiently
    const performMultipleUploads = useCallback(async (filesToUpload, tag) => {
        if (filesToUpload.length === 0) return;

        try {
            // Create an array of upload promises
            const uploadPromises = filesToUpload.map(fileObj =>
                performSingleUpload(fileObj.file, fileObj.tempId, tag)
            );

            // Wait for all uploads to complete
            const results = await Promise.all(uploadPromises);

            // Filter out any null results (from canceled uploads)
            const successfulUploads = results.filter(Boolean);

            // Only notify parent once after all uploads are done
            if (successfulUploads.length > 0) {
                notifyParentOfChange(successfulUploads);
            }
        } catch (error) {
            // Individual file errors are already handled in performSingleUpload
            console.error("One or more uploads failed:", error);
        }
    }, [performSingleUpload, notifyParentOfChange]);

    // --- Event Handlers ---
    const stopDefaults = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
    }, []);

    // Process files before upload (with tag selection if needed)
    const processFilesForUpload = useCallback((validatedFiles) => {
        // If tags are available, show tag selector
        if (tags && tags.length > 0) {
            setFilesForTagging(validatedFiles);
            setShowTagSelector(true);
        } else {
            // No tags, use default "TEMP" tag
            performMultipleUploads(validatedFiles, "TEMP");
        }
    }, [tags, performMultipleUploads]);

    // Handle new files (from drop or input)
    const handleFiles = useCallback((files) => {
        setValidationErrors([]);
        setGeneralError("");

        const filesToProcess = Array.from(files);
        let currentValidCount = managedFiles.filter(
            f => f.status === 'success' || f.status === 'uploading'
        ).length;

        let newValidationErrors = [];
        let filesToUpload = [];

        // Process each file
        filesToProcess.forEach(file => {
            // Skip if we already have a file in single mode
            if (!multiple && currentValidCount >= 1) return;

            // Skip if max files reached in multiple mode
            if (multiple && currentValidCount >= maxFiles) {
                newValidationErrors.push({
                    filename: file.name,
                    message: `Cannot add more files (limit is ${maxFiles}).`
                });
                return;
            }

            // Validate the file
            const validationResult = validateFile(file);
            if (validationResult) {
                validationResult.messages.forEach(msg =>
                    newValidationErrors.push({
                        filename: validationResult.filename,
                        message: msg
                    })
                );
            } else {
                // File is valid, prepare for upload
                const tempId = generateTempId();
                filesToUpload.push({
                    tempId,
                    file,
                    status: 'pending',
                    progress: 0,
                });
                currentValidCount++;
            }
        });

        // Update validation errors if any
        if (newValidationErrors.length > 0) {
            setValidationErrors(newValidationErrors);
        }

        // Process valid files
        if (filesToUpload.length > 0) {
            setManagedFiles(current => [...current, ...filesToUpload]);
            processFilesForUpload(filesToUpload);
        }
    }, [managedFiles, multiple, maxFiles, validateFile, processFilesForUpload]);

    // Tag selector handlers
    const handleTagConfirm = useCallback((selectedTag) => {
        if (filesForTagging.length > 0) {
            performMultipleUploads(filesForTagging, selectedTag);
            setFilesForTagging([]);
            setShowTagSelector(false);
        }
    }, [filesForTagging, performMultipleUploads]);

    const handleTagCancel = useCallback(() => {
        // Remove pending files
        setManagedFiles(current =>
            current.filter(f => !filesForTagging.some(pendingFile => pendingFile.tempId === f.tempId))
        );
        setFilesForTagging([]);
        setShowTagSelector(false);
    }, [filesForTagging]);

    // Handle tag change for existing file
    const handleTagChange = useCallback(async (tempId, newTag) => {
        const fileToUpdate = managedFiles.find(f => f.tempId === tempId);
        if (!fileToUpdate || !fileToUpdate.serverData) return;

        updateFileState(tempId, { status: 'updating' });

        try {
            // Call API to update the tag
            const response = await axios.patch(`${url}/${fileToUpdate.serverData.id}`, {
                tag: newTag
            });

            const newFiles = managedFiles.map(f =>
                f.tempId === tempId
                    ? {
                        ...f,
                        status: 'success',
                        serverData: {
                            ...fileToUpdate.serverData,
                            tag: newTag
                        }
                    }
                    : f
            );

            // Update state and notify parent
            setManagedFiles(newFiles);
            onChange(name, multiple ? newFiles.map(item => item.serverData) : newFiles[0]?.serverData || null);
        } catch (error) {
            console.error("Tag update error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to update tag";
            updateFileState(tempId, {
                status: 'success',
                error: errorMsg
            });
            setGeneralError(errorMsg);
        }
    }, [managedFiles, url, updateFileState, onChange, name, multiple]);

    // Drag and drop event handlers
    const dragEvents = useMemo(() => ({
        onDragEnter: (e) => {
            stopDefaults(e);
            if (!editable) return;
            setIsDragOver(true);
        },
        onDragLeave: (e) => {
            stopDefaults(e);
            if (!editable) return;
            if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
                setIsDragOver(false);
            } else if (!e.relatedTarget) {
                setIsDragOver(false);
            }
        },
        onDragOver: (e) => {
            stopDefaults(e);
            if (!editable) return;
            setIsDragOver(true);
        },
        onDrop: (e) => {
            stopDefaults(e);
            if (!editable) return;
            setIsDragOver(false);
            if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
            }
        },
    }), [editable, stopDefaults, handleFiles]);

    // Input change handler
    const handleInputChange = useCallback((e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
        // Reset input value for reuse
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }, [handleFiles]);

    // Trigger file input click
    const handleTriggerInput = useCallback(() => {
        if (editable && inputRef.current) {
            setValidationErrors([]);
            setGeneralError("");
            inputRef.current.click();
        }
    }, [editable]);

    // Cancel an in-progress upload
    const handleCancelUpload = useCallback((tempId) => {
        const cancelSource = cancelTokenMap.current.get(tempId);
        if (cancelSource) {
            cancelSource.cancel("Upload canceled by user.");
            cancelTokenMap.current.delete(tempId);
        }
    }, []);

    // Handle file deletion
    const openDeleteDialog = useCallback((file) => {
        if (!editable) return;
        setFileToDelete(file);
        setOpenDeleteForm(true);
        setGeneralError("");
    }, [editable]);

    const closeDeleteForm = useCallback(() => {
        setFileToDelete(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDeleteFile = useCallback(async () => {
        if (!fileToDelete) return;

        const { tempId, serverData } = fileToDelete;
        updateFileState(tempId, { status: 'deleting' });
        closeDeleteForm();

        try {
            await axios.post(route("documents.destroy", serverData.id), { _method: "delete" });

            // Remove from state on success
            const newFiles = managedFiles.filter(f => f.tempId !== tempId);
            setManagedFiles(newFiles);

            // Notify parent of change
            onChange(name, multiple ? newFiles.map(item => item.serverData) : newFiles[0]?.serverData || null);
        } catch (error) {
            console.error("Delete error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to delete file";
            updateFileState(tempId, { status: 'success', error: errorMsg });
            setGeneralError(errorMsg);
        } finally {
            setFileToDelete(null);
        }
    }, [fileToDelete, managedFiles, closeDeleteForm, updateFileState, onChange, name, multiple]);

    // Clear all validation errors
    const clearErrors = useCallback(() => {
        setValidationErrors([]);
        setGeneralError("");
    }, []);

    // --- Cleanup Effect ---
    useEffect(() => {
        // Clean up any pending cancel tokens on unmount
        return () => {
            cancelTokenMap.current.forEach(source => {
                source.cancel('Component unmounted');
            });
            cancelTokenMap.current.clear();
        };
    }, []);

    return (
        <>
            <FormGroup sx={{ width: "100%", mb: 1 }}>
                {label && (
                    <InputLabel
                        required={required}
                        error={displayError}
                        sx={{ mb: 1, fontWeight: 'bold' }}
                    >
                        {label}
                    </InputLabel>
                )}

                {/* Display Existing & Uploading Files */}
                {managedFiles.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        {managedFiles.map((fileState) => (
                            <UploadItem
                                key={fileState.tempId}
                                value={fileState.serverData || {
                                    originalName: fileState.file?.name,
                                    size: fileState.file?.size
                                }}
                                file={fileState.file}
                                status={fileState.status}
                                progress={fileState.progress}
                                error={fileState.error}
                                editable={editable && fileState.status !== 'uploading' && fileState.status !== 'deleting'}
                                onDelete={() =>
                                    fileState.status === 'success' && fileState.serverData ?
                                        openDeleteDialog(fileState) : null
                                }
                                onCancel={fileState.status === 'uploading' ?
                                    () => handleCancelUpload(fileState.tempId) : undefined
                                }
                                showFileSize
                                onTagChange={editable && fileState.status === 'success' && fileState.serverData ?
                                    (newTag) => handleTagChange(fileState.tempId, newTag) : undefined
                                }
                                availableTags={tags}
                            />
                        ))}
                    </Box>
                )}

                {/* Tag Selection Dialog */}
                {showTagSelector && (
                    <TagSelector
                        files={filesForTagging}
                        tags={tags}
                        onConfirm={handleTagConfirm}
                        onCancel={handleTagCancel}
                    />
                )}

                {/* Upload Box / Drop Zone */}
                {canUploadMore && editable && (
                    <UploadBox
                        {...dragEvents}
                        onClick={handleTriggerInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleTriggerInput();
                        }}
                        isDragOver={isDragOver}
                        error={displayError}
                        tabIndex={0}
                        aria-label={label || "File Upload Area"}
                        aria-describedby="upload-helper-text"
                        role="button"
                    >
                        <CloudUploadIcon
                            sx={{
                                fontSize: 40,
                                mb: 1,
                                color: isDragOver ? "primary.main" : "text.secondary"
                            }}
                        />
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            {isDragOver ? "Drop files here" : "Drag files or click to upload"}
                        </Typography>
                        <FileTypeInfo id="upload-helper-text">
                            {multiple ? `Up to ${remainingSlots} more file${remainingSlots !== 1 ? 's' : ''}.` : 'Select one file.'}
                            {` Max ${maxFileSize}MB each. Allowed: ${acceptedFileTypes || 'any'}.`}
                        </FileTypeInfo>
                    </UploadBox>
                )}

                {/* Hidden file input */}
                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    multiple={multiple}
                    onChange={handleInputChange}
                    accept={accept}
                    aria-hidden="true"
                />

                {/* Display Errors */}
                <FileErrorAlert
                    errors={validationErrors}
                    generalError={generalError}
                    externalHelperText={externalHelperText}
                    onClear={clearErrors}
                />

                {/* Show file count / limit */}
                {multiple && label && (
                    <Chip
                        label={`${currentFileCount}/${maxFiles} files`}
                        size="small"
                        sx={{ position: 'absolute', top: 0, right: 0, mt: -0.5, mr: 1 }}
                        color={currentFileCount >= maxFiles ? "error" : "default"}
                        variant={currentFileCount >= maxFiles ? "filled" : "outlined"}
                        aria-live="polite"
                    />
                )}
            </FormGroup>

            {/* Delete Confirmation */}
            {editable && (
                <DeleteForm
                    title={`Delete "${fileToDelete?.serverData?.originalName || fileToDelete?.file?.name || 'file'}"?`}
                    message="Are you sure you want to delete this file? This action cannot be undone."
                    openDelete={openDeleteForm}
                    disAgreeCB={closeDeleteForm}
                    agreeCB={handleDeleteFile}
                />
            )}
        </>
    );
};

export default Upload;
