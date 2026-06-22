import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ItemSelect from '@/Pages/Inventory/Components/ItemSelect';
import UnitSelect from '@/Pages/Inventory/Components/UnitSelect';
import LocationSelect from '@/Pages/Inventory/Components/LocationSelect';
import LotSelect from '@/Pages/Inventory/Components/LotSelect';
import BarcodeInput from '@/Pages/Inventory/Components/BarcodeInput';
import BrandInput from '@/Pages/Inventory/Components/BrandInput';
import FifoPreview from '@/Pages/Inventory/Components/FifoPreview';

const LineItemCard = ({
    line,
    idx,
    errors,
    storeId,
    transactionType,
    isEntry,
    usesExistingLots,
    showExpiry,
    showFifo,
    onRemove,
    onUnlock,
    onUpdate,
    onSetItem,
    onSetUnit,
    onSetLot,
    onSetLocation,
    onBarcodeFound,
    onBarcodeNotFound,
}) => (
    <Card
        variant="outlined"
        sx={{ bgcolor: line._barcode_locked ? 'action.hover' : 'background.paper' }}
    >
        <Stack
            direction="row"
            spacing={1}
            sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1,
                bgcolor: 'action.selected',
            }}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="subtitle2">Line {idx + 1}</Typography>
                {line._barcode_locked && (
                    <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        icon={<LockOpenIcon fontSize="small" />}
                        label="Auto-filled — click Unlock to edit"
                    />
                )}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {line._barcode_locked && (
                    <Button
                        size="small"
                        color="warning"
                        startIcon={<LockOpenIcon fontSize="small" />}
                        onClick={onUnlock}
                    >
                        Unlock
                    </Button>
                )}
                <IconButton
                    size="small"
                    color="error"
                    title="Remove line"
                    onClick={onRemove}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Stack>
        <Divider />
        <CardContent>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <BarcodeInput
                        size="small"
                        value={line.barcode}
                        onChange={(val) => onUpdate('barcode', val)}
                        onFound={onBarcodeFound}
                        onNotFound={onBarcodeNotFound}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <ItemSelect
                        size="small"
                        value={line._item}
                        onChange={onSetItem}
                        required
                        disabled={line._barcode_locked}
                        error={!!errors[`lines.${idx}.item_id`]}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <UnitSelect
                        size="small"
                        itemId={line._item?.id}
                        allUnits={[]}
                        value={line._unit}
                        onChange={onSetUnit}
                        required
                        disabled={line._barcode_locked}
                        error={!!errors[`lines.${idx}.unit_id`]}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                    <TextField
                        size="small"
                        type="number"
                        fullWidth
                        required
                        label="Quantity"
                        value={line.quantity}
                        onChange={(e) => onUpdate('quantity', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        error={!!errors[`lines.${idx}.quantity`]}
                        autoFocus={line._barcode_locked}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <LocationSelect
                        size="small"
                        storeId={storeId}
                        itemId={line._item?.id}
                        transactionType={transactionType}
                        value={line._location}
                        onChange={onSetLocation}
                        label="Location"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    {usesExistingLots ? (
                        <LotSelect
                            size="small"
                            itemId={line._item?.id}
                            storeId={storeId}
                            value={line._lot}
                            onChange={onSetLot}
                            disabled={line._barcode_locked}
                        />
                    ) : (
                        // Entry: lot number is always free-text, never locked
                        <TextField
                            size="small"
                            fullWidth
                            label="Lot #"
                            value={line.lot_number}
                            onChange={(e) => onUpdate('lot_number', e.target.value)}
                        />
                    )}
                </Grid>
                {isEntry && (
                    <Grid size={{ xs: 6, md: 2 }}>
                        <TextField
                            size="small"
                            type="number"
                            fullWidth
                            label="Unit Price"
                            value={line.unit_price}
                            onChange={(e) => onUpdate('unit_price', e.target.value)}
                            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        />
                    </Grid>
                )}
                {showExpiry && (
                    <>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <BrandInput
                                size="small"
                                value={line.brand}
                                itemId={line._item?.id}
                                onChange={(v) => onUpdate('brand', v)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 4 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Catalog No"
                                value={line.cat_no}
                                onChange={(e) => onUpdate('cat_no', e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 4 }}>
                            <TextField
                                size="small"
                                type="date"
                                fullWidth
                                label="Expiry Date"
                                value={line.expiry_date}
                                onChange={(e) => onUpdate('expiry_date', e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                    </>
                )}
            </Grid>
            {showFifo && line._item && line.quantity && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <FifoPreview
                        itemId={line._item?.id}
                        storeId={storeId}
                        quantityBaseUnits={
                            line._unit?.conversion_to_base
                                ? parseFloat(line.quantity) *
                                  parseFloat(line._unit.conversion_to_base)
                                : null
                        }
                    />
                </Box>
            )}
        </CardContent>
    </Card>
);

export default LineItemCard;
