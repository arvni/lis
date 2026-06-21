import { Alert, Button, Dialog, DialogTitle, DialogActions } from '@mui/material';
import { ThumbUpAlt } from '@mui/icons-material';
import TextField from '@mui/material/TextField';
import DialogContent from '@mui/material/DialogContent';

const StepApproveDialog = ({
    open,
    onCancel,
    onApprove,
    onChange,
    data,
    processing,
    currentStep,
    approvalFlow,
}) => (
    <Dialog open={open} onClose={!processing ? onCancel : undefined} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Step{currentStep ? `: ${currentStep.name}` : ''}</DialogTitle>
        <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
                This approval moves the report to the next step of the &quot;
                {approvalFlow?.name}
                &quot; flow. The published PDF is uploaded at the final sign-off step.
            </Alert>
            <TextField
                fullWidth
                multiline
                minRows={3}
                label="Comment (optional)"
                name="comment"
                value={data.comment || ''}
                onChange={onChange}
                disabled={processing}
            />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={onCancel} color="inherit" disabled={processing}>
                Cancel
            </Button>
            <Button
                variant="contained"
                onClick={onApprove}
                disabled={processing}
                startIcon={<ThumbUpAlt />}
            >
                Approve Step
            </Button>
        </DialogActions>
    </Dialog>
);

export default StepApproveDialog;
