import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    LinearProgress,
} from '@mui/material';

function BulkConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmColor = 'error',
    processing,
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={processing}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    color={confirmColor}
                    variant="contained"
                    disabled={processing}
                >
                    {processing ? <LinearProgress size={16} /> : 'Confirm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default BulkConfirmDialog;
