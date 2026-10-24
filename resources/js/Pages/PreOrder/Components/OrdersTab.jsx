import React from 'react';
import PropTypes from 'prop-types';
import {
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { patientName } from './stage';

/** Released lines waiting for the center to place them, and the orders that came back. */
export default function OrdersTab({ preOrder }) {
    const placed = new Set(preOrder.linked_orders.map((o) => o.release_key));
    const testName = Object.fromEntries(preOrder.items.map((i) => [i.test_id, i.test_name]));

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2">Released to the center</Typography>
            {preOrder.orders_to_place.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Nothing released yet.
                </Typography>
            ) : (
                <Table size="small" sx={{ mb: 3 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Release</TableCell>
                            <TableCell>Purpose</TableCell>
                            <TableCell>Tests</TableCell>
                            <TableCell>Placed by the center</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preOrder.orders_to_place.map((o) => (
                            <TableRow key={o.release_key}>
                                <TableCell>{o.release_key}</TableCell>
                                <TableCell>{o.purpose}</TableCell>
                                <TableCell>
                                    {o.items
                                        .map(
                                            (i) =>
                                                `${testName[i.test_id] ?? i.test_id} (${patientName(preOrder, i.patient_ref)})`,
                                        )
                                        .join(', ')}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        color={placed.has(o.release_key) ? 'success' : 'warning'}
                                        label={placed.has(o.release_key) ? 'Yes' : 'Not yet'}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Typography variant="subtitle2">Orders in the lab</Typography>
            {preOrder.linked_orders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No order has arrived yet.
                </Typography>
            ) : (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Order</TableCell>
                            <TableCell>Release</TableCell>
                            <TableCell>Samples received</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preOrder.linked_orders.map((o) => (
                            <TableRow key={o.id}>
                                <TableCell>{o.order_id}</TableCell>
                                <TableCell>{o.release_key ?? '—'}</TableCell>
                                <TableCell>{o.received ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{o.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Paper>
    );
}

OrdersTab.propTypes = { preOrder: PropTypes.object.isRequired };
