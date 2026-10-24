import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '@inertiajs/react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Stack,
    Switch,
    TextField,
} from '@mui/material';

/**
 * Switch a test on for pre-orders by giving it a flow. A test without a flow keeps direct
 * ordering. Only new pre-orders follow a change; open ones keep the flow they started with.
 */
export default function PreOrderSettingsDialog({ test, flows, onClose }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        flow_id: null,
        can_be_main: true,
    });

    useEffect(() => {
        if (test) {
            setData({
                flow_id: test.flow_id ?? null,
                can_be_main: test.preorder?.can_be_main ?? true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [test]);

    const enabled = data.flow_id !== null;

    const close = () => {
        reset();
        onClose();
    };

    const save = () =>
        put(route('tests.pre-order', test.id), { preserveScroll: true, onSuccess: close });

    return (
        <Dialog open={Boolean(test)} onClose={close} maxWidth="xs" fullWidth>
            <DialogTitle>Pre-order settings · {test?.name}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={enabled}
                                onChange={(e) =>
                                    setData(
                                        'flow_id',
                                        e.target.checked ? (flows[0]?.id ?? null) : null,
                                    )
                                }
                                disabled={!flows.length}
                            />
                        }
                        label="Available for pre-order"
                    />
                    {enabled && (
                        <>
                            <TextField
                                select
                                label="Flow"
                                value={data.flow_id ?? ''}
                                onChange={(e) => setData('flow_id', Number(e.target.value))}
                                error={Boolean(errors.flow_id)}
                                helperText={
                                    errors.flow_id ||
                                    'Sets the stages a pre-order for this test walks through'
                                }
                                fullWidth
                            >
                                {flows.map((flow) => (
                                    <MenuItem key={flow.id} value={flow.id}>
                                        {flow.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={Boolean(data.can_be_main)}
                                        onChange={(e) => setData('can_be_main', e.target.checked)}
                                    />
                                }
                                label="Can be the main test"
                            />
                        </>
                    )}
                    <Alert severity="info" variant="outlined">
                        Centers can only order a switched-on test through a pre-order. Open
                        pre-orders keep their flow.
                    </Alert>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={close}>Cancel</Button>
                <Button onClick={save} variant="contained" disabled={processing}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

PreOrderSettingsDialog.propTypes = {
    test: PropTypes.object,
    flows: PropTypes.arrayOf(
        PropTypes.shape({ id: PropTypes.number.isRequired, name: PropTypes.string.isRequired }),
    ).isRequired,
    onClose: PropTypes.func.isRequired,
};
