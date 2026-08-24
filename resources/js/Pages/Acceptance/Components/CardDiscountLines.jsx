import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Discounts a partner card granted. They are decided by the contract on the
 * server, so they are shown rather than edited — reception can only remove the
 * card itself, from the card field above.
 */
const CardDiscountLines = ({ discounts = [] }) => {
    if (!discounts.length) return null;

    return (
        <Box sx={{ mb: 2 }}>
            {discounts.map((discount) => (
                <Box
                    key={discount.id}
                    sx={{
                        mb: 1,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: '1px solid',
                        borderColor: 'success.light',
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                    }}
                >
                    <CardMembershipIcon fontSize="small" color="success" />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                            {discount.reason || 'Partner card discount'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {discount.type === 'PERCENTAGE'
                                ? `${discount.value}% of the item price`
                                : 'Fixed contract amount'}
                        </Typography>
                    </Box>
                    <Chip size="small" color="success" label={Number(discount.amount).toFixed(3)} />
                    <Tooltip title="Set by the partner contract — remove the card to change it">
                        <LockIcon fontSize="small" color="disabled" />
                    </Tooltip>
                </Box>
            ))}
        </Box>
    );
};

export default CardDiscountLines;
