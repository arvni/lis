import React from 'react';
import { Box, InputAdornment, TextField, Typography, alpha, useTheme } from '@mui/material';
import { AccountBalance, CreditCard, Receipt, SwapHoriz } from '@mui/icons-material';

export default function MethodDetailsFields({ data, allErrors, onInformationChange }) {
    const theme = useTheme();

    if (!data.paymentMethod) return null;

    return (
        <Box
            sx={{
                mt: 3,
                p: 2,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 2,
            }}
        >
            {/* Card Payment Details */}
            {data.paymentMethod === 'card' && (
                <Box>
                    <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center' }}
                    >
                        <CreditCard fontSize="small" sx={{ mr: 1 }} />
                        Card Payment Details
                    </Typography>
                    <TextField
                        fullWidth
                        name="receiptReferenceCode"
                        label="Receipt Reference Code"
                        placeholder="Enter the transaction reference number"
                        value={data.information?.receiptReferenceCode || ''}
                        error={!!allErrors['information.receiptReferenceCode']}
                        required
                        helperText={
                            allErrors['information.receiptReferenceCode'] ||
                            'Enter the reference code from the card machine receipt'
                        }
                        onChange={onInformationChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Receipt color="primary" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ mt: 1 }}
                        autoFocus
                    />
                </Box>
            )}

            {/* Bank Transfer Details */}
            {data.paymentMethod === 'transfer' && (
                <Box>
                    <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center' }}
                    >
                        <SwapHoriz fontSize="small" sx={{ mr: 1 }} />
                        Bank Transfer Details
                    </Typography>
                    <TextField
                        fullWidth
                        name="transferReference"
                        label="Transfer Reference"
                        placeholder="Enter the bank transfer reference number"
                        value={data.information?.transferReference || ''}
                        error={!!allErrors['information.transferReference']}
                        required
                        helperText={
                            allErrors['information.transferReference'] ||
                            'Enter the transaction ID or reference from the bank transfer'
                        }
                        onChange={onInformationChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountBalance color="info" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ mt: 1 }}
                        autoFocus
                    />
                </Box>
            )}

            {/* Notes Field for All Payment Methods */}
            <TextField
                fullWidth
                name="notes"
                label="Payment Notes (Optional)"
                placeholder="Add any additional notes about this payment"
                value={data.information?.notes || ''}
                multiline
                rows={2}
                onChange={onInformationChange}
                sx={{ mt: 2 }}
            />
        </Box>
    );
}
