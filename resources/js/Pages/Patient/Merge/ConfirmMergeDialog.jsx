import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const ConfirmMergeDialog = ({ open, onClose, onConfirm, processing, keepPatient, removePatient }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon color="warning" /> Confirm merge
        </DialogTitle>
        <DialogContent>
            <DialogContentText component="div">
                This will permanently delete <strong>{removePatient?.fullName}</strong> and move all
                of its acceptances, samples, invoices, payments, documents and other records to{' '}
                <strong>{keepPatient?.fullName}</strong>.
                <Alert severity="warning" sx={{ mt: 2 }}>
                    This action cannot be undone.
                </Alert>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button color="error" variant="contained" disabled={processing} onClick={onConfirm}>
                Merge &amp; Delete
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmMergeDialog;
