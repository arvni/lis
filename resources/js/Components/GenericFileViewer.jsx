import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import {
    CloudDownload,
    Description,
    PictureAsPdf,
    TableChart,
    TextFields,
    Image as ImageIcon,
} from '@mui/icons-material';
import React from 'react';
import PropTypes from 'prop-types';
import { formatFileSize } from '@/Services/helper';

// File type icon component.
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

FileTypeIcon.propTypes = {
    fileType: PropTypes.string,
};

const GenericFileViewer = ({ fileUrl, fileType, fileName, fileSize, onDownload }) => {
    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    maxWidth: 400,
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <Box sx={{ mb: 3, color: 'primary.main', fontSize: 60 }}>
                    <FileTypeIcon fileType={fileType} />
                </Box>

                <Typography variant="h6" gutterBottom>
                    {fileName}
                </Typography>

                <Box sx={{ my: 2 }}>
                    <Chip
                        label={fileType?.toUpperCase() || 'UNKNOWN'}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                    />
                    {fileSize && (
                        <Chip label={formatFileSize(fileSize)} variant="outlined" size="small" />
                    )}
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Preview is not available for this file type.
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<CloudDownload />}
                    onClick={onDownload}
                    fullWidth
                >
                    Download File
                </Button>
            </Paper>
        </Box>
    );
};

GenericFileViewer.propTypes = {
    fileUrl: PropTypes.string.isRequired,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.number,
    onDownload: PropTypes.func,
};

export default GenericFileViewer;
