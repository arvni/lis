import React from 'react';
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { emptyEntitlement, errorsForRow } from './rowState';

/**
 * How much leave of each kind the contract grants. The figure is the whole allowance for the
 * contract's duration — it is never prorated — which the helper text says out loud, because a
 * yearly rate is the obvious wrong assumption.
 *
 * Props:
 *   rows       – [{ _key, leave_kind_id, entitled_days }]
 *   onChange   – fn(rows)
 *   errors     – Inertia validation errors, keyed `entitlements.{index}.{field}`
 *   leaveKinds – [{ id, name }]
 */
const EntitlementsEditor = ({ rows, onChange, errors = {}, leaveKinds = [] }) => {
    const patch = (key, change) =>
        onChange(rows.map((row) => (row._key === key ? { ...row, ...change } : row)));

    const taken = (key) =>
        rows.filter((row) => row._key !== key).map((row) => Number(row.leave_kind_id));

    return (
        <Box>
            {rows.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    No leave allowance yet. Without one, this person’s remaining leave can’t be
                    worked out.
                </Typography>
            )}

            {rows.map((row, index) => {
                const rowErrors = errorsForRow(errors, 'entitlements', index);
                const unavailable = taken(row._key);

                return (
                    <Grid container spacing={2} key={row._key} sx={{ mb: 2 }} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth required error={!!rowErrors.leave_kind_id}>
                                <InputLabel id={`kind-${row._key}`}>Leave kind</InputLabel>
                                <Select
                                    labelId={`kind-${row._key}`}
                                    label="Leave kind"
                                    value={row.leave_kind_id ?? ''}
                                    onChange={(e) => patch(row._key, { leave_kind_id: e.target.value })}
                                >
                                    {leaveKinds.map((kind) => (
                                        <MenuItem
                                            key={kind.id}
                                            value={kind.id}
                                            // Each kind can only be granted once per contract.
                                            disabled={unavailable.includes(kind.id)}
                                        >
                                            {kind.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 10, sm: 5 }}>
                            <TextField
                                label="Days for the whole contract"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ step: '0.5', min: '0' }}
                                value={row.entitled_days ?? ''}
                                onChange={(e) => patch(row._key, { entitled_days: e.target.value })}
                                error={!!rowErrors.entitled_days}
                                helperText={rowErrors.entitled_days || 'Not a yearly rate'}
                            />
                        </Grid>
                        <Grid size={{ xs: 2, sm: 1 }}>
                            <IconButton
                                aria-label="Remove allowance"
                                onClick={() => onChange(rows.filter((r) => r._key !== row._key))}
                            >
                                <DeleteIcon color="error" />
                            </IconButton>
                        </Grid>
                    </Grid>
                );
            })}

            <Button
                startIcon={<AddIcon />}
                onClick={() => onChange([...rows, emptyEntitlement()])}
                disabled={rows.length >= leaveKinds.length}
            >
                Add leave kind
            </Button>
        </Box>
    );
};

export default EntitlementsEditor;
