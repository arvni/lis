import { Card, CardContent, CardHeader, Grid, MenuItem, TextField } from '@mui/material';
import SupplierSelect from '@/Pages/Inventory/Components/SupplierSelect';

const TransactionDetailsCard = ({
    txType,
    data,
    setData,
    errors,
    stores,
    isEntry,
    isTransfer,
    supplierObj,
    setSupplierObj,
}) => (
    <Card sx={{ mb: 3 }}>
        <CardHeader title="Transaction Details" />
        <CardContent>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth disabled label="Transaction Type" value={txType} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        fullWidth
                        required
                        type="date"
                        label="Transaction Date"
                        value={data.transaction_date}
                        onChange={(e) => setData('transaction_date', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        select
                        fullWidth
                        required
                        label="Source Store"
                        value={data.store_id}
                        onChange={(e) => setData('store_id', e.target.value)}
                        error={!!errors.store_id}
                    >
                        {stores.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                {isTransfer && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            select
                            fullWidth
                            required
                            label="Destination Store"
                            value={data.destination_store_id}
                            onChange={(e) => setData('destination_store_id', e.target.value)}
                        >
                            {stores.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                )}
                {isEntry && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <SupplierSelect
                            label="Supplier (optional)"
                            value={supplierObj}
                            onChange={(s) => {
                                setSupplierObj(s);
                                setData('supplier_id', s?.id ?? '');
                            }}
                        />
                    </Grid>
                )}
                <Grid size={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Notes"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

export default TransactionDetailsCard;
