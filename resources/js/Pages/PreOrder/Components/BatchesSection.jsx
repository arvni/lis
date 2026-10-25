import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { router } from '@inertiajs/react';
import {
    Alert,
    Button,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';

const MODE_LABEL = {
    per_batch: 'each batch is its own order',
    pooled: 'batches pool into the first order',
    join: 'later samples join the first order',
};

const post = (name, preOrder, data = {}) =>
    router.post(route(name, preOrder.id), data, { preserveScroll: true });

/**
 * Every shipment on the case with the order it opened or joined. BION raises a sample issue on
 * one batch, closes the batches for the center, confirms the next step after the workup on the
 * center's behalf, and starts testing once the sample list is checked.
 */
export default function BatchesSection({ preOrder, canStartTesting }) {
    const { can } = preOrder;
    const [issue, setIssue] = useState({ batch: null, reason: '' });
    const [note, setNote] = useState('');

    return (
        <>
            <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Sample batches</Typography>
                <Typography variant="caption" color="text.secondary">
                    {MODE_LABEL[preOrder.batch_mode]}
                </Typography>
            </Stack>
            {preOrder.batches.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    No samples released yet.
                </Typography>
            ) : (
                <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Batch</TableCell>
                            <TableCell>Order</TableCell>
                            <TableCell>Lab</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preOrder.batches.map((b) => (
                            <TableRow key={b.key}>
                                <TableCell>
                                    {b.label}{' '}
                                    <Typography
                                        component="span"
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {b.key}
                                    </Typography>
                                    {b.issue && (
                                        <Chip
                                            size="small"
                                            color="error"
                                            sx={{ ml: 1 }}
                                            label={`Sample issue: ${b.issue}`}
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    {b.order?.order_id ??
                                        (b.order_key === b.key
                                            ? 'Not placed yet'
                                            : `joins ${b.order_key}`)}
                                </TableCell>
                                <TableCell>
                                    {b.order
                                        ? `${b.order.received ? 'received' : 'not received'} · ${b.order.status}`
                                        : '—'}
                                </TableCell>
                                <TableCell align="right">
                                    {can.sample_issue && (
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => setIssue({ batch: b.key, reason: '' })}
                                        >
                                            Sample issue
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {issue.batch && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label={`What is wrong with ${issue.batch}`}
                        value={issue.reason}
                        onChange={(e) => setIssue({ ...issue, reason: e.target.value })}
                        inputProps={{ maxLength: 1000 }}
                    />
                    <Button
                        variant="contained"
                        color="error"
                        disabled={issue.reason.trim() === ''}
                        onClick={() => {
                            post('pre-orders.batches.issue', preOrder, issue);
                            setIssue({ batch: null, reason: '' });
                        }}
                    >
                        Ask for a replacement
                    </Button>
                    <Button onClick={() => setIssue({ batch: null, reason: '' })}>Cancel</Button>
                </Stack>
            )}

            {can.confirm_next_step && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    The pre-test workup is complete. The center confirms the next step in the
                    portal; record it here if they told you another way.
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                        <TextField
                            size="small"
                            label="What the center said"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            sx={{ minWidth: 280 }}
                        />
                        <Button
                            variant="contained"
                            onClick={() =>
                                post('pre-orders.next-step', preOrder, { reason: note || null })
                            }
                        >
                            Release the main tests
                        </Button>
                    </Stack>
                </Alert>
            )}

            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {can.close_batches && (
                    <Button
                        variant="outlined"
                        onClick={() => post('pre-orders.batches.close', preOrder)}
                    >
                        No more batches
                    </Button>
                )}
                {can.start_testing && canStartTesting && (
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => post('pre-orders.testing.start', preOrder)}
                    >
                        Sample list checked — start testing
                    </Button>
                )}
            </Stack>
        </>
    );
}

BatchesSection.propTypes = {
    preOrder: PropTypes.object.isRequired,
    canStartTesting: PropTypes.bool,
};
