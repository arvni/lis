import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Chip,
    FormControl,
    FormHelperText,
    Grid2 as Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Define discount types
const DISCOUNT_TYPES = [
    {id: 'PERCENTAGE', name: 'Percentage', icon: '%'},
    {id: 'FIXED', name: 'Fixed Amount', icon: 'OMR'}
];

/**
 * DiscountManager component for handling multiple discounts
 * @param {Object} props - Component props
 * @param {Object} props.customParameters - Current custom parameters including discounts
 * @param {number} props.price - Current test price
 * @param {number} props.maxDiscount - Maximum allowed discount percentage
 * @param {function} props.onChange - Change handler function
 * @param {Object} props.errors - Validation errors
 */
const DiscountManager = ({
                             customParameters = {},
                             price = 0,
                             maxDiscount = 0,
                             onChange,
                             errors = {}
                         }) => {
    // Initialize or use existing discounts array from customParameters
    const [discounts, setDiscounts] = useState(customParameters.discounts || []);

    useEffect(() => {
        handleDiscountChange()
    }, []);

    // Calculate total discount amount
    const calculateTotalDiscount = (discountArray) => {
        return discountArray.reduce((total, discount) => {
            if (discount.type === 'PERCENTAGE') {
                return total + (price * discount.value / 100);
            } else {
                return total + Number(discount.value);
            }
        }, 0);
    };

    // Calculate total discount percentage
    const calculateTotalDiscountPercentage = (discountArray) => {
        return discountArray.reduce((total, discount) => {
            if (discount.type === 'PERCENTAGE') {
                return total + Number(discount.value);
            } else {
                return total + (discount.value / price * 100);
            }
        }, 0);
    };

    // Add a new discount
    const handleAddDiscount = () => {
        const newDiscounts = [
            ...discounts,
            {id: Date.now(), type: 'PERCENTAGE', value: 0, reason: ''}
        ];
        setDiscounts(newDiscounts);

        // Update parent component
        const totalDiscount = calculateTotalDiscount(newDiscounts);
        onChange({
            customParameters: {
                ...customParameters,
                discounts: newDiscounts
            },
            discount: totalDiscount
        });
    };

    // Remove a discount
    const handleRemoveDiscount = (id) => {
        const newDiscounts = discounts.filter(discount => discount.id !== id);
        setDiscounts(newDiscounts);

        // Update parent component
        const totalDiscount = calculateTotalDiscount(newDiscounts);
        onChange({
            customParameters: {
                ...customParameters,
                discounts: newDiscounts
            },
            discount: totalDiscount
        });
    };

    // Update a discount field
    const handleDiscountChange = (id, field, value) => {
        const newDiscounts = discounts.map(discount => {
            if (discount.id === id) {
                return {...discount, [field]: value};
            }
            return discount;
        });

        setDiscounts(newDiscounts);

        // Calculate total discount amount
        const totalDiscount = calculateTotalDiscount(newDiscounts);
        const totalDiscountPercentage = calculateTotalDiscountPercentage(newDiscounts);

        // Check if exceeding max discount
        const maxAmount = maxDiscount * price * 0.01;
        const finalDiscount = Math.min(totalDiscount, maxAmount);

        // If exceeding max discount, adjust the last discount
        let adjustedDiscounts = [...newDiscounts];
        if (totalDiscount > maxAmount && adjustedDiscounts.length > 0) {
            const lastIndex = adjustedDiscounts.length - 1;
            const lastDiscount = adjustedDiscounts[lastIndex];

            if (lastDiscount.type === 'PERCENTAGE') {
                const excess = totalDiscountPercentage - maxDiscount;
                const newValue = Math.max(0, Number(lastDiscount.value) - excess);
                adjustedDiscounts[lastIndex] = {...lastDiscount, value: newValue};
            } else {
                const excess = totalDiscount - maxAmount;
                const newValue = Math.max(0, Number(lastDiscount.value) - excess);
                adjustedDiscounts[lastIndex] = {...lastDiscount, value: newValue};
            }

            setDiscounts(adjustedDiscounts);
        }

        // Update parent component
        onChange({
            customParameters: {
                ...customParameters,
                discounts: totalDiscount > maxAmount ? adjustedDiscounts : newDiscounts
            },
            discount: finalDiscount
        });
    };

    // Calculate remaining available discount
    const remainingDiscountPercentage = Math.max(0, maxDiscount - calculateTotalDiscountPercentage(discounts));
    const remainingDiscountAmount = Math.max(0, (maxDiscount * price * 0.01) - calculateTotalDiscount(discounts));

    return (
        <Box>
            <Box sx={{mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="subtitle2">
                    Discounts
                </Typography>
                <Box>
                    <Tooltip
                        title={`Remaining available discount: ${remainingDiscountPercentage.toFixed(2)}% (${remainingDiscountAmount.toFixed(2)} OMR)`}>
                        <Chip
                            label={`Available: ${remainingDiscountPercentage.toFixed(2)}%`}
                            color={remainingDiscountPercentage > 0 ? "success" : "error"}
                            size="small"
                            sx={{mr: 1}}
                        />
                    </Tooltip>
                    <Button
                        size="small"
                        startIcon={<AddIcon/>}
                        variant="outlined"
                        onClick={handleAddDiscount}
                        disabled={remainingDiscountPercentage <= 0}
                    >
                        Add Discount
                    </Button>
                </Box>
            </Box>

            {discounts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 2}}>
                    No discounts applied. Click "Add Discount" to apply one.
                </Typography>
            ) : (
                discounts.map((discount, index) => (
                    <Box
                        key={discount.id}
                        sx={{
                            mb: 2,
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid size={{xs: 12, sm: 3}}>
                                <FormControl
                                    fullWidth
                                    error={Boolean(errors?.[`customParameters.discounts.${index}.type`])}
                                >
                                    <Select
                                        size="small"
                                        value={discount.type}
                                        onChange={(e) => handleDiscountChange(discount.id, 'type', e.target.value)}
                                    >
                                        {DISCOUNT_TYPES.map(type => (
                                            <MenuItem key={type.id} value={type.id}>
                                                {type.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors?.[`customParameters.discounts.${index}.type`] && (
                                        <FormHelperText error>
                                            {errors[`customParameters.discounts.${index}.type`]}
                                        </FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            <Grid size={{xs: 12, sm: 3}}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Value"
                                    value={discount.value}
                                    onChange={(e) => {
                                        const newValue = Math.max(0, parseFloat(e.target.value) || 0);
                                        handleDiscountChange(discount.id, 'value', newValue);
                                    }}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    {discount.type === 'PERCENTAGE' ? '%' : 'OMR'}
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                    error={Boolean(errors?.[`customParameters.discounts.${index}.value`])}
                                    helperText={errors?.[`customParameters.discounts.${index}.value`] || ''}
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 3}}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Reason"
                                    value={discount.reason || ''}
                                    onChange={(e) => handleDiscountChange(discount.id, 'reason', e.target.value)}
                                    placeholder="Why is this discount applied?"
                                    error={Boolean(errors?.[`customParameters.discounts.${index}.reason`])}
                                    helperText={errors?.[`customParameters.discounts.${index}.reason`] || ''}
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 1}} sx={{display: 'flex', alignItems: 'center'}}>
                                <Tooltip title="Remove discount">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveDiscount(discount.id)}
                                        size="small"
                                    >
                                        <DeleteIcon/>
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>

                        <Box sx={{mt: 1, display: 'flex', justifyContent: 'flex-end'}}>
                            <Typography variant="body2" color="text.secondary">
                                Amount:
                                <Typography
                                    component="span"
                                    fontWeight="medium"
                                    color="primary.main"
                                    sx={{ml: 1}}
                                >
                                    {discount.type === 'PERCENTAGE'
                                        ? (price * discount.value / 100).toFixed(2)
                                        : Number(discount.value).toFixed(2)
                                    } OMR
                                </Typography>
                            </Typography>
                        </Box>
                    </Box>
                ))
            )}

            {discounts.length > 0 && (
                <Box sx={{
                    p: 2,
                    bgcolor: 'primary.50',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="subtitle2">
                        Total Discount:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {calculateTotalDiscount(discounts).toFixed(2)} OMR
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ml: 1}}>
                            ({calculateTotalDiscountPercentage(discounts).toFixed(2)}%)
                        </Typography>
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default DiscountManager;
