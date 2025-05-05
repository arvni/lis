import React, {useState, useCallback, useRef, useEffect} from "react";
import {
    Alert,
    FormGroup,
    InputLabel,
    Typography,
    Chip,
    Box,
    Select,
    MenuItem,
    FormControl,
} from "@mui/material";
import {styled} from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";

// Assuming UploadItem and DeleteForm exist and are adapted
// to potentially receive file objects with status/progress/error info.
import UploadItem from "@/Components/UploadItem"; // Assuming this component can handle the file state object
import DeleteForm from "@/Components/DeleteForm";
import {router} from "@inertiajs/react";

// --- Styled Components (Keep as before, minor tweak for focus) ---
const UploadBox = styled(Box)(({theme, isDragOver, error}) => ({
    border: `2px dashed ${error ? theme.palette.error.main : isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: 'center',
    minHeight: "120px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    backgroundColor: isDragOver ? `${theme.palette.primary.light}20` : "transparent",
    outline: 'none', // Remove default outline
    "&:hover": {
        backgroundColor: `${theme.palette.primary.light}10`,
        borderColor: theme.palette.primary.main
    },
    "&:focus-visible": { // Style for keyboard focus
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    }
}));

const FileTypeInfo = styled(Typography)(({theme}) => ({
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1)
}));

// --- Helper Function ---
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// --- Main Component ---

/**
 * Enhanced file upload component with tag selection
 *
 * @param {Object} props - Component properties
 * @param {string} props.url - URL to upload files to
 * @param {string} props.label - Label for the upload field
 * @param {string} props.name - Field name for parent form state management
 * @param {Array|Object} props.value - Current file value(s) from parent (expected to be final server data structure)
 * @param {boolean} props.error - External error state (e.g., from form validation)
 * @param {string} props.helperText - External helper text / error message
 * @param {Function} props.onChange - Callback: onChange(name, newValue) - newValue is Array or Object matching `value` structure
 * @param {string} [props.accept] - Accepted file types
 * @param {boolean} [props.multiple=false] - Whether multiple files can be uploaded
 * @param {boolean} [props.editable=true] - Whether the component is editable (allows upload/delete)
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {number} [props.maxFileSize=10] - Maximum file size in MB
 * @param {number} [props.maxFiles=5] - Maximum number of files when multiple is true
 * @param {Array} [props.tags=[]] - Array of available tags to select from before upload
 */
const Upload = ({
                    url,
                    label,
                    name,
                    value: parentValue, // Rename to avoid conflict with internal state
                    error: externalError,
                    helperText: externalHelperText,
                    onChange,
                    accept = "application/*",
                    multiple = false,
                    editable = true,
                    required = false,
                    maxFileSize = 20, // Default 20MB
                    maxFiles = 20, // Default max 20 files
                    tags = []  // New prop for tag selection
                }) => {

    const inputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    // Internal state to manage all files (from parent + newly added/uploading)
    // Each item: { tempId: string, file?: File, serverData?: any, status: 'idle' | 'validating' | 'uploading' | 'success' | 'error' | 'deleting', progress: number, error?: string, cancelSource?: CancelTokenSource }
    const [managedFiles, setManagedFiles] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]); // Array of { filename: string, message: string }
    const [generalError, setGeneralError] = useState(""); // For general component errors
    const [fileToDelete, setFileToDelete] = useState(null); // { tempId: string, serverData: any }
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    // State for tag selection
    const [selectedTag, setSelectedTag] = useState("");
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [filesForTagging, setFilesForTagging] = useState([]); // Files waiting for tag selection

    // Set default tag on component mount
    useEffect(() => {
        // If tags array is empty or null, set default tag to TEMP
        setSelectedTag(tags && tags.length > 0 ? tags[0] : "TEMP");
    }, [tags]);

    // Sync internal state with parentValue on initial load and external changes
    useEffect(() => {
        setManagedFiles(currentFiles => {
            const parentFilesArray = parentValue ? (multiple ? parentValue : [parentValue]) : [];
            const newManagedFiles = parentFilesArray.map(serverData => {
                // Try to find if this file already exists in state (e.g., was just uploaded)
                const existing = currentFiles.find(f => f.serverData?.id === serverData?.id); // Assuming server data has an ID
                if (existing && existing.status !== 'idle' && existing.status !== 'deleting') {
                    return {...existing, serverData, status: 'success'}; // Update serverData if needed, ensure status is success
                }
                // Otherwise, create a new entry from parent value
                return {
                    tempId: serverData?.id || generateTempId(), // Use server ID if available
                    serverData: serverData,
                    status: 'success', // Assume parent value represents successfully uploaded files
                    progress: 100,
                };
            });

            // Keep files that are currently uploading or failed, which aren't in parentValue yet
            const uploadingOrFailedFiles = currentFiles.filter(f =>
                (f.status === 'uploading' || f.status === 'error') &&
                !parentFilesArray.some(pf => pf?.id === f.serverData?.id) // Ensure it's not also in parent value
            );

            // Combine and filter out duplicates if any edge cases occurred
            const combined = [...newManagedFiles, ...uploadingOrFailedFiles];
            const uniqueCombined = combined.filter((file, index, self) =>
                index === self.findIndex((f) => f.tempId === file.tempId)
            );
            return uniqueCombined;
        });
    }, [parentValue, multiple]);


    // --- Derived State ---
    const currentFileCount = managedFiles.filter(f => f.status === 'success' || f.status === 'uploading').length;
    const canUploadMore = editable && (multiple ? currentFileCount < maxFiles : currentFileCount === 0);
    const displayError = externalError || validationErrors.length > 0 || !!generalError;
    const displayHelperText = externalHelperText || generalError || (validationErrors.length > 0 ? `${validationErrors.length} validation error(s).` : "");

    // --- File Type / Size Info ---
    const acceptedFileTypes = accept
        .split(',')
        .map(type => type.trim())
        .map(type => {
            if (type === "image/*") return "Images";
            if (type.includes("pdf")) return "PDF";
            if (type.includes("doc") || type.includes("word")) return "Word";
            if (type.startsWith('.')) return type.substring(1).toUpperCase();
            if (type.includes('/')) return type.split('/')[1]; // Basic MIME type part
            return type;
        })
        .filter((value, index, self) => self.indexOf(value) === index) // Unique types
        .join(", ");

    const maxSizeBytes = maxFileSize * 1024 * 1024;

    // --- Validation ---
    const validateFile = (file) => {
        const errors = [];
        // Check file size
        if (file.size > maxSizeBytes) {
            errors.push(`File "${file.name}" is too large (max ${maxFileSize}MB).`);
        }

        // Check file type (improved logic)
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const acceptList = accept.split(',').map(a => a.trim().toLowerCase());

        const isAccepted = acceptList.some(type => {
            if (type.startsWith('.')) { // Match by extension
                return fileExtension === type;
            }
            if (type.endsWith('/*')) { // Match by MIME type prefix (e.g., "image/*")
                return fileType.startsWith(type.slice(0, -1));
            }
            return fileType === type; // Match by exact MIME type
        });

        if (!isAccepted) {
            errors.push(`File type for "${file.name}" is not accepted (allowed: ${acceptedFileTypes}).`);
        }

        return errors.length > 0 ? {filename: file.name, messages: errors} : null;
    };

    // --- State Update Helper ---
    const updateFileState = (tempId, updates) => {
        setManagedFiles(current => current.map(f => f.tempId === tempId ? {...f, ...updates} : f));
    };

    // Handle tag change for an existing file
    const handleTagChange = useCallback(async (tempId, newTag) => {
        const fileToUpdate = managedFiles.find(f => f.tempId === tempId);
        if (!fileToUpdate || !fileToUpdate.serverData) return;

        updateFileState(tempId, {status: 'updating'});

        try {
            // Assuming there's an API endpoint to update a file's tag
            const response = await axios.patch(`${url}/${fileToUpdate.serverData.id}`, {
                tag: newTag
            });

            // Update the file state with the new tag
            updateFileState(tempId, {
                status: 'success',
                serverData: {
                    ...fileToUpdate.serverData,
                    tag: newTag
                }
            });

            // Notify parent of the change
            setManagedFiles(current => {
                const successfulFiles = current
                    .filter(f => f.status === 'success' && f.serverData)
                    .map(f => f.serverData);
                onChange(name, multiple ? successfulFiles : successfulFiles[0] || null);
                return current;
            });

        } catch (error) {
            console.error("Tag update error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to update tag";
            updateFileState(tempId, {
                status: 'success', // Revert to success state
                error: errorMsg
            });
            setGeneralError(errorMsg);
        }
    }, [managedFiles, url, onChange, name, multiple]);

    // --- Upload Logic ---
    const performUpload = useCallback(async (file, tempId, tag) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tag", tag || "TEMP"); // Use selected tag or default to TEMP

        const cancelSource = axios.CancelToken.source();
        updateFileState(tempId, {status: 'uploading', progress: 0, cancelSource});

        try {
            const response = await axios.post(url, formData, {
                cancelToken: cancelSource.token,
                onUploadProgress: (e) => {
                    if (e.total) {
                        const percentCompleted = Math.round((e.loaded * 100) / e.total);
                        updateFileState(tempId, {progress: percentCompleted});
                    }
                },
            });

            updateFileState(tempId, {
                status: 'success',
                progress: 100,
                serverData: response.data.data, // Adjust based on your API response
                file: undefined, // Remove blob after successful upload to save memory
                cancelSource: undefined,
                error: undefined
            });

            // Notify parent AFTER successful upload
            setManagedFiles(current => {
                const successfulFiles = current
                    .filter(f => f.status === 'success' && f.serverData)
                    .map(f => f.serverData);
                onChange(name, multiple ? successfulFiles : successfulFiles[0] || null);
                return current; // Return current state for setManagedFiles
            });

        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Upload canceled:', file.name);
                setManagedFiles(current => current.filter(f => f.tempId !== tempId)); // Remove from internal state
                // Also update parent state if this cancel affects it
                setManagedFiles(current => {
                    const successfulFiles = current
                        .filter(f => f.status === 'success' && f.serverData)
                        .map(f => f.serverData);
                    onChange(name, multiple ? successfulFiles : successfulFiles[0] || null);
                    return current;
                });

            } else {
                console.error("Upload error:", error);
                const errorMsg = error.response?.data?.message || error.message || "Upload failed";
                updateFileState(tempId, {
                    status: 'error',
                    progress: 0,
                    error: errorMsg,
                    cancelSource: undefined
                });
                setGeneralError("An upload failed. Please check individual files.");
            }
        }
    }, [url, name, multiple, onChange]);

    // --- Event Handlers ---
    const stopDefaults = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
    }, []);

    const processFilesForUpload = (validatedFiles) => {
        // If there are tags to select from, show tag selector
        if (tags && tags.length > 0) {
            setFilesForTagging(validatedFiles);
            setShowTagSelector(true);
        } else {
            // No tags provided, use default "TEMP" tag
            validatedFiles.forEach(f => performUpload(f.file, f.tempId, "TEMP"));
        }
    };

    const handleFiles = useCallback((files) => {
        setValidationErrors([]); // Clear previous validation errors
        setGeneralError("");

        const filesToProcess = Array.from(files);
        let currentValidCount = managedFiles.filter(f => f.status === 'success' || f.status === 'uploading').length;
        let newValidationErrors = [];
        let filesToUpload = [];

        filesToProcess.forEach(file => {
            if (!multiple && currentValidCount >= 1) {
                // Skip if single mode and already have a file
                return;
            }
            if (multiple && currentValidCount >= maxFiles) {
                newValidationErrors.push({
                    filename: file.name,
                    message: `Cannot add more files (limit is ${maxFiles}).`
                });
                return; // Skip if max files reached
            }

            const validationResult = validateFile(file);
            if (validationResult) {
                newValidationErrors.push(...validationResult.messages.map(msg => ({
                    filename: validationResult.filename,
                    message: msg
                })));
            } else {
                const tempId = generateTempId();
                const newFileEntry = {
                    tempId,
                    file,
                    status: 'pending', // Will be changed to 'uploading' by performUpload
                    progress: 0,
                };
                filesToUpload.push(newFileEntry);
                currentValidCount++; // Increment count for subsequent checks in this loop
            }
        });

        if (newValidationErrors.length > 0) {
            setValidationErrors(newValidationErrors);
        }

        if (filesToUpload.length > 0) {
            setManagedFiles(current => [...current, ...filesToUpload]);
            // Process files for upload (with tag selection if needed)
            processFilesForUpload(filesToUpload);
        }

    }, [managedFiles, multiple, maxFiles, validateFile, performUpload]);

    // Handle tag selection confirmation
    const handleTagConfirm = () => {
        if (filesForTagging.length > 0) {
            // Proceed with upload using the selected tag
            filesForTagging.forEach(f => performUpload(f.file, f.tempId, selectedTag));
            setFilesForTagging([]);
            setShowTagSelector(false);
        }
    };

    // Handle tag selection cancel
    const handleTagCancel = () => {
        // Remove the pending files
        setManagedFiles(current =>
            current.filter(f => !filesForTagging.some(pendingFile => pendingFile.tempId === f.tempId))
        );
        setFilesForTagging([]);
        setShowTagSelector(false);
    };

    const dragEvents = {
        onDragEnter: (e) => {
            stopDefaults(e);
            if (!editable) return;
            setIsDragOver(true);
        },
        onDragLeave: (e) => {
            stopDefaults(e);
            if (!editable) return;
            // Add a small delay or check relatedTarget to prevent flickering when dragging over children
            if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
                setIsDragOver(false);
            } else if (!e.relatedTarget) {
                setIsDragOver(false); // Handle leaving the window
            }
        },
        onDragOver: (e) => {
            stopDefaults(e);
            if (!editable) return;
            setIsDragOver(true); // Ensure it stays true while over
        },
        onDrop: (e) => {
            stopDefaults(e);
            if (!editable) return;
            setIsDragOver(false);
            if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
            }
        },
    };

    const handleInputChange = (e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
        // Reset input value to allow selecting the same file again
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleTriggerInput = () => {
        if (editable && inputRef.current) {
            setValidationErrors([]); // Clear errors on click
            setGeneralError("");
            inputRef.current.click();
        }
    };

    const handleCancelUpload = (tempId) => {
        const fileToCancel = managedFiles.find(f => f.tempId === tempId);
        if (fileToCancel?.cancelSource) {
            fileToCancel.cancelSource.cancel("Upload canceled by user.");
        }
        // State update (removal/error) is handled in the upload catch block for cancellation
    };


    const openDeleteDialog = useCallback((file) => {
        if (!editable) return;
        setFileToDelete(file); // Store the file to be deleted
        setOpenDeleteForm(true);
        setGeneralError("");
    }, [editable]);

    const closeDeleteForm = useCallback(() => {
        setFileToDelete(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDeleteFile = useCallback(async () => {
        if (!fileToDelete) return;

        const {tempId, serverData} = fileToDelete;
        updateFileState(tempId, {status: 'deleting'});
        closeDeleteForm(); // Close dialog immediately

        try {
            axios.post(route("documents.destroy", serverData.id), {_method: "delete",})
                .then(r => {
                // Remove from internal state on success
                setManagedFiles(current => current.filter(f => f.tempId !== tempId));

                // Notify parent of the change
                setManagedFiles(current => {
                    const successfulFiles = current
                        .filter(f => f.status === 'success' && f.serverData)
                        .map(f => f.serverData);
                    onChange(name, multiple ? successfulFiles : successfulFiles[0] || null);
                    return current;
                });
            })

        } catch (error) {
            console.error("Delete error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to delete file";
            updateFileState(tempId, {status: 'success', error: errorMsg}); // Revert status to allow retry? Or keep 'deleting' and show error? Let's revert.
            setGeneralError(errorMsg);
        } finally {
            // No need to set loading false as we use 'deleting' status
            setFileToDelete(null); // Clear the file marked for deletion
        }
    }, [fileToDelete, multiple, name, onChange]);

    // Calculate remaining slots accurately
    const remainingSlots = multiple ? Math.max(0, maxFiles - currentFileCount) : (currentFileCount === 0 ? 1 : 0);


    return (
        <>
            <FormGroup sx={{width: "100%", mb: 1}}>
                {label && (
                    <InputLabel
                        required={required}
                        error={displayError}
                        sx={{mb: 1, fontWeight: 'bold'}} // Simplified styling
                    >
                        {label}
                    </InputLabel>
                )}

                {/* Display Existing & Uploading Files */}
                <Box sx={{mb: managedFiles.length > 0 ? 2 : 0}}>
                    {managedFiles.map((fileState) => (
                        <UploadItem
                            key={fileState.tempId}
                            // Pass necessary props derived from fileState
                            value={fileState.serverData || {
                                originalName: fileState.file?.name,
                                size: fileState.file?.size
                            }} // Provide basic info if serverData not yet available
                            file={fileState.file} // Pass the actual file object if available
                            status={fileState.status}
                            progress={fileState.progress}
                            error={fileState.error}
                            editable={editable && fileState.status !== 'uploading' && fileState.status !== 'deleting'} // Can't delete while uploading/deleting
                            onDelete={() => fileState.status === 'success' && fileState.serverData ? openDeleteDialog(fileState) : null} // Only allow delete for successfully uploaded files with serverData
                            onCancel={fileState.status === 'uploading' ? () => handleCancelUpload(fileState.tempId) : undefined} // Allow cancelling uploads
                            showFileSize // Keep showing file size
                            // Add tag editing capability
                            onTagChange={editable && fileState.status === 'success' && fileState.serverData ?
                                (newTag) => handleTagChange(fileState.tempId, newTag) : undefined}
                            availableTags={tags} // Pass available tags for editing
                        />
                    ))}
                </Box>


                {/* Tag Selection Dialog */}
                {showTagSelector && (
                    <Box sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 2,
                        mb: 2,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 1
                    }}>
                        <Typography variant="subtitle1" sx={{mb: 2}}>
                            Select a tag for {filesForTagging.length} file{filesForTagging.length !== 1 ? 's' : ''}:
                        </Typography>

                        <FormControl fullWidth sx={{mb: 2}}>
                            <Select
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                displayEmpty
                                size="small"
                            >
                                {tags.map((tag, index) => (
                                    <MenuItem key={index} value={tag.value}>
                                        {tag.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                            <Chip
                                label="Cancel"
                                onClick={handleTagCancel}
                                color="default"
                                variant="outlined"
                            />
                            <Chip
                                label="Confirm"
                                onClick={handleTagConfirm}
                                color="primary"
                            />
                        </Box>
                    </Box>
                )}

                {/* Upload Box / Drop Zone */}
                {canUploadMore && editable && (
                    <UploadBox
                        {...dragEvents}
                        onClick={handleTriggerInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleTriggerInput();
                        }} // Basic keyboard activation
                        isDragOver={isDragOver}
                        error={displayError}
                        tabIndex={0} // Make it focusable
                        aria-label={label || "File Upload Area"}
                        aria-describedby="upload-helper-text" // Link to helper text
                    >
                        <CloudUploadIcon
                            sx={{
                                fontSize: 40,
                                mb: 1,
                                color: isDragOver ? "primary.main" : "text.secondary"
                            }}
                        />
                        <Typography variant="body1" sx={{mb: 1}}>
                            {isDragOver ? "Drop files here" : "Drag files or click to upload"}
                        </Typography>
                        <FileTypeInfo id="upload-helper-text">
                            {multiple ? `Up to ${remainingSlots} more file${remainingSlots !== 1 ? 's' : ''}.` : 'Select one file.'}
                            {` Max ${maxFileSize}MB each. Allowed: ${acceptedFileTypes || 'any'}.`}
                        </FileTypeInfo>
                    </UploadBox>
                )}

                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    multiple={multiple}
                    onChange={handleInputChange}
                    accept={accept}
                />

                {/* Display Errors */}
                {displayError && (
                    <Alert
                        severity="error"
                        sx={{mt: 1}}
                        onClose={() => {
                            setValidationErrors([]);
                            setGeneralError("");
                        }} // Allow closing general/validation errors
                    >
                        {externalHelperText} {/* Show external error first if present */}
                        {generalError && <p>{generalError}</p>}
                        {validationErrors.length > 0 && (
                            <ul>
                                {validationErrors.map((err, i) => <li key={i}>{err.message}</li>)}
                            </ul>
                        )}
                    </Alert>
                )}

                {/* Show file count / limit */}
                {multiple && label && ( // Show chip near label if label exists
                    <Chip
                        label={`${currentFileCount}/${maxFiles} files`}
                        size="small"
                        sx={{position: 'absolute', top: 0, right: 0, mt: -0.5, mr: 1}} // Adjust positioning as needed
                        color={currentFileCount >= maxFiles ? "error" : "default"}
                        variant={currentFileCount >= maxFiles ? "filled" : "outlined"}
                    />
                )}
            </FormGroup>

            {/* Delete Confirmation */}
            {editable && (
                <DeleteForm
                    // Pass file name if available, otherwise a generic name
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
