import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const FileUploadStep = ({
    selectedFile,
    loadingPreview,
    hasHeader,
    errors,
    onFileChange,
    onReset,
    onPreview,
    onCheckboxChange,
}) => (
    <>
        <Box
            sx={{
                border: '2px dashed',
                borderColor: errors.file ? 'error.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: 'background.default',
                transition: 'all 0.3s',
                '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                },
            }}
        >
            <input
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={onFileChange}
            />
            <label htmlFor="file-upload">
                <Box sx={{ cursor: 'pointer' }}>
                    <CloudUploadIcon
                        sx={{
                            fontSize: 64,
                            color: 'primary.main',
                            mb: 2,
                        }}
                    />
                    <Typography variant="h6" gutterBottom>
                        Click to upload Excel file
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Supported formats: .xlsx, .xls, .csv
                    </Typography>
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ mt: 1, display: 'block' }}
                    >
                        Maximum file size: 10MB
                    </Typography>
                </Box>
            </label>

            {selectedFile && (
                <Box sx={{ mt: 3 }}>
                    <Chip
                        icon={<InsertDriveFileIcon />}
                        label={selectedFile.name}
                        onDelete={onReset}
                        color="primary"
                        variant="outlined"
                        sx={{ maxWidth: '100%' }}
                    />
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: 'block', mt: 1 }}
                    >
                        Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </Typography>
                </Box>
            )}

            {errors.file && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.file}
                </Alert>
            )}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <FormControlLabel
                control={
                    <Checkbox checked={hasHeader} onChange={onCheckboxChange} color="primary" />
                }
                label={<Typography variant="body1">First row contains headers</Typography>}
            />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
                variant="contained"
                disabled={!selectedFile || loadingPreview}
                onClick={onPreview}
                startIcon={loadingPreview ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                }}
            >
                {loadingPreview ? 'Loading...' : 'Next: Map Columns'}
            </Button>

            {selectedFile && !loadingPreview && (
                <Button
                    variant="outlined"
                    onClick={onReset}
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                    }}
                >
                    Clear
                </Button>
            )}
        </Box>
    </>
);

export default FileUploadStep;
