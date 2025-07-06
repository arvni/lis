import React, {useMemo} from 'react';
import {
    TextField,
    Typography,
    Box,
    Paper,
    Tooltip,
    Divider,
    Chip,
    InputAdornment,
    Alert
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CalculateIcon from '@mui/icons-material/Calculate';
import FunctionsIcon from '@mui/icons-material/Functions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
    calcPrice,
    getCondition
} from '@/Services/pricing-utils';

const PriceField = ({
                              method,
                              onChange,
                              values = {},
                              errors = {}
                          }) => {
     console.log(values);
    // Memoized price calculation to optimize performance
    const {calculatedPrice, formula, selectedCondition, isValid} = useMemo(() => {
        const price = calcPrice(
            method.extra.formula || '',
            method.extra.parameters || [],
            values?.price || {},
            method.extra.conditions
        );

        // Check if all required parameters have values
        const allParametersFilled = method.extra.parameters?.every(param =>
            param.required ? Boolean(values?.price?.[param.value]) : true
        );

        // Get the selected condition for conditional pricing
        const condition = method.price_type === "Conditional"
            ? getCondition(
                method.extra.conditions,
                method.extra.parameters,
                values?.price
            )
            : null;

        const displayFormula = method.price_type === "Formulate"
            ? method.extra.formula
            : condition?.value || 'N/A';

        return {
            calculatedPrice: price,
            formula: displayFormula,
            selectedCondition: condition,
            isValid: allParametersFilled && price > 0
        };
    }, [method, values?.price]);

    // Enhanced change handler with improved validation
    const handleChange = (e) => {
        const {name, value} = e.target;

        // Validate input based on parameter constraints
        const parameter = method.extra.parameters?.find(p => p.value === name);
        const numericValue = Number(value);

        if (parameter) {
            // Optional: Add input validation
            if (parameter.type === 'number') {
                if (
                    (parameter.min !== undefined && numericValue < parameter.min) ||
                    (parameter.max !== undefined && numericValue > parameter.max)
                ) {
                    // Optionally: Show validation error
                    return;
                }
            }
        }

        const updatedPrice = {
            ...(values?.price || {}),
            [name]: value
        };

        const newPrice = calcPrice(
            method.extra.formula || '',
            method.extra.parameters || [],
            updatedPrice,
            method.extra.conditions
        );

        onChange({
            customParameters: {
                ...(values || {}),
                price: updatedPrice
            },
            price: newPrice
        });
    };

    // Render nothing if no parameters
    if (!method.extra.parameters?.length) {
        return null;
    }

    return (
        <Grid container spacing={3}>
            <Grid item size={{xs: 12}}>
                <Alert
                    severity="info"
                    icon={<CalculateIcon/>}
                    sx={{mb: 2}}
                >
                    {method.price_type === "Formulate"
                        ? "The price for this test is calculated based on the formula and parameters below."
                        : "The price for this test depends on which condition is met based on the parameters below."}
                </Alert>
            </Grid>

            {method.extra.parameters.map(parameter => {
                const paramError = errors?.[`customParameters.price.${parameter.value}`];

                return (
                    <Grid
                        item
                        size={{xs: 12, sm: 6, md: 4}}
                        key={parameter.value}
                    >
                        <Box display="flex" alignItems="flex-start">
                            <TextField
                                type="number"
                                label={parameter.label || parameter.value}
                                name={parameter.value}
                                fullWidth
                                required={parameter.required}
                                onChange={handleChange}
                                value={values?.price?.[parameter.value] || ''}
                                slotProps={{
                                    input: {
                                        min: parameter.min,
                                        max: parameter.max,
                                        step: parameter.step || 1
                                    },
                                    Input: {
                                        startAdornment: parameter.prefix ? (
                                            <InputAdornment position="start">
                                                {parameter.prefix}
                                            </InputAdornment>
                                        ) : null,
                                        endAdornment: parameter.suffix ? (
                                            <InputAdornment position="end">
                                                {parameter.suffix}
                                            </InputAdornment>
                                        ) : null,
                                    }
                                }}
                                error={Boolean(paramError)}
                                helperText={
                                    paramError ||
                                    (parameter.min !== undefined && parameter.max !== undefined
                                        ? `Range: ${parameter.min} - ${parameter.max}`
                                        : parameter.description || '')
                                }
                                sx={{"& input": {textAlign: 'right'}}}
                            />
                            {parameter.description && (
                                <Tooltip title={parameter.description}>
                                    <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                </Tooltip>
                            )}
                        </Box>
                    </Grid>
                );
            })}

            <Grid item size={{xs: 12}}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mt: 2,
                        backgroundColor: isValid ? 'success.50' : 'grey.50',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isValid ? 'success.light' : 'grey.300'
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item size={{xs: 12, md: 6}}>
                            <Box display="flex" alignItems="center">
                                <FunctionsIcon sx={{mr: 1, color: 'text.secondary'}}/>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {method.price_type === "Formulate" ? "Formula:" : "Conditions:"}
                                </Typography>
                            </Box>

                            {method.price_type === "Conditional" && (
                                <Box sx={{mt: 2, mb: 2}}>
                                    {method.extra.conditions?.map((condition, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                p: 1.5,
                                                mb: 1,
                                                backgroundColor: selectedCondition?.index === index
                                                    ? 'success.light'
                                                    : 'background.paper',
                                                color: selectedCondition?.index === index
                                                    ? 'white'
                                                    : 'text.primary',
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: selectedCondition?.index === index
                                                    ? 'success.main'
                                                    : 'divider',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {selectedCondition?.index === index && (
                                                <CheckCircleOutlineIcon sx={{mr: 1}}/>
                                            )}
                                            <Typography variant="body2" fontFamily="monospace">
                                                {condition.condition}: {condition.value} OMR
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {method.price_type === "Formulate" && (
                                <Box
                                    sx={{
                                        p: 1.5,
                                        mt: 1,
                                        backgroundColor: 'background.paper',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        overflow: 'auto',
                                        maxWidth: '100%'
                                    }}
                                >
                                    {formula || 'Enter all parameters to see the formula'}
                                </Box>
                            )}

                            {method.price_type === "Conditional" && selectedCondition && (
                                <Box sx={{mt: 2}}>
                                    <Chip
                                        icon={<CheckCircleOutlineIcon/>}
                                        label="Applied Condition"
                                        color="success"
                                        size="small"
                                        sx={{mb: 1}}
                                    />
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            backgroundColor: 'success.50',
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'success.light',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {selectedCondition.condition}
                                    </Box>
                                </Box>
                            )}
                        </Grid>

                        <Grid item size={{xs: 12, md: 6}}>
                            <Divider orientation="vertical" sx={{display: {xs: 'none', md: 'block'}}}/>
                            <Divider sx={{display: {xs: 'block', md: 'none'}, my: 2}}/>

                            <Box textAlign="center">
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {method.price_type === "Conditional"
                                        ? "Selected Price:"
                                        : "Calculated Price:"}
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 2,
                                        backgroundColor: isValid ? 'success.main' : 'grey.300',
                                        color: isValid ? 'white' : 'text.secondary',
                                        borderRadius: 2,
                                        minWidth: 120
                                    }}
                                >
                                    <Typography variant="h5" fontWeight="bold">
                                        {isValid ? calculatedPrice.toFixed(2) : '—'} OMR
                                    </Typography>
                                </Box>

                                {!isValid && (
                                    <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>
                                        Fill in all required parameters to determine price
                                    </Typography>
                                )}

                                {method.price_type === "Conditional" && selectedCondition && (
                                    <Typography variant="caption" color="success.dark" sx={{display: 'block', mt: 1}}>
                                        Condition "{selectedCondition.condition}" is applied
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default PriceField;
