import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { router } from '@inertiajs/react';
import { Add as AddIcon, Replay as RebuildIcon } from '@mui/icons-material';
import { blankItem, num } from './InvoiceItemsField/constants.js';
import EmptyState from './InvoiceItemsField/EmptyState.jsx';
import InvoiceItemRow from './InvoiceItemsField/InvoiceItemRow.jsx';

/**
 * Flat editable invoice_items table.
 * - Auto rows (from acceptance_items) can be edited; editing locks them so the composer stops overwriting.
 * - Manual rows can be added freely (kind=manual_fee by default).
 * - Soft-deletes are staged via _destroy so the parent submits them as part of the form payload.
 * - "Reset to auto" clears _destroy and removes the local _dirty flag so the row can be unlocked server-side
 *   (not implemented here; would require a separate endpoint to clear locked_at).
 */
const InvoiceItemsField = ({ items = [], onChange, invoiceId }) => {
    const [openDescriptions, setOpenDescriptions] = useState({});

    const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

    const visibleItems = useMemo(() => safeItems.filter((it) => !it._destroy), [safeItems]);

    const emit = (next) => onChange('invoice_items', next);

    const replaceItem = (key, patch) => {
        const next = safeItems.map((it) => {
            const matchKey = it.id ?? it._new_id;
            if (matchKey === key) {
                return { ...it, ...patch };
            }
            return it;
        });
        emit(next);
    };

    const handleField = (key, field, value) => {
        const item = safeItems.find((it) => (it.id ?? it._new_id) === key);
        if (!item) return;

        const patch = { [field]: value };
        if (field === 'qty' || field === 'unit_price') {
            const qty = Math.max(1, parseInt(field === 'qty' ? value : item.qty, 10) || 1);
            const unit = num(field === 'unit_price' ? value : item.unit_price);
            patch.qty = qty;
            patch.unit_price = unit;
            patch.price = qty * unit;
        }
        // Touching an unlocked row marks it locked locally so the server-side sync also locks it.
        if (item.id && !item.locked) {
            patch.locked = true;
        }
        replaceItem(key, patch);
    };

    const handleDelete = (key) => {
        const item = safeItems.find((it) => (it.id ?? it._new_id) === key);
        if (!item) return;

        if (!item.id) {
            // Pure local row — drop it entirely.
            emit(safeItems.filter((it) => (it.id ?? it._new_id) !== key));
            return;
        }
        replaceItem(key, { _destroy: true });
    };

    const handleUndoDelete = (key) => {
        replaceItem(key, { _destroy: false });
    };

    const handleAdd = () => {
        emit([...safeItems, blankItem()]);
    };

    const handleRebuild = () => {
        if (!invoiceId) return;
        if (
            !window.confirm(
                'Rebuild invoice items from acceptance items?\n\n' +
                    '• Brings back deleted test/panel lines and resets their price, qty and discount to auto.\n' +
                    '• Manual lines are not affected.\n' +
                    '• This recomputes the invoice total even if it is paid or part of a statement — ' +
                    'the statement total will change too.\n\n' +
                    'Save any unsaved edits first — they are not included.',
            )
        ) {
            return;
        }
        router.post(
            route('invoices.items.rebuild', { invoice: invoiceId }),
            {},
            {
                preserveScroll: true,
                onError: (errs) => {
                    const msg = errs?.invoice || Object.values(errs || {})[0] || 'Rebuild failed.';
                    window.alert(msg);
                },
            },
        );
    };

    const handleResetToAuto = (item) => {
        if (!invoiceId || !item.id) return;
        if (
            !window.confirm(
                `Reset "${item.title}" to auto? The composer will recompute its price/qty/discount from the underlying acceptance items.`,
            )
        ) {
            return;
        }
        router.post(
            route('invoices.items.unlock', { invoice: invoiceId, item: item.id }),
            {},
            { preserveScroll: true },
        );
    };

    const canResetToAuto = (item) =>
        Boolean(
            invoiceId && item.id && item.locked && (item.kind === 'test' || item.kind === 'panel'),
        );

    const toggleDescription = (key) =>
        setOpenDescriptions((prev) => ({ ...prev, [key]: !prev[key] }));

    if (visibleItems.length === 0 && safeItems.length === 0) {
        return <EmptyState onAdd={handleAdd} />;
    }

    return (
        <Box>
            <Stack
                sx={{
                    mb: 2,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="subtitle1" fontWeight="medium">
                    Invoice Items
                </Typography>
                <Stack direction="row" spacing={1}>
                    {invoiceId && (
                        <Tooltip title="Bring back deleted test/panel lines and reset them to auto from the acceptance items">
                            <Button
                                startIcon={<RebuildIcon />}
                                variant="text"
                                size="small"
                                color="info"
                                onClick={handleRebuild}
                            >
                                Rebuild from acceptance
                            </Button>
                        </Tooltip>
                    )}
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={handleAdd}
                    >
                        Add Item
                    </Button>
                </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Item
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Qty
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Unit Price
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Discount
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Net
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Actions
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {safeItems.map((item) => {
                            const key = item.id ?? item._new_id;
                            return (
                                <InvoiceItemRow
                                    key={key}
                                    item={item}
                                    descriptionOpen={Boolean(openDescriptions[key])}
                                    canReset={canResetToAuto(item)}
                                    onField={handleField}
                                    onDelete={handleDelete}
                                    onUndoDelete={handleUndoDelete}
                                    onToggleDescription={toggleDescription}
                                    onResetToAuto={handleResetToAuto}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default InvoiceItemsField;
