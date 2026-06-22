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
    Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import LotPickerDialog from '@/Pages/Inventory/Components/LotPickerDialog';
import {
    USES_EXISTING_LOTS,
    emptyLine,
    linesFromSource,
    payloadFromSource,
    toPayloadLine,
} from './Add/helpers';
import TransactionDetailsCard from './Add/TransactionDetailsCard';
import LineItemCard from './Add/LineItemCard';

const TransactionAdd = () => {
    const { transactionTypes, stores, defaults } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        transaction_type: defaults?.transaction_type ?? '',
        transaction_date: new Date().toISOString().split('T')[0],
        store_id: defaults?.store_id ?? '',
        destination_store_id: defaults?.destination_store_id ?? '',
        supplier_id: defaults?.supplier_id ?? '',
        notes: defaults?.notes ?? '',
        lines: defaults?.lines?.map(payloadFromSource) ?? [],
    });

    const [lineItems, setLineItems] = useState(() => linesFromSource(defaults?.lines));
    const [supplierObj, setSupplierObj] = useState(defaults?.supplier ?? null);
    const [lotPickerLine, setLotPickerLine] = useState(null); // index of line with open lot picker

    const syncLines = (updated) => {
        setLineItems(updated);
        setData('lines', updated.map(toPayloadLine));
    };

    const addLine = () => syncLines([...lineItems, emptyLine()]);
    const removeLine = (idx) => syncLines(lineItems.filter((_, i) => i !== idx));

    const updateLine = (idx, field, value) => {
        syncLines(lineItems.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    };

    const setLineItem = (idx, item) => {
        syncLines(
            lineItems.map((l, i) =>
                i === idx
                    ? { ...l, _item: item, item_id: item?.id ?? null, _unit: null, unit_id: null }
                    : l,
            ),
        );
    };

    const setLineUnit = (idx, unit) => {
        syncLines(
            lineItems.map((l, i) =>
                i === idx ? { ...l, _unit: unit, unit_id: unit?.id ?? null } : l,
            ),
        );
    };

    const setLineLot = (idx, lot) => {
        syncLines(
            lineItems.map((l, i) =>
                i === idx
                    ? {
                          ...l,
                          _lot: lot,
                          lot_number: lot?.lot_number ?? '',
                          brand: lot?.brand ?? '',
                      }
                    : l,
            ),
        );
    };

    const setLineLocation = (idx, location) => {
        syncLines(
            lineItems.map((l, i) =>
                i === idx
                    ? { ...l, _location: location, store_location_id: location?.id ?? null }
                    : l,
            ),
        );
    };

    const isEntry = ['ENTRY', 'RETURN'].includes(data.transaction_type);
    const usesExistingLots = USES_EXISTING_LOTS.includes(data.transaction_type);
    const showExpiry = !usesExistingLots;
    const showFifo = ['EXPORT', 'TRANSFER'].includes(data.transaction_type);
    const isTransfer = data.transaction_type === 'TRANSFER';

    const handleBarcodeFound = (idx, scanData) => {
        const item = scanData.item ?? null;
        const unit = scanData.unit ?? null;
        const lots = scanData.lots ?? [];

        if (isEntry) {
            // Entry: lock item/unit, prefill lot details if available but keep them editable
            const hint = lots.length === 1 ? lots[0] : null;
            syncLines(
                lineItems.map((l, i) =>
                    i === idx
                        ? {
                              ...l,
                              _barcode_locked: true,
                              _item: item,
                              _unit: unit,
                              item_id: item?.id ?? null,
                              unit_id: unit?.id ?? null,
                              barcode: scanData.barcode ?? l.barcode,
                              lot_number: hint?.lot_number ?? '',
                              brand: hint?.brand ?? '',
                              expiry_date: hint?.expiry_date ?? '',
                          }
                        : l,
                ),
            );
            return;
        }

        // Exit types (EXPORT, TRANSFER, RETURN, EXPIRED_REMOVAL)
        if (lots.length === 1) {
            const lot = lots[0];
            syncLines(
                lineItems.map((l, i) =>
                    i === idx
                        ? {
                              ...l,
                              _barcode_locked: true,
                              _item: item,
                              _unit: unit,
                              _lot: lot,
                              item_id: item?.id ?? null,
                              unit_id: unit?.id ?? null,
                              lot_number: lot.lot_number ?? '',
                              brand: lot.brand ?? '',
                              expiry_date: lot.expiry_date ?? '',
                              barcode: scanData.barcode ?? l.barcode,
                          }
                        : l,
                ),
            );
            return;
        }

        if (lots.length > 1) {
            // Multiple lots — store them and open the picker
            syncLines(
                lineItems.map((l, i) =>
                    i === idx
                        ? {
                              ...l,
                              _barcode_locked: false,
                              _item: item,
                              _unit: unit,
                              _lot: null,
                              _lots_from_scan: lots,
                              item_id: item?.id ?? null,
                              unit_id: unit?.id ?? null,
                              barcode: scanData.barcode ?? l.barcode,
                              lot_number: '',
                              brand: '',
                              expiry_date: '',
                          }
                        : l,
                ),
            );
            setLotPickerLine(idx);
            return;
        }

        // No active lots — item identified but no stock; lock item only
        syncLines(
            lineItems.map((l, i) =>
                i === idx
                    ? {
                          ...l,
                          _barcode_locked: true,
                          _item: item,
                          _unit: unit,
                          item_id: item?.id ?? null,
                          unit_id: unit?.id ?? null,
                          barcode: scanData.barcode ?? l.barcode,
                      }
                    : l,
            ),
        );
    };

    const handleBarcodeNotFound = (idx, barcode) => {
        syncLines(
            lineItems.map((l, i) => (i === idx ? { ...l, barcode, _barcode_locked: false } : l)),
        );
    };

    const unlockLine = (idx) => {
        syncLines(
            lineItems.map((l, i) => (i === idx ? { ...emptyLine(), barcode: l.barcode } : l)),
        );
    };

    const handleLotPicked = (lot) => {
        if (lotPickerLine === null) return;
        syncLines(
            lineItems.map((l, i) =>
                i === lotPickerLine
                    ? {
                          ...l,
                          _barcode_locked: true,
                          _lot: lot,
                          lot_number: lot.lot_number ?? '',
                          brand: lot.brand ?? '',
                          expiry_date: lot.expiry_date ?? '',
                      }
                    : l,
            ),
        );
        setLotPickerLine(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('inventory.transactions.store'));
    };

    return (
        <>
            <Head title="New Stock Transaction" />
            <PageHeader title="New Stock Transaction" />
            <Box component="form" onSubmit={handleSubmit}>
                <TransactionDetailsCard
                    data={data}
                    setData={setData}
                    errors={errors}
                    transactionTypes={transactionTypes}
                    stores={stores}
                    isEntry={isEntry}
                    isTransfer={isTransfer}
                    supplierObj={supplierObj}
                    setSupplierObj={setSupplierObj}
                />

                <Card sx={{ mb: 3 }}>
                    <CardHeader
                        title="Line Items"
                        action={
                            <Button
                                startIcon={<AddIcon />}
                                size="small"
                                variant="outlined"
                                onClick={addLine}
                            >
                                Add Line
                            </Button>
                        }
                    />
                    <CardContent>
                        {lineItems.length === 0 ? (
                            <Alert severity="info">
                                Click &quot;Add Line&quot; to add items. You can scan the barcode on
                                each item to auto-fill details.
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {lineItems.map((line, idx) => (
                                    <LineItemCard
                                        key={idx}
                                        line={line}
                                        idx={idx}
                                        errors={errors}
                                        storeId={data.store_id}
                                        transactionType={data.transaction_type}
                                        isEntry={isEntry}
                                        usesExistingLots={usesExistingLots}
                                        showExpiry={showExpiry}
                                        showFifo={showFifo}
                                        onRemove={() => removeLine(idx)}
                                        onUnlock={() => unlockLine(idx)}
                                        onUpdate={(field, value) => updateLine(idx, field, value)}
                                        onSetItem={(item) => setLineItem(idx, item)}
                                        onSetUnit={(unit) => setLineUnit(idx, unit)}
                                        onSetLot={(lot) => setLineLot(idx, lot)}
                                        onSetLocation={(loc) => setLineLocation(idx, loc)}
                                        onBarcodeFound={(scanData) =>
                                            handleBarcodeFound(idx, scanData)
                                        }
                                        onBarcodeNotFound={(bc) => handleBarcodeNotFound(idx, bc)}
                                    />
                                ))}
                            </Stack>
                        )}
                        {errors.lines && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {errors.lines}
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        onClick={() => router.visit(route('inventory.transactions.index'))}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={processing || lineItems.length === 0}
                        startIcon={processing && <CircularProgress size={16} />}
                    >
                        Save Transaction
                    </Button>
                </Box>
            </Box>

            <LotPickerDialog
                open={lotPickerLine !== null}
                lots={
                    lotPickerLine !== null ? (lineItems[lotPickerLine]?._lots_from_scan ?? []) : []
                }
                onSelect={handleLotPicked}
                onClose={() => setLotPickerLine(null)}
            />
        </>
    );
};

const breadcrumbs = [
    { title: 'Inventory', link: null },
    { title: 'Transactions', link: route('inventory.transactions.index') },
    { title: 'New', link: null },
];

TransactionAdd.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default TransactionAdd;
