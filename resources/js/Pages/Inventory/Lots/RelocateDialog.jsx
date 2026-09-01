import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import LocationSelect from '../Components/LocationSelect';

/**
 * Moves stock that is already on hand to another store/location. The quantity
 * never changes — moving less than the lot holds leaves the remainder behind.
 */
const RelocateDialog = ({ open, onClose, lot, stores = [] }) => {
    const onHand = Number(lot?.quantity_base_units ?? 0);
    const unitName = lot?.item?.default_unit?.name ?? 'base units';

    const [location, setLocation] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        quantity_base_units: onHand,
        to_store_id: lot?.store_id ?? '',
        to_store_location_id: '',
        notes: '',
    });

    // Reopening the dialog should start from the lot as it stands now.
    useEffect(() => {
        if (open) {
            reset();
            clearErrors();
            setLocation(null);
            setData({
                quantity_base_units: onHand,
                to_store_id: lot?.store_id ?? '',
                to_store_location_id: '',
                notes: '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, lot?.id]);

    const quantity = Number(data.quantity_base_units);
    const isPartial = quantity > 0 && quantity < onHand;
    const overStock = quantity > onHand;
    const samePlace =
        Number(data.to_store_id) === Number(lot?.store_id) &&
        (location?.id ?? null) === (lot?.store_location_id ?? null);

    const submit = () => {
        post(route('inventory.lots.relocate', lot.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Move Stock</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Lot <strong>{lot?.lot_number}</strong> currently holds{' '}
                    <strong>
                        {onHand} {unitName}
                    </strong>{' '}
                    at {lot?.store?.name}
                    {lot?.location?.label ? ` · ${lot.location.label}` : ''}. Moving stock changes
                    where it is held, never how much.
                </Typography>

                <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={`Quantity to move (${unitName})`}
                            value={data.quantity_base_units}
                            onChange={(e) => setData('quantity_base_units', e.target.value)}
                            error={!!errors.quantity_base_units || overStock}
                            helperText={
                                errors.quantity_base_units ||
                                (overStock
                                    ? `The lot only holds ${onHand}.`
                                    : isPartial
                                      ? `${(onHand - quantity).toFixed(4)} stays behind at the current place.`
                                      : 'The whole lot moves.')
                            }
                            slotProps={{ htmlInput: { min: 0, step: 'any', max: onHand } }}
                            autoFocus
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Destination store"
                            value={data.to_store_id}
                            onChange={(e) => {
                                // Locations are store-scoped — drop the pick when the store changes.
                                setLocation(null);
                                setData((current) => ({
                                    ...current,
                                    to_store_id: e.target.value,
                                    to_store_location_id: '',
                                }));
                            }}
                            error={!!errors.to_store_id}
                            helperText={errors.to_store_id}
                        >
                            {stores.map((store) => (
                                <MenuItem key={store.id} value={store.id}>
                                    {store.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={12}>
                        <LocationSelect
                            storeId={data.to_store_id || null}
                            value={location}
                            size="small"
                            label="Destination location (optional)"
                            onChange={(next) => {
                                setLocation(next);
                                setData('to_store_location_id', next?.id ?? '');
                            }}
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            label="Reason / Notes (optional)"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            error={!!errors.notes}
                            helperText={errors.notes}
                        />
                    </Grid>

                    {Number(data.to_store_id) !== Number(lot?.store_id) && data.to_store_id && (
                        <Grid size={12}>
                            <Alert severity="warning">
                                This moves stock to a different store without the transfer approval
                                and receipt confirmation a transfer transaction would go through.
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    startIcon={<MoveDownIcon />}
                    onClick={submit}
                    disabled={processing || overStock || samePlace || !(quantity > 0)}
                >
                    Move Stock
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RelocateDialog;
