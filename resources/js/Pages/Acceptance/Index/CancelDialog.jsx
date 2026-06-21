import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Paper,
    CircularProgress,
    Avatar,
    Divider,
} from '@mui/material';
import {
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

const CancelDialog = ({ open, onClose, onConfirm, data, processing }) => (
    <Dialog
        open={open}
        onClose={processing ? undefined : onClose}
        slotProps={{
            paper: {
                elevation: 3,
                sx: {
                    borderRadius: 2,
                    maxWidth: 450,
                },
            },
        }}
    >
        <DialogTitle
            sx={{
                bgcolor: 'warning.light',
                color: 'warning.dark',
                py: 2,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <CancelIcon sx={{ mr: 1.5 }} />
            Cancel Acceptance #{data?.id}
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                    sx={{
                        bgcolor: 'warning.light',
                        color: 'warning.dark',
                        mr: 2,
                        width: 40,
                        height: 40,
                    }}
                >
                    <WarningIcon />
                </Avatar>
                <Typography variant="h6">Confirm Cancellation</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1">
                Are you sure you want to cancel the acceptance for{' '}
                <strong>{data?.patient_fullname || 'this patient'}</strong>?
            </Typography>

            <Paper
                variant="outlined"
                sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'warning.lighter',
                    borderColor: 'warning.light',
                }}
            >
                <Typography variant="body2" color="warning.dark">
                    <WarningIcon
                        fontSize="small"
                        sx={{
                            verticalAlign: 'middle',
                            mr: 1,
                        }}
                    />
                    This action cannot be undone. All linked records will be marked as cancelled.
                </Typography>
            </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
                onClick={onClose}
                disabled={processing}
                variant="outlined"
                startIcon={<CancelIcon />}
                sx={{ borderRadius: 1.5 }}
            >
                No, Keep It
            </Button>
            <Button
                color="warning"
                variant="contained"
                onClick={onConfirm}
                disabled={processing}
                startIcon={
                    processing ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <CheckCircleIcon />
                    )
                }
                sx={{ borderRadius: 1.5 }}
            >
                Yes, Cancel Acceptance
            </Button>
        </DialogActions>
    </Dialog>
);

export default CancelDialog;
