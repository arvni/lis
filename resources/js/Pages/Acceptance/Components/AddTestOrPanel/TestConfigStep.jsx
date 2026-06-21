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
} from '@mui/material';
import {
    Science,
    ExpandMore,
    Person as PersonIcon,
    Calculate as CalculateIcon,
    Add,
} from '@mui/icons-material';
import MethodTable from './MethodTable';
import SampleRow from './SampleRow';
import PricingSection from './PricingSection';

// ─── Test/Service Configure Step ───────────────────────────────────────────────
const TestConfigStep = ({ type, data, errors, maxDiscount, patient, onChange }) => {
    const [expanded, setExpanded] = useState({ method: true, samples: false, pricing: false });
    const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

    // Auto-expand sections that have errors so the user can see what to fix
    useEffect(() => {
        if (!errors || !Object.keys(errors).length) return;
        const hasSampleErrors = Object.keys(errors).some(
            (k) => k.startsWith('s') || k === 'samples',
        );
        const hasPriceErrors = Boolean(errors.price || errors.discount);
        const hasMethodErrors = Boolean(errors.method);
        setExpanded((prev) => ({
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
        const mt = methodTests.find((m) => m.id === methodId);
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
            samples: [
                ...samples,
                { patients: Array(pCount).fill(defaultPatient).filter(Boolean), sampleType: '' },
            ],
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
            updates.samples = [
                { patients: [{ id: patient.id, name: patient.fullName }], sampleType: '' },
            ];
        }
        onChange(updates);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Method Selection */}
            <Accordion
                expanded={expanded.method}
                onChange={() => toggle('method')}
                elevation={1}
                sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{ bgcolor: selectedMethod ? 'primary.50' : 'grey.50', borderRadius: 1 }}
                >
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
                    <MethodTable
                        methodTests={methodTests}
                        selectedId={selectedMethod}
                        onSelect={handleMethodSelect}
                    />
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
                                <Typography variant="body2" fontWeight="medium">
                                    Sampleless
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    No physical sample required
                                </Typography>
                            </Box>
                        }
                    />
                </Paper>
            )}

            {/* Sample Configuration (TEST only, not sampleless) */}
            {!isService && !data.sampleless && data.method_test?.method && (
                <Accordion
                    expanded={expanded.samples}
                    onChange={() => toggle('samples')}
                    elevation={1}
                    sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{ bgcolor: errors.samples ? 'error.50' : 'grey.50', borderRadius: 1 }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color={errors.samples ? 'error' : 'action'} />
                            <Typography variant="subtitle2">Sample Configuration</Typography>
                            <Chip
                                label={`${samples.length} / ${maxSamples}`}
                                size="small"
                                variant="outlined"
                            />
                            {errors.samples && (
                                <Chip label={errors.samples} size="small" color="error" />
                            )}
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
                                <Button
                                    size="small"
                                    startIcon={<Add />}
                                    onClick={addSample}
                                    variant="outlined"
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    Add Sample
                                </Button>
                            )}
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Pricing */}
            {data.method_test?.method && (
                <Accordion
                    expanded={expanded.pricing}
                    onChange={() => toggle('pricing')}
                    elevation={1}
                    sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: errors.price || errors.discount ? 'error.50' : 'grey.50',
                            borderRadius: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalculateIcon fontSize="small" color={errors.price ? 'error' : 'action'} />
                            <Typography variant="subtitle2">Pricing & Discounts</Typography>
                            {data.price > 0 && (
                                <Chip
                                    label={`${(data.price - data.discount).toFixed(2)} OMR`}
                                    size="small"
                                    color="success"
                                />
                            )}
                            {(errors.price || errors.discount) && (
                                <Chip label="Check pricing" size="small" color="error" />
                            )}
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
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Additional Notes{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                        (optional)
                    </Typography>
                </Typography>
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

export default TestConfigStep;
