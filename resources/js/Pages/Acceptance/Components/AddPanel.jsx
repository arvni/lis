import React, {useState, useCallback} from "react";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Button,
    Grid2 as Grid,
    IconButton,
    TextField,
    Typography,
    Box,
    Paper,
    Divider,
    CircularProgress,
    Alert,
    Tooltip
} from "@mui/material";
import {
    Close,
    PlaylistAddCheck,
    HelpOutline,
    Info
} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch";
import TestDetails from './TestDetails';
import {useFormValidation} from './hooks/useFormValidation';
import PanelTestForm from './forms/PanelTestForm';
import {makeId} from "@/Services/helper.js";

const AddPanel = ({
                      open,
                      onClose,
                      onSubmit,
                      maxDiscount,
                      data,
                      onChange,
                      referrer,
                      patient
                  }) => {
    const [loading, setLoading] = useState(false);
    const {errors, validatePanel, setErrors} = useFormValidation(data, maxDiscount);
    // API Service functions
    const fetchTestDetails = useCallback((testId) => {
        setLoading(true);
        return axios.get(route("api.tests.show", testId),{
            params: referrer ? { referrer: { id: referrer.id } } : {},
        }).then(({data: {data: {method_tests, ...res}}}) => {
                const formattedItems = method_tests.map(item => ({
                    id: makeId(5),
                    method_test: item,
                    details: "",
                    discount: 0,
                    price: 0,
                    patients: Array(item.method.no_patient ?? 1)
                        .fill({
                            id: patient.id,
                            name: patient.fullName
                        }),
                    customParameters: {
                        sampleType: "",
                    }
                }));
                onChange({acceptanceItems: formattedItems, panel: res, price: res.price});
            })
            .catch(error => {
                console.error("Failed to fetch test details:", error);
                setErrors(prev => ({...prev, test: "Failed to load test details"}));
            })
            .finally(() => setLoading(false));
    }, [setErrors, patient, onChange]);

    const handleTestSelect = (e) => {
        if (e.target.value) {
            fetchTestDetails(e.target.value.id);
        } else {
            onChange({
                acceptanceItems: [], panel: ""
            })
        }
    };

    const handleFormChange = (updatedData) => {
        onChange({acceptanceItems: updatedData,price:updatedData.reduce((a, b) => a + b.price, 0)});
    };

    const handleSubmit = () => {
        if (validatePanel()) {
            onSubmit();
        }
    };

    // Determine if this is an edit or add operation
    const dialogTitle = data.id ? "Edit Panel" : "Add Panel";
    const hasErrors = Object.keys(errors || {}).length > 0;

    return (
        <Dialog
            open={open}
            fullWidth
            keepMounted
            maxWidth="md"
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: "hidden"
                    }
                }
            }}
        >
            <DialogTitle
                sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                    p: 2
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                        <PlaylistAddCheck sx={{mr: 2}}/>
                        <Typography variant="h6">{dialogTitle}</Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        aria-label="close"
                        sx={{color: "secondary.contrastText"}}
                    >
                        <Close/>
                    </IconButton>
                </Box>
            </DialogTitle>

            {hasErrors && (
                <Alert severity="error" sx={{mx: 3, mt: 2}}>
                    Please correct the errors before submitting
                </Alert>
            )}

            <DialogContent sx={{p: 3}}>
                <Paper elevation={0} sx={{p: 3, mb: 3, backgroundColor: "grey.50", borderRadius: 2}}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Select Panel
                    </Typography>

                    <Grid container spacing={3} alignItems="center">
                        <Grid xs={12} md={6}>
                            <Box display="flex" alignItems="flex-start">
                                <SelectSearch
                                    value={data.panel || ""}
                                    label="Select Test Panel"
                                    fullWidth
                                    url={route("api.tests.list")}
                                    defaultData={{type: 'PANEL', status: true}}
                                    onChange={handleTestSelect}
                                    name="test"
                                    error={Boolean(errors.panel)}
                                    helperText={errors.panel || "Choose a test panel from the list"}
                                />
                                <Tooltip title="A panel contains multiple tests grouped together">
                                    <HelpOutline fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                </Tooltip>
                            </Box>
                        </Grid>

                        {loading && (
                            <Grid size={{xs: 12, md: 6}} textAlign="center">
                                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <CircularProgress size={24} sx={{mr: 1}}/>
                                    <Typography variant="body2">Loading panel details...</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {data.panel && data.panel.id && !loading && (
                    <>
                        <Paper elevation={1} sx={{p: 3, mb: 3, borderRadius: 2}}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                Panel Details
                            </Typography>

                            <Box sx={{mb: 3}}>
                                <TestDetails test={data.panel}/>
                            </Box>
                        </Paper>

                        <Paper elevation={1} sx={{p: 3, borderRadius: 2}}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                Tests in Panel
                            </Typography>

                            <Alert severity="info" icon={<Info/>} sx={{mb: 3}}>
                                This panel contains {data.acceptanceItems.length} test(s). Please configure each test
                                below.
                            </Alert>

                            <Box>
                                <PanelTestForm
                                    panel={data.panel}
                                    acceptanceItems={data.acceptanceItems}
                                    onChange={handleFormChange}
                                    errors={errors}
                                    maxDiscount={maxDiscount}
                                    referrer={referrer}
                                    patient={patient}
                                />
                            </Box>
                        </Paper>
                    </>
                )}

                {!data.panel && !loading && (
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
                        <PlaylistAddCheck sx={{fontSize: 60, color: 'secondary.light', mb: 2}}/>
                        <Typography variant="h6">Select a Panel</Typography>
                        <Typography variant="body2" sx={{maxWidth: 400, mt: 1}}>
                            Please select a test panel from the dropdown above to configure its details
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{p: 3, pt: 2}}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    variant="outlined"
                    sx={{mr: 1}}
                >
                    Cancel
                </Button>
                {data.panel && data.panel.id && (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="secondary"
                        disabled={loading || hasErrors}
                        startIcon={loading && <CircularProgress size={16} color="inherit"/>}
                    >
                        {loading ? "Processing..." : "Add Panel"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AddPanel;
