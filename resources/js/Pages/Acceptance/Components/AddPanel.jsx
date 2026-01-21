import React, { useState, useCallback, useMemo } from "react";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Button,
    Grid2 as Grid,
    IconButton,
    Typography,
    Box,
    Paper,
    CircularProgress,
    Alert,
    Tooltip
} from "@mui/material";
import {
    Close,
    PlaylistAddCheck,
    HelpOutline,
} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch";
import { useFormValidation } from './hooks/useFormValidation';
import PanelTestForm from './forms/PanelTestForm';
import { makeId } from "@/Services/helper.js";

// Constants
const DIALOG_CONFIG = {
    maxWidth: "md",
    borderRadius: 2,
    titlePadding: 2,
    contentPadding: 3
};

const LOADING_STATES = {
    IDLE: 'idle',
    FETCHING: 'fetching',
    SUBMITTING: 'submitting'
};

// Memoized Components
const LoadingIndicator = React.memo(({ message = "Loading..." }) => (
    <Grid size={{ xs: 12, md: 6 }} textAlign="center">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2">{message}</Typography>
        </Box>
    </Grid>
));

LoadingIndicator.displayName = 'LoadingIndicator';

const EmptyPanelState = React.memo(() => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 5,
            textAlign: 'center',
            backgroundColor: 'grey.50',
            borderRadius: 2,
            border: '1px dashed grey.300'
        }}
    >
        <PlaylistAddCheck sx={{ fontSize: 60, color: 'secondary.light', mb: 2 }} />
        <Typography variant="h6">Select a Panel</Typography>
        <Typography variant="body2" sx={{ maxWidth: 400, mt: 1 }}>
            Please select a test panel from the dropdown above to configure its details
        </Typography>
    </Box>
));

EmptyPanelState.displayName = 'EmptyPanelState';

const PanelSelector = React.memo(({
                                      value,
                                      onChange,
                                      error,
                                      helperText,
                                      isLoading
                                  }) => (
    <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: "grey.50", borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Select Panel
        </Typography>

        <Grid container spacing={3} alignItems="center">
            <Grid xs={12} md={6}>
                <Box display="flex" alignItems="flex-start">
                    <SelectSearch
                        value={value}
                        label="Select Test Panel"
                        fullWidth
                        url={route("api.tests.list")}
                        defaultData={{ type: 'PANEL', status: true }}
                        onChange={onChange}
                        name="test"
                        error={error}
                        helperText={helperText}
                        disabled={isLoading}
                    />
                    <Tooltip title="A panel contains multiple tests grouped together">
                        <HelpOutline fontSize="small" color="action" sx={{ ml: 1, mt: 2 }} />
                    </Tooltip>
                </Box>
            </Grid>

            {isLoading && <LoadingIndicator message="Loading panel details..." />}
        </Grid>
    </Paper>
));

PanelSelector.displayName = 'PanelSelector';

const DialogHeader = React.memo(({ title, onClose }) => (
    <DialogTitle
        sx={{
            backgroundColor: "secondary.main",
            color: "secondary.contrastText",
            p: DIALOG_CONFIG.titlePadding
        }}
    >
        <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
                <PlaylistAddCheck sx={{ mr: 2 }} />
                <Typography variant="h6">{title}</Typography>
            </Box>
            <IconButton
                onClick={onClose}
                aria-label="close"
                sx={{ color: "secondary.contrastText" }}
            >
                <Close />
            </IconButton>
        </Box>
    </DialogTitle>
));

DialogHeader.displayName = 'DialogHeader';

const ErrorAlert = React.memo(({ hasErrors }) => {
    if (!hasErrors) return null;

    return (
        <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
            Please correct the errors before submitting
        </Alert>
    );
});

ErrorAlert.displayName = 'ErrorAlert';

const AddPanel = ({
                      open,
                      onClose,
                      onSubmit,
                      maxDiscount = 0,
                      data = {},
                      onChange,
                      referrer,
                      patient
                  }) => {
    const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
    const { errors, validatePanel, setErrors } = useFormValidation(data, maxDiscount);

    // Memoized values
    const dialogTitle = useMemo(() =>
        data.id ? "Edit Panel" : "Add Panel", [data.id]
    );

    const hasErrors = useMemo(() =>
        Object.keys(errors || {}).length > 0, [errors]
    );

    const isLoading = useMemo(() =>
        loadingState !== LOADING_STATES.IDLE, [loadingState]
    );

    const isFetching = useMemo(() =>
        loadingState === LOADING_STATES.FETCHING, [loadingState]
    );

    const isSubmitting = useMemo(() =>
        loadingState === LOADING_STATES.SUBMITTING, [loadingState]
    );

    const hasPanelData = useMemo(() =>
        data.panel && data.panel.id, [data.panel]
    );

    // Utility functions
    const createAcceptanceItems = useCallback((methodTests, panel) => {
        const panelId = makeId(6);
        const pricePerTest = panel.price / methodTests.length;

        return methodTests.map(item => ({
            id: makeId(5),
            panel_id: panelId,
            method_test: item,
            details: "",
            discount: 0,
            price: pricePerTest,
            no_sample:1,
            customParameters: {
                samples: [],
                sampleType: "",
            }
        }));
    }, []);

    const calculateTotals = useCallback((items) => ({
        price: items.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
        discount: items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0)
    }), []);

    // API Service functions
    const fetchTestDetails = useCallback(async (testId) => {
        setLoadingState(LOADING_STATES.FETCHING);

        try {
            const params = referrer ? { referrer: { id: referrer.id } } : {};
            const { data: { data: { method_tests, ...panelData } } } = await axios.get(
                route("api.tests.show", testId),
                { params }
            );

            const panelId = makeId(6);
            const formattedItems = createAcceptanceItems(method_tests, panelData);

            onChange?.({
                acceptanceItems: formattedItems,
                panel: {...panelData,method_tests},
                price: panelData.price,
                id: panelId,
            });

        } catch (error) {
            console.error("Failed to fetch test details:", error);
            setErrors(prev => ({
                ...prev,
                test: error.response?.data?.message || "Failed to load test details"
            }));
        } finally {
            setLoadingState(LOADING_STATES.IDLE);
        }
    }, [referrer, onChange, setErrors, createAcceptanceItems]);

    // Event handlers
    const handleTestSelect = useCallback((e) => {
        const selectedTest = e.target.value;

        if (selectedTest?.id) {
            fetchTestDetails(selectedTest.id);
        } else {
            // Clear data when no test is selected
            onChange?.({
                acceptanceItems: [],
                panel: null,
                price: 0,
                discount: 0
            });
        }
    }, [fetchTestDetails, onChange]);

    const handleFormChange = useCallback((updatedData) => {
        if (!Array.isArray(updatedData)) {
            console.warn('Invalid data format received in handleFormChange');
            return;
        }

        const totals = calculateTotals(updatedData);

        onChange?.({
            acceptanceItems: updatedData,
            ...totals
        });
    }, [onChange, calculateTotals]);

    const handleSubmit = useCallback(async () => {
        if (!validatePanel()) {
            return;
        }

        setLoadingState(LOADING_STATES.SUBMITTING);

        try {
            await onSubmit?.();
        } catch (error) {
            console.error("Submission failed:", error);
            setErrors(prev => ({
                ...prev,
                submit: error.message || "Failed to submit panel"
            }));
        } finally {
            setLoadingState(LOADING_STATES.IDLE);
        }
    }, [validatePanel, onSubmit, setErrors]);

    const handleClose = useCallback(() => {
        if (!isLoading) {
            onClose?.();
        }
    }, [isLoading, onClose]);

    return (
        <Dialog
            open={open}
            fullWidth
            keepMounted
            maxWidth={DIALOG_CONFIG.maxWidth}
            onClose={handleClose}
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: DIALOG_CONFIG.borderRadius,
                        overflow: "hidden"
                    }
                }
            }}
        >
            <DialogHeader title={dialogTitle} onClose={handleClose} />

            <ErrorAlert hasErrors={hasErrors} />

            <DialogContent sx={{ p: DIALOG_CONFIG.contentPadding }}>
                <PanelSelector
                    value={data.panel || ""}
                    onChange={handleTestSelect}
                    error={Boolean(errors.panel)}
                    helperText={errors.panel || "Choose a test panel from the list"}
                    isLoading={isFetching}
                />

                {hasPanelData && !isFetching && (
                    <PanelTestForm
                        panel={data.panel}
                        acceptanceItems={data.acceptanceItems || []}
                        onChange={handleFormChange}
                        errors={errors}
                        maxDiscount={maxDiscount}
                        referrer={referrer}
                        patient={patient}
                    />
                )}

                {!hasPanelData && !isFetching && <EmptyPanelState />}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                    onClick={handleClose}
                    color="inherit"
                    variant="outlined"
                    sx={{ mr: 1 }}
                    disabled={isLoading}
                >
                    Cancel
                </Button>

                {hasPanelData && (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="secondary"
                        disabled={isLoading}
                        startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
                    >
                        {isSubmitting ? "Processing..." : "Submit"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AddPanel;
