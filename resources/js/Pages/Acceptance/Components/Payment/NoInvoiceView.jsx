import { Alert, Box, Button, Card, CardContent, Divider, Input, Stack, Typography } from '@mui/material';
import { Remove as RemoveIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { sum } from '@/Services/helper';

const NoInvoiceView = ({ acceptanceItems, data, handleChange, totalSum, onCreateInvoice }) => (
    <Box sx={{ py: 2 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
            No invoice has been created for this acceptance yet.
        </Alert>

        <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 2,
                    }}
                >
                    <ReceiptIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Items Summary
                    </Typography>
                    <Box sx={{ width: '100%', maxWidth: 500, mt: 2 }}>
                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography>Total Items:</Typography>
                                <Typography fontWeight="bold">{acceptanceItems.length}</Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography>Subtotal:</Typography>
                                <Typography>{sum(acceptanceItems, 'price').toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography>Item Discounts:</Typography>
                                <Typography color="error">
                                    - {sum(acceptanceItems, 'discount').toFixed(2)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography>Additional Discount:</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <RemoveIcon fontSize="small" sx={{ color: 'error.main' }} />
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data?.discount || 0}
                                        onChange={handleChange}
                                        name="discount"
                                        size="small"
                                        sx={{ width: 80 }}
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                max:
                                                    sum(acceptanceItems, 'price') -
                                                    sum(acceptanceItems, 'discount'),
                                                step: 0.01,
                                                style: { textAlign: 'right' },
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography fontWeight="bold">Net Total:</Typography>
                                <Typography fontWeight="bold">{totalSum.toFixed(2)}</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Box>
            </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
                variant="contained"
                onClick={onCreateInvoice}
                startIcon={<ReceiptIcon />}
                size="large"
            >
                Create Invoice
            </Button>
        </Box>
    </Box>
);

export default NoInvoiceView;
