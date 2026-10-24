import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

const HINTS = {
    ivf_pgt: 'IVF / PGT',
    pregnancy: 'Pregnancy',
    diagnosis: 'Diagnosis',
    carrier: 'Carrier',
    other: 'Other',
};

/** What the center sent. Every value is rendered as plain text. */
const KeyValues = ({ title, data }) => {
    const entries = Object.entries(data || {});
    if (!entries.length) return null;
    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">{title}</Typography>
            {entries.map(([key, value]) => (
                <Typography key={key} variant="body2">
                    <strong>{key.replace(/_/g, ' ')}:</strong>{' '}
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Typography>
            ))}
        </Box>
    );
};

KeyValues.propTypes = { title: PropTypes.string.isRequired, data: PropTypes.object };

export default function CaseTab({ preOrder }) {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2">
                {preOrder.start_mode === 'describe'
                    ? 'The center described the case'
                    : 'The center chose tests'}
                {preOrder.start_hint
                    ? ` · hint: ${HINTS[preOrder.start_hint] ?? preOrder.start_hint}`
                    : ''}
            </Typography>
            {preOrder.referral_reason && (
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {preOrder.referral_reason}
                </Typography>
            )}

            <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Ref</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>ID no.</TableCell>
                        <TableCell>Date of birth</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Relationship</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {preOrder.patients.map((p) => (
                        <TableRow key={p.ref} selected={p.ref === preOrder.main_patient_ref}>
                            <TableCell>{p.ref}</TableCell>
                            <TableCell>{p.fullName}</TableCell>
                            <TableCell>{p.idNo ?? '—'}</TableCell>
                            <TableCell>{p.dateOfBirth ?? '—'}</TableCell>
                            <TableCell>{p.gender ?? '—'}</TableCell>
                            <TableCell>
                                {p.relationship ??
                                    (p.ref === preOrder.main_patient_ref ? 'main patient' : '—')}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <KeyValues title="Clinical details" data={preOrder.clinical} />
            <KeyValues title="Scope" data={preOrder.scope} />
        </Paper>
    );
}

CaseTab.propTypes = { preOrder: PropTypes.object.isRequired };
