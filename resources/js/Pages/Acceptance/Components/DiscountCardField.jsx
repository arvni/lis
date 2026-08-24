import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import axios from 'axios';

const PREVIEW_MIN_LENGTH = 6;
const PREVIEW_DEBOUNCE_MS = 400;

/**
 * Scan or type a partner discount card onto an acceptance.
 *
 * The card is only ever a reference — every amount it produces is decided on the
 * server — so this field attaches and detaches, and never edits a price.
 */
const DiscountCardField = ({ acceptanceId, card, canApply = false, errors = {} }) => {
    const [code, setCode] = useState('');
    const [preview, setPreview] = useState(null);
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const timerRef = useRef(null);

    // Preview as the scanner types, so reception sees whose card it is before
    // committing it to the acceptance.
    useEffect(() => {
        if (card || code.trim().length < PREVIEW_MIN_LENGTH) {
            setPreview(null);
            return undefined;
        }

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setChecking(true);
            axios
                .get(route('api.discountCards.resolve'), { params: { code: code.trim() } })
                .then((response) => setPreview(response.data))
                .catch(() => setPreview(null))
                .finally(() => setChecking(false));
        }, PREVIEW_DEBOUNCE_MS);

        return () => clearTimeout(timerRef.current);
    }, [code, card]);

    const handleApply = useCallback(() => {
        if (!code.trim()) return;
        setSubmitting(true);
        router.post(
            route('acceptances.discountCard.store', acceptanceId),
            { code: code.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setCode(''),
                onFinish: () => setSubmitting(false),
            },
        );
    }, [code, acceptanceId]);

    const handleRemove = useCallback(() => {
        setSubmitting(true);
        router.delete(route('acceptances.discountCard.destroy', acceptanceId), {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
        });
    }, [acceptanceId]);

    if (!canApply && !card) return null;

    return (
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: card ? 0 : 2 }}>
                <CardMembershipIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    Partner Discount Card
                </Typography>

                {card && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title={`Card ${card.number}`}>
                            <Chip
                                icon={<CheckCircleIcon />}
                                color="success"
                                variant="outlined"
                                label={card.partner}
                            />
                        </Tooltip>
                        {canApply && (
                            <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                disabled={submitting}
                                onClick={handleRemove}
                            >
                                Remove
                            </Button>
                        )}
                    </Stack>
                )}
            </Box>

            {!card && (
                <>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                        <TextField
                            fullWidth
                            size="small"
                            label="Scan or type the card"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    handleApply();
                                }
                            }}
                            error={!!errors?.code}
                            helperText={errors?.code || 'The card number, or the scanned QR link'}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <QrCodeScannerIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: checking ? (
                                        <InputAdornment position="end">
                                            <CircularProgress size={16} />
                                        </InputAdornment>
                                    ) : null,
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            disabled={submitting || !code.trim() || preview?.valid === false}
                            onClick={handleApply}
                            sx={{ mt: 0.5 }}
                        >
                            Apply
                        </Button>
                    </Stack>

                    {preview && (
                        <Alert severity={preview.valid ? 'success' : 'warning'} sx={{ mt: 2 }}>
                            {preview.valid
                                ? `${preview.card.partner} — card ${preview.card.number}`
                                : preview.reason}
                        </Alert>
                    )}
                </>
            )}
        </Paper>
    );
};

export default DiscountCardField;
