import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Alert, Box, Chip, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';

/**
 * Public landing page for a card's QR. It deliberately shows nothing about any
 * patient — a bearer card is not tied to one — and reveals the contract only for
 * a card that actually works.
 */
const Verify = () => {
    const { valid, reason, card } = usePage().props;

    return (
        <>
            <Head title="Discount Card" />
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                    <Stack spacing={3} alignItems="center" textAlign="center">
                        {valid ? (
                            <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
                        ) : (
                            <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
                        )}

                        <Typography variant="h5">
                            {valid ? 'Valid discount card' : 'This card cannot be used'}
                        </Typography>

                        {!valid && <Alert severity="warning">{reason}</Alert>}

                        {valid && card && (
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="h6">{card.partner}</Typography>
                                <Typography
                                    sx={{ fontFamily: 'monospace', mt: 1, color: 'text.secondary' }}
                                >
                                    {card.number}
                                </Typography>
                                <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                                    {card.expires_at
                                        ? `Valid until ${card.expires_at}`
                                        : 'No expiry'}
                                </Typography>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="subtitle2" gutterBottom>
                                    Discounts on this card
                                </Typography>
                                <Stack spacing={1} alignItems="center">
                                    {card.discounts?.map((discount) => (
                                        <Chip
                                            key={discount.title}
                                            label={`${discount.title} — ${
                                                discount.type === 'PERCENTAGE'
                                                    ? `${discount.amount}%`
                                                    : discount.amount
                                            }`}
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        <Typography variant="caption" color="text.secondary">
                            Present this card at reception to have the discount applied.
                        </Typography>
                    </Stack>
                </Paper>
            </Container>
        </>
    );
};

export default Verify;
