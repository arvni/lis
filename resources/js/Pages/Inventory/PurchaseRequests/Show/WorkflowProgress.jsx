import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    TextField,
    Typography,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { APPROVAL_COLORS } from './constants';

const WorkflowProgress = ({ approvals, canAct, prId, users }) => {
    const [rejectDialog, setRejectDialog] = useState(false);
    const [delegateDialog, setDelegateDialog] = useState(false);
    const [delegateUser, setDelegateUser] = useState(null);
    const approveForm = useForm({ notes: '' });
    const rejectForm = useForm({ notes: '' });
    const delegateForm = useForm({ delegate_to_user_id: '' });

    if (!approvals || approvals.length === 0) return null;

    const activeIdx = approvals.findIndex((a) => a.status === 'PENDING');

    const submitApprove = () => {
        approveForm.post(route('inventory.purchase-requests.approve-step', prId), {
            onSuccess: () => approveForm.reset(),
        });
    };

    const submitReject = () => {
        rejectForm.post(route('inventory.purchase-requests.reject-step', prId), {
            onSuccess: () => {
                rejectForm.reset();
                setRejectDialog(false);
            },
        });
    };

    return (
        <>
            <Card sx={{ mb: 3 }}>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountTreeIcon fontSize="small" color="primary" />
                            <Typography variant="h6">Approval Workflow</Typography>
                        </Box>
                    }
                />
                <CardContent sx={{ pt: 0 }}>
                    <Stepper
                        activeStep={activeIdx === -1 ? approvals.length : activeIdx}
                        orientation="vertical"
                    >
                        {approvals.map((approval, idx) => {
                            const isPending = approval.status === 'PENDING';
                            const isApproved = approval.status === 'APPROVED';
                            const isRejected = approval.status === 'REJECTED';
                            const isActive = idx === activeIdx;

                            return (
                                <Step key={approval.id} completed={isApproved}>
                                    <StepLabel
                                        error={isRejected}
                                        optional={
                                            <Typography variant="caption" color="text.secondary">
                                                {approval.step?.approver_user
                                                    ? `User: ${approval.step.approver_user.name}`
                                                    : approval.step?.approver_role
                                                      ? `Role: ${approval.step.approver_role}`
                                                      : null}
                                            </Typography>
                                        }
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight={600}>
                                                {approval.step?.name ?? `Step ${idx + 1}`}
                                            </Typography>
                                            <Chip
                                                label={approval.status}
                                                size="small"
                                                color={APPROVAL_COLORS[approval.status] ?? 'default'}
                                                variant={isPending ? 'outlined' : 'filled'}
                                            />
                                            {isPending &&
                                                approval.due_at &&
                                                (new Date(approval.due_at) < new Date() ? (
                                                    <Chip
                                                        icon={<WarningAmberIcon fontSize="small" />}
                                                        label="Overdue"
                                                        size="small"
                                                        color="error"
                                                    />
                                                ) : (
                                                    <Chip
                                                        label={`Due ${approval.due_at.substring(0, 10)}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                    />
                                                ))}
                                        </Box>
                                    </StepLabel>
                                    <StepContent>
                                        {approval.acted_by && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                            >
                                                {isApproved ? 'Approved' : 'Rejected'} by{' '}
                                                {approval.acted_by.name}
                                                {approval.acted_at
                                                    ? ` · ${approval.acted_at.substring(0, 10)}`
                                                    : ''}
                                            </Typography>
                                        )}
                                        {approval.notes && (
                                            <Box
                                                sx={{
                                                    mt: 0.5,
                                                    p: 1,
                                                    bgcolor: 'grey.50',
                                                    borderRadius: 1,
                                                    borderLeft: '3px solid',
                                                    borderColor: isRejected
                                                        ? 'error.main'
                                                        : 'success.main',
                                                }}
                                            >
                                                <Typography variant="caption">
                                                    {approval.notes}
                                                </Typography>
                                            </Box>
                                        )}

                                        {isActive && canAct && (
                                            <Box
                                                sx={{
                                                    mt: 1.5,
                                                    display: 'flex',
                                                    gap: 1,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <TextField
                                                    size="small"
                                                    label="Comment (optional)"
                                                    value={approveForm.data.notes}
                                                    onChange={(e) =>
                                                        approveForm.setData('notes', e.target.value)
                                                    }
                                                    sx={{ flex: 1 }}
                                                />
                                                <Button
                                                    startIcon={<ThumbUpIcon />}
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    onClick={submitApprove}
                                                    disabled={approveForm.processing}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    startIcon={<ThumbDownIcon />}
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => setRejectDialog(true)}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => setDelegateDialog(true)}
                                                >
                                                    Delegate
                                                </Button>
                                            </Box>
                                        )}
                                    </StepContent>
                                </Step>
                            );
                        })}
                    </Stepper>
                </CardContent>
            </Card>

            <Dialog
                open={delegateDialog}
                onClose={() => setDelegateDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delegate This Step</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Autocomplete
                        sx={{ mt: 1 }}
                        options={users ?? []}
                        getOptionLabel={(u) => u.name}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        value={delegateUser}
                        onChange={(_, u) => {
                            setDelegateUser(u);
                            delegateForm.setData('delegate_to_user_id', u?.id ?? '');
                        }}
                        renderInput={(params) => (
                            <TextField {...params} size="small" label="Delegate to user" required />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDelegateDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!delegateUser || delegateForm.processing}
                        onClick={() =>
                            delegateForm.post(
                                route('inventory.purchase-requests.delegate-step', prId),
                                {
                                    onSuccess: () => {
                                        delegateForm.reset();
                                        setDelegateUser(null);
                                        setDelegateDialog(false);
                                    },
                                },
                            )
                        }
                    >
                        Delegate
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject This Step</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        sx={{ mt: 1 }}
                        label="Reason for rejection (required)"
                        value={rejectForm.data.notes}
                        onChange={(e) => rejectForm.setData('notes', e.target.value)}
                        error={!!rejectForm.errors.notes}
                        helperText={rejectForm.errors.notes}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={submitReject}
                        disabled={rejectForm.processing || !rejectForm.data.notes}
                    >
                        Confirm Reject
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default WorkflowProgress;
