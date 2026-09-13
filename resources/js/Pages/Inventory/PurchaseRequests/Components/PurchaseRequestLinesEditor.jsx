import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PurchaseRequestLineCard from './PurchaseRequestLineCard';
import { emptyLine, formatAmount, lineTotal, newLineKey } from './lineState';

/** One line's validation errors, keyed by field ("lines.2.qty" → "qty"). */
const errorsForLine = (errors, index) => {
    const prefix = `lines.${index}.`;

    return Object.fromEntries(
        Object.entries(errors)
            .filter(([key]) => key.startsWith(prefix))
            .map(([key, message]) => [key.slice(prefix.length), message]),
    );
};

/**
 * The "Requested Items" editor shared by the create and edit pages: a card per
 * line, an add button right under the last line, and a running estimated total.
 *
 * Props:
 *   lines    – form lines (see lineState.js)
 *   onChange – fn(lines)
 *   errors   – Inertia validation errors, keyed `lines.{index}.{field}`
 *   units    – all units, offered to a line that isn't in the catalogue
 */
const PurchaseRequestLinesEditor = ({ lines, onChange, errors = {}, units = [] }) => {
    // Only a line the user just added or switched gets focus — never on page load.
    const [focusKey, setFocusKey] = useState(null);

    const patchLine = (key, patch) =>
        onChange(lines.map((line) => (line._key === key ? { ...line, ...patch } : line)));

    const addLine = () => {
        const line = emptyLine();
        setFocusKey(line._key);
        onChange([...lines, line]);
    };

    const duplicateLine = (key) => {
        const index = lines.findIndex((line) => line._key === key);
        const copy = { ...lines[index], _key: newLineKey() };
        onChange([...lines.slice(0, index + 1), copy, ...lines.slice(index + 1)]);
    };

    const handlersFor = (line) => ({
        // A picked item starts on its default unit; its other units are one click away.
        onItemChange: (item) =>
            patchLine(line._key, {
                _item: item,
                item_id: item?.id ?? null,
                _unit: item?.default_unit ?? null,
                unit_id: item?.default_unit?.id ?? null,
            }),
        // Switching between a catalogue item and a typed name starts the item and
        // its unit (whose options depend on it) over.
        onManualChange: (manual) => {
            setFocusKey(line._key);
            patchLine(line._key, {
                _manual: manual,
                _item: null,
                item_id: null,
                item_name: '',
                _unit: null,
                unit_id: null,
            });
        },
        onUnitChange: (unit) => patchLine(line._key, { _unit: unit, unit_id: unit?.id ?? null }),
        onSupplierChange: (supplier) =>
            patchLine(line._key, {
                _preferred_supplier: supplier,
                preferred_supplier_id: supplier?.id ?? '',
            }),
        onFieldChange: (field, value) => patchLine(line._key, { [field]: value }),
        onRemove: () => onChange(lines.filter((l) => l._key !== line._key)),
        onDuplicate: () => duplicateLine(line._key),
    });

    if (lines.length === 0) {
        return (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <ShoppingCartOutlinedIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                    No items yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Pick items from the catalogue, or type the name of anything that isn&apos;t in
                    it yet.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={addLine}>
                    Add the first item
                </Button>
                {errors.lines && (
                    <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                        {errors.lines}
                    </Alert>
                )}
            </Paper>
        );
    }

    const totals = lines.map(lineTotal);
    const priced = totals.filter((total) => total !== null);
    const estimatedTotal = priced.reduce((sum, total) => sum + total, 0);

    return (
        <Stack spacing={2}>
            {lines.map((line, index) => (
                <PurchaseRequestLineCard
                    key={line._key}
                    line={line}
                    index={index}
                    total={totals[index]}
                    errors={errorsForLine(errors, index)}
                    units={units}
                    autoFocus={line._key === focusKey}
                    {...handlersFor(line)}
                />
            ))}

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addLine}
                    sx={{ borderStyle: 'dashed' }}
                >
                    Add another item
                </Button>
                <Typography variant="body2" color="text.secondary">
                    {lines.length} {lines.length === 1 ? 'item' : 'items'}
                    {priced.length > 0 && (
                        <>
                            {' · Estimated total '}
                            <Box component="strong" sx={{ color: 'text.primary' }}>
                                {formatAmount(estimatedTotal)}
                            </Box>
                            {priced.length < lines.length && ' (some items have no price)'}
                        </>
                    )}
                </Typography>
            </Box>

            {errors.lines && <Alert severity="error">{errors.lines}</Alert>}
        </Stack>
    );
};

export default PurchaseRequestLinesEditor;
