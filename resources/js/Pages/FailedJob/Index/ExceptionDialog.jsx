import React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
    Divider,
    Grid,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

function ExceptionDialog({ open, onClose, job }) {
    if (!job) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorOutlineIcon color="error" />
                    <Box>
                        <Typography variant="h6" component="span">
                            {job.display_name?.split('\\').pop()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {job.display_name}
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Job Details
                        </Typography>
                        <Grid container spacing={1}>
                            {[
                                ['UUID', job.uuid],
                                ['Queue', job.queue],
                                ['Connection', job.connection],
                                ['Max Tries', job.max_tries ?? '—'],
                                ['Backoff', job.backoff ?? '—'],
                                ['Failed At', job.failed_at],
                            ].map(([label, value]) => (
                                <React.Fragment key={label}>
                                    <Grid size={3}>
                                        <Typography variant="caption" color="text.secondary">
                                            {label}
                                        </Typography>
                                    </Grid>
                                    <Grid size={9}>
                                        <Typography variant="caption">{value}</Typography>
                                    </Grid>
                                </React.Fragment>
                            ))}
                        </Grid>
                    </Box>
                    <Divider />
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Full Exception
                        </Typography>
                        <Box
                            component="pre"
                            sx={{
                                fontSize: '0.72rem',
                                bgcolor: 'grey.900',
                                color: 'grey.100',
                                p: 2,
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: 400,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {job.full_exception}
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ExceptionDialog;
