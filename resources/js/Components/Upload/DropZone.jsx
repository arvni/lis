import { Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { UploadBox, FileTypeInfo } from './styled.jsx';

// Drag-and-drop / click upload area
const DropZone = ({
    dragEvents,
    onTrigger,
    isDragOver,
    displayError,
    label,
    multiple,
    remainingSlots,
    maxFileSize,
    acceptedFileTypes,
}) => {
    return (
        <UploadBox
            {...dragEvents}
            onClick={onTrigger}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onTrigger();
            }}
            isDragOver={isDragOver}
            error={displayError}
            tabIndex={0}
            aria-label={label || 'File Upload Area'}
            aria-describedby="upload-helper-text"
            role="button"
        >
            <CloudUploadIcon
                sx={{
                    fontSize: 40,
                    mb: 1,
                    color: isDragOver ? 'primary.main' : 'text.secondary',
                }}
            />
            <Typography variant="body1" sx={{ mb: 1 }}>
                {isDragOver ? 'Drop files here' : 'Drag files or click to upload'}
            </Typography>
            <FileTypeInfo id="upload-helper-text">
                {multiple
                    ? `Up to ${remainingSlots} more file${remainingSlots !== 1 ? 's' : ''}.`
                    : 'Select one file.'}
                {` Max ${maxFileSize}MB each. Allowed: ${acceptedFileTypes || 'any'}.`}
            </FileTypeInfo>
        </UploadBox>
    );
};

export default DropZone;
