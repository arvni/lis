import { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Grid,
    IconButton,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ItemSelect from '@/Pages/Inventory/Components/ItemSelect';
import UnitSelect from '@/Pages/Inventory/Components/UnitSelect';
import ItemStockHint from '@/Pages/Inventory/Components/ItemStockHint';
import { requestedBaseOf, lineExceedsStock } from './Add';

const URGENCY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const emptyLine = () => ({
    _item: null,
    _unit: null,
    _available_base: null,
    item_id: null,
    unit_id: null,
    qty: '',
    notes: '',
});

const toPayload = ({ _item, _unit, _available_base, ...rest }) => rest;

const lineFromSource = (line) => ({
    _item: line.item ?? null,
    _unit: line.unit ?? null,
    _available_base: null,
    item_id: line.item_id,
    unit_id: line.unit_id,
    qty: line.qty ?? '',
    notes: line.notes ?? '',
});

const Edit = () => {
    const { exportRequest: er, stores } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        store_id: er.store_id ?? '',
        destination: er.destination ?? '',
        purpose: er.purpose ?? '',
        urgency: er.urgency ?? 'NORMAL',
        notes: er.notes ?? '',
        lines: er.lines?.map((l) => toPayload(lineFromSource(l))) ?? [],
    });

    const [lineItems, setLineItems] = useState(() => er.lines?.map(lineFromSource) ?? []);

    const syncLines = (updated) => {
        setLineItems(updated);
        setData('lines', updated.map(toPayload));
    };

    const addLine = () => syncLines([...lineItems, emptyLine()]);
    const removeLine = (idx) => syncLines(lineItems.filter((_, i) => i !== idx));

    const setLineItem = (idx, item) =>
        syncLines(
            lineItems.map((l, i) =>
                i === idx
                    ? {
                          ...l,
                          _item: item,
                          item_id: item?.id ?? null,
                          _unit: null,
                          unit_id: null,
                          _available_base: null,
                      }
                    : l,
            ),
        );

    const setLineUnit = (idx, unit) =>
        syncLines(
            lineItems.map((l, i) =>
                i === idx ? { ...l, _unit: unit, unit_id: unit?.id ?? null } : l,
            ),
        );

    const updateLine = (idx, field, value) =>
        syncLines(lineItems.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

    const setLineAvailable = (idx, base) =>
        setLineItems((prev) =>
            prev.map((l, i) => (i === idx ? { ...l, _available_base: base } : l)),
        );

    const anyExceeds = lineItems.some(lineExceedsStock);
    const canSubmit = !processing && !!data.store_id && lineItems.length > 0 && !anyExceeds;

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('inventory.export-requests.update', er.id));
    };

    return (
        <>
            <Head title={`Edit Export Request #${er.id}`} />
            <PageHeader title={`Edit Export Request #${er.id}`} />
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
                <Card>
                    <CardHeader title="Request Details" />
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    label="From Store"
                                    value={data.store_id}
                                    onChange={(e) => setData('store_id', e.target.value)}
                                    error={!!errors.store_id}
                                    helperText={errors.store_id}
                                >
                                    {stores.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Destination"
                                    value={data.destination}
                                    onChange={(e) => setData('destination', e.target.value)}
                                    error={!!errors.destination}
                                    helperText={errors.destination}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    label="Urgency"
                                    value={data.urgency}
                                    onChange={(e) => setData('urgency', e.target.value)}
                                >
                                    {URGENCY_OPTIONS.map((u) => (
                                        <MenuItem key={u} value={u}>
                                            {u}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Purpose / Notes"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Requested Items"
                        subheader="Requested quantity must not exceed available stock."
                        action={
                            <Button
                                startIcon={<AddIcon />}
                                onClick={addLine}
                                size="small"
                                variant="outlined"
                                disabled={!data.store_id}
                            >
                                Add Item
                            </Button>
                        }
                    />
                    <CardContent sx={{ p: lineItems.length ? 0 : undefined, overflowX: 'auto' }}>
                        {lineItems.length === 0 ? (
                            <Alert severity="info" sx={{ m: 2 }}>
                                Click &quot;Add Item&quot; to add items to this request.
                            </Alert>
                        ) : (
                            <Table size="small" sx={{ minWidth: 760 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 280 }}>Item</TableCell>
                                        <TableCell sx={{ minWidth: 180 }}>Unit</TableCell>
                                        <TableCell sx={{ width: 120 }}>Qty</TableCell>
                                        <TableCell sx={{ minWidth: 160 }}>Notes</TableCell>
                                        <TableCell sx={{ width: 48 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lineItems.map((line, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <ItemSelect
                                                    size="small"
                                                    value={line._item}
                                                    onChange={(item) => setLineItem(idx, item)}
                                                    required
                                                    error={!!errors[`lines.${idx}.item_id`]}
                                                    helperText={errors[`lines.${idx}.item_id`]}
                                                />
                                                <ItemStockHint
                                                    itemId={line._item?.id}
                                                    storeId={data.store_id}
                                                    requestedBase={requestedBaseOf(line)}
                                                    onAvailable={(base) =>
                                                        setLineAvailable(idx, base)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <UnitSelect
                                                    size="small"
                                                    itemId={line._item?.id}
                                                    allUnits={[]}
                                                    value={line._unit}
                                                    onChange={(unit) => setLineUnit(idx, unit)}
                                                    required
                                                    error={!!errors[`lines.${idx}.unit_id`]}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={line.qty}
                                                    onChange={(e) =>
                                                        updateLine(idx, 'qty', e.target.value)
                                                    }
                                                    slotProps={{
                                                        htmlInput: { min: 0, step: 'any' },
                                                    }}
                                                    fullWidth
                                                    error={
                                                        !!errors[`lines.${idx}.qty`] ||
                                                        lineExceedsStock(line)
                                                    }
                                                    helperText={
                                                        lineExceedsStock(line)
                                                            ? 'Exceeds available stock'
                                                            : errors[`lines.${idx}.qty`]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    placeholder="Notes"
                                                    value={line.notes}
                                                    onChange={(e) =>
                                                        updateLine(idx, 'notes', e.target.value)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeLine(idx)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {errors.lines && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                {errors.lines}
                            </Alert>
                        )}
                        {anyExceeds && (
                            <Alert severity="warning" sx={{ m: 2 }}>
                                One or more lines exceed available stock. Reduce the quantity to
                                continue.
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        onClick={() => router.visit(route('inventory.export-requests.show', er.id))}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={!canSubmit}
                        startIcon={processing && <CircularProgress size={16} />}
                    >
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </>
    );
};

const breadcrumbs = (er) => [
    { title: 'Inventory', link: null },
    { title: 'Export Requests', link: route('inventory.export-requests.index') },
    { title: `#${er?.id || ''}`, link: null },
];

Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.exportRequest)}>
        {page}
    </AuthenticatedLayout>
);

export default Edit;
