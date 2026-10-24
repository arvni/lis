import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const describe = (h, labels) => {
    if (h.type === 'stage')
        return `${labels[h.from_stage] ?? 'Created'} → ${labels[h.to_stage] ?? h.to_stage}`;
    if (h.type === 'request') return `Request R${h.request}`;
    if (h.type === 'comment') return 'Message';
    if (h.type === 'document') return h.request ? `File for R${h.request}` : 'File';
    return h.type.charAt(0).toUpperCase() + h.type.slice(1);
};

/** Every stage change, request, decision and exception, oldest first. */
export default function HistoryTab({ preOrder }) {
    const labels = Object.fromEntries(preOrder.progress.map((s) => [s.code, s.label]));

    return (
        <Paper variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>When</TableCell>
                        <TableCell>What</TableCell>
                        <TableCell>Detail</TableCell>
                        <TableCell>By</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {preOrder.history.map((h, i) => (
                        <TableRow key={i}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(h.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>{describe(h, labels)}</TableCell>
                            <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{h.body}</TableCell>
                            <TableCell>{h.actor_name ?? h.side}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
}

HistoryTab.propTypes = { preOrder: PropTypes.object.isRequired };
