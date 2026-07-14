import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Stack,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { FIELDS, SIZE_OPTIONS, MIN_REPEAT, MAX_REPEAT, clampRepeat } from './constants';

const PrintControls = ({
    fields,
    onToggleField,
    onSetFieldRepeat,
    onSetFieldSize,
    printOnlyBarcode,
}) => (
    <Paper variant="outlined" sx={{ mx: 2, mb: 2, p: 2, '@media print': { display: 'none' } }}>
        <Typography variant="subtitle2" gutterBottom>
            Label fields
        </Typography>
        {printOnlyBarcode && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                These settings apply to the barcode view (turn off “Print Series & Dates”).
            </Typography>
        )}
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">Show</TableCell>
                        <TableCell>Field</TableCell>
                        <TableCell align="center">Repeat (lines)</TableCell>
                        <TableCell align="center">Font size</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {FIELDS.map((f) => {
                        const cfg = fields[f.key];
                        return (
                            <TableRow key={f.key} hover selected={cfg.show}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        size="small"
                                        checked={cfg.show}
                                        onChange={() => onToggleField(f.key)}
                                        slotProps={{ input: { 'aria-label': `Show ${f.label}` } }}
                                    />
                                </TableCell>
                                <TableCell>{f.label}</TableCell>
                                <TableCell align="center">
                                    <Stack
                                        direction="row"
                                        spacing={0.5}
                                        sx={{ alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <IconButton
                                            size="small"
                                            aria-label={`Decrease repeats for ${f.label}`}
                                            disabled={!cfg.show || cfg.repeat <= MIN_REPEAT}
                                            onClick={() =>
                                                onSetFieldRepeat(f.key, clampRepeat(cfg.repeat - 1))
                                            }
                                        >
                                            <RemoveIcon fontSize="inherit" />
                                        </IconButton>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={cfg.repeat}
                                            disabled={!cfg.show}
                                            onChange={(e) =>
                                                onSetFieldRepeat(f.key, clampRepeat(e.target.value))
                                            }
                                            slotProps={{
                                                htmlInput: {
                                                    min: MIN_REPEAT,
                                                    max: MAX_REPEAT,
                                                    'aria-label': `Repeat count for ${f.label}`,
                                                    style: { textAlign: 'center', width: '3ch' },
                                                },
                                            }}
                                            sx={{ width: 64 }}
                                        />
                                        <IconButton
                                            size="small"
                                            aria-label={`Increase repeats for ${f.label}`}
                                            disabled={!cfg.show || cfg.repeat >= MAX_REPEAT}
                                            onClick={() =>
                                                onSetFieldRepeat(f.key, clampRepeat(cfg.repeat + 1))
                                            }
                                        >
                                            <AddIcon fontSize="inherit" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                                <TableCell align="center">
                                    {f.text ? (
                                        <ToggleButtonGroup
                                            size="small"
                                            exclusive
                                            value={cfg.size}
                                            disabled={!cfg.show}
                                            onChange={(_, value) =>
                                                value && onSetFieldSize(f.key, value)
                                            }
                                        >
                                            {SIZE_OPTIONS.map((s) => (
                                                <ToggleButton
                                                    key={s.value}
                                                    value={s.value}
                                                    aria-label={`${s.label} font for ${f.label}`}
                                                >
                                                    {s.short}
                                                </ToggleButton>
                                            ))}
                                        </ToggleButtonGroup>
                                    ) : (
                                        <Box
                                            component="span"
                                            sx={{ color: 'text.disabled' }}
                                            aria-hidden
                                        >
                                            —
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
);

export default PrintControls;
