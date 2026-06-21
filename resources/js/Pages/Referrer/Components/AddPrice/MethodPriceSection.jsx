import { Box, Chip, Collapse, IconButton, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Science as ScienceIcon,
} from '@mui/icons-material';
import PriceTypeSelect from './PriceTypeSelect.jsx';
import FixPriceInput from './FixPriceInput.jsx';
import AdvancedPricingFields from './AdvancedPricingFields.jsx';

// Collapsible per-method pricing configuration card
const MethodPriceSection = ({
    methodData,
    method,
    isExpanded,
    index,
    errors,
    onToggle,
    onMethodChange,
    onMethodExtraChange,
}) => {
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
            }}
            key={`method-${method?.id}`}
        >
            {/* Method Header */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                }}
                onClick={() => onToggle(index)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceIcon />
                    <Typography variant="h6" component="div">
                        {method?.name}
                    </Typography>
                    <Chip
                        label={methodData.price_type || 'Fix'}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'inherit',
                            fontWeight: 'bold',
                        }}
                    />
                </Box>
                <IconButton
                    sx={{ color: 'inherit' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(index);
                    }}
                >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            {/* Method Content */}
            <Collapse in={isExpanded}>
                <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        {/* Price Type Selection */}
                        <Grid size={6}>
                            <PriceTypeSelect
                                value={methodData.price_type}
                                onChange={(e) => onMethodChange(index, 'price_type', e.target.value)}
                                labelId={`price-type-select-label-${index}`}
                                id={`price-type-select-${index}`}
                            />
                        </Grid>

                        {/* Price Input Sections based on price type */}
                        {methodData.price_type === 'Fix' ? (
                            <Grid size={6}>
                                <FixPriceInput
                                    value={methodData.price}
                                    error={errors[`methods.${index}.price`]}
                                    onChange={(e) => onMethodChange(index, 'price', e.target.value)}
                                    labelId={`payment-method-label-${index}`}
                                />
                            </Grid>
                        ) : (
                            <AdvancedPricingFields
                                priceType={methodData.price_type}
                                parameters={methodData.extra?.parameters}
                                formula={methodData.extra?.formula}
                                conditions={methodData.extra?.conditions}
                                formulaError={errors[`methods.${index}.extra.formula`]}
                                onParametersChange={(e) =>
                                    onMethodExtraChange(index, 'parameters', e.target.value)
                                }
                                onFormulaChange={(e) =>
                                    onMethodExtraChange(index, 'formula', e.target.value)
                                }
                                onConditionsChange={(e) =>
                                    onMethodExtraChange(index, 'conditions', e.target.value)
                                }
                            />
                        )}
                    </Grid>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default MethodPriceSection;
