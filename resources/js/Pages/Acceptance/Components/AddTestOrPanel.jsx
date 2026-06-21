import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import { Close, Science, PlaylistAddCheck, ArrowBack, Check } from '@mui/icons-material';
import { makeId } from '@/Services/helper';
import axios from 'axios';
import { TYPES } from './AddTestOrPanel/constants';
import { makeTestData, makePanelData } from './AddTestOrPanel/factories';
import { validateTest, validatePanel } from './AddTestOrPanel/validation';
import SelectStep from './AddTestOrPanel/SelectStep';
import TestConfigStep from './AddTestOrPanel/TestConfigStep';
import PanelConfigStep from './AddTestOrPanel/PanelConfigStep';

// ─── Root Component ────────────────────────────────────────────────────────────
const AddTestOrPanel = ({
    open,
    onClose,
    onSubmitTest,
    onSubmitPanel,
    initialTestData = null,
    initialPanelData = null,
    referrer = null,
    maxDiscount = 0,
    patient = null,
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
        // Re-initialise form state on dialog open only; depending on the initial*
        // props or isEdit would reset in-progress edits whenever their identity changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const isPanel = type === 'PANEL';
    const hasSelection = isPanel
        ? Boolean(panelData.panel?.id)
        : Boolean(testData.method_test?.test?.id);

    const fetchItem = useCallback(
        async (id, itemType) => {
            setLoading(true);
            setApiError(null);
            try {
                const {
                    data: { data: info },
                } = await axios.get(route('api.tests.show', id), {
                    params: referrer ? { referrer: { id: referrer.id } } : {},
                });
                if (itemType === 'PANEL') {
                    const { method_tests = [], ...panelInfo } = info;
                    const pid = makeId(6);
                    const priceEach = panelInfo.price / (method_tests.length || 1);
                    setPanelData({
                        id: pid,
                        panel: { ...panelInfo, method_tests },
                        acceptanceItems: method_tests.map((mt) => ({
                            id: makeId(5),
                            panel_id: pid,
                            method_test: mt,
                            price: priceEach,
                            discount: 0,
                            details: '',
                            no_sample: 1,
                            samples: [],
                            customParameters: { sampleType: '', discounts: [] },
                        })),
                        price: panelInfo.price,
                        discount: 0,
                        sampleless: false,
                        reportless: false,
                    });
                } else {
                    const discounts =
                        info.offers?.map((o) => ({
                            id: makeId(6),
                            type: o.type,
                            value: o.amount,
                            reason: o.title,
                        })) || [];
                    setTestData((prev) => ({
                        ...prev,
                        method_test: { test: info, id: null, method: null },
                        price: 0,
                        discount: 0,
                        samples:
                            itemType === 'SERVICE' && patient
                                ? [
                                      {
                                          patients: [{ id: patient.id, name: patient.fullName }],
                                          sampleType: '',
                                      },
                                  ]
                                : [],
                        customParameters: { sampleType: '', discounts },
                    }));
                }
            } catch (e) {
                setApiError(
                    e.response?.data?.message || 'Failed to load details. Please try again.',
                );
            } finally {
                setLoading(false);
            }
        },
        [referrer, patient],
    );

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
        setTestData((prev) => ({ ...prev, ...updates }));
        setErrors((prev) => {
            const next = { ...prev };
            Object.keys(updates).forEach((k) => delete next[k]);
            return next;
        });
    }, []);

    const handlePanelChange = useCallback((updates) => {
        setPanelData((prev) => ({ ...prev, ...updates }));
    }, []);

    const handleSubmit = () => {
        const errs = isPanel
            ? validatePanel(panelData, maxDiscount)
            : validateTest(testData, maxDiscount);
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        if (isPanel) onSubmitPanel?.(panelData);
        else onSubmitTest?.(testData);
        onClose(); // Always close the dialog after a successful submission
    };

    const handleNext = () => {
        if (!type) {
            setErrors({ type: 'Please select a type first' });
            return;
        }
        if (!hasSelection) {
            setErrors({ selection: 'Please select a test or panel to continue' });
            return;
        }
        setErrors({});
        setStep(1);
    };

    const errorCount = Object.keys(errors).length;

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="md"
            slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '92vh' } } }}
        >
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isPanel ? <PlaylistAddCheck /> : <Science />}
                        <Typography variant="h6">
                            {isEdit ? `Edit ${isPanel ? 'Panel' : 'Test'}` : 'Add Test or Panel'}
                        </Typography>
                        {type && !isEdit && (
                            <Chip
                                label={TYPES.find((t) => t.value === type)?.label || type}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                            />
                        )}
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            {!isEdit && (
                <Box sx={{ px: 3, pt: 2, pb: 0 }}>
                    <Stepper activeStep={step} alternativeLabel>
                        {['Select Type & Test', 'Configure & Submit'].map((l) => (
                            <Step key={l}>
                                <StepLabel>{l}</StepLabel>
                            </Step>
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

            <DialogActions
                sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}
            >
                {step === 0 ? (
                    <>
                        <Button variant="outlined" color="inherit" onClick={onClose}>
                            Cancel
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        <Button variant="contained" onClick={handleNext} disabled={loading}>
                            Continue →
                        </Button>
                    </>
                ) : (
                    <>
                        {!isEdit && (
                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<ArrowBack />}
                                onClick={() => setStep(0)}
                            >
                                Back
                            </Button>
                        )}
                        <Box sx={{ flex: 1 }}>
                            {Object.keys(errors).length > 0 && step === 1 && (
                                <Typography
                                    variant="caption"
                                    color="error.main"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}
                                >
                                    <Close fontSize="inherit" />
                                    Please fix the validation errors above
                                </Typography>
                            )}
                        </Box>
                        <Button variant="outlined" color="inherit" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={
                                loading ? <CircularProgress size={16} color="inherit" /> : <Check />
                            }
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading
                                ? 'Processing...'
                                : isEdit
                                  ? 'Update'
                                  : `Add ${isPanel ? 'Panel' : 'Test'}`}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AddTestOrPanel;
