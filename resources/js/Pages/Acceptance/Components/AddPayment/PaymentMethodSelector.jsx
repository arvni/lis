import React from 'react';
import {
    Box,
    Chip,
    FormControlLabel,
    Grid,
    Paper,
    Radio,
    RadioGroup,
    Tooltip,
    Typography,
    Zoom,
    alpha,
    useTheme,
} from '@mui/material';
import { ErrorOutlined } from '@mui/icons-material';

export default function PaymentMethodSelector({ data, allErrors, paymentMethods, onMethodChange }) {
    const theme = useTheme();

    return (
        <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Payment Method
                </Typography>
                {allErrors.paymentMethod && (
                    <Chip
                        icon={<ErrorOutlined fontSize="small" />}
                        label="Required"
                        color="error"
                        size="small"
                        variant="outlined"
                        sx={{ ml: 2 }}
                    />
                )}
            </Box>

            <RadioGroup
                aria-label="payment-method"
                name="paymentMethod"
                value={data.paymentMethod}
                onChange={onMethodChange}
            >
                <Grid container spacing={2}>
                    {paymentMethods.map((method) => {
                        // Skip credit payment method if not applicable
                        if (method.value === 'credit' && data.payer?.type !== 'referrer') {
                            return null;
                        }

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={method.value}>
                                <Tooltip
                                    title={
                                        method.disabled ? 'Not available for this payer type' : ''
                                    }
                                    placement="top"
                                    slots={{ transition: Zoom }}
                                >
                                    <Paper
                                        variant={
                                            data.paymentMethod === method.value
                                                ? 'elevation'
                                                : 'outlined'
                                        }
                                        elevation={data.paymentMethod === method.value ? 4 : 0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            borderColor:
                                                data.paymentMethod === method.value
                                                    ? `${method.color}.main`
                                                    : 'divider',
                                            bgcolor:
                                                data.paymentMethod === method.value
                                                    ? alpha(theme.palette[method.color].main, 0.1)
                                                    : 'transparent',
                                            transition: 'all 0.2s',
                                            cursor: method.disabled ? 'not-allowed' : 'pointer',
                                            opacity: method.disabled ? 0.6 : 1,
                                            '&:hover': !method.disabled
                                                ? {
                                                      borderColor: `${method.color}.main`,
                                                      bgcolor: alpha(
                                                          theme.palette[method.color].main,
                                                          0.05,
                                                      ),
                                                  }
                                                : {},
                                        }}
                                        onClick={() => {
                                            if (!method.disabled) {
                                                onMethodChange({
                                                    target: { value: method.value },
                                                });
                                            }
                                        }}
                                    >
                                        <FormControlLabel
                                            value={method.value}
                                            control={
                                                <Radio
                                                    color={method.color}
                                                    checked={data.paymentMethod === method.value}
                                                    disabled={method.disabled}
                                                />
                                            }
                                            label=""
                                            sx={{
                                                m: 0,
                                                width: '100%',
                                                '& .MuiRadio-root': { p: 0, mr: 1 },
                                            }}
                                        />

                                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    p: 1.5,
                                                    borderRadius: '50%',
                                                    bgcolor: alpha(
                                                        theme.palette[method.color].main,
                                                        0.15,
                                                    ),
                                                    color: `${method.color}.main`,
                                                    mb: 1,
                                                }}
                                            >
                                                {React.cloneElement(method.icon, {
                                                    fontSize: 'large',
                                                })}
                                            </Box>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight:
                                                        data.paymentMethod === method.value
                                                            ? 'bold'
                                                            : 'normal',
                                                }}
                                            >
                                                {method.label}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {method.description}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Tooltip>
                            </Grid>
                        );
                    })}
                </Grid>
            </RadioGroup>
        </>
    );
}
