import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { router, useForm } from '@inertiajs/react';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    IconButton,
    MenuItem,
    Divider,
    FormControlLabel,
    FormGroup,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch';
import { patientName } from './stage';

const TYPES = [
    { value: 'information', label: 'Information / document' },
    { value: 'samples', label: 'Additional samples' },
];

// Once the tests are released, an additional test comes as a request with its own quotation.
const TEST_TYPE = { value: 'test', label: 'Additional test' };

const STATUS_COLOR = {
    open: 'warning',
    answered: 'info',
    awaiting_finance: 'warning',
    order_created: 'info',
    closed: 'success',
    declined: 'default',
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

/** Requests to the center. During review they move the stage; later they sit on top of it. */
export default function RequestsTab({ preOrder }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        types: ['information'],
        reason: '',
        message: '',
        blocking: false,
        due_at: '',
        tests: [],
        retest: false,
    });
    const [picked, setPicked] = useState(null);
    const types = preOrder.can.request_test ? [...TYPES, TEST_TYPE] : TYPES;
    const wantsTests = data.types.includes('test');

    const addTest = (test) => {
        setPicked(null);
        if (!test || data.tests.some((t) => t.test_id === test.id)) return;
        setData('tests', [
            ...data.tests,
            { test_id: test.id, name: test.name, patient_ref: preOrder.main_patient_ref, qty: 1 },
        ]);
    };
    const setTestLine = (index, field, value) =>
        setData(
            'tests',
            data.tests.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
        );

    const toggleType = (value, checked) =>
        setData('types', checked ? [...data.types, value] : data.types.filter((t) => t !== value));

    const raise = () =>
        post(route('pre-orders.requests.store', preOrder.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });

    const close = (number, declined) =>
        router.post(
            route('pre-orders.requests.close', [preOrder.id, number]),
            { declined },
            { preserveScroll: true },
        );

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            {preOrder.requests.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    No requests yet.
                </Typography>
            )}
            <Stack spacing={2} divider={<Divider />}>
                {preOrder.requests.map((r) => (
                    <Box key={r.number}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                        >
                            <Typography fontWeight={600}>{r.label}</Typography>
                            <Chip size="small" color={STATUS_COLOR[r.status]} label={r.status} />
                            {r.blocking && (
                                <Chip
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    label="Blocking"
                                />
                            )}
                            <Typography variant="caption" color="text.secondary">
                                {r.types.join(' + ')} · {r.reason} · due {fmt(r.due_at)}
                            </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                            {r.message}
                        </Typography>
                        {r.answer && (
                            <Typography
                                variant="body2"
                                sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                                color="info.main"
                            >
                                Center: {r.answer}
                            </Typography>
                        )}
                        {preOrder.items
                            .filter((i) => i.request === r.number)
                            .map((i) => (
                                <Typography key={i.id} variant="body2" sx={{ mt: 0.5 }}>
                                    + {i.test_name} for {patientName(preOrder, i.patient_ref)}
                                    {i.quotation ? ` · ${i.quotation}` : ''} · {i.status}
                                </Typography>
                            ))}
                        {['open', 'answered', 'awaiting_finance', 'order_created'].includes(
                            r.status,
                        ) && (
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button size="small" onClick={() => close(r.number, false)}>
                                    {r.status === 'answered' ? 'Accept answer & close' : 'Withdraw'}
                                </Button>
                                <Button
                                    size="small"
                                    color="inherit"
                                    onClick={() => close(r.number, true)}
                                >
                                    Mark declined
                                </Button>
                            </Stack>
                        )}
                    </Box>
                ))}
            </Stack>

            {preOrder.can.raise_request && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Ask the center
                    </Typography>
                    <FormGroup row>
                        {types.map((t) => (
                            <FormControlLabel
                                key={t.value}
                                control={
                                    <Checkbox
                                        checked={data.types.includes(t.value)}
                                        onChange={(e) => toggleType(t.value, e.target.checked)}
                                    />
                                }
                                label={t.label}
                            />
                        ))}
                    </FormGroup>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                        <TextField
                            size="small"
                            label="Reason"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            error={Boolean(errors.reason)}
                            helperText={errors.reason || 'e.g. pedigree, consent, insufficient DNA'}
                            inputProps={{ maxLength: 64 }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="Due"
                            value={data.due_at}
                            onChange={(e) => setData('due_at', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            helperText={errors.due_at || 'Default: in 7 days'}
                            error={Boolean(errors.due_at)}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={data.blocking}
                                    onChange={(e) => setData('blocking', e.target.checked)}
                                />
                            }
                            label="Blocking (the lab can't continue)"
                        />
                    </Stack>
                    {wantsTests && (
                        <Box sx={{ mt: 1 }}>
                            <SelectSearch
                                label="Add a test"
                                size="small"
                                url={route('api.tests.list')}
                                value={picked}
                                name="test"
                                sx={{ minWidth: 280 }}
                                onChange={(e) => addTest(e.target.value)}
                            />
                            {data.tests.map((t, index) => (
                                <Stack
                                    key={t.test_id}
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ mt: 1 }}
                                >
                                    <Typography variant="body2" sx={{ minWidth: 180 }}>
                                        {t.name}
                                    </Typography>
                                    <TextField
                                        select
                                        size="small"
                                        label="For"
                                        value={t.patient_ref ?? ''}
                                        onChange={(e) =>
                                            setTestLine(index, 'patient_ref', e.target.value)
                                        }
                                        sx={{ minWidth: 180 }}
                                    >
                                        {preOrder.patients.map((p) => (
                                            <MenuItem key={p.ref} value={p.ref}>
                                                {p.fullName}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        size="small"
                                        type="number"
                                        label="Qty"
                                        value={t.qty}
                                        onChange={(e) =>
                                            setTestLine(index, 'qty', Number(e.target.value))
                                        }
                                        inputProps={{ min: 1, max: 20 }}
                                        sx={{ width: 90 }}
                                    />
                                    <IconButton
                                        size="small"
                                        aria-label="Remove test"
                                        onClick={() =>
                                            setData(
                                                'tests',
                                                data.tests.filter((_, i) => i !== index),
                                            )
                                        }
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Stack>
                            ))}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={data.retest}
                                        onChange={(e) => setData('retest', e.target.checked)}
                                    />
                                }
                                label="Re-test with new work (e.g. another method)"
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                Priced from the catalogue and sent to the center as its own
                                quotation. Approved lines go to the lab on an add-on order; the main
                                order is not touched.
                            </Typography>
                            {errors.tests && (
                                <Typography variant="caption" color="error">
                                    {errors.tests}
                                </Typography>
                            )}
                        </Box>
                    )}
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        sx={{ mt: 1 }}
                        label="Message to the center"
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        error={Boolean(errors.message || errors.types)}
                        helperText={errors.message || errors.types}
                    />
                    <Button
                        sx={{ mt: 1 }}
                        variant="contained"
                        onClick={raise}
                        disabled={
                            processing || !data.types.length || (wantsTests && !data.tests.length)
                        }
                    >
                        Send request
                    </Button>
                </Box>
            )}
        </Paper>
    );
}

RequestsTab.propTypes = { preOrder: PropTypes.object.isRequired };
