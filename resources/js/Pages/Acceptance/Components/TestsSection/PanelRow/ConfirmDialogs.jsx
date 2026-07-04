import React from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from '@mui/material';

export const DeleteConfirmDialog = ({ open, onClose, onConfirm, panelName }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Panel Removal</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Are you sure you want to remove the panel &quot;{panelName}&quot;? This action will
                remove all associated acceptance items.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} variant="outlined">
                Cancel
            </Button>
            <Button onClick={onConfirm} variant="contained" color="error">
                Remove Panel
            </Button>
        </DialogActions>
    </Dialog>
);

export const EjectConfirmDialog = ({ open, onClose, onConfirm, panelName }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Eject Panel Tests</DialogTitle>
        <DialogContent>
            <DialogContentText>
                This will split all tests in panel <strong>&quot;{panelName}&quot;</strong> into
                independent tests, each reverting to its method&apos;s default test. Prices will be
                recalculated. Workflow states and reports are kept.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} variant="outlined">
                Cancel
            </Button>
            <Button onClick={onConfirm} variant="contained" color="warning">
                Eject
            </Button>
        </DialogActions>
    </Dialog>
);
