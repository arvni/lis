import React, { useCallback, useEffect, useState, useMemo } from "react";
import SelectSearch from "@/Components/SelectSearch.jsx";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Stack,
    Button,
    Paper,
    Box,
    Chip,
    Divider,
    IconButton,
    Alert,
    Tooltip,
    CircularProgress,
    Fade,
    Collapse,
    Avatar,
    Badge,
    Grid2 as Grid,
} from "@mui/material";
import {
    LocationOn,
    Print,
    Close,
    Check,
    Science,
    Person,
    CheckCircle,
    Warning,
    ExpandMore,
    ExpandLess,
    Schedule,
    Biotech,
    OpenInNew,
    QrCode,
} from "@mui/icons-material";

const AddForm = ({ open, onClose, defaultValue }) => {
    const { data, setData, post, reset, processing } = useForm({
        barcodes: [],
        acceptanceId: null,
        referrer: null,
        out_patient: false,
        collect_request: null,
        ...defaultValue
    });
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [materialValidation, setMaterialValidation] = useState({});

    useEffect(() => {
        if (defaultValue) {
            const merged = { barcodes: [], acceptanceId: null, referrer: null, collect_request: null, ...defaultValue };
            setData(merged);
            // Auto-expand all rows
            setExpandedRows(new Set((merged.barcodes || []).map((_, i) => i)));
        }
    }, [defaultValue]);

    const now = new Date().toISOString().slice(0, 16);

    const isReferredOutpatient = !!(data?.referrer && data?.out_patient);

    const validation = useMemo(() => {
        const barcodes = data?.barcodes || [];
        const hasIncompleteDates = barcodes.some(b => !b.collection_date || !b.received_at);
        const hasInvalidDates = barcodes.some(b =>
            b.collection_date && b.received_at && new Date(b.collection_date) > new Date(b.received_at)
        );
        const missingCollectRequest = isReferredOutpatient && !data?.collect_request;
        const missingRequiredBarcodes = isReferredOutpatient && barcodes.some(
            b => b.sampleType?.required_barcode && !b.material?.barcode
        );
        return {
            isValid: !hasIncompleteDates && !hasInvalidDates && !missingCollectRequest && !missingRequiredBarcodes,
            hasIncompleteDates,
            hasInvalidDates,
            missingCollectRequest,
            missingRequiredBarcodes,
            totalSamples: barcodes.length,
            completedSamples: barcodes.filter(b => b.collection_date && b.received_at).length,
        };
    }, [data?.barcodes, data?.collect_request, data?.referrer, data?.out_patient, isReferredOutpatient]);

    const handleClose = useCallback(() => {
        setSubmitSuccess(false);
        setExpandedRows(new Set());
        setMaterialValidation({});
        onClose();
        reset();
    }, [onClose, reset]);

    const toggleRow = useCallback((index) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    }, []);

    const handleChange = useCallback((index) => (e) => {
        const { name, value } = e.target;
        const newBarcodes = [...(data?.barcodes || [])];
        if (name === 'collection_date' && value && !newBarcodes[index]?.received_at) {
            newBarcodes[index] = { ...newBarcodes[index], [name]: value, received_at: value };
        } else {
            newBarcodes[index] = { ...newBarcodes[index], [name]: value };
        }
        setData({ ...data, barcodes: newBarcodes });
    }, [data, setData]);

    const handleQuickFill = useCallback(() => {
        const newBarcodes = (data?.barcodes || []).map(b => ({
            ...b,
            collection_date: b.collection_date || now,
            received_at:     b.received_at     || b.collection_date || now,
            sampleLocation:  b.sampleLocation  || "In Lab",
        }));
        setData({ ...data, barcodes: newBarcodes });
    }, [data, setData, now]);

    const handleMaterialBarcodeCheck = useCallback(async (index, value) => {
        if (!value) {
            const newBarcodes = [...(data?.barcodes || [])];
            newBarcodes[index] = { ...newBarcodes[index], material: null };
            setData({ ...data, barcodes: newBarcodes });
            setMaterialValidation(prev => ({ ...prev, [index]: { loading: false, error: null, valid: false } }));
            return;
        }
        const sampleTypeId = data?.barcodes[index]?.sampleType?.id;
        const referrerId   = data?.referrer?.id;
        setMaterialValidation(prev => ({ ...prev, [index]: { loading: true, error: null, valid: false } }));
        try {
            const res = await axios.get(route('api.materials.checkForReferrer'), {
                params: { barcode: value, sample_type_id: sampleTypeId, referrer_id: referrerId },
            });
            const newBarcodes = [...(data?.barcodes || [])];
            newBarcodes[index] = { ...newBarcodes[index], material: res.data.material };
            setData({ ...data, barcodes: newBarcodes });
            setMaterialValidation(prev => ({ ...prev, [index]: { loading: false, error: null, valid: true } }));
        } catch (err) {
            const newBarcodes = [...(data?.barcodes || [])];
            newBarcodes[index] = { ...newBarcodes[index], material: null };
            setData({ ...data, barcodes: newBarcodes });
            setMaterialValidation(prev => ({
                ...prev,
                [index]: { loading: false, error: err.response?.data?.message || 'Invalid material', valid: false },
            }));
        }
    }, [data, setData]);

    const handleSubmit = useCallback(() => {
        const acceptanceId = data?.barcodes[0]?.items[0].acceptance_id;
        post(route("samples.store"), {
            onSuccess: () => {
                setSubmitSuccess(true);
                setTimeout(() => {
                    window.open(route("acceptances.barcodes", acceptanceId), "_blank");
                    handleClose();
                }, 1000);
            }
        });
    }, [data, post, handleClose]);

    const getStatusColor = (barcode) => {
        if (!barcode.collection_date || !barcode.received_at) return 'error';
        if (new Date(barcode.collection_date) > new Date(barcode.received_at)) return 'warning';
        return 'success';
    };

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: { borderRadius: 3, boxShadow: "0 12px 40px rgba(0,0,0,0.12)", maxHeight: '92vh' }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, px: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "primary.light" }}><Science /></Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>Sample Collection</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>Record collection details and print barcodes</Typography>
                            {data.acceptanceId && (
                                <Chip
                                    component="a"
                                    href={route("acceptances.show", data.acceptanceId)}
                                    target="_blank"
                                    label={`#${data.acceptanceId}`}
                                    size="small"
                                    icon={<OpenInNew fontSize="small" />}
                                    clickable
                                    sx={{ bgcolor: "primary.light", color: "primary.contrastText", fontWeight: 600, "& .MuiChip-icon": { color: "inherit" } }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
                <IconButton color="inherit" onClick={handleClose} disabled={processing} size="large">
                    <Close />
                </IconButton>
            </DialogTitle>

            {/* Scrollable body */}
            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>

                {submitSuccess && (
                    <Fade in>
                        <Alert icon={<CheckCircle />} severity="success" sx={{ m: 2, borderRadius: 2 }}>
                            Collection recorded! Opening barcode print page…
                        </Alert>
                    </Fade>
                )}

                {/* Collect Request selector */}
                {data?.referrer && (
                    <Box sx={{ px: 3, pt: 2.5 }}>
                        <SelectSearch
                            label={isReferredOutpatient ? "Collect Request *" : "Collect Request"}
                            name="collect_request"
                            url={route("api.collectRequests.list")}
                            defaultData={{ referrer_id: data.referrer.id }}
                            value={data.collect_request}
                            onChange={(e) => setData('collect_request', e.target.value)}
                            fullWidth
                            size="small"
                            error={isReferredOutpatient && !data.collect_request}
                            helperText={isReferredOutpatient && !data.collect_request ? "Collect request is required for referred outpatients" : ""}
                        />
                    </Box>
                )}

                {/* Progress banner */}
                {data?.barcodes?.length > 0 && (
                    <Box sx={{ px: 3, pt: 2 }}>
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2, bgcolor: validation.isValid ? 'success.50' : 'warning.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Badge badgeContent={validation.totalSamples} color="primary">
                                    <Biotech color={validation.isValid ? 'success' : 'warning'} />
                                </Badge>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        {validation.completedSamples} of {validation.totalSamples} samples completed
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {validation.isValid ? 'Ready for collection' : 'Some fields need attention'}
                                    </Typography>
                                </Box>
                            </Box>
                            {!validation.isValid && (
                                <Button variant="outlined" size="small" onClick={handleQuickFill} startIcon={<Schedule />} sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
                                    Quick Fill
                                </Button>
                            )}
                        </Paper>
                    </Box>
                )}

                {/* Barcode cards */}
                <Stack spacing={2} sx={{ px: 3, pt: 2, pb: 3 }}>
                    {data?.barcodes?.length > 0 ? data.barcodes.map((barcode, index) => {
                        const statusColor = getStatusColor(barcode);
                        const expanded   = expandedRows.has(index);
                        const matVal     = materialValidation[index];
                        const showReceivedError = barcode.collection_date && (!barcode.received_at || new Date(barcode.collection_date) > new Date(barcode.received_at));

                        return (
                            <Paper key={index} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: statusColor === 'success' ? 'success.main' : statusColor === 'warning' ? 'warning.main' : 'divider' }}>
                                {/* Row summary — clickable */}
                                <Box
                                    onClick={() => toggleRow(index)}
                                    sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, userSelect: 'none' }}
                                >
                                    <IconButton size="small" tabIndex={-1}>
                                        {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                    </IconButton>

                                    <Chip label={barcode.barcodeGroup?.name || `BC-${index + 1}`} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600, minWidth: 64 }} />

                                    <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light' }}><Person sx={{ fontSize: 16 }} /></Avatar>
                                        <Typography variant="body2" fontWeight={600}>{barcode.patient?.fullName || '—'}</Typography>
                                    </Box>

                                    <Chip size="small" icon={<Science sx={{ fontSize: 14 }} />} label={barcode.sampleType?.name || 'Unknown'} sx={{ bgcolor: 'info.50', color: 'info.dark', fontWeight: 500 }} />

                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                        {barcode.items?.length || 0} test{barcode.items?.length !== 1 ? 's' : ''}
                                    </Typography>

                                    <Chip
                                        size="small"
                                        color={statusColor}
                                        icon={statusColor === 'error' ? <Warning sx={{ fontSize: 14 }} /> : <CheckCircle sx={{ fontSize: 14 }} />}
                                        label={!barcode.collection_date || !barcode.received_at ? 'Incomplete' : statusColor === 'warning' ? 'Invalid dates' : 'Ready'}
                                    />
                                </Box>

                                {/* Expanded detail panel */}
                                <Collapse in={expanded} timeout="auto" unmountOnExit>
                                    <Divider />
                                    <Box sx={{ p: 2.5, bgcolor: 'grey.50' }}>
                                        <Stack spacing={2.5}>

                                            {/* Tests */}
                                            <Box>
                                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                                    <Science sx={{ fontSize: 14 }} /> Requested Tests
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {barcode.items?.map((item, i) => (
                                                        <Chip key={i} size="small" variant="outlined" sx={{ bgcolor: 'background.paper', mb: 0.5 }}
                                                            label={<><strong>{item.test?.name}</strong>{item.method?.name ? ` • ${item.method.name}` : ''}</>}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Box>

                                            <Divider />

                                            {/* Collection fields */}
                                            <Box>
                                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                                                    Collection Details
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <TextField
                                                            fullWidth size="small"
                                                            name="sampleLocation"
                                                            label="Sampling Location"
                                                            placeholder="e.g., In Lab"
                                                            value={barcode.sampleLocation || ""}
                                                            onChange={handleChange(index)}
                                                            slotProps={{ input: { startAdornment: <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} /> } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <TextField
                                                            fullWidth size="small"
                                                            name="collection_date"
                                                            type="datetime-local"
                                                            label="Collection Date & Time"
                                                            value={barcode.collection_date || ""}
                                                            onChange={handleChange(index)}
                                                            error={!barcode.collection_date}
                                                            helperText={!barcode.collection_date ? "Required" : ""}
                                                            slotProps={{ htmlInput: { max: now }, inputLabel: { shrink: true } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <TextField
                                                            fullWidth size="small"
                                                            name="received_at"
                                                            type="datetime-local"
                                                            label="Received Date & Time"
                                                            value={barcode.received_at || ""}
                                                            onChange={handleChange(index)}
                                                            error={!!showReceivedError}
                                                            helperText={
                                                                !barcode.received_at && barcode.collection_date
                                                                    ? "Required"
                                                                    : showReceivedError
                                                                        ? "Must be after collection date"
                                                                        : ""
                                                            }
                                                            slotProps={{ htmlInput: { max: now, min: barcode.collection_date || undefined }, inputLabel: { shrink: true } }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>

                                            {/* Material — for orderable or required_barcode referrer samples */}
                                            {data?.referrer && (barcode.sampleType?.orderable || (isReferredOutpatient && barcode.sampleType?.required_barcode)) && (
                                                <>
                                                    <Divider />
                                                    <Box>
                                                        {(() => {
                                                            const barcodeRequired = isReferredOutpatient && barcode.sampleType?.required_barcode;
                                                            const missingBarcode = barcodeRequired && !barcode.material?.barcode;
                                                            return (
                                                                <>
                                                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                                                                        Material{' '}
                                                                        {barcodeRequired
                                                                            ? <Typography component="span" variant="caption" color="error">*</Typography>
                                                                            : <Typography component="span" variant="caption" color="text.disabled">(Optional)</Typography>
                                                                        }
                                                                    </Typography>
                                                                    <TextField
                                                                        size="small"
                                                                        sx={{ maxWidth: 360 }}
                                                                        fullWidth
                                                                        label="Material Barcode"
                                                                        placeholder="Scan or enter material barcode"
                                                                        defaultValue={barcode.material?.barcode || ''}
                                                                        onBlur={(e) => handleMaterialBarcodeCheck(index, e.target.value)}
                                                                        error={!!matVal?.error || missingBarcode}
                                                                        helperText={
                                                                            matVal?.error ||
                                                                            (matVal?.valid ? '✓ Material verified' :
                                                                                missingBarcode ? 'Barcode is required for this sample type' :
                                                                                'Must belong to this referrer if provided')
                                                                        }
                                                                        slotProps={{
                                                                            input: {
                                                                                startAdornment: matVal?.loading
                                                                                    ? <CircularProgress size={16} sx={{ mr: 0.5 }} />
                                                                                    : <QrCode fontSize="small" color={matVal?.valid ? 'success' : 'action'} sx={{ mr: 0.5 }} />,
                                                                            }
                                                                        }}
                                                                    />
                                                                </>
                                                            );
                                                        })()}
                                                    </Box>
                                                </>
                                            )}
                                        </Stack>
                                    </Box>
                                </Collapse>
                            </Paper>
                        );
                    }) : (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2">No barcode data available</Typography>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                        {validation.totalSamples > 0 && `Progress: ${validation.completedSamples}/${validation.totalSamples} samples`}
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                        <Button onClick={handleClose} color="inherit" disabled={processing} startIcon={<Close />}>
                            Cancel
                        </Button>
                        <Tooltip title={
                            validation.totalSamples === 0     ? "No samples to collect"
                            : validation.missingCollectRequest  ? "A collect request is required for referred outpatients"
                            : validation.missingRequiredBarcodes ? "Material barcodes are required for some sample types"
                            : !validation.isValid               ? "Please complete all required fields"
                            : "Collect samples and print barcodes"
                        }>
                            <span>
                                <Button
                                    onClick={handleSubmit}
                                    variant="contained"
                                    disabled={validation.totalSamples === 0 || !validation.isValid || processing}
                                    startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <Check />}
                                    endIcon={!processing && <Print />}
                                    sx={{ fontWeight: 600, px: 3 }}
                                >
                                    {processing ? "Processing…" : "Collect & Print Barcodes"}
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
