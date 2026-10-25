import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { router, useForm } from '@inertiajs/react';
import {
    Button,
    Chip,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Delete, Star, StarBorder } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch';
import { patientName } from './stage';

const STATUS_COLOR = {
    requested: 'default',
    recommended: 'info',
    approved: 'success',
    released: 'success',
};

/** The test lines, the main test (which sets the flow) and BION's Recommend tests picker. */
export default function TestsTab({ preOrder }) {
    const editable = preOrder.can.edit_tests;
    const [test, setTest] = useState(null);
    const { data, setData, post, processing, reset } = useForm({
        test_id: null,
        patient_ref: preOrder.main_patient_ref,
        qty: 1,
    });

    const add = () =>
        post(route('pre-orders.items.store', preOrder.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setTest(null);
            },
        });

    const makeMain = (testId) =>
        router.post(
            route('pre-orders.main-test', preOrder.id),
            { test_id: testId },
            { preserveScroll: true },
        );

    const togglePreTest = (item) =>
        router.post(
            route('pre-orders.items.pre-test', [preOrder.id, item.id]),
            { pre_test: !item.pre_test },
            { preserveScroll: true },
        );

    const drop = (itemId) =>
        router.delete(route('pre-orders.items.destroy', [preOrder.id, itemId]), {
            preserveScroll: true,
        });

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            {!preOrder.main_test && (
                <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                    No main test yet. Pick one with the star: it sets the flow.
                </Typography>
            )}
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox" />
                        <TableCell>Test</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit price</TableCell>
                        <TableCell>Added by</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {preOrder.items.map((item) => {
                        const isMain = item.test_id === preOrder.main_test?.id;
                        return (
                            <TableRow key={item.id}>
                                <TableCell padding="checkbox">
                                    <Tooltip title={isMain ? 'Main test' : 'Make main test'}>
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={!editable || isMain}
                                                onClick={() => makeMain(item.test_id)}
                                            >
                                                {isMain ? <Star color="warning" /> : <StarBorder />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    {item.test_name}{' '}
                                    <Typography
                                        component="span"
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {item.test_code}
                                    </Typography>
                                </TableCell>
                                <TableCell>{patientName(preOrder, item.patient_ref)}</TableCell>
                                <TableCell align="right">{item.qty}</TableCell>
                                <TableCell align="right">{item.unit_price ?? '—'}</TableCell>
                                <TableCell>
                                    {item.added_by === 'bion' ? 'BION' : 'Center'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        color={STATUS_COLOR[item.status] ?? 'default'}
                                        label={item.status}
                                    />
                                    {preOrder.can.set_pre_test && !isMain ? (
                                        <Tooltip title="Pre-tests go to the lab first, before the main tests">
                                            <Chip
                                                size="small"
                                                sx={{ ml: 1 }}
                                                variant={item.pre_test ? 'filled' : 'outlined'}
                                                color={item.pre_test ? 'secondary' : 'default'}
                                                label={item.pre_test ? 'Pre-test' : 'Mark pre-test'}
                                                onClick={() => togglePreTest(item)}
                                            />
                                        </Tooltip>
                                    ) : (
                                        item.pre_test && (
                                            <Chip
                                                size="small"
                                                sx={{ ml: 1 }}
                                                color="secondary"
                                                label="Pre-test"
                                            />
                                        )
                                    )}
                                    {item.release_key && (
                                        <Typography variant="caption" sx={{ ml: 1 }}>
                                            {item.release_key}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {editable && !isMain && (
                                        <IconButton
                                            size="small"
                                            onClick={() => drop(item.id)}
                                            aria-label="Remove test"
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {editable && (
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    sx={{ mt: 2 }}
                    alignItems="flex-start"
                >
                    <SelectSearch
                        label="Recommend a test"
                        size="small"
                        url={route('api.tests.list')}
                        value={test}
                        name="test"
                        sx={{ minWidth: 280 }}
                        onChange={(e) => {
                            setTest(e.target.value);
                            setData('test_id', e.target.value?.id ?? null);
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        label="For"
                        value={data.patient_ref ?? ''}
                        onChange={(e) => setData('patient_ref', e.target.value)}
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
                        value={data.qty}
                        onChange={(e) => setData('qty', Number(e.target.value))}
                        inputProps={{ min: 1, max: 20 }}
                        sx={{ width: 90 }}
                    />
                    <Button variant="outlined" onClick={add} disabled={!data.test_id || processing}>
                        Add
                    </Button>
                </Stack>
            )}

            {preOrder.dropped_items?.length > 0 && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 2 }}
                >
                    Removed: {preOrder.dropped_items.map((i) => i.test_name).join(', ')}
                </Typography>
            )}
        </Paper>
    );
}

TestsTab.propTypes = { preOrder: PropTypes.object.isRequired };
