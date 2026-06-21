import { Box, Typography, Paper, Divider } from '@mui/material';
import { LocalOffer as DiscountIcon } from '@mui/icons-material';
import MethodPriceField from '../MethodPriceField';
import DiscountManager from '../DiscountManager';

// ─── Pricing Section ───────────────────────────────────────────────────────────
const PricingSection = ({
    method,
    customParameters,
    price,
    discount,
    maxDiscount,
    errors,
    onChange,
}) => {
    const isDynamic = method?.price_type === 'Formulate' || method?.price_type === 'Conditional';
    const finalPrice = (Number(price) - Number(discount)).toFixed(2);

    return (
        <Box>
            {isDynamic && (
                <Box sx={{ mb: 2 }}>
                    <MethodPriceField
                        method={method}
                        values={customParameters}
                        onChange={onChange}
                        errors={errors}
                    />
                    <Divider sx={{ my: 2 }} />
                </Box>
            )}

            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <DiscountIcon fontSize="small" color="secondary" />
                    <Typography variant="subtitle2">Discounts</Typography>
                </Box>
                <DiscountManager
                    customParameters={{
                        ...customParameters,
                        discounts: customParameters?.discounts || [],
                    }}
                    price={price || 0}
                    maxDiscount={maxDiscount}
                    onChange={onChange}
                    errors={errors}
                />
            </Box>

            <Paper
                sx={{
                    p: 2,
                    bgcolor: 'success.50',
                    border: '1px solid',
                    borderColor: 'success.200',
                    borderRadius: 1.5,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Base: {Number(price).toFixed(2)} OMR
                        </Typography>
                        {Number(discount) > 0 && (
                            <Typography variant="body2" color="secondary.main">
                                Discount: −{Number(discount).toFixed(2)} OMR
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                            Final
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.dark">
                            {finalPrice} OMR
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default PricingSection;
