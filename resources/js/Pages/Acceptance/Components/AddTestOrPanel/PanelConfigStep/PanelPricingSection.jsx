import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Divider,
    Paper,
    Typography,
} from '@mui/material';
import {
    Calculate as CalculateIcon,
    ExpandMore,
    LocalOffer as DiscountIcon,
} from '@mui/icons-material';
import MethodPriceField from '../../MethodPriceField';
import DiscountManager from '../../DiscountManager';

/** Pricing & Discounts accordion: panel price field, discounts, final total. */
const PanelPricingSection = ({
    panel,
    panelCustomParams,
    hasDynamicPricing,
    totalPrice,
    totalDiscount,
    maxDiscount,
    errors,
    onPriceChange,
    onDiscountChange,
}) => (
    <Accordion
        defaultExpanded
        elevation={1}
        sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}
    >
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">Pricing & Discounts</Typography>
                {totalPrice > 0 && (
                    <Chip
                        label={`${(totalPrice - totalDiscount).toFixed(2)} OMR`}
                        size="small"
                        color="success"
                    />
                )}
            </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 1 }}>
            {hasDynamicPricing && (
                <Box sx={{ mb: 2 }}>
                    <MethodPriceField
                        method={panel}
                        values={panelCustomParams}
                        onChange={onPriceChange}
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
                    customParameters={panelCustomParams}
                    price={totalPrice}
                    maxDiscount={maxDiscount}
                    onChange={onDiscountChange}
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
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Base: {totalPrice.toFixed(2)} OMR
                        </Typography>
                        {totalDiscount > 0 && (
                            <Typography variant="body2" color="secondary.main">
                                Discount: −{totalDiscount.toFixed(2)} OMR
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                            Final
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.dark">
                            {(totalPrice - totalDiscount).toFixed(2)} OMR
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </AccordionDetails>
    </Accordion>
);

export default PanelPricingSection;
