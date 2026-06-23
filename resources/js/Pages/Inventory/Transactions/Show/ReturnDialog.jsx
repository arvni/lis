import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';

const ReturnDialog = ({ open, onClose, notes, onNotesChange, onReturn }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Return to Requester</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The transaction will be sent back as a draft so the requester can revise and
                resubmit.
            </Typography>
            <TextField
                size="small"
                fullWidth
                multiline
                rows={3}
                label="Reason / Notes (optional)"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                autoFocus
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
                variant="contained"
                color="warning"
                startIcon={<UndoIcon />}
                onClick={onReturn}
            >
                Return to Requester
            </Button>
        </DialogActions>
    </Dialog>
);

export default ReturnDialog;
