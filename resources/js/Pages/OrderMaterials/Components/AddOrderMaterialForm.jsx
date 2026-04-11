import React, {useState, useEffect, useCallback} from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Box, Stack, Paper,
    Divider, Chip, IconButton, CircularProgress, Fade,
    InputAdornment, Alert,
} from '@mui/material';
import {Close, QrCode, CheckCircle, Science, Add, DeleteOutline} from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import {useForm} from '@inertiajs/react';
import SelectSearch from '@/Components/SelectSearch.jsx';
import axios from 'axios';

const AddOrderMaterialForm = ({open, onClose}) => {
    const {data, setData, post, processing, errors, reset} = useForm({
        referrer_id: null,
        sample_type_id: null,
        amount: 1,
        materials: [],
    });

    const [referrer, setReferrer] = useState(null);
    const [sampleType, setSampleType] = useState(null);
    const [validatingIdx, setValidatingIdx] = useState({});
    const [materialErrors, setMaterialErrors] = useState({});

    useEffect(() => {
        const count = Math.max(1, parseInt(data.amount) || 1);
        setData(prev => {
            const cur = prev.materials.length;
            if (cur === count) return prev;
            if (count > cur) {
                const added = Array(count - cur).fill(null).map(() => ({id: null, barcode: ''}));
                return {...prev, materials: [...prev.materials, ...added]};
            }
            return {...prev, materials: prev.materials.slice(0, count)};
        });
    }, [data.amount]);

    const handleClose = useCallback(() => {
        reset();
        setReferrer(null);
        setSampleType(null);
        setValidatingIdx({});
        setMaterialErrors({});
        onClose();
    }, [onClose, reset]);

    const handleBarcodeChange = useCallback((index, value) => {
        setData(prev => {
            const mats = [...prev.materials];
            mats[index] = {id: null, barcode: value};
            return {...prev, materials: mats};
        });
        setMaterialErrors(prev => ({...prev, [index]: null}));
    }, [setData]);

    const handleBarcodeBlur = useCallback(async (index, value) => {
        if (!value) {
            setData(prev => {
                const mats = [...prev.materials];
                mats[index] = {id: null, barcode: ''};
                return {...prev, materials: mats};
            });
            return;
        }
        const dup = data.materials.findIndex((m, i) => i !== index && m.barcode === value);
        if (dup !== -1) {
            setMaterialErrors(prev => ({...prev, [index]: `Duplicate — already entered in #${dup + 1}`}));
            return;
        }
        setValidatingIdx(prev => ({...prev, [index]: true}));
        setMaterialErrors(prev => ({...prev, [index]: null}));
        try {
            const res = await axios.get(route('api.materials.check'), {
                params: {barcode: value, sample_id: data.sample_type_id},
            });
            setData(prev => {
                const mats = [...prev.materials];
                mats[index] = {id: res.data.material.id, barcode: value};
                return {...prev, materials: mats};
            });
        } catch (err) {
            setMaterialErrors(prev => ({...prev, [index]: err.response?.data?.message || 'Invalid barcode'}));
            setData(prev => {
                const mats = [...prev.materials];
                mats[index] = {id: null, barcode: value};
                return {...prev, materials: mats};
            });
        } finally {
            setValidatingIdx(prev => ({...prev, [index]: false}));
        }
    }, [data.materials, data.sample_type_id, setData]);

    const handleRemove = useCallback((index) => {
        setData(prev => {
            const mats = prev.materials.filter((_, i) => i !== index);
            return {...prev, materials: mats, amount: Math.max(1, mats.length)};
        });
        // Re-index errors: drop the removed index, shift down higher ones
        setMaterialErrors(prev => {
            const next = {};
            Object.entries(prev).forEach(([k, v]) => {
                const ki = parseInt(k);
                if (ki < index) next[ki] = v;
                else if (ki > index) next[ki - 1] = v;
            });
            return next;
        });
        setValidatingIdx(prev => {
            const next = {};
            Object.entries(prev).forEach(([k, v]) => {
                const ki = parseInt(k);
                if (ki < index) next[ki] = v;
                else if (ki > index) next[ki - 1] = v;
            });
            return next;
        });
    }, [setData]);

    const verifiedCount = data.materials.filter(m => m.id).length;
    const hasMatErrors  = Object.values(materialErrors).some(Boolean);
    const allVerified   = data.materials.length > 0 && data.materials.every(m => m.id);
    const canSubmit     = !!(data.referrer_id && data.sample_type_id && data.amount >= 1
                             && !processing && !hasMatErrors && allVerified);

    const handleSubmit = useCallback(() => {
        post(route('orderMaterials.store'), {onSuccess: handleClose});
    }, [post, handleClose]);

    return (
        <Dialog open={open} onClose={processing ? undefined : handleClose} fullWidth maxWidth="sm"
            PaperProps={{sx: {borderRadius: 3}}}>
            <DialogTitle sx={{
                bgcolor: 'primary.main', color: 'primary.contrastText',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                py: 2, px: 3,
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Science/>
                    <Typography variant="h6" fontWeight={600}>New Order Material</Typography>
                </Box>
                <IconButton color="inherit" onClick={handleClose} disabled={processing}>
                    <Close/>
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{p: 3}}>
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{p: 2.5, borderRadius: 2}}>
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary"
                            sx={{mb: 2, textTransform: 'uppercase', letterSpacing: 0.5}}>
                            Order Details
                        </Typography>
                        <Stack spacing={2}>
                            <SelectSearch
                                label="Referrer *"
                                url={route('api.referrers.list')}
                                value={referrer}
                                error={!!errors.referrer_id}
                                helperText={errors.referrer_id}
                                onChange={(e) => {
                                    setReferrer(e.target.value);
                                    setData('referrer_id', e.target.value?.id ?? null);
                                }}
                                fullWidth
                                size="small"
                            />
                            <SelectSearch
                                label="Sample Type *"
                                url={route('api.sampleTypes.list')}
                                defaultData={{orderable: 1}}
                                value={sampleType}
                                error={!!errors.sample_type_id}
                                helperText={errors.sample_type_id}
                                onChange={(e) => {
                                    setSampleType(e.target.value);
                                    setData(prev => ({
                                        ...prev,
                                        sample_type_id: e.target.value?.id ?? null,
                                        materials: prev.materials.map(() => ({id: null, barcode: ''})),
                                    }));
                                    setMaterialErrors({});
                                }}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Quantity *"
                                type="number"
                                size="small"
                                value={data.amount}
                                onChange={(e) => setData('amount', Math.max(1, parseInt(e.target.value) || 1))}
                                error={!!errors.amount}
                                helperText={errors.amount}
                                slotProps={{htmlInput: {min: 1}}}
                                sx={{maxWidth: 160}}
                            />
                        </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{p: 2.5, borderRadius: 2}}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary"
                                sx={{textTransform: 'uppercase', letterSpacing: 0.5}}>
                                Material Barcodes
                            </Typography>
                            <Chip
                                size="small"
                                label={`${verifiedCount} / ${data.materials.length} verified`}
                                color={verifiedCount === data.materials.length && data.materials.length > 0 ? 'success' : 'default'}
                            />
                        </Box>
                        <Divider sx={{mb: 2}}/>

                        {!data.sample_type_id ? (
                            <Alert severity="info" sx={{borderRadius: 2}}>
                                Select a sample type first to enable barcode scanning.
                            </Alert>
                        ) : (
                            <Stack spacing={1.5}>
                                {data.materials.map((mat, idx) => {
                                    const err     = materialErrors[idx] || errors[`materials.${idx}.id`];
                                    const valid   = !!mat.id && !err;
                                    const loading = !!validatingIdx[idx];
                                    return (
                                        <Box key={idx} sx={{display: 'flex', alignItems: 'flex-start', gap: 1}}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                label={`Material #${idx + 1}`}
                                                placeholder="Scan or enter barcode"
                                                value={mat.barcode}
                                                onChange={(e) => handleBarcodeChange(idx, e.target.value)}
                                                onBlur={(e) => handleBarcodeBlur(idx, e.target.value)}
                                                error={!!err}
                                                helperText={err || (valid ? '✓ Verified' : '')}
                                                disabled={loading}
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <QrCode fontSize="small" color={valid ? 'success' : 'action'}/>
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: loading ? (
                                                            <InputAdornment position="end">
                                                                <CircularProgress size={18}/>
                                                            </InputAdornment>
                                                        ) : valid ? (
                                                            <InputAdornment position="end">
                                                                <Fade in>
                                                                    <CheckCircle color="success" fontSize="small"/>
                                                                </Fade>
                                                            </InputAdornment>
                                                        ) : null,
                                                    },
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemove(idx)}
                                                disabled={loading || processing}
                                                sx={{mt: '4px', flexShrink: 0}}
                                                title="Remove"
                                            >
                                                <DeleteOutline fontSize="small"/>
                                            </IconButton>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Paper>
                </Stack>
            </DialogContent>

            <DialogActions sx={{px: 3, pb: 2.5, borderTop: '1px solid', borderColor: 'divider'}}>
                <Button onClick={handleClose} color="inherit" disabled={processing} startIcon={<Close/>}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!canSubmit}
                    startIcon={processing ? <CircularProgress size={16} color="inherit"/> : <Add/>}
                >
                    {processing ? 'Creating…' : 'Create Order'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddOrderMaterialForm;
