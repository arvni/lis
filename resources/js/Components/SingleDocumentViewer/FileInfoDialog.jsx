import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { CloudDownload } from '@mui/icons-material';
import { formatFileSize } from '@/Services/helper';

const InfoRow = ({ label, value }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
        }}
    >
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
        <Typography variant="body2">{value}</Typography>
    </Box>
);

const FileInfoDialog = ({ open, onClose, onDialogClose, document, ext, onDownload }) => (
    <Dialog open={open} onClose={onDialogClose} aria-labelledby="file-info-dialog-title">
        <DialogTitle id="file-info-dialog-title">File Information</DialogTitle>
        <DialogContent dividers>
            <Box sx={{ minWidth: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                    {document.originalName}
                </Typography>

                <Box sx={{ my: 2 }}>
                    <InfoRow label="Type" value={ext ? ext.toUpperCase() : 'Unknown'} />

                    {document.size && (
                        <InfoRow label="Size" value={formatFileSize(document.size)} />
                    )}

                    {document.created_at && (
                        <InfoRow
                            label="Uploaded"
                            value={new Date(document.created_at).toLocaleString()}
                        />
                    )}

                    {document.updated_at && (
                        <InfoRow
                            label="Last modified"
                            value={new Date(document.updated_at).toLocaleString()}
                        />
                    )}

                    {document.mime_type && <InfoRow label="MIME type" value={document.mime_type} />}
                </Box>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" onClick={onDownload} startIcon={<CloudDownload />}>
                Download
            </Button>
        </DialogActions>
    </Dialog>
);

export default FileInfoDialog;
