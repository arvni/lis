import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from '@mui/material';

/**
 * Dialog shown when a barcode scan resolves to multiple active lots.
 * Props:
 *   open     – boolean
 *   lots     – array of { id, lot_number, brand, expiry_date, quantity_base_units }
 *   onSelect – fn(lot) called when user picks a lot
 *   onClose  – fn() called on cancel
 */
const LotPickerDialog = ({ open, lots, onSelect, onClose }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Select Lot</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Multiple lots match this barcode. Select the one to use:
            </Typography>
            <Stack spacing={1}>
                {lots.map((lot) => (
                    <Card key={lot.id} variant="outlined">
                        <CardActionArea onClick={() => onSelect(lot)}>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                    }}
                                >
                                    <Typography variant="body2" fontWeight="bold">
                                        {lot.lot_number}
                                        {lot.brand && (
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="primary.main"
                                                sx={{ ml: 1 }}
                                            >
                                                {lot.brand}
                                            </Typography>
                                        )}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Qty: {lot.quantity_base_units}
                                    </Typography>
                                </Box>
                                {lot.expiry_date && (
                                    <Typography variant="caption" color="text.secondary">
                                        Exp: {lot.expiry_date}
                                    </Typography>
                                )}
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
    </Dialog>
);

export default LotPickerDialog;
