import React from 'react';
import {
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    TextField,
    Chip,
    Stack,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { formatDate } from './constants';

const MIN_COPIES = 1;
const MAX_COPIES = 99;

const clampCopies = (value) => {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) return MIN_COPIES;
    return Math.min(MAX_COPIES, Math.max(MIN_COPIES, n));
};

const SelectionControls = ({
    materials,
    selection,
    onToggle,
    onSetCopies,
    onSelectAll,
    onSetAllCopies,
    totalLabels,
    selectedCount,
}) => {
    const allSelected = materials.every((m) => selection[m.id]?.selected);
    const someSelected = materials.some((m) => selection[m.id]?.selected);

    return (
        <Paper variant="outlined" sx={{ mx: 2, mb: 2, p: 2, '@media print': { display: 'none' } }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 1.5, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
                <Typography variant="subtitle2">Select materials & copies</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={`${selectedCount} selected · ${totalLabels} label${totalLabels === 1 ? '' : 's'}`}
                    />
                    <Button size="small" onClick={() => onSelectAll(true)}>
                        Select all
                    </Button>
                    <Button size="small" onClick={() => onSelectAll(false)}>
                        Clear
                    </Button>
                    <Button size="small" onClick={() => onSetAllCopies(1)}>
                        Reset copies
                    </Button>
                </Stack>
            </Stack>

            <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    size="small"
                                    checked={allSelected}
                                    indeterminate={!allSelected && someSelected}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    slotProps={{ input: { 'aria-label': 'Select all materials' } }}
                                />
                            </TableCell>
                            <TableCell>Barcode</TableCell>
                            <TableCell>Sample type</TableCell>
                            <TableCell>Tube series</TableCell>
                            <TableCell>Expire</TableCell>
                            <TableCell align="center">Copies</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {materials.map((material) => {
                            const entry = selection[material.id] ?? { selected: true, copies: 1 };
                            return (
                                <TableRow key={material.id} hover selected={entry.selected}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            size="small"
                                            checked={entry.selected}
                                            onChange={() => onToggle(material.id)}
                                            slotProps={{
                                                input: {
                                                    'aria-label': `Select material ${material.barcode}`,
                                                },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                        {material.barcode}
                                    </TableCell>
                                    <TableCell>{material.sample_type_name}</TableCell>
                                    <TableCell>{material.tube_series}</TableCell>
                                    <TableCell>
                                        {formatDate(material.expire_date || material.created_at)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack
                                            direction="row"
                                            spacing={0.5}
                                            sx={{ alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <IconButton
                                                size="small"
                                                aria-label={`Decrease copies for ${material.barcode}`}
                                                disabled={
                                                    !entry.selected || entry.copies <= MIN_COPIES
                                                }
                                                onClick={() =>
                                                    onSetCopies(
                                                        material.id,
                                                        clampCopies(entry.copies - 1),
                                                    )
                                                }
                                            >
                                                <RemoveIcon fontSize="inherit" />
                                            </IconButton>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={entry.copies}
                                                disabled={!entry.selected}
                                                onChange={(e) =>
                                                    onSetCopies(
                                                        material.id,
                                                        clampCopies(e.target.value),
                                                    )
                                                }
                                                slotProps={{
                                                    htmlInput: {
                                                        min: MIN_COPIES,
                                                        max: MAX_COPIES,
                                                        'aria-label': `Copies for ${material.barcode}`,
                                                        style: {
                                                            textAlign: 'center',
                                                            width: '3ch',
                                                        },
                                                    },
                                                }}
                                                sx={{ width: 64 }}
                                            />
                                            <IconButton
                                                size="small"
                                                aria-label={`Increase copies for ${material.barcode}`}
                                                disabled={
                                                    !entry.selected || entry.copies >= MAX_COPIES
                                                }
                                                onClick={() =>
                                                    onSetCopies(
                                                        material.id,
                                                        clampCopies(entry.copies + 1),
                                                    )
                                                }
                                            >
                                                <AddIcon fontSize="inherit" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default SelectionControls;
