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
    IconButton,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';

const NEW_FIELD = { key: '', label: '', type: 'number', needs_finance: true, threshold: 2 };

/**
 * Switch a test on for pre-orders by giving it a flow. A test without a flow keeps direct
 * ordering. Only new pre-orders follow a change; open ones keep the flow they started with.
 */
export default function PreOrderSettingsDialog({ test, flows, onClose }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        flow_id: null,
        can_be_main: true,
        scope: [],
    });

    useEffect(() => {
        if (test) {
            setData({
                flow_id: test.flow_id ?? null,
                can_be_main: test.preorder?.can_be_main ?? true,
                scope: test.preorder?.scope ?? [],
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [test]);

    const enabled = data.flow_id !== null;

    const setField = (index, name, value) =>
        setData(
            'scope',
            data.scope.map((f, i) => (i === index ? { ...f, [name]: value } : f)),
        );

    const close = () => {
        reset();
        onClose();
    };

    const save = () =>
        put(route('tests.pre-order', test.id), { preserveScroll: true, onSuccess: close });

    return (
        <Dialog open={Boolean(test)} onClose={close} maxWidth="sm" fullWidth>
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
                            <Typography variant="subtitle2">Scope questions</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Asked on the pre-order, e.g. genes, HLA or linkage. An answer marked
                                as raising the price sends the center a quotation first.
                            </Typography>
                            {data.scope.map((field, index) => (
                                <Stack
                                    key={index}
                                    spacing={1}
                                    sx={{ pl: 1, borderLeft: 2, borderColor: 'divider' }}
                                >
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            size="small"
                                            label="Key"
                                            value={field.key}
                                            onChange={(e) =>
                                                setField(index, 'key', e.target.value.toLowerCase())
                                            }
                                            error={Boolean(errors[`scope.${index}.key`])}
                                            helperText={
                                                errors[`scope.${index}.key`] || 'e.g. genes'
                                            }
                                            inputProps={{ maxLength: 32 }}
                                        />
                                        <TextField
                                            size="small"
                                            label="Question"
                                            value={field.label}
                                            onChange={(e) =>
                                                setField(index, 'label', e.target.value)
                                            }
                                            error={Boolean(errors[`scope.${index}.label`])}
                                            inputProps={{ maxLength: 64 }}
                                        />
                                        <IconButton
                                            size="small"
                                            aria-label="Remove question"
                                            onClick={() =>
                                                setData(
                                                    'scope',
                                                    data.scope.filter((_, i) => i !== index),
                                                )
                                            }
                                        >
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <TextField
                                            select
                                            size="small"
                                            label="Answer"
                                            value={field.type}
                                            onChange={(e) =>
                                                setField(index, 'type', e.target.value)
                                            }
                                            sx={{ minWidth: 120 }}
                                        >
                                            <MenuItem value="number">Number</MenuItem>
                                            <MenuItem value="yes_no">Yes / no</MenuItem>
                                        </TextField>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={Boolean(field.needs_finance)}
                                                    onChange={(e) =>
                                                        setField(
                                                            index,
                                                            'needs_finance',
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            }
                                            label="Raises the price"
                                        />
                                        {field.type === 'number' && field.needs_finance && (
                                            <TextField
                                                size="small"
                                                type="number"
                                                label="From"
                                                value={field.threshold ?? 1}
                                                onChange={(e) =>
                                                    setField(
                                                        index,
                                                        'threshold',
                                                        Number(e.target.value),
                                                    )
                                                }
                                                inputProps={{ min: 1, max: 99 }}
                                                sx={{ width: 90 }}
                                            />
                                        )}
                                    </Stack>
                                </Stack>
                            ))}
                            <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => setData('scope', [...data.scope, { ...NEW_FIELD }])}
                                disabled={data.scope.length >= 10}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Add question
                            </Button>
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
