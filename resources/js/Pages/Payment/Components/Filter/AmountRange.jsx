import React from 'react';
import { Box, Stack, Grid, TextField, Typography } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const AmountRange = ({ amountFrom, amountTo, amountError, onAmountChange, onKeyDown }) => (
    <Grid size={{ xs: 12, md: 6 }}>
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoneyIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">
                    Amount Range
                </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
                <TextField
                    fullWidth
                    label="From"
                    placeholder="Min"
                    value={amountFrom}
                    onChange={onAmountChange('amountFrom')}
                    onKeyDown={onKeyDown}
                    error={!!amountError && amountFrom}
                    type="text"
                    slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                />
                <TextField
                    fullWidth
                    label="To"
                    placeholder="Max"
                    value={amountTo}
                    onChange={onAmountChange('amountTo')}
                    onKeyDown={onKeyDown}
                    error={!!amountError}
                    helperText={amountError}
                    type="text"
                    slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                />
            </Stack>
        </Box>
    </Grid>
);

export default AmountRange;
