import PropTypes from 'prop-types';
import { Chip, FormGroup, InputLabel } from '@mui/material';

// Assuming DeleteForm exists and is adapted
import DeleteForm from './DeleteForm';
import TagSelector from './Upload/TagSelector.jsx';
import FileErrorAlert from './Upload/FileErrorAlert.jsx';
import FileList from './Upload/FileList.jsx';
import DropZone from './Upload/DropZone.jsx';
import useFileUpload from './Upload/useFileUpload';

/**
 * Enhanced file upload component with tag selection.
 *
 * All state/validation/upload orchestration lives in {@link useFileUpload};
 * this component is thin presentation wiring the hook to the UI parts.
 */
const Upload = ({
    url,
    label,
    name,
    value,
    error,
    helperText: externalHelperText,
    onChange,
    accept,
    multiple = false,
    editable = true,
    required = false,
    maxFileSize = 200, // Default 20MB
    maxFiles = 200, // Default max 20 files
    tags = [], // Tag selection
}) => {
    const {
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
    } = useFileUpload({
        url,
        name,
        value,
        error,
        onChange,
        accept,
        multiple,
        editable,
        maxFileSize,
        maxFiles,
        tags,
    });

    return (
        <>
            <FormGroup sx={{ width: '100%', mb: 1 }}>
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
                <FileList
                    files={managedFiles}
                    editable={editable}
                    tags={tags}
                    onOpenDelete={openDeleteDialog}
                    onCancelUpload={handleCancelUpload}
                    onTagChange={handleTagChange}
                />

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
                    <DropZone
                        dragEvents={dragEvents}
                        onTrigger={handleTriggerInput}
                        isDragOver={isDragOver}
                        displayError={displayError}
                        label={label}
                        multiple={multiple}
                        remainingSlots={remainingSlots}
                        maxFileSize={maxFileSize}
                        acceptedFileTypes={acceptedFileTypes}
                    />
                )}

                {/* Hidden file input */}
                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    multiple={multiple}
                    onChange={handleInputChange}
                    accept={accept || '*/*'}
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
                        color={currentFileCount >= maxFiles ? 'error' : 'default'}
                        variant={currentFileCount >= maxFiles ? 'filled' : 'outlined'}
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

Upload.propTypes = {
    url: PropTypes.string.isRequired,
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    error: PropTypes.bool,
    helperText: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    accept: PropTypes.string,
    multiple: PropTypes.bool,
    editable: PropTypes.bool,
    required: PropTypes.bool,
    maxFileSize: PropTypes.number,
    maxFiles: PropTypes.number,
    tags: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string,
            label: PropTypes.string,
        }),
    ),
};

export default Upload;
