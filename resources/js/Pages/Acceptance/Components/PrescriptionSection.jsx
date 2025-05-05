import React from "react";
import { Box, Stack, Typography, Button, Paper, Chip } from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const PrescriptionSection = ({ prescription }) => {
    if (!prescription) return null;

    // Determine file type icon
    const getFileIcon = (filename) => {
        if (filename.toLowerCase().endsWith('.pdf')) {
            return <PictureAsPdfIcon sx={{ color: '#f44336' }} />;
        } else {
            return <InsertDriveFileIcon sx={{ color: '#2196f3' }} />;
        }
    };

    // Get file extension for display
    const getFileExtension = (filename) => {
        const parts = filename.split('.');
        if (parts.length > 1) {
            return parts[parts.length - 1].toUpperCase();
        }
        return '';
    };

    const fileExtension = getFileExtension(prescription.originalName);

    return (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Box display="flex" alignItems="center" mb={2}>
                <DescriptionIcon sx={{ mr: 2, color: "primary.main", fontSize: 28 }} />
                <Typography variant="h6">Prescription Document</Typography>
            </Box>

            <Box sx={{ pl: 6, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    {getFileIcon(prescription.originalName)}

                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {prescription.originalName}
                        </Typography>
                        {fileExtension && (
                            <Chip
                                size="small"
                                label={fileExtension}
                                sx={{ mt: 0.5, fontSize: '0.7rem' }}
                            />
                        )}
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<FileOpenIcon />}
                        href={route("documents.show", prescription.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ minWidth: 150 }}
                    >
                        View Document
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
};

export default PrescriptionSection;
