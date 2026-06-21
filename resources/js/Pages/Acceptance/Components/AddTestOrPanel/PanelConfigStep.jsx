import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    TextField,
    FormControlLabel,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    Divider,
} from '@mui/material';
import {
    Science,
    PlaylistAddCheck,
    ExpandMore,
    Calculate as CalculateIcon,
    LocalOffer as DiscountIcon,
    Add,
    Settings,
} from '@mui/icons-material';
import SampleRow from './SampleRow';
import MethodPriceField from '../MethodPriceField';
import DiscountManager from '../DiscountManager';

// ─── Panel Configure Step ──────────────────────────────────────────────────────
const PanelConfigStep = ({ panelData, errors, maxDiscount, patient, onChange }) => {
    const { panel, acceptanceItems = [], sampleless, reportless } = panelData;
    const [expandedItem, setExpandedItem] = useState(null);

    // Auto-expand the first item accordion that has errors
    useEffect(() => {
        if (!errors || !Object.keys(errors).length) return;
        const errorKey = Object.keys(errors).find((k) => k.startsWith('item'));
        if (errorKey) {
            const idx = parseInt(errorKey.replace('item', ''), 10);
            const item = acceptanceItems[idx];
            if (item) setExpandedItem(item.id);
        }
    }, [errors, acceptanceItems]);

    const handleSamplelessChange = (e) => {
        const val = e.target.checked;
        const updates = { sampleless: val };
        if (val && patient) {
            updates.acceptanceItems = acceptanceItems.map((item) => ({
                ...item,
                sampleless: true,
                samples: [
                    { patients: [{ id: patient.id, name: patient.fullName }], sampleType: '' },
                ],
            }));
            updates.reportless = true;
        } else if (!val) {
            updates.acceptanceItems = acceptanceItems.map((item) => ({
                ...item,
                sampleless: false,
            }));
        }
        onChange(updates);
    };

    const handleReportlessChange = (e) => {
        const val = e.target.checked;
        onChange({
            reportless: val,
            acceptanceItems: acceptanceItems.map((item) => ({ ...item, reportless: val })),
        });
    };

    const handleItemSampleChange = (itemId, si, field, value, pi) => {
        onChange({
            acceptanceItems: acceptanceItems.map((item) => {
                if (item.id !== itemId) return item;
                const newSamples = (item.samples || []).map((s, idx) => {
                    if (idx !== si) return s;
                    if (field === 'sampleType') return { ...s, sampleType: value };
                    if (field === 'patient') {
                        const pts = [...(s.patients || [])];
                        pts[pi] = value;
                        return { ...s, patients: pts };
                    }
                    return s;
                });
                return { ...item, samples: newSamples };
            }),
        });
    };

    const addItemSample = (itemId) => {
        onChange({
            acceptanceItems: acceptanceItems.map((item) => {
                if (item.id !== itemId) return item;
                const maxS = item.method_test?.method?.no_sample || 1;
                const curr = item.samples || [];
                if (curr.length >= maxS) return item;
                const pCount = item.method_test?.method?.no_patient || 1;
                const def = patient ? { id: patient.id, name: patient.fullName } : null;
                return {
                    ...item,
                    samples: [
                        ...curr,
                        { patients: Array(pCount).fill(def).filter(Boolean), sampleType: '' },
                    ],
                    no_sample: curr.length + 1,
                };
            }),
        });
    };

    const removeItemSample = (itemId, si) => {
        onChange({
            acceptanceItems: acceptanceItems.map((item) => {
                if (item.id !== itemId) return item;
                const curr = item.samples || [];
                if (curr.length <= 1) return item;
                return {
                    ...item,
                    samples: curr.filter((_, i) => i !== si),
                    no_sample: curr.length - 1,
                };
            }),
        });
    };

    const handlePanelPriceChange = (priceData) => {
        const priceEach = (priceData.price || 0) / (acceptanceItems.length || 1);
        onChange({
            ...priceData,
            acceptanceItems: acceptanceItems.map((item) => ({
                ...item,
                price: priceEach,
                customParameters: {
                    ...item.customParameters,
                    ...(priceData.customParameters || {}),
                },
            })),
        });
    };

    const handlePanelDiscountChange = (discountData) => {
        const discountEach = (discountData.discount || 0) / (acceptanceItems.length || 1);
        onChange({
            ...discountData,
            discount: discountData.discount || 0,
            acceptanceItems: acceptanceItems.map((item) => ({
                ...item,
                discount: discountEach,
                customParameters: {
                    ...item.customParameters,
                    ...(discountData.customParameters || {}),
                },
            })),
        });
    };

    const totalPrice = acceptanceItems.reduce((s, i) => s + (Number(i.price) || 0), 0);
    const totalDiscount = acceptanceItems.reduce((s, i) => s + (Number(i.discount) || 0), 0);
    const firstItem = acceptanceItems[0];
    const panelCustomParams = {
        ...(firstItem?.customParameters || {}),
        discounts: firstItem?.customParameters?.discounts || [],
    };
    const hasDynamicPricing =
        panel?.extra?.parameters?.length > 0 &&
        (panel?.price_type === 'Formulate' || panel?.price_type === 'Conditional');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Panel Info */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'secondary.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlaylistAddCheck color="secondary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="bold">
                            {panel?.name}
                        </Typography>
                        <Chip
                            label={`${acceptanceItems.length} tests`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                    </Box>
                    {panel?.price_type === 'Fix' && (
                        <Typography variant="subtitle2" color="secondary.main" fontWeight="bold">
                            {panel.price} OMR
                        </Typography>
                    )}
                </Box>
            </Paper>

            {/* Panel Options */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Panel Options
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={sampleless || false}
                                onChange={handleSamplelessChange}
                                color="warning"
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2">Sampleless</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    No physical sample needed
                                </Typography>
                            </Box>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={reportless || sampleless || false}
                                onChange={handleReportlessChange}
                                color="info"
                                size="small"
                                disabled={sampleless}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2">Reportless</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    No report generated
                                </Typography>
                            </Box>
                        }
                    />
                </Box>
            </Paper>

            {/* Per-test Sample Config */}
            {!sampleless && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Sample Configuration per Test
                    </Typography>
                    {acceptanceItems.map((item, idx) => {
                        const sampleTypes = item.method_test?.method?.test?.sample_types || [];
                        const patientCount = item.method_test?.method?.no_patient || 1;
                        const maxS = item.method_test?.method?.no_sample || 1;
                        const itemSamples = item.samples || [];
                        const hasErr = Object.keys(errors).some((k) => k.startsWith(`item${idx}`));

                        return (
                            <Accordion
                                key={item.id}
                                expanded={expandedItem === item.id}
                                onChange={() =>
                                    setExpandedItem(expandedItem === item.id ? null : item.id)
                                }
                                elevation={1}
                                sx={{
                                    mb: 0.5,
                                    borderRadius: '8px !important',
                                    '&:before': { display: 'none' },
                                    border: hasErr ? '1px solid' : 'none',
                                    borderColor: 'error.main',
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    sx={{ bgcolor: hasErr ? 'error.50' : 'grey.50' }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Science
                                            fontSize="small"
                                            color={hasErr ? 'error' : 'action'}
                                        />
                                        <Typography variant="body2" fontWeight="medium">
                                            {item.method_test?.method?.test?.name}
                                        </Typography>
                                        <Chip
                                            label={item.method_test?.method?.name}
                                            size="small"
                                            variant="outlined"
                                        />
                                        {itemSamples.length > 0 && (
                                            <Chip
                                                label={`${itemSamples.length}/${maxS} samples`}
                                                size="small"
                                                color="primary"
                                            />
                                        )}
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 1 }}>
                                    <Stack spacing={1.5}>
                                        {itemSamples.map((sample, si) => (
                                            <SampleRow
                                                key={si}
                                                sample={sample}
                                                sampleIndex={si}
                                                sampleTypes={sampleTypes}
                                                patientCount={patientCount}
                                                errors={Object.fromEntries(
                                                    Object.entries(errors)
                                                        .filter(([k]) =>
                                                            k.startsWith(`item${idx}.s${si}`),
                                                        )
                                                        .map(([k, v]) => [
                                                            k.replace(`item${idx}.`, ''),
                                                            v,
                                                        ]),
                                                )}
                                                patient={patient}
                                                onChange={(si2, field, value, pi) =>
                                                    handleItemSampleChange(
                                                        item.id,
                                                        si2,
                                                        field,
                                                        value,
                                                        pi,
                                                    )
                                                }
                                                onRemove={(si2) => removeItemSample(item.id, si2)}
                                                canRemove={itemSamples.length > 1}
                                            />
                                        ))}
                                        {itemSamples.length < maxS && (
                                            <Button
                                                size="small"
                                                startIcon={<Add />}
                                                onClick={() => addItemSample(item.id)}
                                                variant="outlined"
                                                sx={{ alignSelf: 'flex-start' }}
                                            >
                                                Add Sample
                                            </Button>
                                        )}
                                        {itemSamples.length === 0 && (
                                            <Button
                                                size="small"
                                                startIcon={<Add />}
                                                onClick={() => addItemSample(item.id)}
                                                variant="contained"
                                                sx={{ alignSelf: 'flex-start' }}
                                            >
                                                Configure Sample
                                            </Button>
                                        )}
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            )}

            {/* Panel Pricing */}
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
                                onChange={handlePanelPriceChange}
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
                            onChange={handlePanelDiscountChange}
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

            {/* Per-test Notes */}
            <Accordion
                elevation={1}
                sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}
            >
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Settings fontSize="small" color="action" />
                        <Typography variant="subtitle2">
                            Additional Notes per Test{' '}
                            <Typography component="span" variant="caption" color="text.secondary">
                                (optional)
                            </Typography>
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                    <Stack spacing={1.5}>
                        {acceptanceItems.map((item) => (
                            <Box key={item.id}>
                                <Typography variant="caption" color="primary.main" fontWeight="bold">
                                    {item.method_test?.method?.test?.name} —{' '}
                                    {item.method_test?.method?.name}
                                </Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={item.details || ''}
                                    onChange={(e) =>
                                        onChange({
                                            acceptanceItems: acceptanceItems.map((i) =>
                                                i.id === item.id
                                                    ? { ...i, details: e.target.value }
                                                    : i,
                                            ),
                                        })
                                    }
                                    placeholder="Optional notes..."
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default PanelConfigStep;
