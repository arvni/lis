import {
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    LinearProgress,
    Typography,
} from '@mui/material';
import { VisibilityOffOutlined } from '@mui/icons-material';
import DialogContent from '@mui/material/DialogContent';

const UnpublishDialog = ({ open, onCancel, onConfirm, processing }) => (
    <Dialog open={open} maxWidth="sm" fullWidth slotProps={{ Paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ pb: 1 }}>Unpublish Report</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
            <Typography>
                Are you sure you want to unpublish this report? This action will make the report
                unavailable to users.
            </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={onCancel} color="inherit" disabled={processing}>
                Cancel
            </Button>
            <Button
                variant="contained"
                color="error"
                onClick={onConfirm}
                disabled={processing}
                startIcon={processing ? <LinearProgress size={20} /> : <VisibilityOffOutlined />}
            >
                Unpublish
            </Button>
        </DialogActions>
    </Dialog>
);

export default UnpublishDialog;
