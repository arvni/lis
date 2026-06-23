import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import Upload from '../Upload';

const UploadPanel = ({ documents, tags, onChange }) => {
    const theme = useTheme();

    return (
        <Box sx={{ p: 2 }}>
            <Paper
                elevation={0}
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                    borderStyle: 'dashed',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CloudUploadIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="medium">
                        Manage Documents
                    </Typography>
                </Box>

                <Upload
                    value={documents}
                    url={route('documents.store')}
                    onChange={onChange}
                    multiple
                    editable={true}
                    sx={{ borderRadius: 2 }}
                    tags={tags}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Drag and drop files here or click to browse.
                </Typography>
            </Paper>
        </Box>
    );
};

export default UploadPanel;
