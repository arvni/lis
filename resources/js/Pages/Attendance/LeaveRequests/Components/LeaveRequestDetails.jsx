import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    ListItem,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

import {
    APPROVAL_STATUS_COLORS,
    LEAVE_STATUS_COLORS,
    formatLeavePeriod,
} from '../leaveFormat';

const ACTIONS = {
    approve: {
        route: 'attendance.leave-requests.approve',
        title: 'Approve',
        field: 'notes',
        label: 'Note (optional)',
        color: 'success',
        required: false,
    },
    reject: {
        route: 'attendance.leave-requests.reject',
        title: 'Reject',
        field: 'notes',
        label: 'Why is it rejected?',
        color: 'error',
        required: true,
    },
    cancel: {
        route: 'attendance.leave-requests.cancel',
        title: 'Cancel leave',
        field: 'reason',
        label: 'Reason (optional)',
        color: 'warning',
        required: false,
    },
};

export const describeStep = (step) => {
    if (step.acted_by) {
        return `${step.acted_by}, ${step.acted_at}${step.notes ? ` — ${step.notes}` : ''}`;
    }

    return step.status === 'PENDING' && step.due_at ? `Due by ${step.due_at}` : null;
};

const LeaveRequestDetails = ({ leave, onClose }) => {
    const [action, setAction] = useState(null);
    const [text, setText] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const current = action ? ACTIONS[action] : null;

    const choose = (name) => () => {
        setAction(name);
        setText('');
        setErrors({});
    };

    const handleConfirm = () => {
        setProcessing(true);
        router.put(
            route(current.route, leave.id),
            { [current.field]: text },
            {
                preserveScroll: true,
                onSuccess: () => setAction(null),
                onError: setErrors,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const enteredBySomeoneElse = leave.requested_by && leave.requested_by.id !== leave.user?.id;

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {leave.kind?.name} leave · {leave.user?.name}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                        <Chip
                            size="small"
                            color={LEAVE_STATUS_COLORS[leave.status] ?? 'default'}
                            label={leave.status_label}
                        />
                        <Typography variant="body2">
                            {formatLeavePeriod(leave)} · {leave.type_label}
                        </Typography>
                    </Box>

                    {leave.reason && <Typography variant="body2">{leave.reason}</Typography>}

                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Requested {leave.created_at}
                        {enteredBySomeoneElse ? ` by ${leave.requested_by.name}` : ''}
                    </Typography>

                    {leave.status === 'CANCELLED' && (
                        <Alert severity="info">
                            Cancelled by {leave.cancelled_by ?? 'someone'} on {leave.cancelled_at}
                            {leave.cancel_reason ? `: ${leave.cancel_reason}` : ''}
                        </Alert>
                    )}

                    <Divider />

                    <Typography variant="subtitle2">Approval steps</Typography>
                    <List dense disablePadding>
                        {(leave.approvals ?? []).map((step) => (
                            <ListItem
                                key={step.id}
                                disableGutters
                                secondaryAction={
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        color={APPROVAL_STATUS_COLORS[step.status] ?? 'default'}
                                        label={step.status_label}
                                    />
                                }
                            >
                                <ListItemText
                                    primary={`${step.name} · ${step.approver}`}
                                    secondary={describeStep(step)}
                                />
                            </ListItem>
                        ))}
                    </List>

                    {current && (
                        <TextField
                            autoFocus
                            multiline
                            minRows={2}
                            label={current.label}
                            required={current.required}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            error={!!errors[current.field]}
                            helperText={errors[current.field]}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                {current ? (
                    <>
                        <Button onClick={() => setAction(null)} disabled={processing}>
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            color={current.color}
                            onClick={handleConfirm}
                            disabled={processing || (current.required && !text.trim())}
                        >
                            {current.title}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={onClose}>Close</Button>
                        {leave.can?.cancel && (
                            <Button color="warning" variant="outlined" onClick={choose('cancel')}>
                                Cancel leave
                            </Button>
                        )}
                        {leave.can?.approve && (
                            <>
                                <Button color="error" variant="outlined" onClick={choose('reject')}>
                                    Reject
                                </Button>
                                <Button
                                    color="success"
                                    variant="contained"
                                    onClick={choose('approve')}
                                >
                                    Approve
                                </Button>
                            </>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default LeaveRequestDetails;
