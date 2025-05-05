import {Box, Button, Chip, Paper, Typography} from "@mui/material";
import {CloudDownload} from "@mui/icons-material";
import React from "react";

const GenericFileViewer = ({ fileUrl, fileType, fileName, fileSize, onDownload }) => {
    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3
        }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    maxWidth: 400,
                    width: '100%',
                    textAlign: 'center'
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
                        <Chip
                            label={formatFileSize(fileSize)}
                            variant="outlined"
                            size="small"
                        />
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

export default GenericFileViewer;
