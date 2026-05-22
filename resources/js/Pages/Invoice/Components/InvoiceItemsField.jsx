import React, {useMemo, useState} from 'react';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {router} from '@inertiajs/react';
import {
    Add as AddIcon,
    AutoAwesome as AutoIcon,
    Delete as DeleteIcon,
    Lock as LockIcon,
    Notes as NotesIcon,
    Receipt as ReceiptIcon,
    RestartAlt as ResetIcon,
    Undo as UndoIcon,
} from '@mui/icons-material';

const KIND_LABEL = {
    test: 'Test',
    panel: 'Panel',
    manual_fee: 'Manual',
    adjustment: 'Adjustment',
};

const KIND_COLOR = {
    test: 'primary',
    panel: 'secondary',
    manual_fee: 'warning',
    adjustment: 'info',
};

const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

const blankItem = () => ({
    id: null,
    _new_id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'manual_fee',
    title: '',
    description: '',
    qty: 1,
    unit_price: 0,
    discount: 0,
    price: 0,
    locked: true,
    test: null,
});

/**
 * Flat editable invoice_items table.
 * - Auto rows (from acceptance_items) can be edited; editing locks them so the composer stops overwriting.
 * - Manual rows can be added freely (kind=manual_fee by default).
 * - Soft-deletes are staged via _destroy so the parent submits them as part of the form payload.
 * - "Reset to auto" clears _destroy and removes the local _dirty flag so the row can be unlocked server-side
 *   (not implemented here; would require a separate endpoint to clear locked_at).
 */
const InvoiceItemsField = ({items = [], onChange, invoiceId}) => {
    const [openDescriptions, setOpenDescriptions] = useState({});

    const safeItems = Array.isArray(items) ? items : [];

    const visibleItems = useMemo(
        () => safeItems.filter((it) => !it._destroy),
        [safeItems],
    );

    const emit = (next) => onChange('invoice_items', next);

    const replaceItem = (key, patch) => {
        const next = safeItems.map((it) => {
            const matchKey = it.id ?? it._new_id;
            if (matchKey === key) {
                return {...it, ...patch};
            }
            return it;
        });
        emit(next);
    };

    const handleField = (key, field, value) => {
        const item = safeItems.find((it) => (it.id ?? it._new_id) === key);
        if (!item) return;

        const patch = {[field]: value};
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
        replaceItem(key, {_destroy: true});
    };

    const handleUndoDelete = (key) => {
        replaceItem(key, {_destroy: false});
    };

    const handleAdd = () => {
        emit([...safeItems, blankItem()]);
    };

    const handleResetToAuto = (item) => {
        if (!invoiceId || !item.id) return;
        if (!window.confirm(
            `Reset "${item.title}" to auto? The composer will recompute its price/qty/discount from the underlying acceptance items.`,
        )) {
            return;
        }
        router.post(
            route('invoices.items.unlock', {invoice: invoiceId, item: item.id}),
            {},
            {preserveScroll: true},
        );
    };

    const canResetToAuto = (item) =>
        Boolean(invoiceId && item.id && item.locked && (item.kind === 'test' || item.kind === 'panel'));

    const toggleDescription = (key) =>
        setOpenDescriptions((prev) => ({...prev, [key]: !prev[key]}));

    // Description editor is collapsed by default — even when content exists.
    // Existing content is shown as a small caption under the title row instead.
    const isDescriptionOpen = (key) => Boolean(openDescriptions[key]);

    const renderKindChip = (item) => (
        <Chip
            size="small"
            label={KIND_LABEL[item.kind] ?? item.kind}
            color={KIND_COLOR[item.kind] ?? 'default'}
            variant="outlined"
        />
    );

    const renderLockBadge = (item) => {
        if (item.locked) {
            return (
                <Tooltip title="Locked — composer won't overwrite this row">
                    <LockIcon fontSize="small" sx={{color: 'warning.main'}}/>
                </Tooltip>
            );
        }
        return (
            <Tooltip title="Auto-managed by composer">
                <AutoIcon fontSize="small" sx={{color: 'text.disabled'}}/>
            </Tooltip>
        );
    };

    const renderRow = (item) => {
        const key = item.id ?? item._new_id;
        const isDeleting = !!item._destroy;

        if (isDeleting) {
            return (
                <TableRow key={key} sx={{backgroundColor: 'error.50', opacity: 0.7}}>
                    <TableCell colSpan={6}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <DeleteIcon fontSize="small" color="error"/>
                            <Typography variant="body2" color="error.main">
                                <strong>{item.title}</strong> will be removed on save
                                {item.kind !== 'manual_fee' && item.kind !== 'adjustment' &&
                                    ' (acceptance items will be unlinked)'}.
                            </Typography>
                            <Box sx={{flex: 1}}/>
                            <Button
                                size="small"
                                startIcon={<UndoIcon/>}
                                onClick={() => handleUndoDelete(key)}
                            >
                                Undo
                            </Button>
                        </Stack>
                    </TableCell>
                </TableRow>
            );
        }

        const descriptionOpen = isDescriptionOpen(key);
        const hasDescription = Boolean(item.description);

        return (
            <React.Fragment key={key}>
                <TableRow hover sx={{'& > td': {verticalAlign: 'middle', borderBottom: descriptionOpen ? 0 : undefined}}}>
                    <TableCell sx={{minWidth: 260}}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            {renderKindChip(item)}
                            {renderLockBadge(item)}
                            <TextField
                                size="small"
                                value={item.code || ''}
                                placeholder="Code"
                                onChange={(e) => handleField(key, 'code', e.target.value)}
                                sx={{width: 110, flexShrink: 0}}
                                slotProps={{htmlInput: {style: {fontFamily: 'monospace', fontSize: '0.8125rem'}}}}
                            />
                            <TextField
                                size="small"
                                fullWidth
                                value={item.title || ''}
                                placeholder="Item title"
                                onChange={(e) => handleField(key, 'title', e.target.value)}
                            />
                        </Stack>
                        {hasDescription && !descriptionOpen && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                onClick={() => toggleDescription(key)}
                                sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    ml: 0.5,
                                    cursor: 'pointer',
                                    fontStyle: 'italic',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 380,
                                    '&:hover': {color: 'primary.main'},
                                }}
                            >
                                {item.description}
                            </Typography>
                        )}
                    </TableCell>

                    <TableCell align="right" sx={{width: 90}}>
                        <TextField
                            size="small"
                            type="number"
                            value={item.qty ?? 1}
                            onChange={(e) => handleField(key, 'qty', e.target.value)}
                            slotProps={{htmlInput: {min: 1, step: 1, style: {textAlign: 'right'}}}}
                            fullWidth
                        />
                    </TableCell>

                    <TableCell align="right" sx={{width: 130}}>
                        <TextField
                            size="small"
                            type="number"
                            value={item.unit_price ?? 0}
                            onChange={(e) => handleField(key, 'unit_price', e.target.value)}
                            slotProps={{htmlInput: {min: 0, step: 0.001, style: {textAlign: 'right'}}}}
                            fullWidth
                        />
                    </TableCell>

                    <TableCell align="right" sx={{width: 130}}>
                        <TextField
                            size="small"
                            type="number"
                            value={item.discount ?? 0}
                            onChange={(e) => handleField(key, 'discount', num(e.target.value))}
                            slotProps={{htmlInput: {min: 0, step: 0.001, style: {textAlign: 'right'}}}}
                            fullWidth
                        />
                    </TableCell>

                    <TableCell align="right" sx={{width: 120}}>
                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                            {(num(item.price) - num(item.discount)).toFixed(3)}
                        </Typography>
                    </TableCell>

                    <TableCell align="center" sx={{width: 130}}>
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                            <Tooltip title={descriptionOpen ? 'Hide description' : (hasDescription ? 'Edit description' : 'Add description')}>
                                <IconButton
                                    size="small"
                                    color={hasDescription ? 'primary' : 'default'}
                                    onClick={() => toggleDescription(key)}
                                >
                                    <NotesIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                            {canResetToAuto(item) && (
                                <Tooltip title="Reset to auto">
                                    <IconButton
                                        size="small"
                                        color="info"
                                        onClick={() => handleResetToAuto(item)}
                                    >
                                        <ResetIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title="Remove">
                                <IconButton size="small" color="error" onClick={() => handleDelete(key)}>
                                    <DeleteIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </TableCell>
                </TableRow>

                {descriptionOpen && (
                    <TableRow>
                        <TableCell sx={{pt: 0, pb: 1.5}} colSpan={6}>
                            <Box sx={{pl: 6}}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={1}
                                    maxRows={3}
                                    value={item.description || ''}
                                    placeholder="Description (optional)"
                                    onChange={(e) => handleField(key, 'description', e.target.value)}
                                />
                            </Box>
                        </TableCell>
                    </TableRow>
                )}
            </React.Fragment>
        );
    };

    if (visibleItems.length === 0 && safeItems.length === 0) {
        return (
            <Paper elevation={0} sx={{p: 4, textAlign: 'center', backgroundColor: 'grey.50'}}>
                <ReceiptIcon sx={{fontSize: 48, color: 'grey.400', mb: 2}}/>
                <Typography variant="h6" color="text.secondary">
                    No items on this invoice yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    Add a manual line item below, or add an acceptance to this invoice.
                </Typography>
                <Button startIcon={<AddIcon/>} variant="contained" onClick={handleAdd}>
                    Add Item
                </Button>
            </Paper>
        );
    }

    return (
        <Box>
            <Stack sx={{mb: 2,flexDirection:"row", justifyContent:"space-between", alignItems:"center"}}>
                <Typography variant="subtitle1" fontWeight="medium">
                    Invoice Items
                </Typography>
                <Button startIcon={<AddIcon/>} variant="outlined" size="small" onClick={handleAdd}>
                    Add Item
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{backgroundColor: 'grey.100'}}>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">Item</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">Qty</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">Unit Price</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">Discount</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">Net</Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight="bold">Actions</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {safeItems.map(renderRow)}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default InvoiceItemsField;
