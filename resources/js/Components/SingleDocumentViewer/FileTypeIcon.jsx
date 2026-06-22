import {
    Description,
    TableChart,
    PictureAsPdf,
    Image as ImageIcon,
    TextFields,
} from '@mui/icons-material';

// File Type icon component
const FileTypeIcon = ({ fileType }) => {
    if (!fileType) return <Description />;

    switch (fileType.toLowerCase()) {
        case 'pdf':
            return <PictureAsPdf />;
        case 'doc':
        case 'docx':
            return <Description />;
        case 'xls':
        case 'xlsx':
        case 'csv':
            return <TableChart />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'svg':
        case 'webp':
            return <ImageIcon />;
        case 'txt':
            return <TextFields />;
        default:
            return <Description />;
    }
};

export default FileTypeIcon;
