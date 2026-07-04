import React from 'react';
import { Box, Typography } from '@mui/material';

const PriceDisplay = ({ price, discount }) => {
    const hasDiscount = Number(discount) > 0;

    return (
        <Box sx={{ textAlign: 'right' }}>
            <Typography
                variant="body2"
                fontWeight="medium"
                color={hasDiscount ? 'success.main' : 'text.primary'}
            >
                {price}
            </Typography>
            {hasDiscount && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                    -{discount} discount
                </Typography>
            )}
        </Box>
    );
};

export default PriceDisplay;
