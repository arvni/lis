import { Box, CircularProgress, Divider, TextField, Typography } from '@mui/material';
import { QrCode } from '@mui/icons-material';

/**
 * Material barcode field — shown for orderable or required_barcode referrer samples.
 */
export default function MaterialField({ barcode, matVal, isReferredOutpatient, onCheck }) {
    const barcodeRequired = isReferredOutpatient && barcode.sampleType?.required_barcode;
    const missingBarcode = barcodeRequired && !barcode.material?.barcode;

    return (
        <>
            <Divider />
            <Box>
                <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        mb: 1.5,
                        display: 'block',
                    }}
                >
                    Material{' '}
                    {barcodeRequired ? (
                        <Typography component="span" variant="caption" color="error">
                            *
                        </Typography>
                    ) : (
                        <Typography component="span" variant="caption" color="text.disabled">
                            (Optional)
                        </Typography>
                    )}
                </Typography>
                <TextField
                    size="small"
                    sx={{ maxWidth: 360 }}
                    fullWidth
                    label="Material Barcode"
                    placeholder="Scan or enter material barcode"
                    defaultValue={barcode.material?.barcode || ''}
                    onBlur={(e) => onCheck(e.target.value)}
                    error={!!matVal?.error || missingBarcode}
                    helperText={
                        matVal?.error ||
                        (matVal?.valid
                            ? '✓ Material verified'
                            : missingBarcode
                              ? 'Barcode is required for this sample type'
                              : 'Must belong to this referrer if provided')
                    }
                    slotProps={{
                        input: {
                            startAdornment: matVal?.loading ? (
                                <CircularProgress size={16} sx={{ mr: 0.5 }} />
                            ) : (
                                <QrCode
                                    fontSize="small"
                                    color={matVal?.valid ? 'success' : 'action'}
                                    sx={{ mr: 0.5 }}
                                />
                            ),
                        },
                    }}
                />
            </Box>
        </>
    );
}
