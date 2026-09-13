import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    CircularProgress,
    Grid,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ItemSelect from '@/Pages/Inventory/Components/ItemSelect';
import UnitSelect from '@/Pages/Inventory/Components/UnitSelect';
import LocationSelect from '@/Pages/Inventory/Components/LocationSelect';
import BrandInput from '@/Pages/Inventory/Components/BrandInput';

const ReceiveItems = () => {
    const { purchaseRequest: pr, stores, status, success } = usePage().props;

    const pendingLines = (pr.lines ?? []).filter(
        (l) => parseFloat(l.qty_received ?? 0) < parseFloat(l.qty),
    );

    const initLine = (l) => ({
        pr_line_id: l.id,
        qty: String(Math.max(0, parseFloat(l.qty) - parseFloat(l.qty_received ?? 0))),
        barcode: '',
        lot_number: '',
        brand: l.brand ?? '',
        cat_no: l.cat_no ?? '',
        expiry_date: '',
        store_location_id: null,
        unit_price: l.unit_price ?? '',
        // Only used by a line not in the catalogue: the item and unit it is received as.
        item_id: null,
        unit_id: null,
        _linkItem: null,
        _linkUnit: null,
        _location: null,
        _selected: true,
        _line: l,
    });

    const [receiveLines, setReceiveLines] = useState(() => pendingLines.map(initLine));

    const [storeId, setStoreId] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const toggle = (idx) => {
        setReceiveLines((prev) =>
            prev.map((l, i) => (i === idx ? { ...l, _selected: !l._selected } : l)),
        );
    };

    const updateReceiveLine = (idx, field, value) => {
        setReceiveLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    };

    const setLocation = (idx, loc) => {
        setReceiveLines((prev) =>
            prev.map((l, i) =>
                i === idx ? { ...l, _location: loc, store_location_id: loc?.id ?? null } : l,
            ),
        );
    };

    // Picking a different item resets the unit and location, whose options depend on it.
    const setLinkItem = (idx, item) => {
        setReceiveLines((prev) =>
            prev.map((l, i) =>
                i === idx
                    ? {
                          ...l,
                          _linkItem: item,
                          item_id: item?.id ?? null,
                          _linkUnit: null,
                          unit_id: null,
                          _location: null,
                          store_location_id: null,
                      }
                    : l,
            ),
        );
    };

    const setLinkUnit = (idx, unit) => {
        setReceiveLines((prev) =>
            prev.map((l, i) =>
                i === idx ? { ...l, _linkUnit: unit, unit_id: unit?.id ?? null } : l,
            ),
        );
    };

    const nullify = (v) => (v === '' || v === undefined ? null : v);

    const handleSubmit = (e) => {
        e.preventDefault();
        const selected = receiveLines
            .filter((l) => l._selected)
            .map(({ _location, _selected, _line, _linkItem, _linkUnit, ...rest }) => ({
                ...rest,
                barcode: nullify(rest.barcode),
                unit_price: nullify(rest.unit_price),
                expiry_date: nullify(rest.expiry_date),
                lot_number: nullify(rest.lot_number),
                brand: nullify(rest.brand),
                cat_no: nullify(rest.cat_no),
                store_location_id: rest.store_location_id || null,
            }));

        setSubmitting(true);
        router.post(
            route('inventory.purchase-requests.store-receipt', pr.id),
            { store_id: storeId, notes, lines: selected },
            {
                onError: (errs) => {
                    setErrors(errs);
                    setSubmitting(false);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    if (pendingLines.length === 0) {
        return (
            <>
                <PageHeader title="Receive Items" />
                <Alert severity="success">All lines have been fully received.</Alert>
            </>
        );
    }

    const errorMessages = Object.values(errors).filter(Boolean);
    const hasUnlinkedLine = receiveLines.some(
        (l) => l._selected && !l._line.item_id && (!l.item_id || !l.unit_id),
    );

    return (
        <>
            <Head title={`Receive Items — PR #${pr.id}`} />
            <PageHeader title={`Receive Items — PR #${pr.id}`} />
            {status && (
                <Alert
                    severity={success ? 'success' : 'error'}
                    sx={{ mb: 2, whiteSpace: 'pre-line' }}
                >
                    {status}
                </Alert>
            )}
            {errorMessages.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessages.map((m, i) => (
                        <div key={i}>{m}</div>
                    ))}
                </Alert>
            )}
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
                <Card>
                    <CardHeader title="Delivery Details" />
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    label="Receiving Store"
                                    value={storeId}
                                    onChange={(e) => setStoreId(e.target.value)}
                                    error={!!errors.store_id}
                                >
                                    {stores.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Lines to Receive"
                        subheader="Uncheck lines not in this shipment. Adjust qty if partially received."
                    />
                    <CardContent sx={{ p: 0, overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: 1100 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" />
                                    <TableCell>Item</TableCell>
                                    <TableCell align="right">Remaining</TableCell>
                                    <TableCell sx={{ width: 90 }}>Qty to Receive</TableCell>
                                    <TableCell sx={{ width: 90 }}>Unit Price</TableCell>
                                    <TableCell sx={{ width: 100 }}>Cat No</TableCell>
                                    <TableCell sx={{ width: 110 }}>Lot #</TableCell>
                                    <TableCell sx={{ width: 120 }}>Barcode</TableCell>
                                    <TableCell sx={{ minWidth: 110 }}>Brand</TableCell>
                                    <TableCell sx={{ width: 120 }}>Expiry</TableCell>
                                    <TableCell sx={{ minWidth: 160 }}>Location</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {receiveLines.map((rl, idx) => {
                                    const remaining =
                                        parseFloat(rl._line.qty) -
                                        parseFloat(rl._line.qty_received ?? 0);
                                    return (
                                        <TableRow
                                            key={rl.pr_line_id}
                                            sx={!rl._selected ? { opacity: 0.4 } : {}}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={rl._selected}
                                                    onChange={() => toggle(idx)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {rl._line.item_id ? (
                                                    <>
                                                        <Typography variant="body2">
                                                            {rl._line.item?.name}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {rl._line.unit?.name}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 1,
                                                            minWidth: 240,
                                                        }}
                                                    >
                                                        <Typography variant="body2">
                                                            {rl._line.item_name}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            Not in catalogue (requested in{' '}
                                                            {rl._line.unit?.name}). Link it to an
                                                            item to add it to stock.
                                                        </Typography>
                                                        <ItemSelect
                                                            size="small"
                                                            label="Catalogue item"
                                                            value={rl._linkItem}
                                                            onChange={(item) =>
                                                                setLinkItem(idx, item)
                                                            }
                                                            required={rl._selected}
                                                        />
                                                        <UnitSelect
                                                            size="small"
                                                            itemId={rl._linkItem?.id}
                                                            value={rl._linkUnit}
                                                            onChange={(unit) =>
                                                                setLinkUnit(idx, unit)
                                                            }
                                                            required={rl._selected}
                                                        />
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">{remaining}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    fullWidth
                                                    value={rl.qty}
                                                    disabled={!rl._selected}
                                                    slotProps={{
                                                        htmlInput: {
                                                            min: 0.000001,
                                                            max: remaining,
                                                            step: 'any',
                                                        },
                                                    }}
                                                    onChange={(e) =>
                                                        updateReceiveLine(
                                                            idx,
                                                            'qty',
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={!!errors[`lines.${idx}.qty`]}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    fullWidth
                                                    value={rl.unit_price}
                                                    disabled={!rl._selected}
                                                    slotProps={{
                                                        htmlInput: { min: 0, step: 'any' },
                                                    }}
                                                    onChange={(e) =>
                                                        updateReceiveLine(
                                                            idx,
                                                            'unit_price',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={rl.cat_no}
                                                    disabled={!rl._selected}
                                                    onChange={(e) =>
                                                        updateReceiveLine(
                                                            idx,
                                                            'cat_no',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={rl.lot_number}
                                                    disabled={!rl._selected}
                                                    onChange={(e) =>
                                                        updateReceiveLine(
                                                            idx,
                                                            'lot_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={rl.barcode}
                                                    disabled={!rl._selected}
                                                    slotProps={{
                                                        htmlInput: {
                                                            sx: { fontFamily: 'monospace' },
                                                        },
                                                    }}
                                                    onChange={(e) =>
                                                        updateReceiveLine(
                                                            idx,
                                                            'barcode',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <BrandInput
                                                    value={rl.brand}
                                                    itemId={rl._line.item_id ?? rl.item_id}
                                                    disabled={!rl._selected}
                                                    onChange={(v) =>
                                                        updateReceiveLine(idx, 'brand', v)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="date"
                                                    fullWidth
                                                    value={rl.expiry_date}
                                                    disabled={!rl._selected}
                                                    onChange={(e) =>
                                                        updateReceiveLine(
                                                            idx,
                                                            'expiry_date',
                                                            e.target.value,
                                                        )
                                                    }
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <LocationSelect
                                                    size="small"
                                                    storeId={storeId}
                                                    itemId={rl._line.item_id ?? rl.item_id}
                                                    transactionType="ENTRY"
                                                    value={rl._location}
                                                    onChange={(loc) => setLocation(idx, loc)}
                                                    disabled={!rl._selected}
                                                    label="Location"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() =>
                            router.visit(route('inventory.purchase-requests.show', pr.id))
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={
                            submitting ||
                            !storeId ||
                            hasUnlinkedLine ||
                            receiveLines.every((l) => !l._selected)
                        }
                        startIcon={submitting && <CircularProgress size={16} />}
                    >
                        Confirm Receipt &amp; Create Stock Entry
                    </Button>
                </Box>
            </Box>
        </>
    );
};

const breadcrumbs = (pr) => [
    { title: 'Inventory', link: null },
    { title: 'Purchase Requests', link: route('inventory.purchase-requests.index') },
    { title: `#${pr?.id || ''}`, link: route('inventory.purchase-requests.show', pr?.id) },
    { title: 'Receive Items', link: null },
];

ReceiveItems.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={breadcrumbs(page.props.purchaseRequest)}
    >
        {page}
    </AuthenticatedLayout>
);

export default ReceiveItems;
