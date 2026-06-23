import {
    InsertDriveFile as InsertDriveFileIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Photo as PhotoIcon,
    Description as DescriptionIcon,
    Archive as ArchiveIcon,
} from '@mui/icons-material';

// Pick an icon for a document based on its extension / mime type.
export const getFileIcon = (mimeType) => {
    if (!mimeType) return <InsertDriveFileIcon />;

    if (['pdf', 'application/pdf', 'application/x-pdf'].includes(mimeType)) {
        return <PictureAsPdfIcon sx={{ color: '#f44336' }} />;
    } else if (
        ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tif', 'tiff'].includes(mimeType)
    ) {
        return <PhotoIcon sx={{ color: '#4caf50' }} />;
    } else if (['doc', 'docx'].includes(mimeType)) {
        return <DescriptionIcon sx={{ color: '#2196f3' }} />;
    } else if (['zip', 'rar', 'archive', '7z', 'tar', 'gz', 'bz2'].includes(mimeType)) {
        return <ArchiveIcon sx={{ color: '#ff9800' }} />;
    }

    return <InsertDriveFileIcon sx={{ color: '#9e9e9e' }} />;
};
