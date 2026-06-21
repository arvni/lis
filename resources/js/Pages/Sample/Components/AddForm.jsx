import React, { useCallback, useEffect, useState, useMemo } from 'react';
import SelectSearch from '@/Components/SelectSearch.jsx';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    Stack,
    Button,
    Box,
    Alert,
    Tooltip,
    CircularProgress,
    Fade,
} from '@mui/material';
import { Print, Close, Check, CheckCircle } from '@mui/icons-material';
import { computeValidation } from './AddForm/helpers';
import DialogHeader from './AddForm/DialogHeader';
import ProgressBanner from './AddForm/ProgressBanner';
import BarcodeCard from './AddForm/BarcodeCard';

const AddForm = ({ open, onClose, defaultValue }) => {
    const { data, setData, post, reset, processing } = useForm({
        barcodes: [],
        acceptanceId: null,
        referrer: null,
        out_patient: false,
        collect_request: null,
        ...defaultValue,
    });
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [materialValidation, setMaterialValidation] = useState({});

    useEffect(() => {
        if (defaultValue) {
            const merged = {
                barcodes: [],
                acceptanceId: null,
                referrer: null,
                collect_request: null,
                ...defaultValue,
            };
            setData(merged);
            // Auto-expand all rows
            setExpandedRows(new Set((merged.barcodes || []).map((_, i) => i)));
        }
    }, [defaultValue, setData]);

    const now = new Date().toISOString().slice(0, 16);

    const isReferredOutpatient = !!(data?.referrer && data?.out_patient);

    const validation = useMemo(
        () => computeValidation(data?.barcodes, data?.collect_request, isReferredOutpatient),
        [data?.barcodes, data?.collect_request, isReferredOutpatient],
    );

    const handleClose = useCallback(() => {
        setSubmitSuccess(false);
        setExpandedRows(new Set());
        setMaterialValidation({});
        onClose();
        reset();
    }, [onClose, reset]);

    const toggleRow = useCallback((index) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    }, []);

    const handleChange = useCallback(
        (index) => (e) => {
            const { name, value } = e.target;
            const newBarcodes = [...(data?.barcodes || [])];
            if (name === 'collection_date' && value && !newBarcodes[index]?.received_at) {
                newBarcodes[index] = { ...newBarcodes[index], [name]: value, received_at: value };
            } else {
                newBarcodes[index] = { ...newBarcodes[index], [name]: value };
            }
            setData({ ...data, barcodes: newBarcodes });
        },
        [data, setData],
    );

    const handleQuickFill = useCallback(() => {
        const newBarcodes = (data?.barcodes || []).map((b) => ({
            ...b,
            collection_date: b.collection_date || now,
            received_at: b.received_at || b.collection_date || now,
            sampleLocation: b.sampleLocation || 'In Lab',
        }));
        setData({ ...data, barcodes: newBarcodes });
    }, [data, setData, now]);

    const handleMaterialBarcodeCheck = useCallback(
        async (index, value) => {
            if (!value) {
                const newBarcodes = [...(data?.barcodes || [])];
                newBarcodes[index] = { ...newBarcodes[index], material: null };
                setData({ ...data, barcodes: newBarcodes });
                setMaterialValidation((prev) => ({
                    ...prev,
                    [index]: { loading: false, error: null, valid: false },
                }));
                return;
            }
            const sampleTypeId = data?.barcodes[index]?.sampleType?.id;
            const referrerId = data?.referrer?.id;
            setMaterialValidation((prev) => ({
                ...prev,
                [index]: { loading: true, error: null, valid: false },
            }));
            try {
                const res = await axios.get(route('api.materials.checkForReferrer'), {
                    params: {
                        barcode: value,
                        sample_type_id: sampleTypeId,
                        referrer_id: referrerId,
                    },
                });
                const newBarcodes = [...(data?.barcodes || [])];
                newBarcodes[index] = { ...newBarcodes[index], material: res.data.material };
                setData({ ...data, barcodes: newBarcodes });
                setMaterialValidation((prev) => ({
                    ...prev,
                    [index]: { loading: false, error: null, valid: true },
                }));
            } catch (err) {
                const newBarcodes = [...(data?.barcodes || [])];
                newBarcodes[index] = { ...newBarcodes[index], material: null };
                setData({ ...data, barcodes: newBarcodes });
                setMaterialValidation((prev) => ({
                    ...prev,
                    [index]: {
                        loading: false,
                        error: err.response?.data?.message || 'Invalid material',
                        valid: false,
                    },
                }));
            }
        },
        [data, setData],
    );

    const handleSubmit = useCallback(() => {
        const acceptanceId = data?.barcodes[0]?.items[0].acceptance_id;
        post(route('samples.store'), {
            onSuccess: () => {
                setSubmitSuccess(true);
                setTimeout(() => {
                    window.open(route('acceptances.barcodes', acceptanceId), '_blank');
                    handleClose();
                }, 1000);
            },
        });
    }, [data, post, handleClose]);

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : handleClose}
            fullWidth
            maxWidth="md"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                        maxHeight: '92vh',
                    },
                },
            }}
        >
            <DialogHeader data={data} processing={processing} onClose={handleClose} />

            {/* Scrollable body */}
            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                {submitSuccess && (
                    <Fade in>
                        <Alert
                            icon={<CheckCircle />}
                            severity="success"
                            sx={{ m: 2, borderRadius: 2 }}
                        >
                            Collection recorded! Opening barcode print page…
                        </Alert>
                    </Fade>
                )}

                {/* Collect Request selector */}
                {data?.referrer && (
                    <Box sx={{ px: 3, pt: 2.5 }}>
                        <SelectSearch
                            label={isReferredOutpatient ? 'Collect Request *' : 'Collect Request'}
                            name="collect_request"
                            url={route('api.collectRequests.list')}
                            defaultData={{ referrer_id: data.referrer.id }}
                            value={data.collect_request}
                            onChange={(e) => setData('collect_request', e.target.value)}
                            fullWidth
                            size="small"
                            error={isReferredOutpatient && !data.collect_request}
                            helperText={
                                isReferredOutpatient && !data.collect_request
                                    ? 'Collect request is required for referred outpatients'
                                    : ''
                            }
                        />
                    </Box>
                )}

                {/* Progress banner */}
                {data?.barcodes?.length > 0 && (
                    <ProgressBanner validation={validation} onQuickFill={handleQuickFill} />
                )}

                {/* Barcode cards */}
                <Stack spacing={2} sx={{ px: 3, pt: 2, pb: 3 }}>
                    {data?.barcodes?.length > 0 ? (
                        data.barcodes.map((barcode, index) => (
                            <BarcodeCard
                                key={index}
                                barcode={barcode}
                                index={index}
                                expanded={expandedRows.has(index)}
                                matVal={materialValidation[index]}
                                now={now}
                                referrer={data?.referrer}
                                isReferredOutpatient={isReferredOutpatient}
                                onToggle={() => toggleRow(index)}
                                onChange={handleChange(index)}
                                onMaterialCheck={(value) =>
                                    handleMaterialBarcodeCheck(index, value)
                                }
                            />
                        ))
                    ) : (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2">No barcode data available</Typography>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{ px: 3, pb: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
                <Box
                    display="flex"
                    width="100%"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {validation.totalSamples > 0 &&
                            `Progress: ${validation.completedSamples}/${validation.totalSamples} samples`}
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            onClick={handleClose}
                            color="inherit"
                            disabled={processing}
                            startIcon={<Close />}
                        >
                            Cancel
                        </Button>
                        <Tooltip
                            title={
                                validation.totalSamples === 0
                                    ? 'No samples to collect'
                                    : validation.missingCollectRequest
                                      ? 'A collect request is required for referred outpatients'
                                      : validation.missingRequiredBarcodes
                                        ? 'Material barcodes are required for some sample types'
                                        : !validation.isValid
                                          ? 'Please complete all required fields'
                                          : 'Collect samples and print barcodes'
                            }
                        >
                            <span>
                                <Button
                                    onClick={handleSubmit}
                                    variant="contained"
                                    disabled={
                                        validation.totalSamples === 0 ||
                                        !validation.isValid ||
                                        processing
                                    }
                                    startIcon={
                                        processing ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <Check />
                                        )
                                    }
                                    endIcon={!processing && <Print />}
                                    sx={{ fontWeight: 600, px: 3 }}
                                >
                                    {processing ? 'Processing…' : 'Collect & Print Barcodes'}
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default AddForm;
