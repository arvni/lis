import React, { useMemo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    TextField,
    Paper,
    Alert,
    alpha,
    useTheme,
} from '@mui/material';
import { Close, Save, RequestQuote } from '@mui/icons-material';
import { router } from '@inertiajs/react';

/**
 * Dialog for editing the price and discount of each acceptance item before an
 * invoice is created. Submits to the acceptances.updateItemPrices endpoint.
 *
 * @param {boolean} open
 * @param {Object} acceptance - acceptance with id
 * @param {Array} acceptanceItems - flat list of acceptance items (id, price, discount, method_test...)
 * @param {Function} onClose
 */
const EditItemPricesForm = ({ open, acceptance, acceptanceItems = [], onClose }) => {
    const theme = useTheme();

    const [items, setItems] = useState(() =>
        acceptanceItems.map((item) => ({
            id: item.id,
            name: item?.method_test?.test?.name ?? item?.test?.name ?? `Item #${item.id}`,
            price: item.price ?? 0,
            discount: item.discount ?? 0,
        })),
    );
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleField = (id, field) => (e) => {
        const value = e.target.value;
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
        );
    };

    const totals = useMemo(() => {
        const price = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0), 0);
        const discount = items.reduce((acc, i) => acc + (parseFloat(i.discount) || 0), 0);
        return { price, discount, net: price - discount };
    }, [items]);

    const handleSubmit = () => {
        setProcessing(true);
        router.put(
            route('acceptances.updateItemPrices', acceptance.id),
            {
                items: items.map((i) => ({
                    id: i.id,
                    price: parseFloat(i.price) || 0,
                    discount: parseFloat(i.discount) || 0,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs);
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : onClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 2 } } }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RequestQuote sx={{ mr: 1.5, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h6" component="span">
                            Edit Item Prices
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                        >
                            Adjust the price and discount of each item before creating the invoice
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} disabled={processing} aria-label="Close dialog">
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                {items.length === 0 ? (
                    <Alert severity="info">There are no items to edit.</Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small" aria-label="edit item prices table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell align="right" width={160}>
                                        Price
                                    </TableCell>
                                    <TableCell align="right" width={160}>
                                        Discount
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {item.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={item.price}
                                                onChange={handleField(item.id, 'price')}
                                                error={Boolean(errors[`items.${index}.price`])}
                                                helperText={errors[`items.${index}.price`]}
                                                slotProps={{
                                                    htmlInput: {
                                                        min: 0,
                                                        step: 0.01,
                                                        style: { textAlign: 'right' },
                                                    },
                                                }}
                                                sx={{ width: 140 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={item.discount}
                                                onChange={handleField(item.id, 'discount')}
                                                error={Boolean(errors[`items.${index}.discount`])}
                                                helperText={errors[`items.${index}.discount`]}
                                                slotProps={{
                                                    htmlInput: {
                                                        min: 0,
                                                        step: 0.01,
                                                        style: { textAlign: 'right' },
                                                    },
                                                }}
                                                sx={{ width: 140 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell>
                                        <Typography fontWeight="bold">Net Total</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="bold">
                                            {totals.price.toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="bold" color="error">
                                            -{totals.discount.toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} align="right">
                                        <Typography variant="h6" fontWeight="bold">
                                            Net Amount:
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            color="success.main"
                                        >
                                            {totals.net.toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    variant="outlined"
                    disabled={processing}
                    startIcon={<Close />}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={processing || items.length === 0}
                    startIcon={<Save />}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditItemPricesForm;
