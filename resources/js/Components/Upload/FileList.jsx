import { Box } from '@mui/material';
import UploadItem from '../UploadItem';

// Renders the list of managed (existing + uploading) files
const FileList = ({ files, editable, tags, onOpenDelete, onCancelUpload, onTagChange }) => {
    if (files.length === 0) return null;

    return (
        <Box sx={{ mb: 2 }}>
            {files.map((fileState) => (
                <UploadItem
                    key={fileState.tempId}
                    value={
                        fileState.serverData || {
                            originalName: fileState.file?.name,
                            size: fileState.file?.size,
                        }
                    }
                    file={fileState.file}
                    status={fileState.status}
                    progress={fileState.progress}
                    error={fileState.error}
                    editable={
                        editable &&
                        fileState.status !== 'uploading' &&
                        fileState.status !== 'deleting'
                    }
                    onDelete={() =>
                        fileState.status === 'success' && fileState.serverData
                            ? onOpenDelete(fileState)
                            : null
                    }
                    onCancel={
                        fileState.status === 'uploading'
                            ? () => onCancelUpload(fileState.tempId)
                            : undefined
                    }
                    showFileSize
                    onTagChange={
                        editable && fileState.status === 'success' && fileState.serverData
                            ? (newTag) => onTagChange(fileState.tempId, newTag)
                            : undefined
                    }
                    availableTags={tags}
                />
            ))}
        </Box>
    );
};

export default FileList;
