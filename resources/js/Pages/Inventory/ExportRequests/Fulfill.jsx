import { useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
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

const Fulfill = () => {
    const { exportRequest: er, errors } = usePage().props;

    const remainingLines = useMemo(
        () =>
            (er.lines ?? [])
                .map((l) => ({
                    id: l.id,
                    name: l.item?.name ?? `#${l.item_id}`,
                    unit: l.unit?.name ?? '',
                    requested: parseFloat(l.qty),
                    fulfilled: parseFloat(l.qty_fulfilled),
                    remaining: parseFloat(l.qty) - parseFloat(l.qty_fulfilled),
                }))
                .filter((l) => l.remaining > 0),
        [er.lines],
    );

    const [notes, setNotes] = useState('');
    const [qtys, setQtys] = useState(() =>
        Object.fromEntries(remainingLines.map((l) => [l.id, String(l.remaining)])),
    );
    const [processing, setProcessing] = useState(false);

    const setQty = (id, value) => setQtys((p) => ({ ...p, [id]: value }));

    const overCap = remainingLines.some((l) => parseFloat(qtys[l.id] || 0) > l.remaining);
    const anyQty = remainingLines.some((l) => parseFloat(qtys[l.id] || 0) > 0);

    const submit = () => {
        const lines = remainingLines
            .filter((l) => parseFloat(qtys[l.id] || 0) > 0)
            .map((l) => ({ export_line_id: l.id, qty: qtys[l.id] }));

        setProcessing(true);
        router.post(
            route('inventory.export-requests.store-fulfillment', er.id),
            { notes, lines },
            { onFinish: () => setProcessing(false) },
        );
    };

    return (
        <>
            <Head title={`Fulfill Export Request #${er.id}`} />
            <PageHeader title={`Fulfill Export Request #${er.id}`} />

            <Alert severity="info" sx={{ mb: 2 }}>
                Dispatching creates an EXPORT stock transaction from{' '}
                <strong>{er.store?.name}</strong> to <strong>{er.destination}</strong> and deducts
                stock (FIFO). Stock availability is re-checked at this step.
            </Alert>

            <Card>
                <CardHeader title="Items to Dispatch" />
                <CardContent sx={{ p: 0, overflowX: 'auto' }}>
                    {remainingLines.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            Nothing left to fulfill.
                        </Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell>Unit</TableCell>
                                    <TableCell align="right">Requested</TableCell>
                                    <TableCell align="right">Already</TableCell>
                                    <TableCell align="right">Remaining</TableCell>
                                    <TableCell sx={{ width: 140 }}>Dispatch Qty</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {remainingLines.map((l) => {
                                    const over = parseFloat(qtys[l.id] || 0) > l.remaining;
                                    return (
                                        <TableRow key={l.id}>
                                            <TableCell>{l.name}</TableCell>
                                            <TableCell>{l.unit}</TableCell>
                                            <TableCell align="right">{l.requested}</TableCell>
                                            <TableCell align="right">{l.fulfilled}</TableCell>
                                            <TableCell align="right">{l.remaining}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={qtys[l.id] ?? ''}
                                                    onChange={(e) => setQty(l.id, e.target.value)}
                                                    slotProps={{
                                                        htmlInput: {
                                                            min: 0,
                                                            max: l.remaining,
                                                            step: 'any',
                                                        },
                                                    }}
                                                    error={over}
                                                    helperText={over ? 'Over remaining' : undefined}
                                                    fullWidth
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {errors?.lines && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.lines}
                </Alert>
            )}

            <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mt: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                    onClick={() => router.visit(route('inventory.export-requests.show', er.id))}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={submit}
                    disabled={processing || overCap || !anyQty}
                    startIcon={processing && <CircularProgress size={16} />}
                >
                    Dispatch Stock
                </Button>
            </Box>
        </>
    );
};

const breadcrumbs = (er) => [
    { title: 'Inventory', link: null },
    { title: 'Export Requests', link: route('inventory.export-requests.index') },
    { title: `#${er?.id || ''}`, link: route('inventory.export-requests.show', er?.id) },
    { title: 'Fulfill', link: null },
];

Fulfill.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.exportRequest)}>
        {page}
    </AuthenticatedLayout>
);

export default Fulfill;
