import React from 'react';
import PropTypes from 'prop-types';
import { useForm, usePage } from '@inertiajs/react';
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
} from '@mui/material';

const TYPES = [
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'not_eligible', label: 'Not eligible' },
    { value: 'not_proceeding', label: 'Patient no longer proceeding' },
];

/** End the pre-order with a reason. After samples arrive this needs the override permission. */
export default function CloseDialog({ preOrder, open, onClose }) {
    const { auth } = usePage().props;
    const canOverride = auth.permissions.includes('PreOrders.Cases.Override');
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'cancelled',
        reason: '',
        comment: '',
        override: false,
    });
    const close = () => {
        reset();
        onClose();
    };
    const submit = () =>
        post(route('pre-orders.close', preOrder.id), { preserveScroll: true, onSuccess: close });

    return (
        <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
            <DialogTitle>Close {preOrder.code}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        select
                        label="Outcome"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                    >
                        {TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                                {t.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Reason"
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        error={Boolean(errors.reason)}
                        helperText={errors.reason}
                        inputProps={{ maxLength: 64 }}
                    />
                    <TextField
                        label="Comment"
                        multiline
                        minRows={3}
                        value={data.comment}
                        onChange={(e) => setData('comment', e.target.value)}
                        error={Boolean(errors.comment)}
                        helperText={errors.comment}
                    />
                    {canOverride && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={data.override}
                                    onChange={(e) => setData('override', e.target.checked)}
                                />
                            }
                            label="Override: samples have already arrived"
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={close}>Back</Button>
                <Button color="error" variant="contained" onClick={submit} disabled={processing}>
                    Close pre-order
                </Button>
            </DialogActions>
        </Dialog>
    );
}

CloseDialog.propTypes = {
    preOrder: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
