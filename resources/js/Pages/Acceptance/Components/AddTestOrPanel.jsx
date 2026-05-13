import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Grid, Paper, Button, IconButton, Chip,
    CircularProgress, Alert, TextField, FormControlLabel, Switch,
    Stepper, Step, StepLabel, Accordion, AccordionSummary, AccordionDetails,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    FormControl, InputLabel, Select, MenuItem, FormHelperText,
    Stack, Divider, Tooltip
} from '@mui/material';
import {
    Close, Science, PlaylistAddCheck, ArrowBack, Check, ExpandMore,
    Person as PersonIcon, AccessTime, Paid, Calculate as CalculateIcon,
    LocalOffer as DiscountIcon, Add, Remove, Settings, InfoOutlined
} from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch';
import MethodPriceField from './MethodPriceField';
import DiscountManager from './DiscountManager';
import { makeId } from '@/Services/helper';
import axios from 'axios';

// ─── Type Configs ─────────────────────────────────────────────────────────────
const TYPES = [
    { value: 'TEST', label: 'Lab Test', desc: 'Single diagnostic test with sample', color: 'primary' },
    { value: 'SERVICE', label: 'Service', desc: 'Clinical or administrative service', color: 'success' },
    { value: 'PANEL', label: 'Panel', desc: 'Bundle of related tests', color: 'secondary' },
];

// ─── Data Factories ────────────────────────────────────────────────────────────
const makeTestData = (init = {}) => ({
    ic: makeId(6),
    method_test: { test: { type: '' }, id: null, method: null },
    price: 0, discount: 0, details: '',
    sampleless: false, samples: [],
    customParameters: { sampleType: '', discounts: [] },
    ...init,
});

const makePanelData = (init = {}) => ({
    id: makeId(6),
    panel: null, acceptanceItems: [],
    price: 0, discount: 0,
    sampleless: false, reportless: false,
    ...init,
});

// ─── Validation ────────────────────────────────────────────────────────────────
const validateTest = (data, maxDiscount) => {
    const errs = {};
    if (!data.method_test?.test?.id) errs.test = 'Please select a test';
    if (!data.method_test?.id) errs.method = 'Please select a method';
    if (!data.price || Number(data.price) <= 0) errs.price = 'Price must be greater than 0';
    const isService = data.method_test?.test?.type === 'SERVICE';
    if (!isService && !data.sampleless) {
        if (!data.samples?.length) {
            errs.samples = 'At least one sample is required';
        } else {
            data.samples.forEach((s, si) => {
                if (!s.sampleType) errs[`s${si}.sampleType`] = 'Select a sample type';
                (s.patients || []).forEach((p, pi) => {
                    if (!p?.id) errs[`s${si}.p${pi}`] = 'Select a patient';
                });
            });
        }
    }
    if (maxDiscount && data.price > 0 && data.discount > maxDiscount * data.price * 0.01)
        errs.discount = `Discount cannot exceed ${maxDiscount}%`;
    return errs;
};

const validatePanel = (data, maxDiscount) => {
    const errs = {};
    if (!data.panel?.id) { errs.panel = 'Please select a panel'; return errs; }
    if (maxDiscount && data.price > 0 && data.discount > maxDiscount * data.price / 100)
        errs.discount = 'Discount exceeds the maximum allowed';
    if (!data.sampleless) {
        (data.acceptanceItems || []).forEach((item, i) => {
            if (!item.sampleless && !item.samples?.length)
                errs[`item${i}.samples`] = 'At least one sample required';
            (item.samples || []).forEach((s, si) => {
                if (!s.sampleType) errs[`item${i}.s${si}.sampleType`] = 'Select a sample type';
                (s.patients || []).forEach((p, pi) => {
                    if (!p?.id) errs[`item${i}.s${si}.p${pi}`] = 'Select a patient';
                });
            });
        });
    }
    return errs;
};

// ─── Step 1: Type + Selection ──────────────────────────────────────────────────
const SelectStep = ({ type, testData, panelData, loading, errors, requestedTests, onTypeSelect, onItemSelect, onRequestedSelect }) => {
    const preview = type !== 'PANEL' ? testData.method_test?.test : panelData.panel;
    const hasPreview = Boolean(preview?.id);

    return (
        <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                What would you like to add?
            </Typography>

            <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {TYPES.map(({ value, label, desc, color }) => (
                    <Grid key={value} size={{ xs: 12, sm: 4 }}>
                        <Paper
                            elevation={type === value ? 4 : 1}
                            onClick={() => onTypeSelect(value)}
                            sx={{
                                p: 2, cursor: 'pointer', borderRadius: 2,
                                border: '2px solid',
                                borderColor: type === value ? `${color}.main` : 'transparent',
                                bgcolor: type === value ? `${color}.50` : 'background.paper',
                                transition: 'all 0.15s ease',
                                '&:hover': { borderColor: `${color}.300`, bgcolor: `${color}.50`, transform: 'translateY(-1px)' },
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight="bold" color={type === value ? `${color}.main` : 'text.primary'}>
                                {label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{desc}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {errors.type && <Alert severity="error" sx={{ mb: 2 }}>{errors.type}</Alert>}

            {type && (
                <Box>
                    {type !== 'PANEL' && requestedTests.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">Quick select from requested:</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {requestedTests.map(t => (
                                    <Chip
                                        key={t.server_id || t.name}
                                        label={t.name}
                                        onClick={onRequestedSelect(t)}
                                        size="small"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    <SelectSearch
                        value={type !== 'PANEL' ? (testData.method_test?.test?.id ? testData.method_test.test : '') : (panelData.panel || '')}
                        label={type === 'PANEL' ? 'Select Panel' : type === 'TEST' ? 'Select Test' : 'Select Service'}
                        fullWidth
                        url={route('api.tests.list')}
                        defaultData={{ type, status: true }}
                        onChange={onItemSelect}
                        name="test"
                        error={Boolean(errors.test || errors.selection || errors.panel)}
                        helperText={errors.test || errors.selection || errors.panel || 'Start typing to search...'}
                        disabled={loading}
                    />

                    {loading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: 'text.secondary' }}>
                            <CircularProgress size={18} />
                            <Typography variant="body2">Loading details...</Typography>
                        </Box>
                    )}

                    {!loading && hasPreview && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2, mt: 2, borderRadius: 2,
                                bgcolor: type === 'PANEL' ? 'secondary.50' : 'primary.50',
                                border: '1px solid',
                                borderColor: type === 'PANEL' ? 'secondary.200' : 'primary.200',
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight="bold">
                                {preview.fullName || preview.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                                {preview.code && (
                                    <Chip label={preview.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                                )}
                                {type === 'PANEL' && (
                                    <Chip
                                        label={`${preview.method_tests?.length || 0} tests included`}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                )}
                                {(preview.test_groups || []).map(g => (
                                    <Chip key={g.id} label={g.name} size="small" color="primary" variant="outlined" />
                                ))}
                            </Box>
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
};

// ─── Method Selection Table ────────────────────────────────────────────────────
const MethodTable = ({ methodTests = [], selectedId, onSelect }) => {
    if (!methodTests.length)
        return <Alert severity="info">No methods available for this test.</Alert>;

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
            <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                        <TableCell>Method</TableCell>
                        <TableCell align="center"><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}><AccessTime fontSize="inherit" /> TAT</Box></TableCell>
                        <TableCell align="right"><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}><Paid fontSize="inherit" /> Price</Box></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {methodTests.filter(m => m?.status).map(({ id, method }) => (
                        <TableRow
                            key={id}
                            hover
                            selected={selectedId === id}
                            onClick={() => onSelect(id)}
                            sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'primary.50' } }}
                        >
                            <TableCell>
                                <Typography variant="body2" fontWeight={selectedId === id ? 'bold' : 'normal'}>
                                    {method?.name}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                {method?.turnaround_time
                                    ? <Chip label={`${method.turnaround_time}d`} size="small" color={method.turnaround_time <= 2 ? 'success' : 'primary'} />
                                    : <Typography variant="caption" color="text.disabled">—</Typography>}
                            </TableCell>
                            <TableCell align="right">
                                {method?.price_type === 'Fix'
                                    ? <Typography variant="body2" fontWeight="medium">{method.price} OMR</Typography>
                                    : <Chip label={method?.price_type} size="small" color="warning" />}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// ─── Sample Row ────────────────────────────────────────────────────────────────
const SampleRow = memo(({ sample, sampleIndex, sampleTypes, patientCount, errors, patient, onChange, onRemove, canRemove }) => {
    const defaultPatientData = useMemo(() => ({ patient: patient?.id }), [patient?.id]);
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" color="primary.main">
                    Sample {sampleIndex + 1}
                </Typography>
                {canRemove && (
                    <IconButton size="small" color="error" onClick={() => onRemove(sampleIndex)}>
                        <Remove fontSize="small" />
                    </IconButton>
                )}
            </Box>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 5 }}>
                    <FormControl fullWidth size="small" error={Boolean(errors?.[`s${sampleIndex}.sampleType`])}>
                        <InputLabel>Sample Type</InputLabel>
                        <Select
                            value={sample.sampleType || ''}
                            label="Sample Type"
                            onChange={(e) => onChange(sampleIndex, 'sampleType', e.target.value)}
                        >
                            {sampleTypes.map(st => <MenuItem key={st.id} value={st.id}>{st.name}</MenuItem>)}
                        </Select>
                        {errors?.[`s${sampleIndex}.sampleType`] && (
                            <FormHelperText>{errors[`s${sampleIndex}.sampleType`]}</FormHelperText>
                        )}
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 7 }}>
                    <Stack spacing={1}>
                        {Array.from({ length: patientCount }).map((_, pi) => (
                            <SelectSearch
                                key={pi}
                                size="small"
                                value={sample.patients?.[pi] || ''}
                                label={patientCount > 1 ? `Patient ${pi + 1}` : 'Patient'}
                                fullWidth
                                url={route('api.patients.list')}
                                defaultData={defaultPatientData}
                                onChange={(e) => onChange(sampleIndex, 'patient', e.target.value, pi)}
                                name="patient"
                                error={Boolean(errors?.[`s${sampleIndex}.p${pi}`])}
                                helperText={errors?.[`s${sampleIndex}.p${pi}`] || ''}
                                startAdornment={<PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />}
                            />
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </Paper>
    );
});

// ─── Pricing Section ───────────────────────────────────────────────────────────
const PricingSection = ({ method, customParameters, price, discount, maxDiscount, errors, onChange }) => {
    const isDynamic = method?.price_type === 'Formulate' || method?.price_type === 'Conditional';
    const finalPrice = (Number(price) - Number(discount)).toFixed(2);

    return (
        <Box>
            {isDynamic && (
                <Box sx={{ mb: 2 }}>
                    <MethodPriceField method={method} values={customParameters} onChange={onChange} errors={errors} />
                    <Divider sx={{ my: 2 }} />
                </Box>
            )}

            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <DiscountIcon fontSize="small" color="secondary" />
                    <Typography variant="subtitle2">Discounts</Typography>
                </Box>
                <DiscountManager
                    customParameters={{ ...customParameters, discounts: customParameters?.discounts || [] }}
                    price={price || 0}
                    maxDiscount={maxDiscount}
                    onChange={onChange}
                    errors={errors}
                />
            </Box>

            <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Base: {Number(price).toFixed(2)} OMR</Typography>
                        {Number(discount) > 0 && (
                            <Typography variant="body2" color="secondary.main">Discount: −{Number(discount).toFixed(2)} OMR</Typography>
                        )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">Final</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.dark">{finalPrice} OMR</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

// ─── Test/Service Configure Step ───────────────────────────────────────────────
const TestConfigStep = ({ type, data, errors, maxDiscount, patient, onChange }) => {
    const [expanded, setExpanded] = useState({ method: true, samples: false, pricing: false });
    const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    // Auto-expand sections that have errors so the user can see what to fix
    useEffect(() => {
        if (!errors || !Object.keys(errors).length) return;
        const hasSampleErrors = Object.keys(errors).some(k => k.startsWith('s') || k === 'samples');
        const hasPriceErrors = Boolean(errors.price || errors.discount);
        const hasMethodErrors = Boolean(errors.method);
        setExpanded(prev => ({
            ...prev,
            ...(hasMethodErrors ? { method: true } : {}),
            ...(hasSampleErrors ? { samples: true } : {}),
            ...(hasPriceErrors ? { pricing: true } : {}),
        }));
    }, [errors]);

    const methodTests = data.method_test?.test?.method_tests || [];
    const selectedMethod = data.method_test?.id;
    const isService = type === 'SERVICE';

    const sampleTypes = data.method_test?.method?.test?.sample_types || [];
    const patientCount = data.method_test?.method?.no_patient || 1;
    const maxSamples = data.method_test?.method?.no_sample || 1;
    const samples = Array.isArray(data.samples) ? data.samples : [];

    const handleMethodSelect = (methodId) => {
        const mt = methodTests.find(m => m.id === methodId);
        if (!mt?.method) return;
        const pCount = mt.method.no_patient || 1;
        const defaultPatient = patient ? { id: patient.id, name: patient.fullName } : null;
        const defaultSamples = isService
            ? [{ patients: defaultPatient ? [defaultPatient] : [], sampleType: '' }]
            : [{ patients: Array(pCount).fill(defaultPatient).filter(Boolean), sampleType: '' }];

        onChange({
            method_test: { ...data.method_test, id: methodId, method: mt.method },
            price: mt.method.price_type === 'Fix' ? mt.method.price : 0,
            discount: 0,
            samples: defaultSamples,
            customParameters: { sampleType: '', discounts: [] },
        });
        setExpanded({ method: false, samples: true, pricing: false });
    };

    const handleSampleChange = (si, field, value, pi) => {
        const newSamples = samples.map((s, idx) => {
            if (idx !== si) return s;
            if (field === 'sampleType') return { ...s, sampleType: value };
            if (field === 'patient') {
                const pts = [...(s.patients || [])];
                pts[pi] = value;
                return { ...s, patients: pts };
            }
            return s;
        });
        onChange({ samples: newSamples });
    };

    const addSample = () => {
        if (samples.length >= maxSamples) return;
        const pCount = data.method_test?.method?.no_patient || 1;
        const defaultPatient = patient ? { id: patient.id, name: patient.fullName } : null;
        onChange({
            samples: [...samples, { patients: Array(pCount).fill(defaultPatient).filter(Boolean), sampleType: '' }],
            no_sample: samples.length + 1,
        });
    };

    const removeSample = (si) => {
        if (samples.length <= 1) return;
        onChange({ samples: samples.filter((_, i) => i !== si), no_sample: samples.length - 1 });
    };

    const handleSamplelessChange = (e) => {
        const isSampleless = e.target.checked;
        const updates = { sampleless: isSampleless };
        if (isSampleless && patient) {
            updates.samples = [{ patients: [{ id: patient.id, name: patient.fullName }], sampleType: '' }];
        }
        onChange(updates);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Method Selection */}
            <Accordion expanded={expanded.method} onChange={() => toggle('method')} elevation={1} sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: selectedMethod ? 'primary.50' : 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Science fontSize="small" color={selectedMethod ? 'primary' : 'action'} />
                        <Typography variant="subtitle2">Method Selection</Typography>
                        {selectedMethod && (
                            <Chip
                                label={data.method_test?.method?.name}
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                            />
                        )}
                        {errors.method && <Chip label="Required" size="small" color="error" />}
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                    <MethodTable methodTests={methodTests} selectedId={selectedMethod} onSelect={handleMethodSelect} />
                </AccordionDetails>
            </Accordion>

            {/* Test Options: sampleless (only for TEST) */}
            {!isService && data.method_test?.method && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={data.sampleless || false}
                                onChange={handleSamplelessChange}
                                color="warning"
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight="medium">Sampleless</Typography>
                                <Typography variant="caption" color="text.secondary">No physical sample required</Typography>
                            </Box>
                        }
                    />
                </Paper>
            )}

            {/* Sample Configuration (TEST only, not sampleless) */}
            {!isService && !data.sampleless && data.method_test?.method && (
                <Accordion expanded={expanded.samples} onChange={() => toggle('samples')} elevation={1} sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: errors.samples ? 'error.50' : 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color={errors.samples ? 'error' : 'action'} />
                            <Typography variant="subtitle2">Sample Configuration</Typography>
                            <Chip label={`${samples.length} / ${maxSamples}`} size="small" variant="outlined" />
                            {errors.samples && <Chip label={errors.samples} size="small" color="error" />}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 1 }}>
                        <Stack spacing={1.5}>
                            {samples.map((sample, si) => (
                                <SampleRow
                                    key={si}
                                    sample={sample}
                                    sampleIndex={si}
                                    sampleTypes={sampleTypes}
                                    patientCount={patientCount}
                                    errors={errors}
                                    patient={patient}
                                    onChange={handleSampleChange}
                                    onRemove={removeSample}
                                    canRemove={samples.length > 1}
                                />
                            ))}
                            {samples.length < maxSamples && (
                                <Button size="small" startIcon={<Add />} onClick={addSample} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                                    Add Sample
                                </Button>
                            )}
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Pricing */}
            {data.method_test?.method && (
                <Accordion expanded={expanded.pricing} onChange={() => toggle('pricing')} elevation={1} sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: errors.price || errors.discount ? 'error.50' : 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalculateIcon fontSize="small" color={errors.price ? 'error' : 'action'} />
                            <Typography variant="subtitle2">Pricing & Discounts</Typography>
                            {data.price > 0 && (
                                <Chip label={`${(data.price - data.discount).toFixed(2)} OMR`} size="small" color="success" />
                            )}
                            {(errors.price || errors.discount) && <Chip label="Check pricing" size="small" color="error" />}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 1 }}>
                        <PricingSection
                            method={data.method_test.method}
                            customParameters={data.customParameters}
                            price={data.price}
                            discount={data.discount}
                            maxDiscount={maxDiscount}
                            errors={errors}
                            onChange={onChange}
                        />
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Additional Notes */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Additional Notes <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></Typography>
                <TextField
                    multiline
                    fullWidth
                    rows={2}
                    size="small"
                    value={data.details || ''}
                    onChange={(e) => onChange({ details: e.target.value })}
                    placeholder="Any special instructions or notes for this test..."
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                />
            </Paper>
        </Box>
    );
};

// ─── Panel Configure Step ──────────────────────────────────────────────────────
const PanelConfigStep = ({ panelData, errors, maxDiscount, patient, onChange }) => {
    const { panel, acceptanceItems = [], sampleless, reportless } = panelData;
    const [expandedItem, setExpandedItem] = useState(null);

    // Auto-expand the first item accordion that has errors
    useEffect(() => {
        if (!errors || !Object.keys(errors).length) return;
        const errorKey = Object.keys(errors).find(k => k.startsWith('item'));
        if (errorKey) {
            const idx = parseInt(errorKey.replace('item', ''), 10);
            const item = acceptanceItems[idx];
            if (item) setExpandedItem(item.id);
        }
    }, [errors]);

    const handleSamplelessChange = (e) => {
        const val = e.target.checked;
        const updates = { sampleless: val };
        if (val && patient) {
            updates.acceptanceItems = acceptanceItems.map(item => ({
                ...item, sampleless: true,
                samples: [{ patients: [{ id: patient.id, name: patient.fullName }], sampleType: '' }],
            }));
            updates.reportless = true;
        } else if (!val) {
            updates.acceptanceItems = acceptanceItems.map(item => ({ ...item, sampleless: false }));
        }
        onChange(updates);
    };

    const handleReportlessChange = (e) => {
        const val = e.target.checked;
        onChange({
            reportless: val,
            acceptanceItems: acceptanceItems.map(item => ({ ...item, reportless: val })),
        });
    };

    const handleItemSampleChange = (itemId, si, field, value, pi) => {
        onChange({
            acceptanceItems: acceptanceItems.map(item => {
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
            acceptanceItems: acceptanceItems.map(item => {
                if (item.id !== itemId) return item;
                const maxS = item.method_test?.method?.no_sample || 1;
                const curr = item.samples || [];
                if (curr.length >= maxS) return item;
                const pCount = item.method_test?.method?.no_patient || 1;
                const def = patient ? { id: patient.id, name: patient.fullName } : null;
                return {
                    ...item,
                    samples: [...curr, { patients: Array(pCount).fill(def).filter(Boolean), sampleType: '' }],
                    no_sample: curr.length + 1,
                };
            }),
        });
    };

    const removeItemSample = (itemId, si) => {
        onChange({
            acceptanceItems: acceptanceItems.map(item => {
                if (item.id !== itemId) return item;
                const curr = item.samples || [];
                if (curr.length <= 1) return item;
                return { ...item, samples: curr.filter((_, i) => i !== si), no_sample: curr.length - 1 };
            }),
        });
    };

    const handlePanelPriceChange = (priceData) => {
        const priceEach = (priceData.price || 0) / (acceptanceItems.length || 1);
        onChange({
            ...priceData,
            acceptanceItems: acceptanceItems.map(item => ({
                ...item,
                price: priceEach,
                customParameters: { ...item.customParameters, ...(priceData.customParameters || {}) },
            })),
        });
    };

    const handlePanelDiscountChange = (discountData) => {
        const discountEach = (discountData.discount || 0) / (acceptanceItems.length || 1);
        onChange({
            ...discountData,
            discount: discountData.discount || 0,
            acceptanceItems: acceptanceItems.map(item => ({
                ...item,
                discount: discountEach,
                customParameters: { ...item.customParameters, ...(discountData.customParameters || {}) },
            })),
        });
    };

    const totalPrice = acceptanceItems.reduce((s, i) => s + (Number(i.price) || 0), 0);
    const totalDiscount = acceptanceItems.reduce((s, i) => s + (Number(i.discount) || 0), 0);
    const firstItem = acceptanceItems[0];
    const panelCustomParams = { ...(firstItem?.customParameters || {}), discounts: firstItem?.customParameters?.discounts || [] };
    const hasDynamicPricing = panel?.extra?.parameters?.length > 0 &&
        (panel?.price_type === 'Formulate' || panel?.price_type === 'Conditional');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Panel Info */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'secondary.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlaylistAddCheck color="secondary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="bold">{panel?.name}</Typography>
                        <Chip label={`${acceptanceItems.length} tests`} size="small" color="secondary" variant="outlined" />
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
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Panel Options</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <FormControlLabel
                        control={<Switch checked={sampleless || false} onChange={handleSamplelessChange} color="warning" size="small" />}
                        label={<Box><Typography variant="body2">Sampleless</Typography><Typography variant="caption" color="text.secondary">No physical sample needed</Typography></Box>}
                    />
                    <FormControlLabel
                        control={<Switch checked={reportless || sampleless || false} onChange={handleReportlessChange} color="info" size="small" disabled={sampleless} />}
                        label={<Box><Typography variant="body2">Reportless</Typography><Typography variant="caption" color="text.secondary">No report generated</Typography></Box>}
                    />
                </Box>
            </Paper>

            {/* Per-test Sample Config */}
            {!sampleless && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Sample Configuration per Test</Typography>
                    {acceptanceItems.map((item, idx) => {
                        const sampleTypes = item.method_test?.method?.test?.sample_types || [];
                        const patientCount = item.method_test?.method?.no_patient || 1;
                        const maxS = item.method_test?.method?.no_sample || 1;
                        const itemSamples = item.samples || [];
                        const hasErr = Object.keys(errors).some(k => k.startsWith(`item${idx}`));

                        return (
                            <Accordion
                                key={item.id}
                                expanded={expandedItem === item.id}
                                onChange={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                elevation={1}
                                sx={{ mb: 0.5, borderRadius: '8px !important', '&:before': { display: 'none' }, border: hasErr ? '1px solid' : 'none', borderColor: 'error.main' }}
                            >
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: hasErr ? 'error.50' : 'grey.50' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Science fontSize="small" color={hasErr ? 'error' : 'action'} />
                                        <Typography variant="body2" fontWeight="medium">
                                            {item.method_test?.method?.test?.name}
                                        </Typography>
                                        <Chip label={item.method_test?.method?.name} size="small" variant="outlined" />
                                        {itemSamples.length > 0 && (
                                            <Chip label={`${itemSamples.length}/${maxS} samples`} size="small" color="primary" />
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
                                                        .filter(([k]) => k.startsWith(`item${idx}.s${si}`))
                                                        .map(([k, v]) => [k.replace(`item${idx}.`, ''), v])
                                                )}
                                                patient={patient}
                                                onChange={(si2, field, value, pi) => handleItemSampleChange(item.id, si2, field, value, pi)}
                                                onRemove={(si2) => removeItemSample(item.id, si2)}
                                                canRemove={itemSamples.length > 1}
                                            />
                                        ))}
                                        {itemSamples.length < maxS && (
                                            <Button size="small" startIcon={<Add />} onClick={() => addItemSample(item.id)} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                                                Add Sample
                                            </Button>
                                        )}
                                        {itemSamples.length === 0 && (
                                            <Button size="small" startIcon={<Add />} onClick={() => addItemSample(item.id)} variant="contained" sx={{ alignSelf: 'flex-start' }}>
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
            <Accordion defaultExpanded elevation={1} sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalculateIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2">Pricing & Discounts</Typography>
                        {totalPrice > 0 && (
                            <Chip label={`${(totalPrice - totalDiscount).toFixed(2)} OMR`} size="small" color="success" />
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
                    <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Base: {totalPrice.toFixed(2)} OMR</Typography>
                                {totalDiscount > 0 && (
                                    <Typography variant="body2" color="secondary.main">Discount: −{totalDiscount.toFixed(2)} OMR</Typography>
                                )}
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary">Final</Typography>
                                <Typography variant="h6" fontWeight="bold" color="success.dark">
                                    {(totalPrice - totalDiscount).toFixed(2)} OMR
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </AccordionDetails>
            </Accordion>

            {/* Per-test Notes */}
            <Accordion elevation={1} sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Settings fontSize="small" color="action" />
                        <Typography variant="subtitle2">Additional Notes per Test <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                    <Stack spacing={1.5}>
                        {acceptanceItems.map((item) => (
                            <Box key={item.id}>
                                <Typography variant="caption" color="primary.main" fontWeight="bold">
                                    {item.method_test?.method?.test?.name} — {item.method_test?.method?.name}
                                </Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={item.details || ''}
                                    onChange={(e) => onChange({
                                        acceptanceItems: acceptanceItems.map(i =>
                                            i.id === item.id ? { ...i, details: e.target.value } : i
                                        ),
                                    })}
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

// ─── Root Component ────────────────────────────────────────────────────────────
const AddTestOrPanel = ({
    open, onClose,
    onSubmitTest, onSubmitPanel,
    initialTestData = null, initialPanelData = null,
    referrer = null, maxDiscount = 0, patient = null,
    requestedTests = [],
}) => {
    const isEditTest = Boolean(initialTestData?.method_test?.test?.id);
    const isEditPanel = Boolean(initialPanelData?.panel?.id);
    const isEdit = isEditTest || isEditPanel;

    const initType = useCallback(() => {
        if (isEditPanel) return 'PANEL';
        if (isEditTest) return initialTestData?.method_test?.test?.type || 'TEST';
        return null;
    }, [isEditPanel, isEditTest, initialTestData]);

    const [step, setStep] = useState(0);
    const [type, setType] = useState(initType);
    const [testData, setTestData] = useState(() => makeTestData(initialTestData));
    const [panelData, setPanelData] = useState(() => makePanelData(initialPanelData));
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;
        const t = initType();
        setType(t);
        setStep(isEdit ? 1 : 0);
        setTestData(makeTestData(initialTestData));
        setPanelData(makePanelData(initialPanelData));
        setErrors({});
        setApiError(null);
        setLoading(false);
    }, [open]);

    const isPanel = type === 'PANEL';
    const hasSelection = isPanel ? Boolean(panelData.panel?.id) : Boolean(testData.method_test?.test?.id);

    const fetchItem = useCallback(async (id, itemType) => {
        setLoading(true);
        setApiError(null);
        try {
            const { data: { data: info } } = await axios.get(
                route('api.tests.show', id),
                { params: referrer ? { referrer: { id: referrer.id } } : {} }
            );
            if (itemType === 'PANEL') {
                const { method_tests = [], ...panelInfo } = info;
                const pid = makeId(6);
                const priceEach = panelInfo.price / (method_tests.length || 1);
                setPanelData({
                    id: pid,
                    panel: { ...panelInfo, method_tests },
                    acceptanceItems: method_tests.map(mt => ({
                        id: makeId(5), panel_id: pid, method_test: mt,
                        price: priceEach, discount: 0, details: '', no_sample: 1,
                        samples: [],
                        customParameters: { sampleType: '', discounts: [] },
                    })),
                    price: panelInfo.price, discount: 0,
                    sampleless: false, reportless: false,
                });
            } else {
                const discounts = info.offers?.map(o => ({
                    id: makeId(6), type: o.type, value: o.amount, reason: o.title,
                })) || [];
                setTestData(prev => ({
                    ...prev,
                    method_test: { test: info, id: null, method: null },
                    price: 0, discount: 0,
                    samples: itemType === 'SERVICE' && patient
                        ? [{ patients: [{ id: patient.id, name: patient.fullName }], sampleType: '' }]
                        : [],
                    customParameters: { sampleType: '', discounts },
                }));
            }
        } catch (e) {
            setApiError(e.response?.data?.message || 'Failed to load details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [referrer, patient]);

    const handleTypeSelect = (t) => {
        setType(t);
        setTestData(makeTestData({ method_test: { test: { type: t } } }));
        setPanelData(makePanelData());
        setErrors({});
    };

    const handleItemSelect = (e) => {
        const val = e.target.value;
        if (val?.id) fetchItem(val.id, type);
    };

    const handleRequestedSelect = (t) => () => fetchItem(t.server_id, type);

    const handleTestChange = useCallback((updates) => {
        setTestData(prev => ({ ...prev, ...updates }));
        setErrors(prev => {
            const next = { ...prev };
            Object.keys(updates).forEach(k => delete next[k]);
            return next;
        });
    }, []);

    const handlePanelChange = useCallback((updates) => {
        setPanelData(prev => ({ ...prev, ...updates }));
    }, []);

    const handleSubmit = () => {
        const errs = isPanel ? validatePanel(panelData, maxDiscount) : validateTest(testData, maxDiscount);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        if (isPanel) onSubmitPanel?.(panelData);
        else onSubmitTest?.(testData);
        onClose(); // Always close the dialog after a successful submission
    };

    const handleNext = () => {
        if (!type) { setErrors({ type: 'Please select a type first' }); return; }
        if (!hasSelection) { setErrors({ selection: 'Please select a test or panel to continue' }); return; }
        setErrors({});
        setStep(1);
    };

    const errorCount = Object.keys(errors).length;

    return (
        <Dialog open={open} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 2, maxHeight: '92vh' } }}>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isPanel ? <PlaylistAddCheck /> : <Science />}
                        <Typography variant="h6">
                            {isEdit ? `Edit ${isPanel ? 'Panel' : 'Test'}` : 'Add Test or Panel'}
                        </Typography>
                        {type && !isEdit && (
                            <Chip
                                label={TYPES.find(t => t.value === type)?.label || type}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                            />
                        )}
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }} size="small"><Close /></IconButton>
                </Box>
            </DialogTitle>

            {!isEdit && (
                <Box sx={{ px: 3, pt: 2, pb: 0 }}>
                    <Stepper activeStep={step} alternativeLabel>
                        {['Select Type & Test', 'Configure & Submit'].map(l => (
                            <Step key={l}><StepLabel>{l}</StepLabel></Step>
                        ))}
                    </Stepper>
                </Box>
            )}

            {apiError && (
                <Alert severity="error" onClose={() => setApiError(null)} sx={{ mx: 3, mt: 1 }}>
                    {apiError}
                </Alert>
            )}
            {errorCount > 0 && step === 1 && (
                <Alert severity="warning" sx={{ mx: 3, mt: 1 }}>
                    {errorCount} issue{errorCount > 1 ? 's' : ''} need attention before submitting.
                </Alert>
            )}

            <DialogContent sx={{ px: 3, py: 2 }}>
                {step === 0 ? (
                    <SelectStep
                        type={type}
                        testData={testData}
                        panelData={panelData}
                        loading={loading}
                        errors={errors}
                        requestedTests={requestedTests}
                        onTypeSelect={handleTypeSelect}
                        onItemSelect={handleItemSelect}
                        onRequestedSelect={handleRequestedSelect}
                    />
                ) : isPanel ? (
                    <PanelConfigStep
                        panelData={panelData}
                        errors={errors}
                        maxDiscount={maxDiscount}
                        patient={patient}
                        onChange={handlePanelChange}
                    />
                ) : (
                    <TestConfigStep
                        type={type}
                        data={testData}
                        errors={errors}
                        maxDiscount={maxDiscount}
                        patient={patient}
                        onChange={handleTestChange}
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                {step === 0 ? (
                    <>
                        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
                        <Box sx={{ flex: 1 }} />
                        <Button variant="contained" onClick={handleNext} disabled={loading}>
                            Continue →
                        </Button>
                    </>
                ) : (
                    <>
                        {!isEdit && (
                            <Button variant="outlined" color="inherit" startIcon={<ArrowBack />} onClick={() => setStep(0)}>
                                Back
                            </Button>
                        )}
                        <Box sx={{ flex: 1 }}>
                            {Object.keys(errors).length > 0 && step === 1 && (
                                <Typography variant="caption" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
                                    <Close fontSize="inherit" />
                                    Please fix the validation errors above
                                </Typography>
                            )}
                        </Box>
                        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Check />}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : isEdit ? 'Update' : `Add ${isPanel ? 'Panel' : 'Test'}`}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AddTestOrPanel;
