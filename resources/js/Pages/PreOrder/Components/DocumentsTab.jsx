import React from 'react';
import PropTypes from 'prop-types';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Link,
} from '@mui/material';

const TAG_LABEL = {
    MEDICAL_HISTORY: 'Medical history',
    ID_CARD: 'ID card',
    CONSENT_FORM: 'Consent form',
    REQUEST_FORM: 'Request form',
    PRESCRIPTION: 'Prescription',
    DOCUMENT: 'Other',
};

/** Files the center attached. Each one passed the upload checks before it was stored. */
export default function DocumentsTab({ preOrder }) {
    const requestOf = Object.fromEntries(
        preOrder.history
            .filter((h) => h.type === 'document' && h.request)
            .map((h) => [h.body, h.request]),
    );

    if (preOrder.documents.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    The center hasn&apos;t sent any files yet.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>File</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>For request</TableCell>
                        <TableCell>Received</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {preOrder.documents.map((d) => (
                        <TableRow key={d.hash}>
                            <TableCell>
                                <Link
                                    href={route('pre-orders.documents.show', [preOrder.id, d.hash])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {d.name}
                                </Link>
                            </TableCell>
                            <TableCell>{TAG_LABEL[d.tag] ?? d.tag}</TableCell>
                            <TableCell>
                                {requestOf[d.name] ? `R${requestOf[d.name]}` : '—'}
                            </TableCell>
                            <TableCell>
                                {d.created_at ? new Date(d.created_at).toLocaleString() : ''}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
}

DocumentsTab.propTypes = { preOrder: PropTypes.object.isRequired };
