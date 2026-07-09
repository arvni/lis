import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import { generateTempId, formatFileTypes, validateFile as validateFileAgainst } from './helpers';

/**
 * Owns all file-upload state, validation, upload/delete/tag orchestration and
 * drag-and-drop wiring for the {@link Upload} component. Extracted from the
 * component body so the logic is testable in isolation (via renderHook) and the
 * component itself is thin presentation.
 */
export default function useFileUpload({
    url,
    name,
    value: parentValue,
    error: externalError,
    onChange,
    accept,
    multiple = false,
    editable = true,
    maxFileSize = 200,
    maxFiles = 200,
    tags = [],
}) {
    const inputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [managedFiles, setManagedFiles] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [generalError, setGeneralError] = useState('');
    const [fileToDelete, setFileToDelete] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [filesForTagging, setFilesForTagging] = useState([]);
    const [showTagSelector, setShowTagSelector] = useState(false);

    // --- Memoized Values ---
    const acceptedFileTypes = useMemo(() => formatFileTypes(accept), [accept]);
    const maxSizeBytes = useMemo(() => maxFileSize * 1024 * 1024, [maxFileSize]);

    const currentFileCount = useMemo(
        () => managedFiles.filter((f) => f.status === 'success' || f.status === 'uploading').length,
        [managedFiles],
    );

    const canUploadMore = useMemo(
        () => editable && (multiple ? currentFileCount < maxFiles : currentFileCount === 0),
        [editable, multiple, currentFileCount, maxFiles],
    );

    const displayError = useMemo(
        () => externalError || validationErrors.length > 0 || !!generalError,
        [externalError, validationErrors, generalError],
    );

    const remainingSlots = useMemo(
        () =>
            multiple ? Math.max(0, maxFiles - currentFileCount) : currentFileCount === 0 ? 1 : 0,
        [multiple, maxFiles, currentFileCount],
    );

    // Create a cancelation token source map for better management
    const cancelTokenMap = useRef(new Map());

    // --- Sync with Parent Value ---
    useEffect(() => {
        // Convert parent value to array format for consistent handling
        const parentFilesArray = parentValue
            ? (multiple ? parentValue : [parentValue]).filter(Boolean)
            : [];

        setManagedFiles((currentFiles) => {
            // Map parent data to our internal format
            const parentMappedFiles = parentFilesArray.map((serverData) => {
                // Try to find existing file in state
                const existing = currentFiles.find((f) => f.serverData?.id === serverData?.id);

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
                    !parentFilesArray.some((pf) => pf?.id === f.serverData?.id),
            );

            // Combine and return without duplicates
            const combined = [...parentMappedFiles, ...uploadingOrFailedFiles];
            return combined.filter(
                (file, index, self) => index === self.findIndex((f) => f.tempId === file.tempId),
            );
        });
    }, [parentValue, multiple]);

    // --- File Validation ---
    const validateFile = useCallback(
        (file) =>
            validateFileAgainst(file, { accept, acceptedFileTypes, maxSizeBytes, maxFileSize }),
        [accept, acceptedFileTypes, maxSizeBytes, maxFileSize],
    );

    // --- File State Management ---
    const updateFileState = useCallback((tempId, updates) => {
        setManagedFiles((current) =>
            current.map((f) => (f.tempId === tempId ? { ...f, ...updates } : f)),
        );
    }, []);

    // --- Notify Parent of Changes ---
    const notifyParentOfChange = useCallback(
        (results = []) => {
            const successfulFiles = managedFiles
                .filter((f) => f.status === 'success' && f.serverData)
                .map((f) => f.serverData);

            const allSuccessFiles =
                results.length > 0 ? [...successfulFiles, ...results] : successfulFiles;

            onChange(name, multiple ? allSuccessFiles : allSuccessFiles[0] || null);
        },
        [managedFiles, multiple, name, onChange],
    );

    // --- Upload Logic ---
    const performSingleUpload = useCallback(
        async (file, tempId, tag) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('tag', tag || 'TEMP');

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
                    error: undefined,
                });

                return response.data.data;
            } catch (error) {
                if (axios.isCancel(error)) {
                    setManagedFiles((current) => current.filter((f) => f.tempId !== tempId));
                    return null;
                } else {
                    console.error('Upload error:', error);
                    const errorMsg =
                        error.response?.data?.message || error.message || 'Upload failed';
                    updateFileState(tempId, {
                        status: 'error',
                        progress: 0,
                        error: errorMsg,
                    });
                    setGeneralError('An upload failed. Please check individual files.');
                    throw error;
                }
            } finally {
                // Always clean up the cancel token
                cancelTokenMap.current.delete(tempId);
            }
        },
        [url, updateFileState],
    );

    // Handle multiple uploads efficiently
    const performMultipleUploads = useCallback(
        async (filesToUpload, tag) => {
            if (filesToUpload.length === 0) return;

            try {
                // Create an array of upload promises
                const uploadPromises = filesToUpload.map((fileObj) =>
                    performSingleUpload(fileObj.file, fileObj.tempId, tag),
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
                console.error('One or more uploads failed:', error);
            }
        },
        [performSingleUpload, notifyParentOfChange],
    );

    // --- Event Handlers ---
    const stopDefaults = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
    }, []);

    // Process files before upload (with tag selection if needed)
    const processFilesForUpload = useCallback(
        (validatedFiles) => {
            // If tags are available, show tag selector
            if (tags && tags.length > 0) {
                setFilesForTagging(validatedFiles);
                setShowTagSelector(true);
            } else {
                // No tags, use default "TEMP" tag
                performMultipleUploads(validatedFiles, 'TEMP');
            }
        },
        [tags, performMultipleUploads],
    );

    // Handle new files (from drop or input)
    const handleFiles = useCallback(
        (files) => {
            setValidationErrors([]);
            setGeneralError('');

            const filesToProcess = Array.from(files);
            let currentValidCount = managedFiles.filter(
                (f) => f.status === 'success' || f.status === 'uploading',
            ).length;

            let newValidationErrors = [];
            let filesToUpload = [];

            // Process each file
            filesToProcess.forEach((file) => {
                // Skip if we already have a file in single mode
                if (!multiple && currentValidCount >= 1) return;

                // Skip if max files reached in multiple mode
                if (multiple && currentValidCount >= maxFiles) {
                    newValidationErrors.push({
                        filename: file.name,
                        message: `Cannot add more files (limit is ${maxFiles}).`,
                    });
                    return;
                }

                // Validate the file
                const validationResult = validateFile(file);
                if (validationResult) {
                    validationResult.messages.forEach((msg) =>
                        newValidationErrors.push({
                            filename: validationResult.filename,
                            message: msg,
                        }),
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
                setManagedFiles((current) => [...current, ...filesToUpload]);
                processFilesForUpload(filesToUpload);
            }
        },
        [managedFiles, multiple, maxFiles, validateFile, processFilesForUpload],
    );

    // Tag selector handlers
    const handleTagConfirm = useCallback(
        (selectedTag) => {
            if (filesForTagging.length > 0) {
                performMultipleUploads(filesForTagging, selectedTag);
                setFilesForTagging([]);
                setShowTagSelector(false);
            }
        },
        [filesForTagging, performMultipleUploads],
    );

    const handleTagCancel = useCallback(() => {
        // Remove pending files
        setManagedFiles((current) =>
            current.filter(
                (f) => !filesForTagging.some((pendingFile) => pendingFile.tempId === f.tempId),
            ),
        );
        setFilesForTagging([]);
        setShowTagSelector(false);
    }, [filesForTagging]);

    // Handle tag change for existing file
    const handleTagChange = useCallback(
        async (tempId, newTag) => {
            const fileToUpdate = managedFiles.find((f) => f.tempId === tempId);
            if (!fileToUpdate || !fileToUpdate.serverData) return;

            updateFileState(tempId, { status: 'updating' });

            try {
                // Call API to update the tag
                await axios.patch(`${url}/${fileToUpdate.serverData.id}`, {
                    tag: newTag,
                });

                const newFiles = managedFiles.map((f) =>
                    f.tempId === tempId
                        ? {
                              ...f,
                              status: 'success',
                              serverData: {
                                  ...fileToUpdate.serverData,
                                  tag: newTag,
                              },
                          }
                        : f,
                );

                // Update state and notify parent
                setManagedFiles(newFiles);
                onChange(
                    name,
                    multiple
                        ? newFiles.map((item) => item.serverData)
                        : newFiles[0]?.serverData || null,
                );
            } catch (error) {
                console.error('Tag update error:', error);
                const errorMsg =
                    error.response?.data?.message || error.message || 'Failed to update tag';
                updateFileState(tempId, {
                    status: 'success',
                    error: errorMsg,
                });
                setGeneralError(errorMsg);
            }
        },
        [managedFiles, url, updateFileState, onChange, name, multiple],
    );

    // Drag and drop event handlers
    const dragEvents = useMemo(
        () => ({
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
        }),
        [editable, stopDefaults, handleFiles],
    );

    // Input change handler
    const handleInputChange = useCallback(
        (e) => {
            if (e.target.files) {
                handleFiles(e.target.files);
            }
            // Reset input value for reuse
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [handleFiles],
    );

    // Trigger file input click
    const handleTriggerInput = useCallback(() => {
        if (editable && inputRef.current) {
            setValidationErrors([]);
            setGeneralError('');
            inputRef.current.click();
        }
    }, [editable]);

    // Cancel an in-progress upload
    const handleCancelUpload = useCallback((tempId) => {
        const cancelSource = cancelTokenMap.current.get(tempId);
        if (cancelSource) {
            cancelSource.cancel('Upload canceled by user.');
            cancelTokenMap.current.delete(tempId);
        }
    }, []);

    // Handle file deletion
    const openDeleteDialog = useCallback(
        (file) => {
            if (!editable) return;
            setFileToDelete(file);
            setOpenDeleteForm(true);
            setGeneralError('');
        },
        [editable],
    );

    const closeDeleteForm = useCallback(() => {
        setFileToDelete(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDeleteFile = useCallback(async () => {
        if (!fileToDelete) return;

        const { tempId, serverData } = fileToDelete;
        updateFileState(tempId, { status: 'deleting' });
        closeDeleteForm();

        axios
            .post(route('documents.destroy', serverData.id || serverData.hash), {
                _method: 'delete',
            })
            .then(() => {
                // Remove from state on success
                const newFiles = managedFiles.filter((f) => f.tempId !== tempId);
                setManagedFiles(newFiles);
                // Notify parent of change
                onChange(
                    name,
                    multiple
                        ? newFiles.map((item) => item.serverData)
                        : newFiles[0]?.serverData || null,
                );
            })
            .catch((error) => {
                console.error('Delete error:', error);
                if (error.status === 404 || error.response?.status === 404) {
                    const newFiles = managedFiles.filter((f) => f.tempId !== tempId);
                    setManagedFiles(newFiles);
                    // Notify parent of change
                    onChange(
                        name,
                        multiple
                            ? newFiles.map((item) => item.serverData)
                            : newFiles[0]?.serverData || null,
                    );
                } else {
                    const errorMsg =
                        error.response?.data?.message || error.message || 'Failed to delete file';
                    updateFileState(tempId, { status: 'error', error: errorMsg });
                    setGeneralError(errorMsg);
                }
            })
            .finally(() => {
                setFileToDelete(null);
            });
    }, [fileToDelete, managedFiles, closeDeleteForm, updateFileState, onChange, name, multiple]);

    // Clear all validation errors
    const clearErrors = useCallback(() => {
        setValidationErrors([]);
        setGeneralError('');
    }, []);

    // --- Cleanup Effect ---
    useEffect(() => {
        // Capture the ref's Map (never reassigned, only mutated) for use in cleanup.
        const cancelTokens = cancelTokenMap.current;
        // Clean up any pending cancel tokens on unmount
        return () => {
            cancelTokens.forEach((source) => {
                source.cancel('Component unmounted');
            });
            cancelTokens.clear();
        };
    }, []);

    return {
        inputRef,
        isDragOver,
        managedFiles,
        validationErrors,
        generalError,
        fileToDelete,
        openDeleteForm,
        filesForTagging,
        showTagSelector,
        acceptedFileTypes,
        currentFileCount,
        canUploadMore,
        displayError,
        remainingSlots,
        dragEvents,
        handleInputChange,
        handleTriggerInput,
        handleCancelUpload,
        handleTagChange,
        handleTagConfirm,
        handleTagCancel,
        openDeleteDialog,
        closeDeleteForm,
        handleDeleteFile,
        clearErrors,
    };
}
