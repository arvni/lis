import React from 'react';
import {
    Box,
    FormControl,
    FormHelperText,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Paper,
    Select,
    Typography,
} from '@mui/material';
import { AttachMoney, Business, Person } from '@mui/icons-material';

export default function PayerAmountSection({
    data,
    allErrors,
    payers,
    max,
    shouldFocusAmount,
    onPayerChange,
    onPriceChange,
}) {
    return (
        <Box
            component={Paper}
            variant="outlined"
            sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                transition: 'all 0.2s',
                borderColor: Object.keys(allErrors).length > 0 ? 'error.light' : 'divider',
            }}
        >
            <Grid container spacing={3}>
                {/* Payer Selection */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth error={!!allErrors.payer}>
                        <InputLabel id="payer-select-label" required>
                            Payer
                        </InputLabel>
                        <Select
                            labelId="payer-select-label"
                            label="Payer"
                            name="payer"
                            required
                            value={data.payer ? `${data.payer.type}-${data.payer.id}` : ''}
                            onChange={onPayerChange}
                            startAdornment={
                                data.payer && (
                                    <InputAdornment position="start">
                                        {data.payer.type === 'patient' ? (
                                            <Person color="primary" />
                                        ) : (
                                            <Business color="secondary" />
                                        )}
                                    </InputAdornment>
                                )
                            }
                        >
                            {payers.length === 0 ? (
                                <MenuItem disabled>
                                    <Typography color="text.secondary">
                                        No payers available
                                    </Typography>
                                </MenuItem>
                            ) : (
                                payers.map((payer) => (
                                    <MenuItem
                                        key={`${payer.type}-${payer.id}`}
                                        value={`${payer.type}-${payer.id}`}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <span>{payer.name}</span>
                                        </Box>
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                        {allErrors.payer && (
                            <FormHelperText error>{allErrors.payer}</FormHelperText>
                        )}
                    </FormControl>
                </Grid>

                {/* Payment Amount */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth error={!!allErrors.price}>
                        <InputLabel id="amount-input-label" required>
                            Payment Amount
                        </InputLabel>
                        <OutlinedInput
                            type="number"
                            name="price"
                            label="Payment Amount"
                            value={data.price}
                            required
                            autoFocus={shouldFocusAmount}
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    max: max,
                                    step: 0.01,
                                },
                            }}
                            onChange={onPriceChange}
                            startAdornment={
                                <InputAdornment position="start">
                                    <AttachMoney color={data.price > 0 ? 'success' : 'action'} />
                                </InputAdornment>
                            }
                            endAdornment={<InputAdornment position="end">OMR</InputAdornment>}
                        />
                        {allErrors.price ? (
                            <FormHelperText error>{allErrors.price}</FormHelperText>
                        ) : (
                            <FormHelperText>
                                Enter amount up to {max.toFixed(2)} OMR
                            </FormHelperText>
                        )}
                    </FormControl>
                </Grid>
            </Grid>
        </Box>
    );
}
