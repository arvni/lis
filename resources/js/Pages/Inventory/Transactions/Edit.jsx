import { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Alert, Box, Button, Card, CardContent, CardHeader, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import LotPickerDialog from '@/Pages/Inventory/Components/LotPickerDialog';
import { USES_EXISTING_LOTS, emptyLine, lineFromExisting, toPayloadLine } from './Add/helpers';
import TransactionDetailsCard from './Edit/TransactionDetailsCard';
import LineItemsTable from './Edit/LineItemsTable';

const TransactionEdit = () => {
    const { transaction, stores, success, status } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        transaction_date: transaction.transaction_date ?? '',
        store_id: transaction.store_id ?? '',
        destination_store_id: transaction.destination_store_id ?? '',
        supplier_id: transaction.supplier_id ?? '',
        notes: transaction.notes ?? '',
        lines: (transaction.lines ?? [])
            .map(toPayloadLine.bind(null, {})) // placeholder; overwritten below
            .map(() => ({})), // will be set by lineItems sync
    });

    const [lineItems, setLineItems] = useState(() =>
        (transaction.lines ?? []).map(lineFromExisting),
    );
    const [supplierObj, setSupplierObj] = useState(transaction.supplier ?? null);
    const [lotPickerLine, setLotPickerLine] = useState(null);

    const syncLines = (updated) => {
        setLineItems(updated);
        setData('lines', updated.map(toPayloadLine));
    };

    // Initialise form lines from loaded transaction on first render
    useState(() => {
        setData('lines', lineItems.map(toPayloadLine));
    });

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

    const txType = transaction.transaction_type;
    const isEntry = ['ENTRY', 'RETURN'].includes(txType);
    const usesExistingLots = USES_EXISTING_LOTS.includes(txType);
    const showExpiry = !usesExistingLots;

    const handleBarcodeFound = (idx, scanData) => {
        const item = scanData.item ?? null;
        const unit = scanData.unit ?? null;
        const lots = scanData.lots ?? [];

        if (isEntry) {
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
    const isTransfer = txType === 'TRANSFER';

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('inventory.transactions.update', transaction.id));
    };

    return (
        <>
            <Head title={`Edit Transaction: ${transaction.reference_number}`} />
            <PageHeader title={`Edit Transaction: ${transaction.reference_number}`} />

            {status && (
                <Alert
                    severity={success ? 'success' : 'error'}
                    sx={{ mb: 2, whiteSpace: 'pre-line' }}
                >
                    {status}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <TransactionDetailsCard
                    txType={txType}
                    data={data}
                    setData={setData}
                    errors={errors}
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
                    <CardContent sx={{ p: lineItems.length ? 0 : undefined, overflowX: 'auto' }}>
                        <LineItemsTable
                            lineItems={lineItems}
                            errors={errors}
                            storeId={data.store_id}
                            txType={txType}
                            isEntry={isEntry}
                            usesExistingLots={usesExistingLots}
                            showExpiry={showExpiry}
                            onUpdate={updateLine}
                            onSetItem={setLineItem}
                            onSetUnit={setLineUnit}
                            onSetLot={setLineLot}
                            onSetLocation={setLineLocation}
                            onBarcodeFound={handleBarcodeFound}
                            onBarcodeNotFound={handleBarcodeNotFound}
                            onUnlock={unlockLine}
                            onRemove={removeLine}
                        />
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        onClick={() =>
                            router.visit(route('inventory.transactions.show', transaction.id))
                        }
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={processing || lineItems.length === 0}
                        startIcon={processing && <CircularProgress size={16} />}
                    >
                        Save Changes
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

const breadcrumbs = (tx) => [
    { title: 'Inventory', link: null },
    { title: 'Transactions', link: route('inventory.transactions.index') },
    {
        title: tx?.reference_number || 'Transaction',
        link: route('inventory.transactions.show', tx?.id),
    },
    { title: 'Edit', link: null },
];

TransactionEdit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.transaction)}>
        {page}
    </AuthenticatedLayout>
);

export default TransactionEdit;
